import {fail,json,readJson,normalizeEmail,hmac,randomHex,passwordHash,sha256,sessionCookie,originAllowed,recordAttempt,constantTimeEqual} from "../_lib/auth.js";
export async function onRequest({request,env}){
 if(request.method!=="POST")return fail("method_not_allowed",405);
 if(!originAllowed(request))return fail("origin_not_allowed",403);
 let body;try{body=await readJson(request)}catch{return fail("invalid_request",400)}
 const email=normalizeEmail(body.email),password=typeof body.password==="string"?body.password:"";
 if(!email||!password||password.length>128)return fail("invalid_email_or_password",400);
 try{
  const emailHash=await hmac(email,env.AUTH_PEPPER),ipHash=await hmac(request.headers.get("cf-connecting-ip")||"unknown",env.AUTH_PEPPER);
  if(!await recordAttempt(env,emailHash,ipHash))return fail("too_many_attempts_try_later",429);
  const user=await env.DB.prepare("SELECT id,status,password_hash FROM users WHERE email_hash=? LIMIT 1").bind(emailHash).first();
  if(!user||user.status!=="active"||!user.password_hash)return fail("invalid_email_or_password",401);
  const parts=user.password_hash.split("$");if(parts.length!==4||parts[0]!=="pbkdf2-sha256"||parts[1]!=="100000")return fail("invalid_email_or_password",401);
  const candidate=await passwordHash(password,parts[2]);if(!constantTimeEqual(candidate,parts[3]))return fail("invalid_email_or_password",401);
  const token=randomHex(32),tokenHash=await sha256(token),expiry=new Date(Date.now()+30*86400000).toISOString();
  await env.DB.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(tokenHash,user.id,expiry).run();
  return json({ok:true,user:{id:user.id},message:"Signed in."},200,{"set-cookie":sessionCookie(token)});
 }catch(error){console.error("candy_login_failed",error);return fail("auth_service_unavailable",503)}
}

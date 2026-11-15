import {fail,json,readJson,normalizeEmail,hmac,randomHex,passwordHash,sha256,sessionCookie,originAllowed,recordAttempt} from "../_lib/auth.js";
export async function onRequest({request,env}){
 if(request.method!=="POST")return fail("method_not_allowed",405);
 if(!originAllowed(request))return fail("origin_not_allowed",403);
 let body;try{body=await readJson(request)}catch{return fail("invalid_request",400)}
 const email=normalizeEmail(body.email),password=typeof body.password==="string"?body.password:"";
 if(!email||password.length<10||password.length>128)return fail("invalid_email_or_password_length",400);
 try{
  const emailHash=await hmac(email,env.AUTH_PEPPER),ipHash=await hmac(request.headers.get("cf-connecting-ip")||"unknown",env.AUTH_PEPPER);
  if(!await recordAttempt(env,emailHash,ipHash))return fail("too_many_attempts_try_later",429);
  const existing=await env.DB.prepare("SELECT id FROM users WHERE email_hash=? LIMIT 1").bind(emailHash).first();
  if(existing)return fail("account_already_exists_use_login",409);
  const salt=randomHex(16),digest=await passwordHash(password,salt),stored="pbkdf2-sha256$100000$"+salt+"$"+digest,userId=crypto.randomUUID();
  // Birth date remains unset here; Germany Dating Pro will request age details before dating features are enabled.
  await env.DB.prepare("INSERT INTO users(id,email_hash,password_hash,status) VALUES(?,?,?,'active')").bind(userId,emailHash,stored).run();
  const token=randomHex(32),tokenHash=await sha256(token),expiry=new Date(Date.now()+30*86400000).toISOString();
  await env.DB.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(tokenHash,userId,expiry).run();
  return json({ok:true,user:{id:userId},message:"Account created."},200,{"set-cookie":sessionCookie(token)});
 }catch(error){console.error("candy_register_failed",error);return fail("auth_service_unavailable",503)}
}

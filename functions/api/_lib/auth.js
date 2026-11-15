const encoder = new TextEncoder();
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer",...headers}})}
export function fail(error,status=400){return json({ok:false,error},status)}
export async function readJson(request){if(!request.headers.get("content-type")?.toLowerCase().includes("application/json"))throw new Error("content_type");const raw=await request.text();if(raw.length>4096)throw new Error("too_large");return JSON.parse(raw)}
export function normalizeEmail(value){if(typeof value!=="string")return null;const email=value.trim().toLowerCase();if(email.length>254||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))return null;return email}
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("")}
export async function hmac(value,secret){if(!secret||secret.length<32)throw new Error("auth_secret_missing");const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(await crypto.subtle.sign("HMAC",key,encoder.encode(value)))}
export async function sha256(value){return hex(await crypto.subtle.digest("SHA-256",encoder.encode(value)))}
export function randomHex(size=32){const b=new Uint8Array(size);crypto.getRandomValues(b);return hex(b)}
export async function passwordHash(password,saltHex){const salt=Uint8Array.from(saltHex.match(/.{2}/g),x=>parseInt(x,16));const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"},key,256);return hex(bits)}
export function cookieToken(request){const cookie=request.headers.get("cookie")||"";return cookie.match(/(?:^|;\\s*)candy_session=([a-f0-9]{64})(?:;|$)/)?.[1]||null}
export function sessionCookie(token,maxAge=2592000){return `candy_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
export function clearCookie(){return "candy_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"}
export function originAllowed(request){const origin=request.headers.get("origin");if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
export async function recordAttempt(env,emailHash,ipHash){const row=await env.DB.prepare("SELECT COUNT(*) AS n FROM auth_password_attempts WHERE (email_hash=? OR ip_hash=?) AND created_at>datetime('now','-1 hour')").bind(emailHash,ipHash).first();if((row?.n||0)>=8)return false;await env.DB.prepare("INSERT INTO auth_password_attempts(id,email_hash,ip_hash) VALUES(?,?,?)").bind(crypto.randomUUID(),emailHash,ipHash).run();return true}
export function constantTimeEqual(a,b){if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}

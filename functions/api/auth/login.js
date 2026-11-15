import { fail, json, originAllowed, readJson, supabaseAuth, cookiesForSession } from "../_lib/supabase.js";
export async function onRequest({ request }) {
  if (request.method !== "POST") return fail("method_not_allowed", 405);
  if (!originAllowed(request)) return fail("origin_not_allowed", 403);
  let body;
  try { body = await readJson(request); } catch { return fail("invalid_request", 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 128) return fail("invalid_email_or_password", 400);
  try {
    const result = await supabaseAuth("token?grant_type=password", { method: "POST", body: { email, password } });
    if (!result.response.ok || !result.data?.access_token || !result.data?.refresh_token) {
      return fail(result.response.status === 429 ? "too_many_attempts_try_later" : "invalid_email_or_password", result.response.status === 429 ? 429 : 401);
    }
    return json({ ok: true, user: { id: result.data.user.id, email: result.data.user.email } }, 200, cookiesForSession(result.data));
  } catch (error) {
    console.error("candy_login_failed", error);
    return fail("auth_service_unavailable", 503);
  }
}

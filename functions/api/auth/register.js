import { fail, json, originAllowed, readJson, supabaseAuth, cookiesForSession } from "../_lib/supabase.js";
export async function onRequest({ request }) {
  if (request.method !== "POST") return fail("method_not_allowed", 405);
  if (!originAllowed(request)) return fail("origin_not_allowed", 403);
  let body;
  try { body = await readJson(request); } catch { return fail("invalid_request", 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254 || password.length < 10 || password.length > 128) {
    return fail("invalid_email_or_password_length", 400);
  }
  try {
    const result = await supabaseAuth("signup", { method: "POST", body: { email, password } });
    if (!result.response.ok) {
      const code = result.data?.code || result.data?.error_code || "";
      if (code === "user_already_exists" || /already registered|already exists/i.test(result.data?.msg || result.data?.message || "")) {
        return fail("account_already_exists_use_login", 409);
      }
      console.error("candy_signup_rejected", result.response.status, code);
      return fail("account_creation_failed", result.response.status === 429 ? 429 : 400);
    }
    if (!result.data?.access_token || !result.data?.refresh_token || !result.data?.user?.id) {
      return fail("email_confirmation_required", 409);
    }
    return json({ ok: true, user: { id: result.data.user.id, email: result.data.user.email } }, 200, cookiesForSession(result.data));
  } catch (error) {
    console.error("candy_signup_failed", error);
    return fail("auth_service_unavailable", 503);
  }
}

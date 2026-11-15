import { json, originAllowed, requireSession, clearSessionCookies } from "../_lib/supabase.js";
export async function onRequestPost({ request }) {
  if (!originAllowed(request)) return json({ ok: false, error: "origin_not_allowed" }, 403, clearSessionCookies());
  try {
    const session = await requireSession(request);
    if (session) {
      await fetch("https://dowxgetlaaxfywwxguee.supabase.co/auth/v1/logout", {
        method: "POST",
        headers: {
          apikey: "sb_publishable_eUYx_dftfVKJuZszIqJk4A_oj0LNHZm",
          authorization: "Bearer " + session.accessToken
        }
      });
    }
    return json({ ok: true }, 200, clearSessionCookies());
  } catch (error) {
    console.error("candy_logout_failed", error);
    return json({ ok: true }, 200, clearSessionCookies());
  }
}

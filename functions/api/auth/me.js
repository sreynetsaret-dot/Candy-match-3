import { fail, json, requireSession } from "../_lib/supabase.js";
export async function onRequestGet({ request }) {
  try {
    const session = await requireSession(request);
    if (!session) return json({ ok: false }, 401);
    return json({ ok: true, user: { id: session.user.id, email: session.user.email } }, 200, session.cookies);
  } catch (error) {
    console.error("candy_me_failed", error);
    return fail("auth_service_unavailable", 503);
  }
}

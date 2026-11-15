import { fail, json, originAllowed, readJson, requireSession } from "./_lib/supabase.js";

async function requestProgress(accessToken, userId, method, payload) {
  const url = "https://dowxgetlaaxfywwxguee.supabase.co/rest/v1/player_progress";
  const query = method === "GET"
    ? "?select=coins,level,game_state&user_id=eq." + encodeURIComponent(userId) + "&limit=1"
    : "?on_conflict=user_id";
  const response = await fetch(url + query, {
    method,
    headers: {
      apikey: "sb_publishable_eUYx_dftfVKJuZszIqJk4A_oj0LNHZm",
      authorization: "Bearer " + accessToken,
      "content-type": "application/json",
      ...(method === "POST" ? { prefer: "resolution=merge-duplicates,return=minimal" } : {})
    },
    ...(payload ? { body: JSON.stringify(payload) } : {})
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { response, data };
}
export async function onRequestGet({ request }) {
  if (!originAllowed(request)) return fail("origin_not_allowed", 403);
  try {
    const session = await requireSession(request);
    if (!session) return json({ ok: false, error: "not_signed_in" }, 401);
    const result = await requestProgress(session.accessToken, session.user.id, "GET");
    if (!result.response.ok) return json({ ok: false, error: "progress_unavailable" }, 503, session.cookies);
    return json({ ok: true, progress: result.data?.[0] || null }, 200, session.cookies);
  } catch (error) {
    console.error("candy_progress_read_failed", error);
    return fail("progress_unavailable", 503);
  }
}
export async function onRequestPut({ request }) {
  if (!originAllowed(request)) return fail("origin_not_allowed", 403);
  let body;
  try { body = await readJson(request); } catch { return fail("invalid_request", 400); }
  const coins = Number(body.coins), level = Number(body.level);
  if (!Number.isSafeInteger(coins) || coins < 0 || !Number.isSafeInteger(level) || level < 1 || level > 100000) {
    return fail("invalid_progress", 400);
  }
  const gameState = body.game_state && typeof body.game_state === "object" && !Array.isArray(body.game_state) ? body.game_state : {};
  try {
    const session = await requireSession(request);
    if (!session) return json({ ok: false, error: "not_signed_in" }, 401);
    const result = await requestProgress(session.accessToken, session.user.id, "POST", {
      user_id: session.user.id, coins, level, game_state: gameState, updated_at: new Date().toISOString()
    });
    if (!result.response.ok) return json({ ok: false, error: "progress_save_failed" }, 503, session.cookies);
    return json({ ok: true }, 200, session.cookies);
  } catch (error) {
    console.error("candy_progress_save_failed", error);
    return fail("progress_save_failed", 503);
  }
}

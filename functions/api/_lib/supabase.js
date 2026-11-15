const SUPABASE_URL = "https://dowxgetlaaxfywwxguee.supabase.co";
const SUPABASE_KEY = "sb_publishable_eUYx_dftfVKJuZszIqJk4A_oj0LNHZm";

export function json(data, status = 200, cookies = []) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
}
export function fail(error, status = 400) { return json({ ok: false, error }, status); }
export function originAllowed(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}
export async function readJson(request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new Error("content_type");
  const raw = await request.text();
  if (raw.length > 16384) throw new Error("too_large");
  return JSON.parse(raw);
}
function cookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  const match = raw.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}
function sessionCookies(session) {
  const accessAge = Math.max(60, Math.min(3600, Number(session.expires_in) || 3600));
  const refreshAge = 60 * 60 * 24 * 30;
  const base = "Path=/; HttpOnly; Secure; SameSite=Lax";
  return [
    "candy_access=" + encodeURIComponent(session.access_token) + "; " + base + "; Max-Age=" + accessAge,
    "candy_refresh=" + encodeURIComponent(session.refresh_token) + "; " + base + "; Max-Age=" + refreshAge
  ];
}
export function clearSessionCookies() {
  const base = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
  return ["candy_access=; " + base, "candy_refresh=; " + base];
}
export async function supabaseAuth(path, options = {}) {
  const response = await fetch(SUPABASE_URL + "/auth/v1/" + path, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_KEY,
      "content-type": "application/json",
      ...(options.accessToken ? { authorization: "Bearer " + options.accessToken } : {})
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  });
  let data = {};
  try { data = await response.json(); } catch {}
  return { response, data };
}
export async function requireSession(request) {
  let accessToken = cookie(request, "candy_access");
  const refreshToken = cookie(request, "candy_refresh");
  if (accessToken) {
    const current = await supabaseAuth("user", { accessToken });
    if (current.response.ok && current.data?.id) {
      return { user: current.data, accessToken, cookies: [] };
    }
  }
  if (refreshToken) {
    const refreshed = await supabaseAuth("token?grant_type=refresh_token", {
      method: "POST", body: { refresh_token: refreshToken }
    });
    if (refreshed.response.ok && refreshed.data?.access_token && refreshed.data?.user?.id) {
      return {
        user: refreshed.data.user,
        accessToken: refreshed.data.access_token,
        cookies: sessionCookies(refreshed.data)
      };
    }
  }
  return null;
}
export function cookiesForSession(session) {
  return session?.access_token && session?.refresh_token ? sessionCookies(session) : [];
}
export { SUPABASE_URL };

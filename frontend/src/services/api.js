// Thin fetch wrapper: JSON in/out, throws Error(message) using the backend's {"error": "..."} payload.
async function req(method, url, data) {
  let res;
  try {
    res = await fetch("/api" + url, { method, headers: { "Content-Type": "application/json" }, body: data ? JSON.stringify(data) : undefined });
  } catch { throw new Error("Cannot reach the backend. Is Flask running on port 5000?"); }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
export const api = { get: (u) => req("GET", u), post: (u, d = {}) => req("POST", u, d), put: (u, d) => req("PUT", u, d), del: (u) => req("DELETE", u) };

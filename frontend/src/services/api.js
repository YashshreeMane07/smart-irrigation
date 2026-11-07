
// Backend URL: Render in production, Vite proxy during local development.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Thin fetch wrapper
async function req(method, url, data) {
  let res;

  try {
    res = await fetch(`${API_BASE_URL}/api${url}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the backend. Please check your connection.");
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }

  return json;
}

export const api = {
  get: (u) => req("GET", u),
  post: (u, d = {}) => req("POST", u, d),
  put: (u, d) => req("PUT", u, d),
  del: (u) => req("DELETE", u),
};

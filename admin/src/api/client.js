const API_BASE = import.meta.env.VITE_API_BASE || "";
const SITE_ORIGIN = import.meta.env.VITE_SITE_ORIGIN || "http://localhost:4173";
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("cms_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("cms_token", token);
  else localStorage.removeItem("cms_token");
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  const data = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

export function assetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/assets/")) return `${SITE_ORIGIN}${url}`;
  if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
  return url;
}

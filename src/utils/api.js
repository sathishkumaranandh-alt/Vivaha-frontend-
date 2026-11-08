import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (user && !error) {
      const { data: { session: refreshed } } = await supabase.auth.getSession();
      return refreshed?.access_token || null;
    }
    return null;
  } catch (err) {
    console.error("🔒 getAccessToken error:", err);
    return null;
  }
}

// ⚡ Speed: /settings is the same for everyone and is asked for by many components on every page.
// Share one request for 60 seconds instead of calling the (slow) server again and again.
let settingsCache = { at: 0, promise: null };

export async function apiFetch(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  if (path === "/settings" && method === "GET") {
    if (!settingsCache.promise || Date.now() - settingsCache.at > 60000) {
      settingsCache = { at: Date.now(), promise: apiFetchRaw(path, options) };
      settingsCache.promise.then((r) => { if (!r.ok) settingsCache = { at: 0, promise: null }; })
        .catch(() => { settingsCache = { at: 0, promise: null }; });
    }
    const r = await settingsCache.promise;
    return r.clone();
  }
  if (path === "/settings") settingsCache = { at: 0, promise: null }; // admin saved new settings
  return apiFetchRaw(path, options);
}

async function apiFetchRaw(path, options = {}) {
  const token = await getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });


    if (!res.ok) {
      const clone = res.clone();
      try {
        const errData = await clone.json();
        console.error(`❌ apiFetch[${path}] ERROR:`, errData);
      } catch {}
    }

    return res;
  } catch (fetchErr) {
    console.error(`🚨 apiFetch[${path}] FETCH FAILED:`, fetchErr.message);
    throw fetchErr;
  }
}

export async function adminApiFetch(path, options = {}) {
  if (path === "/settings") settingsCache = { at: 0, promise: null }; // settings are being changed: forget the saved copy
  const token = await getAccessToken();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (userId) headers["x-admin-id"] = userId;

  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

  return fetch(url, {
    ...options,
    headers,
  });
}

export default apiFetch;
        

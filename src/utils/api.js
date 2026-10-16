import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

// ============================================
// 🔑 Get valid access token (auto-refresh if needed)
// ============================================
async function getAccessToken() {
  try {
    // 1. Try current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }

    // 2. If no session, try refreshing user (triggers token refresh)
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

// ============================================
// 🔒 apiFetch — Auto JWT
// ============================================
export async function apiFetch(path, options = {}) {
  const token = await getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ apiFetch: No token available for", path);
  }

  const url = path.startsWith("http")
    ? path
    : `${BACKEND_URL}${path}`;

  return fetch(url, {
    ...options,
    headers,
  });
}

// ============================================
// 🔒 adminApiFetch — JWT + admin_id
// ============================================
export async function adminApiFetch(path, options = {}) {
  const token = await getAccessToken();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (userId) headers["x-admin-id"] = userId;

  const url = path.startsWith("http")
    ? path
    : `${BACKEND_URL}${path}`;

  return fetch(url, {
    ...options,
    headers,
  });
}

export default apiFetch;

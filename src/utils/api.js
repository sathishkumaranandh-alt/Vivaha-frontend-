import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

// ============================================
// 🔒 AUTHENTICATED API FETCH
// Auto-includes Supabase JWT token in header
// ============================================
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });
}

// ============================================
// 🔒 ADMIN FETCH — for admin routes
// Re-uses apiFetch (JWT enough; admin role checked server-side)
// ============================================
export async function adminApiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const userId = session?.user?.id;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (userId) {
    headers["x-admin-id"] = userId;
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });
}

export default apiFetch;

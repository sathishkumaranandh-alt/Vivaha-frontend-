import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

// ============================================
// 🔒 ADMIN API HELPER
// Auto-includes admin_id in every request
// ============================================
export async function adminFetch(path, options = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("🚫 adminFetch: Not logged in");
    throw new Error("Not logged in");
  }

  // Append admin_id to query string
  const url = path.includes("?")
    ? `${BACKEND_URL}${path}&admin_id=${user.id}`
    : `${BACKEND_URL}${path}?admin_id=${user.id}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-id": user.id,
      ...(options.headers || {}),
    },
  });
}

export default adminFetch;

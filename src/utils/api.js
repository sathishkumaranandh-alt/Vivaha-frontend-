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

export async function apiFetch(path, options = {}) {
  const token = await getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log(`✅ apiFetch[${path}] TOKEN: YES`);
  } else {
    console.warn(`❌ apiFetch[${path}] TOKEN: NO`);
  }

  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`📡 apiFetch[${path}] STATUS: ${res.status}`);

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

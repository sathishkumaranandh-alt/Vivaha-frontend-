const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

let cache = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * Fetch active communities (cached for 60 seconds).
 * Returns: [{ id, slug, name, emoji, color, description, display_order }]
 */
export async function getCommunities() {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_DURATION) return cache;

  try {
    const res = await fetch(`${BACKEND_URL}/communities`);
    if (!res.ok) throw new Error("Failed to load communities");
    const data = await res.json();
    cache = data.communities || [];
    cacheTime = now;
    return cache;
  } catch (err) {
    console.error("getCommunities error:", err);
    // Fallback to defaults so app doesn't break
    return [
      { slug: "vanniyar", name: "Vanniyar", emoji: "🔥" },
      { slug: "naidu", name: "Naidu", emoji: "💫" },
      { slug: "kallar", name: "Kallar", emoji: "⚡" },
      { slug: "thevar", name: "Thevar", emoji: "🌟" },
      { slug: "other", name: "Other", emoji: "👥" },
    ];
  }
}

export function clearCommunitiesCache() {
  cache = null;
  cacheTime = 0;
}

/**
 * React hook to use communities in components.
 */
import { useState, useEffect } from "react";

export function useCommunities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await getCommunities();
      if (!cancelled) {
        setCommunities(list);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { communities, loading };
}
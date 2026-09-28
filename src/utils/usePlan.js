import { useState, useEffect } from "react";
import supabase from "../supabaseClient";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const FREE_PERMISSIONS = {
  daily_interests: 5,
  daily_recommendations: 5,
  max_photos: 3,
  advanced_search: false,
  see_visitors: false,
  unlimited_chat: false,
  profile_boost: false,
  contact_access: false,
  priority_support: false,
};

export function usePlan() {
  const [plan, setPlan] = useState("Free");
  const [permissions, setPermissions] = useState(FREE_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const res = await fetch(`${BACKEND_URL}/plans/user-plan/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan || "Free");
          setPermissions({ ...FREE_PERMISSIONS, ...(data.permissions || {}) });
        }
      } catch (err) {
        console.error("usePlan error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { plan, permissions, loading, userId };
}

export default usePlan;

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
  see_dob: false,
  see_horoscope: false,
  see_income: false,
  interest_to_anyone: false,
  see_full_photo: false,
  request_photo: true,
  can_view_paid_profiles: false,
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
        if (!user) { setLoading(false); return; }
        setUserId(user.id);

        // Get plan permissions
        const res = await fetch(`${BACKEND_URL}/plans/user-plan/${user.id}`);
        let planPerms = {};
        let planName = "Free";
        if (res.ok) {
          const data = await res.json();
          planName = data.plan || "Free";
          planPerms = data.permissions || {};
        }

        // Get custom permissions
        const customRes = await fetch(`${BACKEND_URL}/user-permissions/user/${user.id}`);
        let rawCustom = {};
        let category = null;
        if (customRes.ok) {
          const data = await customRes.json();
          rawCustom = data.custom_permissions || {};
          category = data.category || null;
        }

        // ============================================
        // SMART MERGE (same as backend logic):
        // Start with defaults + plan permissions
        // Then apply ONLY custom TRUE values + numbers
        // Custom FALSE values are IGNORED (plan decides)
        // ============================================
        const merged = { ...FREE_PERMISSIONS, ...planPerms };

        Object.keys(rawCustom).forEach((key) => {
          const val = rawCustom[key];
          if (val === true || typeof val === "number") {
            merged[key] = val;
          }
          // Custom FALSE values are ignored — plan permission wins
        });

        setPlan(category ? `${planName} · ${category}` : planName);
        setPermissions(merged);
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

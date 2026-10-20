import { useState, useEffect } from "react";
import supabase from "../supabaseClient";
import { apiFetch } from "./api"; // 🛡️ Added for JWT

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

        // 🛡️ SECURITY FIX: Switched to apiFetch & removed user.id from URL
        const res = await apiFetch(`/plans/user-plan/${user.id}`);
        let planPerms = {};
        let planName = "Free";
        if (res.ok) {
          const data = await res.json();
          planName = data.plan || "Free";
          planPerms = data.permissions || {};
        }

        // 🛡️ SECURITY FIX: Switched to apiFetch & used the new secure route
        const customRes = await apiFetch(`/user-permissions/my-permissions`);
        let rawCustom = {};
        let category = null;
        if (customRes.ok) {
          const data = await customRes.json();
          rawCustom = data.custom_permissions || {};
          category = data.category || null;
        }

        // ============================================
        // SMART MERGE (same as backend logic):
        // ============================================
        const merged = { ...FREE_PERMISSIONS, ...planPerms };

        Object.keys(rawCustom).forEach((key) => {
          const val = rawCustom[key];
          if (val === true || typeof val === "number") {
            merged[key] = val;
          }
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

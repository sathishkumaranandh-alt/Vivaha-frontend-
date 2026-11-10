import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import supabase from "../supabaseClient";
import { apiFetch } from "../utils/api";

// 🛠️ Shows a "We'll be back soon" screen to everyone except admins while
// Admin → Settings → Site → System → Maintenance Mode is ON.
// /login stays open so the admin can sign in and switch it off again.
// While the settings are still loading (or if they cannot be read) the normal site is shown.
export default function MaintenanceGate({ children }) {
  const { pathname } = useLocation();
  const [on, setOn] = useState(false);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/settings");
        const data = await res.json();
        const s = (data && data.settings) || {};
        const maintenance = s.maintenance_mode === "true";
        if (!alive) return;
        setOn(maintenance);
        setMessage(s.maintenance_message || "");
        if (!maintenance) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) { if (alive) setIsAdmin(false); return; }
        const { data: row } = await supabase.from("users").select("role").eq("id", session.user.id).single();
        if (alive) setIsAdmin(row?.role === "admin");
      } catch (e) {
        /* settings unreadable → keep the site open */
      }
    })();
    return () => { alive = false; };
  }, [pathname]);

  if (on && isAdmin) {
    return (
      <>
        <div style={{ background: "#dc2626", color: "#fff", textAlign: "center", padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>
          🛠️ Maintenance Mode is ON — only admins can see the site. Turn it off in Admin → Settings → Site → System.
        </div>
        {children}
      </>
    );
  }

  if (on && !isAdmin && !pathname.startsWith("/login")) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ maxWidth: 460, textAlign: "center", padding: "36px 24px", borderRadius: 22, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 54, marginBottom: 10 }}>🛠️</div>
          <h2 style={{ margin: "0 0 10px", color: "var(--vg-text, #2D1B1B)" }}>We'll be back soon</h2>
          <p style={{ margin: "0 0 8px", color: "var(--vg-muted, #666)", lineHeight: 1.6 }}>
            {message || "We are doing some maintenance to make the site better. Please check back in a little while."}
          </p>
          <p style={{ margin: 0, color: "var(--vg-muted, #666)", lineHeight: 1.6 }}>
            பராமரிப்பு பணி நடைபெறுகிறது. சிறிது நேரத்தில் மீண்டும் வாருங்கள்.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

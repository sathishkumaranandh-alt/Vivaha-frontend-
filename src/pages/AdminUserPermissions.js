import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const PERMISSION_FIELDS = [
  { key: "daily_interests", label: "Daily Interests Limit", type: "number" },
  { key: "daily_recommendations", label: "Daily Recommendations", type: "number" },
  { key: "max_photos", label: "Max Photos", type: "number" },
  { key: "advanced_search", label: "Advanced Search Access", type: "bool" },
  { key: "see_visitors", label: "See Who Viewed Me", type: "bool" },
  { key: "unlimited_chat", label: "Unlimited Chat", type: "bool" },
  { key: "profile_boost", label: "Profile Boost Included", type: "bool" },
  { key: "contact_access", label: "View Contact Info", type: "bool" },
  { key: "priority_support", label: "Priority Support", type: "bool" },
  { key: "see_dob", label: "See Date of Birth", type: "bool" },
  { key: "see_horoscope", label: "See Horoscope Details", type: "bool" },
  { key: "see_income", label: "See Income Details", type: "bool" },
  { key: "interest_to_anyone", label: "Send Interest to Any Community", type: "bool" },
  { key: "see_full_photo", label: "See Full Photos (No Blur)", type: "bool" },
  { key: "request_photo", label: "Can Request to View Photos", type: "bool" },
  { key: "can_view_paid_profiles", label: "Can View Paid Member Profiles", type: "bool" },
];

function AdminUserPermissions() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [originalPerms, setOriginalPerms] = useState({});
  const [planPermissions, setPlanPermissions] = useState({});
  const [planName, setPlanName] = useState("Free");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: admin } } = await supabase.auth.getUser();
        if (!admin) { navigate("/login"); return; }
        const { data: profile } = await supabase.from("users").select("role").eq("id", admin.id).single();
        if (!profile || profile.role !== "admin") { navigate("/dashboard"); return; }

        if (!userId) { navigate("/admin"); return; }

        // Load target user
        const userRes = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}/details`);
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
        }

        // Load their custom permissions
        const permRes = await fetch(`${BACKEND_URL}/user-permissions/user/${userId}`);
        if (permRes.ok) {
          const data = await permRes.json();
          const custom = data.custom_permissions || {};
          setPermissions(custom);
          setOriginalPerms(custom);
          setCategory(data.category || "");
        }

        // Load plan permissions (for showing plan default)
        const planRes = await fetch(`${BACKEND_URL}/plans/user-plan/${userId}`);
        if (planRes.ok) {
          const data = await planRes.json();
          setPlanName(data.plan || "Free");
          setPlanPermissions(data.permissions || {});
        }

        // Load categories
        const catRes = await fetch(`${BACKEND_URL}/user-permissions/categories`);
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate, userId]);

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePermissionValue = (key, value) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  // Clear a specific override — returns to plan default
  const clearOverride = (key) => {
    setPermissions(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean permissions: remove false values that were never explicitly set
      // This prevents stale 'false' data from blocking plan permissions
      const cleaned = {};
      Object.keys(permissions).forEach((key) => {
        const val = permissions[key];
        // Keep TRUE values and numbers
        if (val === true || typeof val === "number") {
          cleaned[key] = val;
        }
        // Keep FALSE only if it was in the original custom permissions
        // (i.e., admin explicitly set it as override before)
        else if (val === false && originalPerms.hasOwnProperty(key)) {
          cleaned[key] = val;
        }
      });

      const res = await fetch(`${BACKEND_URL}/user-permissions/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_permissions: cleaned, category }),
      });
      if (res.ok) {
        setPermissions(cleaned);
        setOriginalPerms(cleaned);
        toast.success("Permissions saved for user!");
      } else {
        toast.error("Failed to save");
      }
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset to plan defaults? Custom overrides will be removed.")) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/user-permissions/user/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setPermissions({});
        setOriginalPerms({});
        setCategory("");
        toast.success("Reset to plan defaults");
      }
    } catch { toast.error("Failed to reset"); } finally { setSaving(false); }
  };

  const applyCategory = async (catName) => {
    if (!catName) return;
    try {
      const res = await fetch(`${BACKEND_URL}/user-permissions/apply-category/${userId}/${encodeURIComponent(catName)}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const custom = data.user.custom_permissions || {};
        setPermissions(custom);
        setOriginalPerms(custom);
        setCategory(catName);
        toast.success(`Applied ${catName} category`);
      }
    } catch { toast.error("Failed to apply"); } finally { }
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;

  const S = {
    page: { maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: 12 },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    card: { background: "white", borderRadius: "14px", padding: "24px", border: "1px solid #f0e0e0", marginBottom: "16px" },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase" },
    input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box" },
    permsGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "10px", marginTop: "12px" },
    permRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FFF9F5", borderRadius: "8px", border: "1px solid #f0e0e0", gap: 8, position: "relative" },
    permRowOverride: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FEF3C7", borderRadius: "8px", border: "1.5px solid #D4A017", gap: 8, position: "relative" },
    permLabel: { fontSize: "13px", color: "#2D1B1B", fontWeight: 600, flex: 1 },
    planHint: { fontSize: "10px", color: "#8a6b6b", fontStyle: "italic", marginTop: "2px" },
    btn: { background: "#8B0A2E", color: "white", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" },
    backBtn: { background: "#e5e7eb", color: "#8B0A2E", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
    resetBtn: { background: "#f3f4f6", color: "#374151", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" },
    catRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
    catChip: { padding: "8px 14px", borderRadius: "20px", border: "1.5px solid #e5e7eb", background: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    clearBtn: { background: "transparent", border: "none", color: "#dc2626", fontSize: "10px", cursor: "pointer", textDecoration: "underline", padding: "2px 4px", fontFamily: "inherit" },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>🔐 User Permissions</h1>
          <p style={S.sub}>
            {user?.name || user?.email || "User"} · Plan: <strong>{planName}</strong>
            {category && ` · Category: ${category}`}
          </p>
        </div>
        <Link to="/admin" style={S.backBtn}>← Dashboard</Link>
      </div>

      {/* Apply Preset Category */}
      <div style={S.card}>
        <h3 style={{ color: "#8B0A2E", marginTop: 0, marginBottom: "6px", fontSize: "16px" }}>⚡ Quick Apply Category</h3>
        <p style={{ color: "#8a6b6b", fontSize: "12px", marginBottom: "12px" }}>
          Apply a preset category to instantly grant a set of permissions.
        </p>
        <div style={S.catRow}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => applyCategory(c.name)}
              style={{ ...S.catChip, background: category === c.name ? c.color : "white", color: category === c.name ? "white" : c.color, borderColor: c.color }}
              title={c.description}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Permissions */}
      <div style={S.card}>
        <h3 style={{ color: "#8B0A2E", marginTop: 0, marginBottom: "6px", fontSize: "16px" }}>🎛️ Custom Permissions</h3>
        <p style={{ color: "#8a6b6b", fontSize: "12px", marginBottom: "12px" }}>
          These override the user's plan. <strong>Highlighted rows (yellow)</strong> are explicit overrides.
          Other rows use the plan's default value.
        </p>

        <div style={S.permsGrid}>
          {PERMISSION_FIELDS.map((p) => {
            const isOverride = originalPerms.hasOwnProperty(p.key);
            const currentVal = permissions[p.key];
            const planVal = planPermissions[p.key];
            const boolVal = currentVal === true;
            const numVal = currentVal ?? (typeof planVal === "number" ? planVal : 0);

            return (
              <div key={p.key} style={isOverride ? S.permRowOverride : S.permRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.permLabel}>{p.label}</div>
                  <div style={S.planHint}>
                    Plan: {typeof planVal === "boolean" ? (planVal ? "✓ On" : "✗ Off") : (planVal ?? "—")}
                    {isOverride && " · Override active"}
                  </div>
                </div>

                {p.type === "bool" ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <input
                      type="checkbox"
                      checked={boolVal}
                      onChange={() => togglePermission(p.key)}
                      style={{ width: 20, height: 20, accentColor: "#8B0A2E", cursor: "pointer" }}
                    />
                    {isOverride && (
                      <button onClick={() => clearOverride(p.key)} style={S.clearBtn} title="Clear override">clear</button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <input
                      type="number"
                      value={numVal}
                      onChange={(e) => updatePermissionValue(p.key, parseInt(e.target.value) || 0)}
                      style={{ width: 70, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, textAlign: "center", fontFamily: "inherit" }}
                    />
                    {isOverride && (
                      <button onClick={() => clearOverride(p.key)} style={S.clearBtn} title="Clear override">clear</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "💾 Save Permissions"}
          </button>
          <button onClick={handleReset} disabled={saving} style={S.resetBtn}>
            ↺ Reset to Plan Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminUserPermissions;

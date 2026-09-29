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

        // Load the target user
        const userRes = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}/details`);
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
        }

        // Load their custom permissions
        const permRes = await fetch(`${BACKEND_URL}/user-permissions/user/${userId}`);
        if (permRes.ok) {
          const data = await permRes.json();
          setPermissions(data.custom_permissions || {});
          setCategory(data.category || "");
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/user-permissions/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_permissions: permissions, category }),
      });
      if (res.ok) {
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
        setPermissions(data.user.custom_permissions || {});
        setCategory(catName);
        toast.success(`Applied ${catName} category`);
      }
    } catch { toast.error("Failed to apply"); }
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
    permRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FFF9F5", borderRadius: "8px", border: "1px solid #f0e0e0" },
    permLabel: { fontSize: "13px", color: "#2D1B1B", fontWeight: 600 },
    btn: { background: "#8B0A2E", color: "white", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" },
    backBtn: { background: "#e5e7eb", color: "#8B0A2E", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
    resetBtn: { background: "#f3f4f6", color: "#374151", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" },
    catRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
    catChip: { padding: "8px 14px", borderRadius: "20px", border: "1.5px solid #e5e7eb", background: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>🔐 User Permissions</h1>
          <p style={S.sub}>
            {user?.name || user?.email || "User"} · Plan: <strong>{user?.plan || "Free"}</strong>
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
          These override the user's plan. Leave empty to use plan defaults.
        </p>

        <div style={S.permsGrid}>
          {PERMISSION_FIELDS.map((p) => (
            <div key={p.key} style={S.permRow}>
              <span style={S.permLabel}>{p.label}</span>
              {p.type === "bool" ? (
                <input
                  type="checkbox"
                  checked={permissions[p.key] || false}
                  onChange={() => togglePermission(p.key)}
                  style={{ width: 20, height: 20, accentColor: "#8B0A2E" }}
                />
              ) : (
                <input
                  type="number"
                  value={permissions[p.key] ?? 0}
                  onChange={(e) => updatePermissionValue(p.key, parseInt(e.target.value) || 0)}
                  style={{ width: 80, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, textAlign: "center", fontFamily: "inherit" }}
                />
              )}
            </div>
          ))}
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

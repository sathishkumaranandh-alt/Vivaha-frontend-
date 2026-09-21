import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const API = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function AdminSettings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [saved, setSaved] = useState(false);
  const [logFilter, setLogFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setAdminEmail(user.email || "");

        const { data: profile } = await supabase
          .from("users").select("role").eq("id", user.id).single();

        if (!profile || profile.role !== "admin") {
          setError("Access denied. Admin only.");
          setLoading(false);
          return;
        }
        setIsAdmin(true);

        // Load settings + logs
        const [setRes, logRes] = await Promise.all([
          fetch(`${API}/settings`),
          fetch(`${API}/audit/all`),
        ]);
        if (setRes.ok) setSettings((await setRes.json()).settings || {});
        if (logRes.ok) setLogs((await logRes.json()).logs || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      const res = await fetch(`${API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Log the action
        await fetch(`${API}/audit/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin_email: adminEmail,
            action: "update_settings",
            target_type: "settings",
            target_name: "Site Settings",
            details: "Updated site configuration",
          }),
        });
      } else {
        alert("Failed to save");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Clear ALL audit logs? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/audit/clear`, { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        alert("Logs cleared");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#666" }}>Loading... ⏳</div>;
  if (error) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <p style={{ color: "#b91c1c", fontSize: 18 }}>⚠️ {error}</p>
      <Link to="/admin" style={{ color: "#1e3a8a", fontWeight: "bold" }}>← Back to Dashboard</Link>
    </div>
  );
  if (!isAdmin) return null;

  const filteredLogs = logFilter === "all" ? logs : logs.filter(l => l.action === logFilter);
  const uniqueActions = ["all", ...new Set(logs.map(l => l.action))];

  const actionIcons = {
    verify: "✔️", suspend: "🚫", unsuspend: "✅", delete: "🗑️",
    resolve: "✅", dismiss: "✖️", user_suspended: "🚫",
    grant: "🎁", extend: "➕", update_settings: "⚙️",
  };

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>⚙️ Admin Settings</h1>
          <p style={S.sub}>Manage site configuration & view audit log</p>
        </div>
        <Link to="/admin" style={S.backBtn}>← Dashboard</Link>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        <button onClick={() => setTab("settings")} style={{ ...S.tabBtn, background: tab === "settings" ? "#1e3a8a" : "#f3f4f6", color: tab === "settings" ? "white" : "#374151" }}>
          ⚙️ Site Settings
        </button>
        <button onClick={() => setTab("logs")} style={{ ...S.tabBtn, background: tab === "logs" ? "#7c3aed" : "#f3f4f6", color: tab === "logs" ? "white" : "#374151" }}>
          📝 Audit Log ({logs.length})
        </button>
      </div>

      {/* ==================== SETTINGS TAB ==================== */}
      {tab === "settings" && (
        <div style={S.card}>
          {saved && <div style={S.savedBanner}>✅ Settings saved successfully!</div>}

          <h3 style={S.sectionTitle}>🌐 Basic Info</h3>
          <Field label="Site Name" value={settings.site_name} onChange={(v) => handleSettingChange("site_name", v)} placeholder="Vivaha Matrimony" />
          <Field label="Homepage Tagline" value={settings.homepage_tagline} onChange={(v) => handleSettingChange("homepage_tagline", v)} placeholder="Find Your Perfect Life Partner" />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>📞 Contact Info</h3>
          <Field label="Support Email" value={settings.contact_email} onChange={(v) => handleSettingChange("contact_email", v)} placeholder="support@example.com" type="email" />
          <Field label="Support Phone" value={settings.contact_phone} onChange={(v) => handleSettingChange("contact_phone", v)} placeholder="+91 90000 00000" />
          <Field label="Support Hours" value={settings.support_hours} onChange={(v) => handleSettingChange("support_hours", v)} placeholder="Mon-Fri, 9 AM - 6 PM" />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>🔧 System</h3>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Maintenance Mode</div>
              <div style={S.toggleHint}>When ON, users see a maintenance message</div>
            </div>
            <ToggleSwitch
              value={settings.maintenance_mode === "true"}
              onChange={(v) => handleSettingChange("maintenance_mode", v ? "true" : "false")}
              color="#dc2626"
            />
          </div>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Allow New Registrations</div>
              <div style={S.toggleHint}>When OFF, new users can't sign up</div>
            </div>
            <ToggleSwitch
              value={settings.allow_registration !== "false"}
              onChange={(v) => handleSettingChange("allow_registration", v ? "true" : "false")}
              color="#16a34a"
            />
          </div>

          {/* SAVE */}
          <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "💾 Save All Settings"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== AUDIT LOG TAB ==================== */}
      {tab === "logs" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#1e3a8a" }}>Recent Activity ({filteredLogs.length})</h3>
            {logs.length > 0 && (
              <button onClick={handleClearLogs} style={S.dangerBtn}>🗑️ Clear All Logs</button>
            )}
          </div>

          {/* ACTION FILTERS */}
          {logs.length > 0 && (
            <div style={S.subTabs}>
              {uniqueActions.map((a) => (
                <button
                  key={a}
                  onClick={() => setLogFilter(a)}
                  style={{
                    ...S.subTabBtn,
                    background: logFilter === a ? "#7c3aed" : "#f3f4f6",
                    color: logFilter === a ? "white" : "#374151",
                  }}
                >
                  {a === "all" ? `📋 All (${logs.length})` : `${actionIcons[a] || "•"} ${a} (${logs.filter(l => l.action === a).length})`}
                </button>
              ))}
            </div>
          )}

          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 60, marginBottom: 12 }}>📝</div>
              <p style={{ color: "#666", fontSize: 17 }}>No activity yet.</p>
              <p style={{ color: "#999", fontSize: 14 }}>Admin actions will appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredLogs.map((log) => (
                <div key={log.id} style={S.logItem}>
                  <div style={S.logIcon}>{actionIcons[log.action] || "•"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                      <span style={S.logAction}>{log.action.replace(/_/g, " ")}</span>
                      <span style={S.logTime}>{new Date(log.created_at).toLocaleString("en-IN")}</span>
                    </div>
                    {log.target_name && (
                      <div style={S.logTarget}>
                        {log.target_type && <span style={S.logBadge}>{log.target_type}</span>}
                        <strong>{log.target_name}</strong>
                      </div>
                    )}
                    {log.details && <div style={S.logDetails}>"{log.details}"</div>}
                    {log.admin_email && (
                      <div style={S.logAdmin}>by {log.admin_email}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================
function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={S.input}
      />
    </div>
  );
}

function ToggleSwitch({ value, onChange, color = "#1e3a8a" }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 50, height: 28, borderRadius: 14,
        background: value ? color : "#d1d5db",
        position: "relative", cursor: "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22, height: 22, borderRadius: "50%", background: "white",
          position: "absolute", top: 3,
          left: value ? 25 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

// ==================== STYLES ====================
const S = {
  page: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  h1: { color: "#1e3a8a", fontSize: 26, margin: "0 0 4px 0" },
  sub: { color: "#666", fontSize: 14, margin: 0 },
  backBtn: { background: "#e5e7eb", color: "#1e3a8a", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
  tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tabBtn: { border: "none", padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 8 },
  card: { background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  sectionTitle: { margin: "0 0 14px 0", color: "#1e3a8a", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f3f4f6", gap: 12 },
  toggleLabel: { fontSize: 15, fontWeight: 600, color: "#1e3a8a" },
  toggleHint: { fontSize: 12, color: "#888", marginTop: 2 },
  primaryBtn: { background: "#1e3a8a", color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" },
  dangerBtn: { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  savedBanner: { background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 8, textAlign: "center", marginBottom: 20, fontWeight: 600 },
  subTabs: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 },
  subTabBtn: { border: "none", padding: "6px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  logItem: { display: "flex", gap: 12, padding: 14, background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" },
  logIcon: { fontSize: 22, flexShrink: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: 8 },
  logAction: { fontSize: 14, fontWeight: 700, color: "#1e3a8a", textTransform: "capitalize" },
  logTime: { fontSize: 11, color: "#888" },
  logTarget: { fontSize: 13, color: "#444", display: "flex", alignItems: "center", gap: 6, marginTop: 2 },
  logBadge: { background: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase" },
  logDetails: { fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 4 },
  logAdmin: { fontSize: 11, color: "#999", marginTop: 4 },
};

export default AdminSettings;
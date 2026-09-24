import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const API = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

// Preset color palette for quick selection
const COLOR_PRESETS = [
  "#8B0A2E", "#6B0722", "#D4A017", "#b8860b", "#2D1B1B",
  "#5c3030", "#8a6b6b", "#16a34a", "#2563eb", "#7c3aed",
  "#dc2626", "#ea580c", "#0891b2", "#ffffff", "#000000",
];

function AdminSettings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("site");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [saved, setSaved] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const heroFileRef = useRef(null);

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

  // ============================================================
  // UPLOAD HERO IMAGE
  // ============================================================
  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      handleSettingChange("home_hero_image", publicUrl);
      toast.success("Image uploaded! Click Save to apply.");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (heroFileRef.current) heroFileRef.current.value = "";
    }
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
        await fetch(`${API}/audit/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin_email: adminEmail,
            action: "update_settings",
            target_type: "settings",
            target_name: "Site Settings",
            details: `Updated settings (tab: ${tab})`,
          }),
        });
      } else {
        toast.error("Failed to save");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Clear ALL audit logs? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/audit/clear`, { method: "DELETE" });
      if (res.ok) { setLogs([]); toast.success("Logs cleared"); }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#666" }}>Loading... ⏳</div>;
  if (error) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <p style={{ color: "#b91c1c", fontSize: 18 }}>⚠️ {error}</p>
      <Link to="/admin" style={{ color: "#8B0A2E", fontWeight: "bold" }}>← Back to Dashboard</Link>
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
          <p style={S.sub}>Manage site configuration, homepage & audit log</p>
        </div>
        <Link to="/admin" style={S.backBtn}>← Dashboard</Link>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        <button
          onClick={() => setTab("site")}
          style={{ ...S.tabBtn, background: tab === "site" ? "#8B0A2E" : "#f3f4f6", color: tab === "site" ? "white" : "#374151" }}
        >
          ⚙️ Site Settings
        </button>
        <button
          onClick={() => setTab("home")}
          style={{ ...S.tabBtn, background: tab === "home" ? "#D4A017" : "#f3f4f6", color: tab === "home" ? "white" : "#374151" }}
        >
          🏠 Homepage Editor
        </button>
        <button
          onClick={() => setTab("logs")}
          style={{ ...S.tabBtn, background: tab === "logs" ? "#7c3aed" : "#f3f4f6", color: tab === "logs" ? "white" : "#374151" }}
        >
          📝 Audit Log ({logs.length})
        </button>
      </div>

      {/* ==================== SITE SETTINGS TAB ==================== */}
      {tab === "site" && (
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
            <ToggleSwitch value={settings.maintenance_mode === "true"} onChange={(v) => handleSettingChange("maintenance_mode", v ? "true" : "false")} color="#dc2626" />
          </div>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Allow New Registrations</div>
              <div style={S.toggleHint}>When OFF, new users can't sign up</div>
            </div>
            <ToggleSwitch value={settings.allow_registration !== "false"} onChange={(v) => handleSettingChange("allow_registration", v ? "true" : "false")} color="#16a34a" />
          </div>

          <div style={{ marginTop: 28 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "💾 Save Site Settings"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== HOMEPAGE EDITOR TAB ==================== */}
      {tab === "home" && (
        <div style={S.card}>
          {saved && <div style={S.savedBanner}>✅ Homepage updated! Refresh to see changes.</div>}

          <div style={S.notice}>
            💡 <strong>Tip:</strong> All changes appear on the homepage after clicking Save.
          </div>

          {/* ============ HERO TEXT ============ */}
          <h3 style={S.sectionTitle}>🎬 Hero Text</h3>

          <Field
            label="Eyebrow Text"
            value={settings.home_eyebrow}
            onChange={(v) => handleSettingChange("home_eyebrow", v)}
            placeholder="TRADITION · TRUST · TOGETHER FOREVER"
          />

          <Field
            label="Main Title"
            value={settings.home_title}
            onChange={(v) => handleSettingChange("home_title", v)}
            placeholder="Find Your Perfect Life Partner"
          />

          <Field
            label="Tamil Subtitle"
            value={settings.home_tamil_subtitle}
            onChange={(v) => handleSettingChange("home_tamil_subtitle", v)}
            placeholder="நம் பாரம்பரியம்..."
          />

          <Field
            label="Subtitle Paragraph"
            value={settings.home_subtitle}
            onChange={(v) => handleSettingChange("home_subtitle", v)}
            placeholder="Vivaha Matrimony brings together..."
            textarea
          />

          {/* ============ HERO IMAGE ============ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🖼️ Hero Image</h3>

          {settings.home_hero_image && (
            <div style={S.previewBox}>
              <img
                src={settings.home_hero_image}
                alt=""
                style={S.previewImg}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button
              type="button"
              onClick={() => heroFileRef.current?.click()}
              disabled={uploading}
              style={{ ...S.uploadBtn, opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? "⏳ Uploading..." : "📷 Upload from Phone"}
            </button>
            {settings.home_hero_image && (
              <button
                type="button"
                onClick={() => handleSettingChange("home_hero_image", "")}
                style={S.removeBtn}
              >
                🗑️ Remove Image
              </button>
            )}
          </div>

          <input
            ref={heroFileRef}
            type="file"
            accept="image/*"
            onChange={handleHeroUpload}
            style={{ display: "none" }}
          />

          <p style={S.helpText}>📷 JPG, PNG up to 5MB. Square or landscape images work best.</p>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0e0e0" }}>
            <div style={S.orLabel}>OR paste an image URL</div>
            <Field
              label="Image URL"
              value={settings.home_hero_image}
              onChange={(v) => handleSettingChange("home_hero_image", v)}
              placeholder="https://example.com/image.jpg"
            />
            <p style={S.helpText}>
              Find free images at{" "}
              <a href="https://unsplash.com/s/photos/indian-wedding" target="_blank" rel="noreferrer" style={{ color: "#8B0A2E", fontWeight: 600 }}>
                unsplash.com
              </a>
            </p>
          </div>

          {/* ============ TEXT COLORS ============ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🎨 Text Colors</h3>
          <p style={S.sectionDesc}>Click a color swatch or type a custom hex code</p>

          <ColorPicker
            label="Eyebrow Text Color"
            value={settings.home_color_eyebrow || "#8B0A2E"}
            onChange={(v) => handleSettingChange("home_color_eyebrow", v)}
          />

          <ColorPicker
            label="Main Title Color"
            value={settings.home_color_title || "#8B0A2E"}
            onChange={(v) => handleSettingChange("home_color_title", v)}
          />

          <ColorPicker
            label="Tamil Subtitle Color"
            value={settings.home_color_tamil || "#8B0A2E"}
            onChange={(v) => handleSettingChange("home_color_tamil", v)}
          />

          <ColorPicker
            label="Subtitle Paragraph Color"
            value={settings.home_color_subtitle || "#5c3030"}
            onChange={(v) => handleSettingChange("home_color_subtitle", v)}
          />

          <ColorPicker
            label="Trust Badge Title Color"
            value={settings.home_color_trust || "#8B0A2E"}
            onChange={(v) => handleSettingChange("home_color_trust", v)}
          />

          {/* ============ HERO LAYOUT ============ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>📐 Hero Layout</h3>
          <p style={S.sectionDesc}>Control the size and spacing of the hero section</p>

          <Slider
            label="Hero Section Height"
            value={settings.home_hero_height || "600"}
            onChange={(v) => handleSettingChange("home_hero_height", v)}
            min={300}
            max={900}
            step={20}
          />

          <Slider
            label="Content Max Width"
            value={settings.home_content_width || "560"}
            onChange={(v) => handleSettingChange("home_content_width", v)}
            min={300}
            max={900}
            step={20}
          />

          <Slider
            label="Cream Overlay Opacity"
            value={settings.home_overlay_opacity || "90"}
            onChange={(v) => handleSettingChange("home_overlay_opacity", v)}
            min={0}
            max={100}
            step={5}
            unit="%"
          />
          <p style={{ fontSize: 11, color: "#888", marginTop: -8, marginBottom: 16 }}>
            Lower = more image visible, Higher = text more readable
          </p>

          {/* ============ TEXT SIZES ============ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🔤 Text Sizes</h3>
          <p style={S.sectionDesc}>Desktop sizes. Mobile auto-scales to 70%.</p>

          <Slider
            label="Eyebrow Size"
            value={settings.home_size_eyebrow || "11"}
            onChange={(v) => handleSettingChange("home_size_eyebrow", v)}
            min={8}
            max={20}
          />

          <Slider
            label="Main Title Size"
            value={settings.home_size_title || "56"}
            onChange={(v) => handleSettingChange("home_size_title", v)}
            min={24}
            max={100}
            step={2}
          />

          <Slider
            label="Tamil Subtitle Size"
            value={settings.home_size_tamil || "19"}
            onChange={(v) => handleSettingChange("home_size_tamil", v)}
            min={12}
            max={40}
            step={1}
          />

          <Slider
            label="Subtitle Paragraph Size"
            value={settings.home_size_subtitle || "16"}
            onChange={(v) => handleSettingChange("home_size_subtitle", v)}
            min={12}
            max={30}
            step={1}
          />

          {/* ============ SEARCH BOX ============ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🔍 Search Box</h3>
          <p style={S.sectionDesc}>Control the search form in the hero</p>

          <Slider
            label="Search Box Width"
            value={settings.home_search_width || "520"}
            onChange={(v) => handleSettingChange("home_search_width", v)}
            min={320}
            max={800}
            step={20}
          />

          <Slider
            label="Search Box Padding"
            value={settings.home_search_padding || "16"}
            onChange={(v) => handleSettingChange("home_search_padding", v)}
            min={8}
            max={40}
            step={2}
          />

          <ColorPicker
            label="Search Button Color"
            value={settings.home_search_button_color || "#8B0A2E"}
            onChange={(v) => handleSettingChange("home_search_button_color", v)}
          />

          {/* ============ VISIBILITY ============ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>👁️ Show / Hide Sections</h3>
          <p style={S.sectionDesc}>Toggle what appears on the homepage hero</p>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Show Eyebrow Text</div>
              <div style={S.toggleHint}>Small text above title</div>
            </div>
            <ToggleSwitch
              value={settings.home_show_eyebrow !== "false"}
              onChange={(v) => handleSettingChange("home_show_eyebrow", v ? "true" : "false")}
              color="#8B0A2E"
            />
          </div>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Show Tamil Subtitle</div>
              <div style={S.toggleHint}>Tamil line under title</div>
            </div>
            <ToggleSwitch
              value={settings.home_show_tamil !== "false"}
              onChange={(v) => handleSettingChange("home_show_tamil", v ? "true" : "false")}
              color="#8B0A2E"
            />
          </div>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Show Subtitle Paragraph</div>
              <div style={S.toggleHint}>Description text below</div>
            </div>
            <ToggleSwitch
              value={settings.home_show_subtitle !== "false"}
              onChange={(v) => handleSettingChange("home_show_subtitle", v ? "true" : "false")}
              color="#8B0A2E"
            />
          </div>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Show Trust Badges</div>
              <div style={S.toggleHint}>4 badges with icons</div>
            </div>
            <ToggleSwitch
              value={settings.home_show_trust !== "false"}
              onChange={(v) => handleSettingChange("home_show_trust", v ? "true" : "false")}
              color="#8B0A2E"
            />
          </div>

          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleLabel}>Show Search Box</div>
              <div style={S.toggleHint}>Bride/Groom search form</div>
            </div>
            <ToggleSwitch
              value={settings.home_show_search !== "false"}
              onChange={(v) => handleSettingChange("home_show_search", v ? "true" : "false")}
              color="#8B0A2E"
            />
          </div>

          {/* ============ TRUST BADGES ============ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>✨ Trust Badges</h3>
          <p style={S.sectionDesc}>4 badges shown below the hero. Leave empty to hide.</p>

          <div style={S.badgeGrid}>
            <Field label="Badge 1 — Title" value={settings.home_trust_1_title} onChange={(v) => handleSettingChange("home_trust_1_title", v)} placeholder="Verified Profiles" />
            <Field label="Badge 1 — Subtitle" value={settings.home_trust_1_desc} onChange={(v) => handleSettingChange("home_trust_1_desc", v)} placeholder="100% genuine" />
            <Field label="Badge 2 — Title" value={settings.home_trust_2_title} onChange={(v) => handleSettingChange("home_trust_2_title", v)} placeholder="Safe & Secure" />
            <Field label="Badge 2 — Subtitle" value={settings.home_trust_2_desc} onChange={(v) => handleSettingChange("home_trust_2_desc", v)} placeholder="Privacy first" />
            <Field label="Badge 3 — Title" value={settings.home_trust_3_title} onChange={(v) => handleSettingChange("home_trust_3_title", v)} placeholder="Wide Community" />
            <Field label="Badge 3 — Subtitle" value={settings.home_trust_3_desc} onChange={(v) => handleSettingChange("home_trust_3_desc", v)} placeholder="All communities" />
            <Field label="Badge 4 — Title" value={settings.home_trust_4_title} onChange={(v) => handleSettingChange("home_trust_4_title", v)} placeholder="Dedicated Support" />
            <Field label="Badge 4 — Subtitle" value={settings.home_trust_4_desc} onChange={(v) => handleSettingChange("home_trust_4_desc", v)} placeholder="We are here" />
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...S.primaryBtn, background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "#8B0A2E", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Saving..." : "💾 Save Homepage Changes"}
            </button>
            <button
              onClick={() => window.open("/", "_blank")}
              style={S.previewSiteBtn}
            >
              👁️ Preview Homepage
            </button>
          </div>
        </div>
      )}

      {/* ==================== AUDIT LOG TAB ==================== */}
      {tab === "logs" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#8B0A2E" }}>Recent Activity ({filteredLogs.length})</h3>
            {logs.length > 0 && <button onClick={handleClearLogs} style={S.dangerBtn}>🗑️ Clear All Logs</button>}
          </div>

          {logs.length > 0 && (
            <div style={S.subTabs}>
              {uniqueActions.map((a) => (
                <button
                  key={a}
                  onClick={() => setLogFilter(a)}
                  style={{ ...S.subTabBtn, background: logFilter === a ? "#7c3aed" : "#f3f4f6", color: logFilter === a ? "white" : "#374151" }}
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
                    {log.admin_email && <div style={S.logAdmin}>by {log.admin_email}</div>}
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
function Field({ label, value, onChange, placeholder, type = "text", textarea = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {textarea ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...S.input, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={S.input}
        />
      )}
    </div>
  );
}

function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "px" }) {
  const numValue = parseFloat(value) || 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>
        {label} — <span style={{ color: "#8B0A2E" }}>{numValue}{unit}</span>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, accentColor: "#8B0A2E" }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={numValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...S.input, width: 80, marginBottom: 0 }}
        />
      </div>
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

function ColorPicker({ label, value, onChange }) {
  const [showPalette, setShowPalette] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div
          onClick={() => setShowPalette(!showPalette)}
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            background: value,
            border: "2px solid #f0e0e0",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          title="Click to open color palette"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#8B0A2E"
          style={{ ...S.input, flex: 1, minWidth: 140, fontFamily: "monospace", marginBottom: 0 }}
        />
      </div>

      {showPalette && (
        <div style={S.palette}>
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setShowPalette(false); }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: c,
                border: c === value ? "3px solid #8B0A2E" : "2px solid #f0e0e0",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== STYLES ====================
const S = {
  page: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  h1: { color: "#8B0A2E", fontSize: 26, margin: "0 0 4px 0" },
  sub: { color: "#666", fontSize: 14, margin: 0 },
  backBtn: { background: "#e5e7eb", color: "#8B0A2E", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
  tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tabBtn: { border: "none", padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 8 },
  card: { background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0e0e0" },
  sectionTitle: { margin: "0 0 14px 0", color: "#8B0A2E", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionDesc: { margin: "-8px 0 16px 0", color: "#888", fontSize: 12 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: "#FFF9F5", outline: "none", marginBottom: 0 },
  helpText: { fontSize: 12, color: "#888", marginTop: 6, fontStyle: "italic" },
  orLabel: { fontSize: 11, color: "#8B0A2E", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 },
  badgeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  notice: { background: "#FDF2F6", border: "1px solid #f0e0e0", borderRadius: 10, padding: 14, fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f3f4f6", gap: 12 },
  toggleLabel: { fontSize: 15, fontWeight: 600, color: "#8B0A2E" },
  toggleHint: { fontSize: 12, color: "#888", marginTop: 2 },
  primaryBtn: { background: "#8B0A2E", color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", fontFamily: "inherit" },
  previewSiteBtn: { background: "white", color: "#8B0A2E", border: "1.5px solid #8B0A2E", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  uploadBtn: { background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", border: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(139,10,46,0.3)" },
  removeBtn: { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  dangerBtn: { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  savedBanner: { background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 8, textAlign: "center", marginBottom: 20, fontWeight: 600 },
  subTabs: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 },
  subTabBtn: { border: "none", padding: "6px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  logItem: { display: "flex", gap: 12, padding: 14, background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" },
  logIcon: { fontSize: 22, flexShrink: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: 8 },
  logAction: { fontSize: 14, fontWeight: 700, color: "#8B0A2E", textTransform: "capitalize" },
  logTime: { fontSize: 11, color: "#888" },
  logTarget: { fontSize: 13, color: "#444", display: "flex", alignItems: "center", gap: 6, marginTop: 2 },
  logBadge: { background: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase" },
  logDetails: { fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 4 },
  logAdmin: { fontSize: 11, color: "#999", marginTop: 4 },
  previewBox: { width: "100%", maxWidth: 400, borderRadius: 12, overflow: "hidden", border: "2px solid #f0e0e0", background: "#FFF9F5" },
  previewImg: { width: "100%", height: "auto", display: "block", aspectRatio: "16/9", objectFit: "cover" },
  palette: {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: 8,
    marginTop: 12,
    padding: 12,
    background: "#FFF9F5",
    borderRadius: 10,
    border: "1px solid #f0e0e0",
  },
};

export default AdminSettings;

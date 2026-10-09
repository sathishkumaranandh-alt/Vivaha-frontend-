import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { CONFIGURABLE_PAGES } from "../utils/pageTheme";

const API = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const COLOR_PRESETS = [
  "#8B0A2E", "#6B0722", "#D4A017", "#b8860b", "#2D1B1B",
  "#5c3030", "#8a6b6b", "#16a34a", "#2563eb", "#7c3aed",
  "#dc2626", "#ea580c", "#0891b2", "#ffffff", "#000000",
  "#FDF2F6", "#F8E8ED", "#FFF9F5", "#fef3c7", "#dcfce7",
];

const PRIVACY_TOGGLES = [
  { key: "privacy_show_profile_visibility", label: "Who Can See My Profile", hint: "Audience-based profile visibility (Paid/Verified/Matches)" },
  { key: "privacy_show_photo_privacy", label: "Photo Privacy", hint: "Users can set who sees their photos" },
  { key: "privacy_show_contact_privacy", label: "Contact Privacy", hint: "Users can hide mobile/email" },
  { key: "privacy_show_private_gallery", label: "Private Gallery Toggle", hint: "Private gallery toggle in photo upload" },
  { key: "privacy_show_profile_visible_toggle", label: "Profile Visible Toggle", hint: "Generic profile visible on/off" },
  { key: "privacy_show_online_status_toggle", label: "Online Status Toggle", hint: "Show/hide online status" },
  { key: "privacy_show_photo_request", label: "Photo Request System", hint: "Request-to-view blurred photos" },
  { key: "privacy_show_boost", label: "Profile Boost Feature", hint: "Show/hide 🚀 Boost page" },
  { key: "privacy_show_visitors", label: "Who Viewed Me", hint: "Show/hide 👀 Visitors page" },
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
  const [selectedPage, setSelectedPage] = useState("home");
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

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large. Max 5MB");

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars").upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      handleSettingChange("home_hero_image", urlData.publicUrl);
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
        window.dispatchEvent(new Event("theme-refresh"));
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

  const currentPageLabel = CONFIGURABLE_PAGES.find(p => p.key === selectedPage)?.label || "Page";

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>⚙️ Admin Settings</h1>
          <p style={S.sub}>Manage site config, homepage, page themes, privacy & audit log</p>
        </div>
        <Link to="/admin" style={S.backBtn}>← Dashboard</Link>
      </div>

      <div style={S.tabs}>
        <button onClick={() => setTab("site")} style={{ ...S.tabBtn, background: tab === "site" ? "#8B0A2E" : "#f3f4f6", color: tab === "site" ? "white" : "#374151" }}>⚙️ Site</button>
        <button onClick={() => setTab("home")} style={{ ...S.tabBtn, background: tab === "home" ? "#D4A017" : "#f3f4f6", color: tab === "home" ? "white" : "#374151" }}>🏠 Homepage</button>
        <button onClick={() => setTab("pages")} style={{ ...S.tabBtn, background: tab === "pages" ? "#16a34a" : "#f3f4f6", color: tab === "pages" ? "white" : "#374151" }}>🎨 Page Themes</button>
        <button onClick={() => setTab("cards")} style={{ ...S.tabBtn, background: tab === "cards" ? "#ec4899" : "#f3f4f6", color: tab === "cards" ? "white" : "#374151" }}>🎴 Profile Cards</button>
        <button onClick={() => setTab("privacy")} style={{ ...S.tabBtn, background: tab === "privacy" ? "#0891b2" : "#f3f4f6", color: tab === "privacy" ? "white" : "#374151" }}>🔒 Privacy Controls</button>
        <button onClick={() => setTab("logs")} style={{ ...S.tabBtn, background: tab === "logs" ? "#7c3aed" : "#f3f4f6", color: tab === "logs" ? "white" : "#374151" }}>📝 Audit ({logs.length})</button>
      </div>

      {/* ==================== SITE SETTINGS ==================== */}
      {tab === "site" && (
        <div style={S.card}>
          {saved && <div style={S.savedBanner}>✅ Settings saved!</div>}

          <h3 style={S.sectionTitle}>🌐 Basic Info</h3>
          <Field label="Site Name" value={settings.site_name} onChange={(v) => handleSettingChange("site_name", v)} placeholder="Vivaha Matrimony" />
          <Field label="Homepage Tagline" value={settings.homepage_tagline} onChange={(v) => handleSettingChange("homepage_tagline", v)} placeholder="Find Your Perfect Life Partner" />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>📞 Contact Info</h3>
          <Field label="Support Email" value={settings.contact_email} onChange={(v) => handleSettingChange("contact_email", v)} placeholder="support@example.com" type="email" />
          <Field label="Support Phone" value={settings.contact_phone} onChange={(v) => handleSettingChange("contact_phone", v)} placeholder="+91 90000 00000" />
          <Field label="Support Hours" value={settings.support_hours} onChange={(v) => handleSettingChange("support_hours", v)} placeholder="Mon-Fri, 9 AM - 6 PM" />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>🔧 System</h3>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>Maintenance Mode</div><div style={S.toggleHint}>When ON, users see a maintenance message</div></div>
            <ToggleSwitch value={settings.maintenance_mode === "true"} onChange={(v) => handleSettingChange("maintenance_mode", v ? "true" : "false")} color="#dc2626" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>Allow New Registrations</div><div style={S.toggleHint}>When OFF, new users can't sign up</div></div>
            <ToggleSwitch value={settings.allow_registration !== "false"} onChange={(v) => handleSettingChange("allow_registration", v ? "true" : "false")} color="#16a34a" />
          </div>

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>🎨 Global Theme</h3>
          <ColorPicker label="Navbar Background Color" value={settings.global_navbar_bg || "#ffffff"} onChange={(v) => handleSettingChange("global_navbar_bg", v)} />
          <ColorPicker label="Navbar Text Color" value={settings.global_navbar_text || "#2D1B1B"} onChange={(v) => handleSettingChange("global_navbar_text", v)} />
          <Slider label="Navbar Font Size" value={settings.global_navbar_size || "13"} onChange={(v) => handleSettingChange("global_navbar_size", v)} min={12} max={20} />
          <ColorPicker label="Mobile Menu Text Color" value={settings.mobile_menu_text_color || "#8B0A2E"} onChange={(v) => handleSettingChange("mobile_menu_text_color", v)} />
          <ColorPicker label="Page Background Color (Default)" value={settings.global_page_bg || "#FFF9F5"} onChange={(v) => handleSettingChange("global_page_bg", v)} />
          <ColorPicker label="Footer Background" value={settings.global_footer_bg || "#1a0510"} onChange={(v) => handleSettingChange("global_footer_bg", v)} />

          <div style={{ marginTop: 28 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "💾 Save Site Settings"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== PAGE THEMES ==================== */}
      {tab === "pages" && (
        <div style={S.card}>
          {saved && <div style={S.savedBanner}>✅ Page theme saved!</div>}
          <div style={S.notice}>
            💡 <strong>Tip:</strong> Select a page, then customize its background, text colors, boxes, and font sizes. Each page can look different!
          </div>

          <h3 style={S.sectionTitle}>📄 Select Page</h3>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{ ...S.input, marginBottom: 24, cursor: "pointer", fontWeight: 700, fontSize: 15 }}
          >
            {CONFIGURABLE_PAGES.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>
            {currentPageLabel} — Colors
          </h3>
          <p style={S.sectionDesc}>Colors for this specific page only</p>

          <ColorPicker label="Page Background Color" value={settings[`page_${selectedPage}_bg`] || "#FFF9F5"} onChange={(v) => handleSettingChange(`page_${selectedPage}_bg`, v)} />
          <ColorPicker label="Heading Text Color" value={settings[`page_${selectedPage}_heading_color`] || "#8B0A2E"} onChange={(v) => handleSettingChange(`page_${selectedPage}_heading_color`, v)} />
          <ColorPicker label="Body Text Color" value={settings[`page_${selectedPage}_body_color`] || "#2D1B1B"} onChange={(v) => handleSettingChange(`page_${selectedPage}_body_color`, v)} />
          <ColorPicker label="Muted/Secondary Text Color" value={settings[`page_${selectedPage}_muted_color`] || "#8a6b6b"} onChange={(v) => handleSettingChange(`page_${selectedPage}_muted_color`, v)} />
          <ColorPicker label="Link/Accent Color" value={settings[`page_${selectedPage}_link_color`] || "#8B0A2E"} onChange={(v) => handleSettingChange(`page_${selectedPage}_link_color`, v)} />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>🔤 Font Sizes</h3>
          <p style={S.sectionDesc}>Font sizes for this page only</p>

          <Slider label="Base Text Size (Body)" value={settings[`page_${selectedPage}_base_size`] || "14"} onChange={(v) => handleSettingChange(`page_${selectedPage}_base_size`, v)} min={12} max={20} unit="px" />
          <Slider label="Heading Text Size" value={settings[`page_${selectedPage}_heading_size`] || "26"} onChange={(v) => handleSettingChange(`page_${selectedPage}_heading_size`, v)} min={18} max={40} unit="px" />

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>📦 Box / Card Theme</h3>
          <p style={S.sectionDesc}>Customize background, border, radius, padding, and shadow for all boxes on this page (sidebar, cards, panels)</p>

          <ColorPicker label="Box Background Color" value={settings[`page_${selectedPage}_card_bg`] || "#ffffff"} onChange={(v) => handleSettingChange(`page_${selectedPage}_card_bg`, v)} />
          <ColorPicker label="Box Border Color" value={settings[`page_${selectedPage}_card_border`] || "#f0e0e0"} onChange={(v) => handleSettingChange(`page_${selectedPage}_card_border`, v)} />
          <Slider label="Box Border Width" value={settings[`page_${selectedPage}_card_border_width`] || "1"} onChange={(v) => handleSettingChange(`page_${selectedPage}_card_border_width`, v)} min={0} max={4} step={1} unit="px" />
          <Slider label="Box Corner Radius" value={settings[`page_${selectedPage}_card_radius`] || "14"} onChange={(v) => handleSettingChange(`page_${selectedPage}_card_radius`, v)} min={0} max={28} step={2} unit="px" />
          <Slider label="Box Inner Padding" value={settings[`page_${selectedPage}_card_padding`] || "20"} onChange={(v) => handleSettingChange(`page_${selectedPage}_card_padding`, v)} min={8} max={40} step={2} unit="px" />
          <Slider label="Box Shadow Strength" value={settings[`page_${selectedPage}_card_shadow`] || "40"} onChange={(v) => handleSettingChange(`page_${selectedPage}_card_shadow`, v)} min={0} max={100} step={5} />
          <p style={{ fontSize: 11, color: "#888", marginTop: -8, marginBottom: 16 }}>0 = no shadow · 100 = strong shadow</p>

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>📋 Label & Value Typography</h3>
          <p style={S.sectionDesc}>Customize text styles for labels (left side) and values (right side) — like Quick Info rows, filters, etc.</p>

          <h4 style={{ color: "#8B0A2E", fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Left Side — Label</h4>
          <ColorPicker label="Label Text Color" value={settings[`page_${selectedPage}_label_color`] || "#8a6b6b"} onChange={(v) => handleSettingChange(`page_${selectedPage}_label_color`, v)} />
          <Slider label="Label Font Size" value={settings[`page_${selectedPage}_label_size`] || "12"} onChange={(v) => handleSettingChange(`page_${selectedPage}_label_size`, v)} min={10} max={20} step={1} unit="px" />
          <label style={S.label}>Label Font Weight</label>
          <select
            value={settings[`page_${selectedPage}_label_weight`] || "500"}
            onChange={(e) => handleSettingChange(`page_${selectedPage}_label_weight`, e.target.value)}
            style={{ ...S.input, marginBottom: 16, cursor: "pointer" }}
          >
            <option value="400">Normal (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi-Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra-Bold (800)</option>
          </select>

          <h4 style={{ color: "#8B0A2E", fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Right Side — Value</h4>
          <ColorPicker label="Value Text Color" value={settings[`page_${selectedPage}_value_color`] || "#2D1B1B"} onChange={(v) => handleSettingChange(`page_${selectedPage}_value_color`, v)} />
          <Slider label="Value Font Size" value={settings[`page_${selectedPage}_value_size`] || "12"} onChange={(v) => handleSettingChange(`page_${selectedPage}_value_size`, v)} min={10} max={20} step={1} unit="px" />
          <label style={S.label}>Value Font Weight</label>
          <select
            value={settings[`page_${selectedPage}_value_weight`] || "600"}
            onChange={(e) => handleSettingChange(`page_${selectedPage}_value_weight`, e.target.value)}
            style={{ ...S.input, marginBottom: 16, cursor: "pointer" }}
          >
            <option value="400">Normal (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi-Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra-Bold (800)</option>
          </select>

          <div style={{ marginTop: 28 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, background: "linear-gradient(135deg, #16a34a, #22c55e)", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "💾 Save Page Theme"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== PROFILE CARDS ==================== */}
      {tab === "cards" && (
        <div style={S.card}>
          {saved && <div style={S.savedBanner}>✅ Profile card design saved!</div>}
          <div style={S.notice}>
            💡 <strong>Tip:</strong> These settings apply to <strong>ALL</strong> profile cards site-wide (Home, Search, Dashboard, Matches, Recommendations).
          </div>

          <h3 style={S.sectionTitle}>📦 Card Box</h3>
          <p style={S.sectionDesc}>Background, border, radius, shadow for the entire card</p>

          <ColorPicker label="Card Background" value={settings.card_bg || "#ffffff"} onChange={(v) => handleSettingChange("card_bg", v)} />
          <ColorPicker label="Card Border Color" value={settings.card_border_color || "#f0e0e0"} onChange={(v) => handleSettingChange("card_border_color", v)} />
          <Slider label="Card Border Width" value={settings.card_border_width || "1"} onChange={(v) => handleSettingChange("card_border_width", v)} min={0} max={4} step={1} unit="px" />
          <Slider label="Card Corner Radius" value={settings.card_radius || "12"} onChange={(v) => handleSettingChange("card_radius", v)} min={0} max={28} step={2} unit="px" />
          <Slider label="Card Shadow Strength" value={settings.card_shadow || "40"} onChange={(v) => handleSettingChange("card_shadow", v)} min={0} max={100} step={5} />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>📷 Photo</h3>
          <p style={S.sectionDesc}>Photo shape and privacy blur intensity</p>

          <label style={S.label}>Photo Aspect Ratio</label>
          <select
            value={settings.card_photo_ratio || "1/1"}
            onChange={(e) => handleSettingChange("card_photo_ratio", e.target.value)}
            style={{ ...S.input, marginBottom: 16, cursor: "pointer" }}
          >
            <option value="2/3">Tall Portrait (2:3) — Photo focused</option>
            <option value="3/4">Portrait (3:4) — Classic</option>
            <option value="4/5">Portrait (4:5)</option>
            <option value="1/1">Square (1:1) — Compact</option>
            <option value="16/9">Landscape (16:9) — Wide</option>
          </select>

          <Slider label="Blur Intensity (for private photos)" value={settings.card_photo_blur || "20"} onChange={(v) => handleSettingChange("card_photo_blur", v)} min={5} max={40} step={1} unit="px" />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>📝 Text</h3>
          <p style={S.sectionDesc}>Name, body text and muted text colors on the card</p>

          <ColorPicker label="Name Text Color (over photo)" value={settings.card_name_color || "#ffffff"} onChange={(v) => handleSettingChange("card_name_color", v)} />
          <Slider label="Name Font Size" value={settings.card_name_size || "14.5"} onChange={(v) => handleSettingChange("card_name_size", v)} min={11} max={22} step={0.5} unit="px" />
          <ColorPicker label="Body Text Color (education, occupation)" value={settings.card_body_color || "#3d2828"} onChange={(v) => handleSettingChange("card_body_color", v)} />
          <ColorPicker label="Muted Text Color (company, hints)" value={settings.card_muted_color || "#8a6b6b"} onChange={(v) => handleSettingChange("card_muted_color", v)} />

          {/* ============================================ */}
          {/* NEW: NO-PHOTO CARD DESIGN */}
          {/* ============================================ */}
          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🖼️ No Photo Card Design</h3>
          <p style={S.sectionDesc}>Customize how profile cards look when user hasn't uploaded a photo</p>

          <ColorPicker label="No-Photo Background Color" value={settings.card_no_photo_bg || "#FDF2F6"} onChange={(v) => handleSettingChange("card_no_photo_bg", v)} />
          <p style={{ fontSize: 11, color: "#888", marginTop: -8, marginBottom: 12, fontStyle: "italic" }}>
            💡 Recommended: soft pastel colors like #FDF2F6 (pink), #FFF9F5 (cream), #EFF6FF (blue), #F0FDF4 (green)
          </p>

          <ColorPicker label="No-Photo Name Color" value={settings.card_no_photo_name_color || "#8B0A2E"} onChange={(v) => handleSettingChange("card_no_photo_name_color", v)} />
          <ColorPicker label="No-Photo Body Text Color" value={settings.card_no_photo_body_color || "#5c3030"} onChange={(v) => handleSettingChange("card_no_photo_body_color", v)} />
          <Slider label="Gender Icon Opacity" value={settings.card_no_photo_icon_opacity || "16"} onChange={(v) => handleSettingChange("card_no_photo_icon_opacity", v)} min={0} max={50} step={1} unit="%" />
          <p style={{ fontSize: 11, color: "#888", marginTop: -8, marginBottom: 16, fontStyle: "italic" }}>
            0% = hidden · 16% = subtle (default) · 50% = prominent
          </p>

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>👁️ Show / Hide Details on Photo</h3>
          <p style={S.sectionDesc}>Choose which details appear on each profile card photo</p>

          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>📍 Location</div><div style={S.toggleHint}>Show city / location</div></div>
            <ToggleSwitch value={settings.card_show_location !== "false"} onChange={(v) => handleSettingChange("card_show_location", v ? "true" : "false")} color="#ec4899" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>🎓 Education</div><div style={S.toggleHint}>Show education / degree</div></div>
            <ToggleSwitch value={settings.card_show_education !== "false"} onChange={(v) => handleSettingChange("card_show_education", v ? "true" : "false")} color="#ec4899" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>💼 Occupation</div><div style={S.toggleHint}>Show job + company</div></div>
            <ToggleSwitch value={settings.card_show_occupation !== "false"} onChange={(v) => handleSettingChange("card_show_occupation", v ? "true" : "false")} color="#ec4899" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>📏 Height</div><div style={S.toggleHint}>Show height</div></div>
            <ToggleSwitch value={settings.card_show_height !== "false"} onChange={(v) => handleSettingChange("card_show_height", v ? "true" : "false")} color="#ec4899" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>🏷️ Community</div><div style={S.toggleHint}>Show community chip</div></div>
            <ToggleSwitch value={settings.card_show_community !== "false"} onChange={(v) => handleSettingChange("card_show_community", v ? "true" : "false")} color="#ec4899" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>🗣️ Mother Tongue</div><div style={S.toggleHint}>Show language chip</div></div>
            <ToggleSwitch value={settings.card_show_mother_tongue !== "false"} onChange={(v) => handleSettingChange("card_show_mother_tongue", v ? "true" : "false")} color="#ec4899" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>🔒 Contact Status</div><div style={S.toggleHint}>Show contact lock/unlock chip</div></div>
            <ToggleSwitch value={settings.card_show_contact !== "false"} onChange={(v) => handleSettingChange("card_show_contact", v ? "true" : "false")} color="#ec4899" />
          </div>

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>🏷️ Chips</h3>
          <p style={S.sectionDesc}>Community, mother tongue chips</p>

          <ColorPicker label="Chip Background" value={settings.card_chip_bg || "#FDF2F6"} onChange={(v) => handleSettingChange("card_chip_bg", v)} />
          <ColorPicker label="Chip Text Color" value={settings.card_chip_text || "#8B0A2E"} onChange={(v) => handleSettingChange("card_chip_text", v)} />

          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>🎴 Buttons</h3>
          <p style={S.sectionDesc}>"View" button colors (and "Unlock" for blurred photos)</p>

          <ColorPicker label="View Button Background" value={settings.card_button_bg || "#8B0A2E"} onChange={(v) => handleSettingChange("card_button_bg", v)} />
          <ColorPicker label="View Button Hover Color" value={settings.card_button_bg_hover || "#a01438"} onChange={(v) => handleSettingChange("card_button_bg_hover", v)} />
          <ColorPicker label="View Button Text Color" value={settings.card_button_text || "#ffffff"} onChange={(v) => handleSettingChange("card_button_text", v)} />
          <ColorPicker label="Protected/Blur Button Background" value={settings.card_protected_bg || "#8a6b6b"} onChange={(v) => handleSettingChange("card_protected_bg", v)} />

          <div style={{ marginTop: 28 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, background: "linear-gradient(135deg, #ec4899, #db2777)", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "💾 Save Profile Card Design"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== PRIVACY CONTROLS ==================== */}
      {tab === "privacy" && (
        <div style={S.card}>
          {saved && <div style={S.savedBanner}>✅ Privacy controls saved!</div>}
          <div style={S.notice}>
            💡 <strong>Tip:</strong> Toggle OFF a feature to hide it from all users. They won't see it in Settings or profile pages.
          </div>

          <h3 style={S.sectionTitle}>🔒 Privacy Feature Controls</h3>
          <p style={S.sectionDesc}>Enable or disable each privacy feature across the platform.</p>

          {PRIVACY_TOGGLES.map((t) => (
            <div key={t.key} style={S.toggleRow}>
              <div>
                <div style={S.toggleLabel}>{t.label}</div>
                <div style={S.toggleHint}>{t.hint}</div>
              </div>
              <ToggleSwitch
                value={settings[t.key] !== "false"}
                onChange={(v) => handleSettingChange(t.key, v ? "true" : "false")}
                color="#0891b2"
              />
            </div>
          ))}

          <div style={{ marginTop: 28 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "💾 Save Privacy Controls"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== HOMEPAGE EDITOR ==================== */}
      {tab === "home" && (
        <div style={S.card}>
          {saved && <div style={S.savedBanner}>✅ Homepage updated!</div>}
          <div style={S.notice}>💡 Changes appear after clicking Save. Use the "Preview" button to see them.</div>

          <h3 style={S.sectionTitle}>🎬 Hero Text</h3>
          <Field label="Eyebrow Text" value={settings.home_eyebrow} onChange={(v) => handleSettingChange("home_eyebrow", v)} placeholder="TRADITION · TRUST · TOGETHER FOREVER" />
          <Field label="Main Title" value={settings.home_title} onChange={(v) => handleSettingChange("home_title", v)} placeholder="Find Your Perfect Life Partner" />
          <Field label="Tamil Subtitle" value={settings.home_tamil_subtitle} onChange={(v) => handleSettingChange("home_tamil_subtitle", v)} placeholder="நம் பாரம்பரியம்..." />
          <Field label="Subtitle Paragraph" value={settings.home_subtitle} onChange={(v) => handleSettingChange("home_subtitle", v)} placeholder="Vivaha Matrimony brings together..." textarea />

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🎯 Block Positions</h3>
          <p style={S.sectionDesc}>Move Text, Trust, Search blocks. X = % from left, Y = % from top, Width = % of hero.</p>

          <div style={S.positionGroup}>
            <div style={S.positionGroupTitle}>📝 Text Block</div>
            <Slider label="Text — X" value={settings.home_text_x || "6"} onChange={(v) => handleSettingChange("home_text_x", v)} min={0} max={90} step={1} unit="%" />
            <Slider label="Text — Y" value={settings.home_text_y || "18"} onChange={(v) => handleSettingChange("home_text_y", v)} min={0} max={90} step={1} unit="%" />
            <Slider label="Text — Width" value={settings.home_text_width || "50"} onChange={(v) => handleSettingChange("home_text_width", v)} min={20} max={100} step={1} unit="%" />
          </div>

          <div style={S.positionGroup}>
            <div style={S.positionGroupTitle}>✨ Trust Badges Block</div>
            <Slider label="Trust — X" value={settings.home_trust_x || "6"} onChange={(v) => handleSettingChange("home_trust_x", v)} min={0} max={90} step={1} unit="%" />
            <Slider label="Trust — Y" value={settings.home_trust_y || "65"} onChange={(v) => handleSettingChange("home_trust_y", v)} min={0} max={95} step={1} unit="%" />
            <Slider label="Trust — Width" value={settings.home_trust_width || "50"} onChange={(v) => handleSettingChange("home_trust_width", v)} min={20} max={100} step={1} unit="%" />
          </div>

          <div style={S.positionGroup}>
            <div style={S.positionGroupTitle}>🔍 Search Box Block</div>
            <Slider label="Search — X" value={settings.home_search_x || "6"} onChange={(v) => handleSettingChange("home_search_x", v)} min={0} max={90} step={1} unit="%" />
            <Slider label="Search — Y" value={settings.home_search_y || "74"} onChange={(v) => handleSettingChange("home_search_y", v)} min={0} max={95} step={1} unit="%" />
            <Slider label="Search — Width" value={settings.home_search_width || "45"} onChange={(v) => handleSettingChange("home_search_width", v)} min={20} max={100} step={1} unit="%" />
          </div>

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🖼️ Hero Image</h3>
          {settings.home_hero_image && (
            <div style={S.previewBox}>
              <img src={settings.home_hero_image} alt="" style={S.previewImg} onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button type="button" onClick={() => heroFileRef.current?.click()} disabled={uploading} style={{ ...S.uploadBtn, opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "⏳ Uploading..." : "📷 Upload from Phone"}
            </button>
            {settings.home_hero_image && (
              <button type="button" onClick={() => handleSettingChange("home_hero_image", "")} style={S.removeBtn}>🗑️ Remove Image</button>
            )}
          </div>
          <input ref={heroFileRef} type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: "none" }} />
          <p style={S.helpText}>📷 JPG, PNG up to 5MB.</p>

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🎨 Text Colors</h3>
          <ColorPicker label="Eyebrow Text Color" value={settings.home_color_eyebrow || "#8B0A2E"} onChange={(v) => handleSettingChange("home_color_eyebrow", v)} />
          <ColorPicker label="Main Title Color" value={settings.home_color_title || "#8B0A2E"} onChange={(v) => handleSettingChange("home_color_title", v)} />
          <ColorPicker label="Tamil Subtitle Color" value={settings.home_color_tamil || "#8B0A2E"} onChange={(v) => handleSettingChange("home_color_tamil", v)} />
          <ColorPicker label="Subtitle Paragraph Color" value={settings.home_color_subtitle || "#5c3030"} onChange={(v) => handleSettingChange("home_color_subtitle", v)} />
          <ColorPicker label="Trust Badge Title Color" value={settings.home_color_trust || "#8B0A2E"} onChange={(v) => handleSettingChange("home_color_trust", v)} />

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>📐 Hero Layout</h3>
          <Slider label="Hero Section Height" value={settings.home_hero_height || "600"} onChange={(v) => handleSettingChange("home_hero_height", v)} min={300} max={900} step={20} />
          <Slider label="Content Max Width" value={settings.home_content_width || "560"} onChange={(v) => handleSettingChange("home_content_width", v)} min={300} max={900} step={20} />
          <Slider label="Cream Overlay Opacity" value={settings.home_overlay_opacity || "90"} onChange={(v) => handleSettingChange("home_overlay_opacity", v)} min={0} max={100} step={5} unit="%" />

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🔤 Text Sizes</h3>
          <Slider label="Eyebrow Size" value={settings.home_size_eyebrow || "11"} onChange={(v) => handleSettingChange("home_size_eyebrow", v)} min={8} max={20} />
          <Slider label="Main Title Size" value={settings.home_size_title || "56"} onChange={(v) => handleSettingChange("home_size_title", v)} min={24} max={100} step={2} />
          <Slider label="Tamil Subtitle Size" value={settings.home_size_tamil || "19"} onChange={(v) => handleSettingChange("home_size_tamil", v)} min={12} max={40} step={1} />
          <Slider label="Subtitle Paragraph Size" value={settings.home_size_subtitle || "16"} onChange={(v) => handleSettingChange("home_size_subtitle", v)} min={12} max={30} step={1} />

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>🔍 Search Box</h3>
          <Slider label="Search Box Padding" value={settings.home_search_padding || "16"} onChange={(v) => handleSettingChange("home_search_padding", v)} min={8} max={40} step={2} />
          <ColorPicker label="Search Button Color" value={settings.home_search_button_color || "#8B0A2E"} onChange={(v) => handleSettingChange("home_search_button_color", v)} />

          <h3 style={{ ...S.sectionTitle, marginTop: 32 }}>👁️ Show / Hide Sections</h3>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>Show Eyebrow Text</div></div>
            <ToggleSwitch value={settings.home_show_eyebrow !== "false"} onChange={(v) => handleSettingChange("home_show_eyebrow", v ? "true" : "false")} color="#8B0A2E" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>Show Tamil Subtitle</div></div>
            <ToggleSwitch value={settings.home_show_tamil !== "false"} onChange={(v) => handleSettingChange("home_show_tamil", v ? "true" : "false")} color="#8B0A2E" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>Show Subtitle Paragraph</div></div>
            <ToggleSwitch value={settings.home_show_subtitle !== "false"} onChange={(v) => handleSettingChange("home_show_subtitle", v ? "true" : "false")} color="#8B0A2E" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>Show Trust Badges</div></div>
            <ToggleSwitch value={settings.home_show_trust !== "false"} onChange={(v) => handleSettingChange("home_show_trust", v ? "true" : "false")} color="#8B0A2E" />
          </div>
          <div style={S.toggleRow}>
            <div><div style={S.toggleLabel}>Show Search Box</div></div>
            <ToggleSwitch value={settings.home_show_search !== "false"} onChange={(v) => handleSettingChange("home_show_search", v ? "true" : "false")} color="#8B0A2E" />
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleSave} disabled={saving} style={{ ...S.primaryBtn, background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "#8B0A2E", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "💾 Save Homepage Changes"}
            </button>
            <button onClick={() => window.open("/", "_blank")} style={S.previewSiteBtn}>👁️ Preview Homepage</button>
          </div>
        </div>
      )}

      {/* ==================== AUDIT LOG ==================== */}
      {tab === "logs" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#8B0A2E" }}>Recent Activity ({filteredLogs.length})</h3>
            {logs.length > 0 && <button onClick={handleClearLogs} style={S.dangerBtn}>🗑️ Clear All Logs</button>}
          </div>

          {logs.length > 0 && (
            <div style={S.subTabs}>
              {uniqueActions.map((a) => (
                <button key={a} onClick={() => setLogFilter(a)} style={{ ...S.subTabBtn, background: logFilter === a ? "#7c3aed" : "#f3f4f6", color: logFilter === a ? "white" : "#374151" }}>
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
                    {log.target_name && <div style={S.logTarget}><strong>{log.target_name}</strong></div>}
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

// SUB COMPONENTS
function Field({ label, value, onChange, placeholder, type = "text", textarea = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {textarea ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...S.input, resize: "vertical", fontFamily: "inherit" }} />
      ) : (
        <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={S.input} />
      )}
    </div>
  );
}

function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "px" }) {
  const numValue = parseFloat(value) || 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label} — <span style={{ color: "#8B0A2E" }}>{numValue}{unit}</span></label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input type="range" min={min} max={max} step={step} value={numValue} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, accentColor: "#8B0A2E" }} />
        <input type="number" min={min} max={max} step={step} value={numValue} onChange={(e) => onChange(e.target.value)} style={{ ...S.input, width: 80, marginBottom: 0 }} />
      </div>
    </div>
  );
}

function ToggleSwitch({ value, onChange, color = "#1e3a8a" }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 50, height: 28, borderRadius: 14, background: value ? color : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: value ? 25 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  const [showPalette, setShowPalette] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div onClick={() => setShowPalette(!showPalette)} style={{ width: 46, height: 46, borderRadius: 10, background: value, border: "2px solid #f0e0e0", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="#8B0A2E" style={{ ...S.input, flex: 1, minWidth: 140, fontFamily: "monospace", marginBottom: 0 }} />
      </div>
      {showPalette && (
        <div style={S.palette}>
          {COLOR_PRESETS.map((c) => (
            <button key={c} type="button" onClick={() => { onChange(c); setShowPalette(false); }} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: c === value ? "3px solid #8B0A2E" : "2px solid #f0e0e0", cursor: "pointer" }} title={c} />
          ))}
        </div>
      )}
    </div>
  );
}

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
  notice: { background: "#FDF2F6", border: "1px solid #f0e0e0", borderRadius: 10, padding: 14, fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f3f4f6", gap: 12 },
  toggleLabel: { fontSize: 15, fontWeight: 600, color: "#8B0A2E" },
  toggleHint: { fontSize: 12, color: "#888", marginTop: 2 },
  primaryBtn: { background: "#8B0A2E", color: "white", border: "none", padding: "14px 28px", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", fontFamily: "inherit" },
  previewSiteBtn: { background: "white", color: "#8B0A2E", border: "1.5px solid #8B0A2E", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  uploadBtn: { background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", border: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  removeBtn: { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  dangerBtn: { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  savedBanner: { background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 8, textAlign: "center", marginBottom: 20, fontWeight: 600 },
  subTabs: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 },
  subTabBtn: { border: "none", padding: "6px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  logItem: { display: "flex", gap: 12, padding: 14, background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" },
  logIcon: { fontSize: 22, flexShrink: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: 8 },
  logAction: { fontSize: 14, fontWeight: 700, color: "#8B0A2E", textTransform: "capitalize" },
  logTime: { fontSize: 11, color: "#888" },
  logTarget: { fontSize: 13, color: "#444", marginTop: 2 },
  logDetails: { fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 4 },
  logAdmin: { fontSize: 11, color: "#999", marginTop: 4 },
  previewBox: { width: "100%", maxWidth: 400, borderRadius: 12, overflow: "hidden", border: "2px solid #f0e0e0", background: "#FFF9F5" },
  previewImg: { width: "100%", height: "auto", display: "block", aspectRatio: "16/9", objectFit: "cover" },
  palette: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8, marginTop: 12, padding: 12, background: "#FFF9F5", borderRadius: 10, border: "1px solid #f0e0e0" },
  positionGroup: { background: "#FFF9F5", border: "1px solid #f0e0e0", borderRadius: 10, padding: 14, marginBottom: 14 },
  positionGroupTitle: { fontSize: 13, fontWeight: 700, color: "#8B0A2E", marginBottom: 12 },
};

export default AdminSettings;
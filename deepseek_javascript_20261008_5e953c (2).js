import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const PRESET_TEMPLATES = [
  { id: "place", label: "Place / City", icon: "📍", field_key: "place", type: "select", step: 1, options: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi", "Dindigul", "Thanjavur", "Karur", "Nagercoil", "Kanchipuram", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune", "Other"] },
  { id: "occupation", label: "Job / Occupation", icon: "💼", field_key: "job_type", type: "select", step: 3, options: ["Software Engineer", "Doctor", "Nurse", "Teacher", "Government Employee", "Bank Employee", "Business Owner", "Accountant", "Lawyer", "Engineer", "Designer", "Pharmacist", "Police", "Army", "Driver", "Farmer", "Other"] },
  { id: "diet", label: "Diet Preference", icon: "🍽️", field_key: "diet_pref", type: "select", step: 4, options: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"] },
  { id: "hobbies", label: "Hobbies", icon: "🎨", field_key: "hobbies", type: "text", step: 4, options: [] },
  { id: "smoking", label: "Smoking", icon: "🚭", field_key: "smoking", type: "select", step: 4, options: ["Never", "Occasionally", "Regularly"] },
  { id: "drinking", label: "Drinking", icon: "🍷", field_key: "drinking", type: "select", step: 4, options: ["Never", "Occasionally", "Regularly"] },
  { id: "blood_group", label: "Blood Group", icon: "🩸", field_key: "blood_group", type: "select", step: 1, options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  { id: "height", label: "Height", icon: "📏", field_key: "height", type: "text", step: 1, options: [] },
  { id: "weight", label: "Weight (kg)", icon: "⚖️", field_key: "weight", type: "number", step: 1, options: [] },
];

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "tel", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

const PROFILE_TABS = [
  { value: "basic", label: "👤 Basic" },
  { value: "community", label: "🕉️ Community" },
  { value: "career", label: "💼 Career" },
  { value: "family", label: "🏠 Family" },
  { value: "prefs", label: "💕 Preferences" },
];

function AdminFormBuilder() {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [coreFields, setCoreFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [activeTab, setActiveTab] = useState("presets");
  const [editingField, setEditingField] = useState(null);
  const [editingCore, setEditingCore] = useState(null);

  const [newField, setNewField] = useState({
    field_key: "", label: "", type: "text", options: "",
    is_required: false, step: 1,
    show_in_profile: true, show_in_view: true,
    profile_tab: "basic",
    display_order: 0,
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== "admin") { navigate("/dashboard"); return; }

      try {
        const [fRes, cRes] = await Promise.all([
          fetch(`${BACKEND_URL}/form-config/fields`).then(r => r.json()),
          fetch(`${BACKEND_URL}/form-config/core-fields`).then(r => r.json()),
        ]);
        setFields(fRes.fields || []);
        setCoreFields(cRes.fields || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const reloadAll = async () => {
    const [fRes, cRes] = await Promise.all([
      fetch(`${BACKEND_URL}/form-config/fields`).then(r => r.json()),
      fetch(`${BACKEND_URL}/form-config/core-fields`).then(r => r.json()),
    ]);
    setFields(fRes.fields || []);
    setCoreFields(cRes.fields || []);
  };

  // Get next display order (suggestion)
  const getNextDisplayOrder = (tab) => {
    const inTab = fields.filter(f => (f.profile_tab || "basic") === tab);
    const max = inTab.reduce((m, f) => Math.max(m, f.display_order || 0), 0);
    return max + 1;
  };

  const applyPreset = (preset) => {
    setNewField({
      field_key: preset.field_key,
      label: preset.label,
      type: preset.type,
      options: preset.options.join(", "),
      is_required: false,
      step: preset.step,
      show_in_profile: true,
      show_in_view: true,
      profile_tab: "basic",
      display_order: 0,
    });
    setActiveTab("custom");
    toast.info(`Loaded: ${preset.label} — Choose Profile Tab & Order`);
  };

  // FIX 2: Only auto-fill display_order if user hasn't typed a custom value
  const handleProfileTabChange = (tab) => {
    setNewField(prev => {
      const currentOrder = parseInt(prev.display_order, 10) || 0;
      const wasAutoDefault = currentOrder === 0;
      return {
        ...prev,
        profile_tab: tab,
        display_order: wasAutoDefault ? getNextDisplayOrder(tab) : prev.display_order,
      };
    });
  };

  const handleAdd = async () => {
    if (!newField.label.trim()) return toast.error("Label is required");
    if (!newField.field_key.trim()) return toast.error("Field Key is required");

    setSaving(true);
    try {
      const optionsArray = newField.type === "select" && newField.options
        ? newField.options.split(",").map(o => o.trim()).filter(Boolean) : [];

      const res = await fetch(`${BACKEND_URL}/form-config/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_key: newField.field_key.toLowerCase().replace(/\s+/g, "_"),
          label: newField.label,
          type: newField.type,
          options: optionsArray,
          is_required: newField.is_required,
          step: parseInt(newField.step, 10),
          show_in_profile: newField.show_in_profile,
          show_in_view: newField.show_in_view,
          profile_tab: newField.profile_tab,
          display_order: parseInt(newField.display_order || 0, 10),
        }),
      });
      if (res.ok) {
        toast.success("Field added!");
        setNewField({
          field_key: "", label: "", type: "text", options: "",
          is_required: false, step: 1,
          show_in_profile: true, show_in_view: true,
          profile_tab: "basic",
          display_order: 0,
        });
        await reloadAll();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add");
      }
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  };

  const handleUpdateCustom = async () => {
    if (!editingField) return;
    setSaving(true);
    try {
      const optionsArray = editingField.type === "select"
        ? (Array.isArray(editingField.options)
          ? editingField.options
          : (editingField.options || "").split(",").map(o => o.trim()).filter(Boolean))
        : [];

      const res = await fetch(`${BACKEND_URL}/form-config/fields/${editingField.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editingField.label,
          type: editingField.type,
          options: optionsArray,
          is_required: editingField.is_required,
          step: parseInt(editingField.step, 10),
          show_in_profile: editingField.show_in_profile,
          show_in_view: editingField.show_in_view,
          profile_tab: editingField.profile_tab || "basic",
          display_order: parseInt(editingField.display_order || 0, 10),
        }),
      });
      if (res.ok) {
        toast.success("Field updated!");
        setEditingField(null);
        await reloadAll();
      } else { toast.error("Failed to update"); }
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  };

  const handleUpdateCore = async () => {
    if (!editingCore) return;
    setSaving(true);
    try {
      const optionsArray = editingCore.type === "select"
        ? (Array.isArray(editingCore.options)
          ? editingCore.options
          : (editingCore.options || "").split(",").map(o => o.trim()).filter(Boolean))
        : [];

      const res = await fetch(`${BACKEND_URL}/form-config/core-fields/${editingCore.field_key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editingCore.label,
          type: editingCore.type,
          options: optionsArray,
          is_required: editingCore.is_required,
          is_active: editingCore.is_active,
          show_in_profile: editingCore.show_in_profile,
          show_in_view: editingCore.show_in_view,
          step: parseInt(editingCore.step, 10),
          display_order: parseInt(editingCore.display_order || 0, 10),
        }),
      });
      if (res.ok) {
        toast.success("Core field updated!");
        setEditingCore(null);
        await reloadAll();
      } else { toast.error("Failed to update"); }
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this field?")) return;
    await fetch(`${BACKEND_URL}/form-config/fields/${id}`, { method: "DELETE" });
    await reloadAll();
    toast.success("Field deleted");
  };

  const handleToggleCustom = async (field, key) => {
    const newVal = !field[key];
    await fetch(`${BACKEND_URL}/form-config/fields/${field.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: newVal }),
    });
    setFields(fields.map(f => f.id === field.id ? { ...f, [key]: newVal } : f));
  };

  const handleToggleCore = async (field, key) => {
    const newVal = !field[key];
    try {
      const res = await fetch(`${BACKEND_URL}/form-config/core-fields/${field.field_key}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newVal }),
      });
      if (res.ok) {
        setCoreFields(coreFields.map(f => f.field_key === field.field_key ? { ...f, [key]: newVal } : f));
        toast.success(`Updated ${field.label}`);
      }
    } catch { toast.error("Failed to update"); }
  };

  const startEditCustom = (field) => {
    const opts = Array.isArray(field.options) ? field.options.join(", ") : (field.options || "");
    setEditingField({
      ...field,
      options: opts,
      show_in_profile: field.show_in_profile !== false,
      show_in_view: field.show_in_view !== false,
      profile_tab: field.profile_tab || "basic",
      display_order: field.display_order || 0,
    });
    setActiveTab("existing");
  };

  const startEditCore = (field) => {
    const opts = Array.isArray(field.options)
      ? field.options.join(", ")
      : (typeof field.options === "string" ? field.options : "");
    setEditingCore({
      ...field,
      options: opts,
      type: field.type || "text",
      step: field.step || 1,
      display_order: field.display_order || 0,
      is_active: field.is_active !== false,
      is_required: field.is_required === true,
      show_in_profile: field.show_in_profile !== false,
      show_in_view: field.show_in_view !== false,
    });
    setActiveTab("core-edit");
  };

  // FIX 1: Tab order (follows PROFILE_TABS order, not alphabetical)
  const getTabIndex = (tab) => {
    const idx = PROFILE_TABS.findIndex(t => t.value === tab);
    return idx === -1 ? 999 : idx;
  };

  // Sort custom fields by tab (PROFILE_TABS order) → display_order → label
  const sortedFields = [...fields].sort((a, b) => {
    const at = getTabIndex(a.profile_tab || "basic");
    const bt = getTabIndex(b.profile_tab || "basic");
    if (at !== bt) return at - bt;
    const ao = a.display_order || 0;
    const bo = b.display_order || 0;
    if (ao !== bo) return ao - bo;
    return (a.label || "").localeCompare(b.label || "");
  });

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;

  const S = {
    page: { maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: 12 },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    backBtn: { background: "#e5e7eb", color: "#8B0A2E", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
    tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    tab: (active) => ({ border: "none", padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 8, fontFamily: "inherit", background: active ? "#8B0A2E" : "#f3f4f6", color: active ? "white" : "#374151" }),
    card: { background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #f0e0e0", marginBottom: "20px", boxShadow: "0 4px 20px rgba(139,10,46,0.04)" },
    cardTitle: { color: "#8B0A2E", marginTop: 0, marginBottom: "16px", fontSize: "17px", fontWeight: 700 },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
    input: { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#FAFAFA", boxSizing: "border-box" },
    grid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "14px" },
    presetGrid: { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" },
    presetCard: { background: "linear-gradient(135deg, #FFF9F5, #FDF2F6)", border: "1.5px solid #f0e0e0", borderRadius: "14px", padding: "16px 12px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
    coreRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#FFF9F5", borderRadius: "10px", border: "1px solid #f0e0e0", marginBottom: "8px", flexWrap: "wrap", gap: 10 },
    coreLabel: { fontSize: "14px", fontWeight: 600, color: "#2D1B1B" },
    coreKey: { fontSize: "10px", color: "#8a6b6b", fontFamily: "monospace" },
    fieldRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#FFF9F5", borderRadius: "12px", border: "1px solid #f0e0e0", flexWrap: "wrap", gap: 10, marginBottom: "8px" },
    btnPrimary: { background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", border: "none", padding: "14px 28px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(139,10,46,0.25)" },
    btnSmall: { border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    stepHeader: { fontSize: "12px", fontWeight: 800, color: "#8B0A2E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", marginTop: "16px", paddingBottom: "6px", borderBottom: "2px solid #FDF2F6" },
    toggleRow: { display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: "pointer" },
    helper: { fontSize: "11px", color: "#8a6b6b", marginTop: "4px", fontStyle: "italic" },
    orderBadge: { background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 700, marginLeft: "6px" },
  };

  const coreByStep = coreFields.reduce((acc, f) => {
    const s = f.step || 1;
    if (!acc[s]) acc[s] = [];
    acc[s].push(f);
    return acc;
  }, {});

  const previewOptions = newField.options ? newField.options.split(",").map(o => o.trim()).filter(Boolean) : [];
  const STEP_NAMES = { 1: "Step 1 — Basic", 2: "Step 2 — Community", 3: "Step 3 — Career", 4: "Step 4 — Family", 5: "Step 5 — Contact" };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>🛠️ Registration Form Builder</h1>
          <p style={S.sub}>Manage core fields, presets, and custom fields</p>
        </div>
        <Link to="/admin" style={S.backBtn}>← Dashboard</Link>
      </div>

      <div style={S.tabs}>
        <button onClick={() => { setActiveTab("core"); setEditingField(null); setEditingCore(null); }} style={S.tab(activeTab === "core")}>⚙️ Core Fields</button>
        <button onClick={() => { setActiveTab("presets"); setEditingField(null); setEditingCore(null); }} style={S.tab(activeTab === "presets")}>⚡ Presets</button>
        <button onClick={() => { setActiveTab("custom"); setEditingField(null); setEditingCore(null); }} style={S.tab(activeTab === "custom")}>➕ Add Custom</button>
        <button onClick={() => { setActiveTab("existing"); setEditingCore(null); }} style={S.tab(activeTab === "existing")}>📋 Custom ({fields.length})</button>
      </div>

      {/* CORE FIELDS TAB */}
      {activeTab === "core" && !editingCore && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>⚙️ Core Fields — Full Control</h3>
          <p style={{ fontSize: "13px", color: "#8a6b6b", marginBottom: "20px" }}>
            <strong>Edit</strong> = label, type, options, order · <strong>Active</strong> = register ·
            <strong>Req</strong> = mandatory · <strong>Profile</strong> = edit · <strong>View</strong> = view
          </p>

          {Object.keys(coreByStep).sort((a, b) => a - b).map((stepNum) => (
            <div key={stepNum}>
              <div style={S.stepHeader}>{STEP_NAMES[stepNum] || `Step ${stepNum}`}</div>
              {coreByStep[stepNum]
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((f) => (
                  <div key={f.field_key} style={S.coreRow}>
                    <div style={{ flex: 1, minWidth: "140px" }}>
                      <div style={S.coreLabel}>
                        {f.label}
                        <span style={S.orderBadge}>#{f.display_order || 0}</span>
                      </div>
                      <div style={S.coreKey}>
                        {f.field_key} · {f.type || "text"}
                        {f.type === "select" && f.options && ` · ${(Array.isArray(f.options) ? f.options.length : 0)} options`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                      <button onClick={() => startEditCore(f)} style={{ ...S.btnSmall, background: "#8B0A2E", color: "white" }}>✏️ Edit</button>
                      <button onClick={() => handleToggleCore(f, "is_active")} style={{ ...S.btnSmall, background: f.is_active ? "#dcfce7" : "#fee2e2", color: f.is_active ? "#166534" : "#991b1b", minWidth: "60px" }}>{f.is_active ? "✓ Active" : "✕ Hidden"}</button>
                      <button onClick={() => handleToggleCore(f, "is_required")} style={{ ...S.btnSmall, background: f.is_required ? "#fef3c7" : "#f3f4f6", color: f.is_required ? "#92400e" : "#666", minWidth: "60px" }}>{f.is_required ? "★ Req" : "Optional"}</button>
                      <button onClick={() => handleToggleCore(f, "show_in_profile")} style={{ ...S.btnSmall, background: f.show_in_profile !== false ? "#dbeafe" : "#f3f4f6", color: f.show_in_profile !== false ? "#1e40af" : "#666", minWidth: "60px" }}>{f.show_in_profile !== false ? "👤 Profile" : "No Profile"}</button>
                      <button onClick={() => handleToggleCore(f, "show_in_view")} style={{ ...S.btnSmall, background: f.show_in_view !== false ? "#f3e8ff" : "#f3f4f6", color: f.show_in_view !== false ? "#7c3aed" : "#666", minWidth: "60px" }}>{f.show_in_view !== false ? "👁️ View" : "No View"}</button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* CORE FIELD EDIT */}
      {activeTab === "core-edit" && editingCore && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>✏️ Edit Core Field: {editingCore.field_key}</h3>
          <div style={S.grid}>
            <div><label style={S.label}>Label</label><input style={S.input} value={editingCore.label || ""} onChange={(e) => setEditingCore({ ...editingCore, label: e.target.value })} /></div>
            <div><label style={S.label}>Field Key (locked)</label><input style={{ ...S.input, background: "#f0f0f0" }} value={editingCore.field_key} disabled /></div>
            <div>
              <label style={S.label}>Type</label>
              <select style={S.input} value={editingCore.type || "text"} onChange={(e) => setEditingCore({ ...editingCore, type: e.target.value })}>
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Registration Step</label>
              <select style={S.input} value={editingCore.step || 1} onChange={(e) => setEditingCore({ ...editingCore, step: e.target.value })}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{STEP_NAMES[n]}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Display Order (within step)</label>
              <input type="number" style={S.input} value={editingCore.display_order || 0} onChange={(e) => setEditingCore({ ...editingCore, display_order: e.target.value })} />
              <p style={S.helper}>சிறிய எண் முதல்ல. உ.ம்: 1, 2, 3</p>
            </div>
          </div>

          {editingCore.type === "select" && (
            <div style={{ marginTop: "14px" }}>
              <label style={S.label}>Dropdown Options (comma-separated)</label>
              <textarea style={{ ...S.input, resize: "vertical", minHeight: "100px", fontFamily: "monospace" }} value={Array.isArray(editingCore.options) ? editingCore.options.join(", ") : editingCore.options || ""} onChange={(e) => setEditingCore({ ...editingCore, options: e.target.value })} rows={4} />
            </div>
          )}

          <label style={S.toggleRow}>
            <input type="checkbox" checked={editingCore.is_active !== false} onChange={(e) => setEditingCore({ ...editingCore, is_active: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Active (show in register)</span>
          </label>
          <label style={S.toggleRow}>
            <input type="checkbox" checked={editingCore.is_required === true} onChange={(e) => setEditingCore({ ...editingCore, is_required: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Required</span>
          </label>
          <label style={S.toggleRow}>
            <input type="checkbox" checked={editingCore.show_in_profile !== false} onChange={(e) => setEditingCore({ ...editingCore, show_in_profile: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Show in Profile Edit</span>
          </label>
          <label style={S.toggleRow}>
            <input type="checkbox" checked={editingCore.show_in_view !== false} onChange={(e) => setEditingCore({ ...editingCore, show_in_view: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Show in Profile View</span>
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button onClick={handleUpdateCore} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "💾 Save Core Field"}</button>
            <button onClick={() => setEditingCore(null)} style={{ ...S.btnSmall, background: "#f3f4f6", color: "#374151", padding: "14px 20px" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* PRESETS */}
      {activeTab === "presets" && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>⚡ Quick Add from Presets</h3>
          <p style={{ fontSize: "12px", color: "#8a6b6b", marginBottom: "16px" }}>Preset load ஆனப்புறம், Profile Tab & Display Order-ஐ கீழே set பண்ணுங்க.</p>
          <div style={S.presetGrid}>
            {PRESET_TEMPLATES.map((p) => (
              <div key={p.id} style={S.presetCard} onClick={() => applyPreset(p)}>
                <div style={{ fontSize: "26px" }}>{p.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#8B0A2E" }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD CUSTOM */}
      {activeTab === "custom" && !editingField && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>➕ Add Custom Field</h3>
          <div style={S.grid}>
            <div><label style={S.label}>Label</label><input style={S.input} placeholder="e.g. Blood Group" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} /></div>
            <div><label style={S.label}>Field Key</label><input style={S.input} placeholder="e.g. blood_group" value={newField.field_key} onChange={(e) => setNewField({ ...newField, field_key: e.target.value })} /></div>
            <div>
              <label style={S.label}>Type</label>
              <select style={S.input} value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Registration Step</label>
              <select style={S.input} value={newField.step} onChange={(e) => setNewField({ ...newField, step: e.target.value })}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{STEP_NAMES[n]}</option>)}
              </select>
            </div>
          </div>

          {newField.type === "select" && (
            <div style={{ marginTop: "14px" }}>
              <label style={S.label}>Options ({previewOptions.length})</label>
              <textarea style={{ ...S.input, resize: "vertical", minHeight: "100px", fontFamily: "monospace" }} placeholder="A+, A-, B+, B-, O+" value={newField.options} onChange={(e) => setNewField({ ...newField, options: e.target.value })} rows={4} />
            </div>
          )}

          <label style={S.toggleRow}>
            <input type="checkbox" checked={newField.is_required} onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Mandatory in registration</span>
          </label>

          {/* Profile + Order section */}
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "2px dashed #f0e0e0" }}>
            <h4 style={{ color: "#8B0A2E", fontSize: "14px", margin: "0 0 4px 0" }}>👤 Profile Settings</h4>
            <p style={{ fontSize: "11px", color: "#8a6b6b", margin: "0 0 12px 0" }}>Which profile section + what position?</p>

            <div style={S.grid}>
              <div>
                <label style={S.label}>Profile Tab <span style={{ color: "#dc2626" }}>*</span></label>
                <select style={S.input} value={newField.profile_tab} onChange={(e) => handleProfileTabChange(e.target.value)}>
                  {PROFILE_TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Display Order <span style={{ color: "#dc2626" }}>*</span></label>
                <input
                  type="number"
                  style={S.input}
                  value={newField.display_order}
                  onChange={(e) => setNewField({ ...newField, display_order: e.target.value })}
                  placeholder="1"
                />
                <p style={S.helper}>சிறிய எண் முதல்ல. Suggested: {getNextDisplayOrder(newField.profile_tab)}</p>
              </div>
            </div>

            <label style={S.toggleRow}>
              <input type="checkbox" checked={newField.show_in_profile} onChange={(e) => setNewField({ ...newField, show_in_profile: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Show in Profile Edit</span>
            </label>

            <label style={S.toggleRow}>
              <input type="checkbox" checked={newField.show_in_view} onChange={(e) => setNewField({ ...newField, show_in_view: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Show in Profile View</span>
            </label>
          </div>

          <button onClick={handleAdd} disabled={saving} style={{ ...S.btnPrimary, marginTop: "20px", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Adding..." : "➕ Add Field"}
          </button>
        </div>
      )}

      {/* EDIT CUSTOM */}
      {editingField && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>✏️ Edit: {editingField.field_key}</h3>
          <div style={S.grid}>
            <div><label style={S.label}>Label</label><input style={S.input} value={editingField.label || ""} onChange={(e) => setEditingField({ ...editingField, label: e.target.value })} /></div>
            <div><label style={S.label}>Field Key (locked)</label><input style={{ ...S.input, background: "#f0f0f0" }} value={editingField.field_key} disabled /></div>
            <div>
              <label style={S.label}>Type</label>
              <select style={S.input} value={editingField.type} onChange={(e) => setEditingField({ ...editingField, type: e.target.value })}>
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Registration Step</label>
              <select style={S.input} value={editingField.step} onChange={(e) => setEditingField({ ...editingField, step: e.target.value })}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{STEP_NAMES[n]}</option>)}
              </select>
            </div>
          </div>

          {editingField.type === "select" && (
            <div style={{ marginTop: "14px" }}>
              <label style={S.label}>Options</label>
              <textarea style={{ ...S.input, resize: "vertical", minHeight: "100px", fontFamily: "monospace" }} value={Array.isArray(editingField.options) ? editingField.options.join(", ") : editingField.options || ""} onChange={(e) => setEditingField({ ...editingField, options: e.target.value })} rows={4} />
            </div>
          )}

          <div style={{ ...S.grid, marginTop: "14px" }}>
            <div>
              <label style={S.label}>Profile Tab</label>
              <select style={S.input} value={editingField.profile_tab || "basic"} onChange={(e) => setEditingField({ ...editingField, profile_tab: e.target.value })}>
                {PROFILE_TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Display Order</label>
              <input
                type="number"
                style={S.input}
                value={editingField.display_order || 0}
                onChange={(e) => setEditingField({ ...editingField, display_order: e.target.value })}
              />
              <p style={S.helper}>சிறிய எண் முதல்ல</p>
            </div>
          </div>

          <label style={S.toggleRow}>
            <input type="checkbox" checked={editingField.show_in_profile !== false} onChange={(e) => setEditingField({ ...editingField, show_in_profile: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Show in Profile Edit</span>
          </label>
          <label style={S.toggleRow}>
            <input type="checkbox" checked={editingField.show_in_view !== false} onChange={(e) => setEditingField({ ...editingField, show_in_view: e.target.checked })} style={{ width: 20, height: 20, accentColor: "#8B0A2E" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Show in Profile View</span>
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={handleUpdateCustom} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "💾 Save"}</button>
            <button onClick={() => setEditingField(null)} style={{ ...S.btnSmall, background: "#f3f4f6", color: "#374151", padding: "14px 20px" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* CUSTOM FIELDS LIST — sorted */}
      {activeTab === "existing" && !editingField && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>📋 Custom Fields ({fields.length})</h3>
          <p style={{ fontSize: "12px", color: "#8a6b6b", marginBottom: "16px" }}>
            Fields sorted by Profile Tab → Display Order. Order மாற்ற Edit-ல் மாத்திக்கோங்க.
          </p>
          {sortedFields.length === 0 ? (
            <p style={{ color: "#8a6b6b", fontSize: "13px" }}>No custom fields yet.</p>
          ) : (
            sortedFields.map((f) => (
              <div key={f.id} style={S.fieldRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#8B0A2E", fontSize: "14px" }}>
                    {f.label}
                    <span style={S.orderBadge}>#{f.display_order || 0}</span>
                    <span style={{ fontWeight: 400, color: "#8a6b6b", fontSize: "11px", marginLeft: "6px" }}>({f.field_key})</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#8a6b6b" }}>
                    Tab: {f.profile_tab || "basic"} · step {f.step} · {f.type} ·{" "}
                    {f.show_in_profile !== false ? "✓ Edit" : "✗ Edit"} ·{" "}
                    {f.show_in_view !== false ? "✓ View" : "✗ View"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => startEditCustom(f)} style={{ ...S.btnSmall, background: "#eff6ff", color: "#1e40af" }}>✏️ Edit</button>
                  <button onClick={() => handleToggleCustom(f, "is_active")} style={{ ...S.btnSmall, background: f.is_active ? "#dcfce7" : "#f3f4f6", color: f.is_active ? "#166534" : "#666" }}>{f.is_active ? "Active" : "Hidden"}</button>
                  <button onClick={() => handleDelete(f.id)} style={{ ...S.btnSmall, background: "#fee2e2", color: "#b91c1c" }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminFormBuilder;
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

// Preset templates for quick add
const PRESET_TEMPLATES = [
  {
    id: "place",
    label: "Place / City",
    icon: "📍",
    field_key: "place",
    type: "select",
    step: 2,
    options: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
      "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi",
      "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
      "Udhagamandalam", "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam",
      "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune",
      "Other"
    ],
  },
  {
    id: "occupation",
    label: "Job / Occupation",
    icon: "💼",
    field_key: "job_type",
    type: "select",
    step: 3,
    options: [
      "Software Engineer", "Doctor", "Nurse", "Teacher", "Professor",
      "Government Employee", "Bank Employee", "Business Owner",
      "Accountant", "Lawyer", "Engineer", "Designer", "Architect",
      "Pharmacist", "Police", "Army", "Driver", "Farmer",
      "Chef", "Sales", "Marketing", "HR", "Consultant",
      "Student", "Homemaker", "Other"
    ],
  },
  {
    id: "diet",
    label: "Diet Preference",
    icon: "🍽️",
    field_key: "diet_pref",
    type: "select",
    step: 4,
    options: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"],
  },
  {
    id: "hobbies",
    label: "Hobbies",
    icon: "🎨",
    field_key: "hobbies",
    type: "text",
    step: 4,
    options: [],
  },
  {
    id: "smoking",
    label: "Smoking",
    icon: "🚭",
    field_key: "smoking",
    type: "select",
    step: 4,
    options: ["Never", "Occasionally", "Regularly"],
  },
  {
    id: "drinking",
    label: "Drinking",
    icon: "🍷",
    field_key: "drinking",
    type: "select",
    step: 4,
    options: ["Never", "Occasionally", "Regularly"],
  },
  {
    id: "blood_group",
    label: "Blood Group",
    icon: "🩸",
    field_key: "blood_group",
    type: "select",
    step: 1,
    options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  {
    id: "height",
    label: "Height",
    icon: "📏",
    field_key: "height",
    type: "text",
    step: 2,
    options: [],
  },
  {
    id: "weight",
    label: "Weight (kg)",
    icon: "⚖️",
    field_key: "weight",
    type: "number",
    step: 2,
    options: [],
  },
  {
    id: "education_detail",
    label: "Education Detail",
    icon: "🎓",
    field_key: "education_detail",
    type: "select",
    step: 3,
    options: [
      "10th", "12th", "Diploma", "ITI", "B.A", "B.Sc", "B.Com", "B.E", "B.Tech",
      "BBA", "BCA", "MBBS", "BDS", "LLB", "M.A", "M.Sc", "M.Com", "M.E", "M.Tech",
      "MBA", "MCA", "MD", "MS", "PhD", "Other"
    ],
  },
];

const FIELD_TYPES = [
  { value: "text", label: "Text (short)" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "tel", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

function AdminFormBuilder() {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [activeTab, setActiveTab] = useState("presets");

  const [newField, setNewField] = useState({
    field_key: "",
    label: "",
    type: "text",
    options: "",
    is_required: false,
    step: 2,
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
      fetch(`${BACKEND_URL}/form-config/fields`)
        .then((res) => res.json())
        .then((data) => setFields(data.fields || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
    load();
  }, [navigate]);

  const reloadFields = async () => {
    const res = await fetch(`${BACKEND_URL}/form-config/fields`);
    if (res.ok) {
      const data = await res.json();
      setFields(data.fields || []);
    }
  };

  const applyPreset = (preset) => {
    setNewField({
      field_key: preset.field_key,
      label: preset.label,
      type: preset.type,
      options: preset.options.join(", "),
      is_required: false,
      step: preset.step,
    });
    setActiveTab("custom");
    toast.info(`Loaded preset: ${preset.label}. Review and click Add.`);
  };

  const handleAdd = async () => {
    if (!newField.label.trim()) return toast.error("Label is required");
    if (!newField.field_key.trim()) return toast.error("Field Key is required");

    setSaving(true);
    try {
      const optionsArray = newField.type === "select" && newField.options
        ? newField.options.split(",").map(o => o.trim()).filter(Boolean)
        : [];

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
        }),
      });

      if (res.ok) {
        toast.success("Field added!");
        setNewField({ field_key: "", label: "", type: "text", options: "", is_required: false, step: 2 });
        await reloadFields();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add");
      }
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this field?")) return;
    await fetch(`${BACKEND_URL}/form-config/fields/${id}`, { method: "DELETE" });
    await reloadFields();
    toast.success("Field deleted");
  };

  const handleToggle = async (field) => {
    await fetch(`${BACKEND_URL}/form-config/fields/${field.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !field.is_active }),
    });
    setFields(fields.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f));
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;

  const S = {
    page: { maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: 12 },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    backBtn: { background: "#e5e7eb", color: "#8B0A2E", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
    tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    tab: (active) => ({
      border: "none", padding: "10px 20px", fontSize: 14, fontWeight: 700,
      cursor: "pointer", borderRadius: 8, fontFamily: "inherit",
      background: active ? "#8B0A2E" : "#f3f4f6",
      color: active ? "white" : "#374151",
    }),
    card: { background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #f0e0e0", marginBottom: "20px", boxShadow: "0 4px 20px rgba(139,10,46,0.04)" },
    cardTitle: { color: "#8B0A2E", marginTop: 0, marginBottom: "16px", fontSize: "17px", fontWeight: 700 },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
    input: { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#FAFAFA", boxSizing: "border-box", transition: "border 0.2s" },
    grid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "14px" },
    presetGrid: { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" },
    presetCard: {
      background: "linear-gradient(135deg, #FFF9F5, #FDF2F6)",
      border: "1.5px solid #f0e0e0",
      borderRadius: "14px",
      padding: "16px 12px",
      textAlign: "center",
      cursor: "pointer",
      transition: "transform 0.15s, box-shadow 0.15s",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
    },
    presetIcon: { fontSize: "26px" },
    presetLabel: { fontSize: "12px", fontWeight: 700, color: "#8B0A2E", lineHeight: 1.3 },
    preview: {
      background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
      border: "1.5px dashed #d1d5db",
      borderRadius: "12px",
      padding: "16px",
      marginTop: "12px",
    },
    previewLabel: { fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "8px", textTransform: "uppercase" },
    previewField: { display: "flex", alignItems: "center", padding: "10px 14px", background: "white", border: "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#666" },
    fieldRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#FFF9F5", borderRadius: "12px", border: "1px solid #f0e0e0", flexWrap: "wrap", gap: 10, marginBottom: "8px" },
    fieldName: { fontWeight: 700, color: "#8B0A2E", fontSize: "14px", marginBottom: "4px" },
    fieldMeta: { fontSize: "11px", color: "#8a6b6b" },
    btnPrimary: { background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", border: "none", padding: "14px 28px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(139,10,46,0.25)" },
    btnSmall: { border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  };

  // Count options in preview
  const previewOptions = newField.options ? newField.options.split(",").map(o => o.trim()).filter(Boolean) : [];
  const previewRequired = newField.is_required;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>🛠️ Registration Form Builder</h1>
          <p style={S.sub}>Modern form builder with presets, dropdowns & live preview</p>
        </div>
        <Link to="/admin" style={S.backBtn}>← Dashboard</Link>
      </div>

      <div style={S.tabs}>
        <button onClick={() => setActiveTab("presets")} style={S.tab(activeTab === "presets")}>⚡ Presets</button>
        <button onClick={() => setActiveTab("custom")} style={S.tab(activeTab === "custom")}>➕ Custom Field</button>
        <button onClick={() => setActiveTab("existing")} style={S.tab(activeTab === "existing")}>📋 Fields ({fields.length})</button>
      </div>

      {/* PRESETS TAB */}
      {activeTab === "presets" && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>⚡ Quick Add from Presets</h3>
          <p style={{ fontSize: "13px", color: "#8a6b6b", marginBottom: "20px" }}>
            Click any preset to pre-fill the field. You can review and edit before adding.
          </p>
          <div style={S.presetGrid}>
            {PRESET_TEMPLATES.map((p) => (
              <div key={p.id} style={S.presetCard} onClick={() => applyPreset(p)}>
                <div style={S.presetIcon}>{p.icon}</div>
                <div style={S.presetLabel}>{p.label}</div>
                {p.options.length > 0 && (
                  <div style={{ fontSize: "9px", color: "#8a6b6b", fontWeight: 600 }}>
                    {p.options.length} options
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOM FIELD TAB */}
      {activeTab === "custom" && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>➕ Add New Field</h3>

          <div style={S.grid}>
            <div>
              <label style={S.label}>Field Label (shown to user)</label>
              <input
                style={S.input}
                placeholder="e.g. Place / City"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              />
            </div>
            <div>
              <label style={S.label}>Field Key (database name)</label>
              <input
                style={S.input}
                placeholder="e.g. place"
                value={newField.field_key}
                onChange={(e) => setNewField({ ...newField, field_key: e.target.value })}
              />
            </div>
            <div>
              <label style={S.label}>Type</label>
              <select style={S.input} value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Show in Step</label>
              <select style={S.input} value={newField.step} onChange={(e) => setNewField({ ...newField, step: e.target.value })}>
                <option value="1">Step 1 - Basic Details</option>
                <option value="2">Step 2 - Community</option>
                <option value="3">Step 3 - Education</option>
                <option value="4">Step 4 - Family</option>
                <option value="5">Step 5 - Preferences</option>
              </select>
            </div>
          </div>

          {newField.type === "select" && (
            <div style={{ marginTop: "14px" }}>
              <label style={S.label}>
                Dropdown Options ({previewOptions.length} added)
              </label>
              <textarea
                style={{ ...S.input, resize: "vertical", minHeight: "100px", fontFamily: "monospace", fontSize: "13px" }}
                placeholder="Chennai, Coimbatore, Madurai, Salem, Other"
                value={newField.options}
                onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                rows={4}
              />
              <div style={{ fontSize: "11px", color: "#8a6b6b", marginTop: "6px" }}>
                💡 Separate options with commas
              </div>
            </div>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={newField.is_required}
              onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
              style={{ width: 20, height: 20, accentColor: "#8B0A2E" }}
            />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#2D1B1B" }}>
              Make this field mandatory
            </span>
          </label>

          {/* LIVE PREVIEW */}
          <div style={S.preview}>
            <div style={S.previewLabel}>👁️ Live Preview</div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px" }}>
              {newField.label || "Field Label"}
              {previewRequired && <span style={{ color: "#dc2626" }}> *</span>}
            </label>
            {newField.type === "select" ? (
              <div style={S.previewField}>
                <span style={{ flex: 1 }}>
                  {previewOptions[0] ? `Select ${newField.label || "..."}` : "Select..."}
                </span>
                <span style={{ fontSize: "10px", color: "#999" }}>▾</span>
              </div>
            ) : newField.type === "textarea" ? (
              <div style={{ ...S.previewField, minHeight: "60px", alignItems: "flex-start" }}>
                Enter {newField.label || "..."}
              </div>
            ) : (
              <div style={S.previewField}>
                {newField.type === "date" ? "mm/dd/yyyy" : `Enter ${newField.label || "..."}`}
              </div>
            )}
          </div>

          <button onClick={handleAdd} disabled={saving} style={{ ...S.btnPrimary, marginTop: "16px", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Adding..." : "➕ Add Field"}
          </button>
        </div>
      )}

      {/* EXISTING FIELDS TAB */}
      {activeTab === "existing" && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>📋 Current Fields ({fields.length})</h3>
          {fields.length === 0 ? (
            <p style={{ color: "#8a6b6b", fontSize: "13px" }}>No custom fields yet. Add from Presets or Custom tab.</p>
          ) : (
            <div>
              {fields.map((f) => (
                <div key={f.id} style={S.fieldRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.fieldName}>
                      {f.label}
                      <span style={{ fontWeight: 400, color: "#8a6b6b", fontSize: "11px", marginLeft: "6px" }}>
                        ({f.field_key})
                      </span>
                    </div>
                    <div style={S.fieldMeta}>
                      Step {f.step} • {f.type} • {f.is_required ? "Mandatory" : "Optional"}
                      {f.options && f.options.length > 0 && ` • ${f.options.length} options`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggle(f)}
                      style={{ ...S.btnSmall, background: f.is_active ? "#dcfce7" : "#f3f4f6", color: f.is_active ? "#166534" : "#666" }}
                    >
                      {f.is_active ? "Active" : "Hidden"}
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      style={{ ...S.btnSmall, background: "#fee2e2", color: "#b91c1c" }}
                    >
                      Delete
                    </button>
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

export default AdminFormBuilder;

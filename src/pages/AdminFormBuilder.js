import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function AdminFormBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("custom"); // "custom" or "core"
  const [fields, setFields] = useState([]);
  const [coreFields, setCoreFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const [newField, setNewField] = useState({
    field_key: "", label: "", type: "text", options: "", is_required: false, step: 2,
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
        const [customRes, coreRes] = await Promise.all([
          fetch(`${BACKEND_URL}/form-config/fields`).then(r => r.json()),
          fetch(`${BACKEND_URL}/form-config/core-fields`).then(r => r.json())
        ]);
        setFields(customRes.fields || []);
        setCoreFields(coreRes.fields || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const handleAdd = async () => {
    if (!newField.label.trim() || !newField.field_key.trim()) return toast.error("Label and Key are required");
    setSaving(true);
    try {
      const optionsArray = newField.type === "select" && newField.options
        ? newField.options.split(",").map(o => o.trim()).filter(Boolean) : [];
      const res = await fetch(`${BACKEND_URL}/form-config/fields`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_key: newField.field_key.toLowerCase().replace(/\s+/g, "_"),
          label: newField.label, type: newField.type, options: optionsArray,
          is_required: newField.is_required, step: parseInt(newField.step, 10),
        }),
      });
      if (res.ok) {
        toast.success("Field added!");
        setNewField({ field_key: "", label: "", type: "text", options: "", is_required: false, step: 2 });
        const updated = await fetch(`${BACKEND_URL}/form-config/fields`).then(r => r.json());
        setFields(updated.fields || []);
      } else { toast.error("Failed to add field"); }
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this field?")) return;
    await fetch(`${BACKEND_URL}/form-config/fields/${id}`, { method: "DELETE" });
    setFields(fields.filter(f => f.id !== id));
    toast.success("Field deleted");
  };

  const handleToggleCustom = async (field) => {
    await fetch(`${BACKEND_URL}/form-config/fields/${field.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !field.is_active }),
    });
    setFields(fields.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f));
  };

  const handleUpdateCore = async (key, updates) => {
    await fetch(`${BACKEND_URL}/form-config/core-fields/${key}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setCoreFields(coreFields.map(f => f.field_key === key ? { ...f, ...updates } : f));
    toast.success("Core field updated");
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "16px" : "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" }}>🛠️ Registration Form Builder</h1>
          <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>Manage all fields in the 5-step registration form.</p>
        </div>
        <Link to="/admin" style={{ background: "#e5e7eb", color: "#8B0A2E", padding: "10px 18px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>← Dashboard</Link>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("custom")} style={{ ...S.tab, background: activeTab === "custom" ? "#8B0A2E" : "#f3f4f6", color: activeTab === "custom" ? "white" : "#374151" }}>➕ Custom Fields</button>
        <button onClick={() => setActiveTab("core")} style={{ ...S.tab, background: activeTab === "core" ? "#8B0A2E" : "#f3f4f6", color: activeTab === "core" ? "white" : "#374151" }}>⚙️ Core Fields</button>
      </div>

      {activeTab === "custom" && (
        <>
          <div style={{ background: "white", borderRadius: "14px", padding: "24px", border: "1px solid #f0e0e0", marginBottom: "24px" }}>
            <h3 style={{ color: "#8B0A2E", marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>➕ Add New Custom Field</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div><label style={S.label}>Field Label</label><input style={S.input} placeholder="e.g. Hobbies" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} /></div>
              <div><label style={S.label}>Field Key</label><input style={S.input} placeholder="e.g. hobbies" value={newField.field_key} onChange={(e) => setNewField({ ...newField, field_key: e.target.value })} /></div>
              <div><label style={S.label}>Type</label>
                <select style={S.input} value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
                  <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="tel">Phone</option><option value="email">Email</option><option value="select">Dropdown</option><option value="textarea">Long Text</option>
                </select>
              </div>
              <div><label style={S.label}>Show in Step</label>
                <select style={S.input} value={newField.step} onChange={(e) => setNewField({ ...newField, step: e.target.value })}>
                  <option value="1">Step 1 - Basic</option><option value="2">Step 2 - Community</option><option value="3">Step 3 - Career</option><option value="4">Step 4 - Family</option><option value="5">Step 5 - Preference</option>
                </select>
              </div>
            </div>
            {newField.type === "select" && (<div style={{ marginBottom: "14px" }}><label style={S.label}>Dropdown Options (comma separated)</label><input style={S.input} placeholder="Reading, Sports, Music" value={newField.options} onChange={(e) => setNewField({ ...newField, options: e.target.value })} /></div>)}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <input type="checkbox" id="req" checked={newField.is_required} onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })} style={{ width: 18, height: 18, accentColor: "#8B0A2E" }} />
              <label htmlFor="req" style={{ fontSize: "14px", color: "#2D1B1B", fontWeight: 600 }}>Make this field mandatory</label>
            </div>
            <button onClick={handleAdd} disabled={saving} style={{ background: "#8B0A2E", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Adding..." : "Add Field"}</button>
          </div>

          <div style={{ background: "white", borderRadius: "14px", padding: "24px", border: "1px solid #f0e0e0" }}>
            <h3 style={{ color: "#8B0A2E", marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>📋 Current Custom Fields ({fields.length})</h3>
            {fields.length === 0 ? <p style={{ color: "#8a6b6b", fontSize: "13px" }}>No custom fields added yet.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {fields.map((f) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#FFF9F5", borderRadius: "10px", border: "1px solid #f0e0e0", flexWrap: "wrap", gap: 10 }}>
                    <div><div style={{ fontWeight: 700, color: "#8B0A2E", fontSize: "14px" }}>{f.label} <span style={{ fontWeight: 400, color: "#8a6b6b", fontSize: "12px" }}>({f.field_key})</span></div><div style={{ fontSize: "11px", color: "#8a6b6b" }}>Step {f.step} • {f.type} • {f.is_required ? "Mandatory" : "Optional"}</div></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button onClick={() => handleToggleCustom(f)} style={{ background: f.is_active ? "#dcfce7" : "#f3f4f6", color: f.is_active ? "#166534" : "#666", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{f.is_active ? "Active" : "Hidden"}</button>
                      <button onClick={() => handleDelete(f.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "core" && (
        <div style={{ background: "white", borderRadius: "14px", padding: "24px", border: "1px solid #f0e0e0" }}>
          <h3 style={{ color: "#8B0A2E", marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>⚙️ Core Registration Fields</h3>
          <p style={{ fontSize: "13px", color: "#8a6b6b", marginBottom: "20px" }}>Email and Password cannot be changed (required by system).</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {coreFields.map((f) => (
              <div key={f.field_key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#FFF9F5", borderRadius: "10px", border: "1px solid #f0e0e0", flexWrap: "wrap", gap: 10 }}>
                <div><div style={{ fontWeight: 700, color: "#8B0A2E", fontSize: "14px" }}>{f.label}</div><div style={{ fontSize: "11px", color: "#8a6b6b" }}>Key: {f.field_key}</div></div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button onClick={() => handleUpdateCore(f.field_key, { is_required: !f.is_required })} style={{ background: f.is_required ? "#fef3c7" : "#f3f4f6", color: f.is_required ? "#92400e" : "#666", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{f.is_required ? "Mandatory" : "Optional"}</button>
                  <button onClick={() => handleUpdateCore(f.field_key, { is_active: !f.is_active })} style={{ background: f.is_active ? "#dcfce7" : "#fee2e2", color: f.is_active ? "#166534" : "#991b1b", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{f.is_active ? "Active" : "Hidden"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  tab: { border: "none", padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer", borderRadius: "8px" },
  label: { display: "block", fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase" },
  input: { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box", background: "#FFF9F5", outline: "none" },
};

export default AdminFormBuilder;

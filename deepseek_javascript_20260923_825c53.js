import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const EMOJI_CHOICES = ["👥", "🔥", "💫", "⚡", "🌟", "💍", "🏛️", "🌸", "🌺", "⭐", "🎯", "🌈"];
const COLOR_CHOICES = [
  "#dc2626", "#2563eb", "#ea580c", "#7c3aed",
  "#16a34a", "#db2777", "#0891b2", "#ca8a04",
  "#6b7280", "#1e3a8a",
];

const SAMPLE_BULK = `Yadava
Pillai
Chettiar
Vellalar
Mudaliar
🌟|Gounder
💫|Kongu Vellalar`;

function AdminCommunities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [form, setForm] = useState({
    slug: "", name: "", emoji: "👥", color: "#1e3a8a",
    description: "", display_order: 10,
  });

  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const { data: profile } = await supabase
          .from("users").select("role").eq("id", user.id).single();

        if (!profile || profile.role !== "admin") {
          toast.error("Admin access required");
          navigate("/");
          return;
        }
        setIsAdmin(true);
        await loadCommunities();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCommunities = async () => {
    const res = await fetch(`${BACKEND_URL}/communities/all`);
    if (res.ok) {
      const data = await res.json();
      setCommunities(data.communities || []);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      slug: "", name: "", emoji: "👥", color: "#1e3a8a",
      description: "", display_order: (communities.length + 1) * 10,
    });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      slug: c.slug, name: c.name, emoji: c.emoji || "👥",
      color: c.color || "#1e3a8a", description: c.description || "",
      display_order: c.display_order || 10,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      toast.error("Slug and name are required");
      return;
    }

    setBusy("save");
    try {
      const payload = {
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "_"),
        name: form.name.trim(),
        emoji: form.emoji,
        color: form.color,
        description: form.description.trim() || null,
        display_order: parseInt(form.display_order) || 999,
      };

      let res;
      if (editing) {
        res = await fetch(`${BACKEND_URL}/communities/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BACKEND_URL}/communities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? "Community updated" : "Community added!");
        setShowModal(false);
        await loadCommunities();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setBusy(null);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast.error("Please paste a list of communities");
      return;
    }

    setBulkBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/communities/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list: bulkText }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          `✅ Added ${data.added} communities${data.skipped ? ` (${data.skipped} skipped)` : ""}`
        );
        setShowBulkModal(false);
        setBulkText("");
        await loadCommunities();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleToggle = async (c) => {
    setBusy(c.id);
    try {
      const res = await fetch(`${BACKEND_URL}/communities/${c.id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success(c.is_active ? "Deactivated" : "Activated");
        await loadCommunities();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.name}" community?\n\nThis cannot be undone.`)) return;
    setBusy(c.id);
    try {
      const res = await fetch(`${BACKEND_URL}/communities/${c.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Community deleted");
        await loadCommunities();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#666", marginTop: "16px" }}>Loading communities...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const bulkLines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
  const bulkPreview = bulkLines.length;

  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ color: "#1e3a8a", fontSize: isMobile ? "22px" : "28px", margin: "0 0 4px 0" }}>
            🏷️ Manage Communities
          </h1>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            Add one at a time, or import in bulk
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link to="/admin" style={backBtnStyle}>← Dashboard</Link>
          <button onClick={() => setShowBulkModal(true)} style={bulkBtnStyle}>
            📦 Bulk Upload
          </button>
          <button onClick={openAdd} style={addBtnStyle}>
            ➕ Add One
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={statsRowStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: "22px" }}>👥</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1e3a8a" }}>
            {communities.length}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>Total</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: "22px" }}>✅</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#16a34a" }}>
            {communities.filter((c) => c.is_active).length}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>Active</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: "22px" }}>⏸️</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ea580c" }}>
            {communities.filter((c) => !c.is_active).length}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>Inactive</div>
        </div>
      </div>

      {/* LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {communities.map((c) => (
          <div key={c.id} style={{ ...cardStyle, opacity: busy === c.id ? 0.5 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: c.color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "24px", flexShrink: 0,
                }}
              >
                {c.emoji || "👥"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, color: "#1e3a8a", fontSize: "16px" }}>{c.name}</h3>
                  {!c.is_active && <span style={inactiveBadgeStyle}>⏸️ Inactive</span>}
                </div>
                <p style={{ margin: "4px 0 0 0", color: "#888", fontSize: "12px" }}>
                  Slug: <code style={codeStyle}>{c.slug}</code> • Order: {c.display_order}
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button onClick={() => openEdit(c)} disabled={busy === c.id} style={editBtnStyle}>✏️</button>
                <button
                  onClick={() => handleToggle(c)}
                  disabled={busy === c.id}
                  style={c.is_active ? deactivateBtnStyle : activateBtnStyle}
                >
                  {c.is_active ? "⏸️" : "▶️"}
                </button>
                <button onClick={() => handleDelete(c)} disabled={busy === c.id} style={deleteBtnStyle}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SINGLE ADD/EDIT MODAL */}
      {showModal && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={modalCloseStyle}>✕</button>
            <h2 style={{ marginTop: 0, color: "#1e3a8a", fontSize: "20px" }}>
              {editing ? "✏️ Edit Community" : "➕ Add New Community"}
            </h2>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "80px", height: "80px", borderRadius: "20px",
                  background: form.color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "40px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                }}
              >
                {form.emoji}
              </div>
            </div>

            <label style={labelStyle}>Community Name *</label>
            <input
              type="text" value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f, name,
                  slug: editing ? f.slug : name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
                }));
              }}
              placeholder="e.g. Yadava"
              style={inputStyle}
            />

            <label style={labelStyle}>URL Slug *</label>
            <input
              type="text" value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="e.g. yadava" style={inputStyle}
            />

            <label style={labelStyle}>Description (optional)</label>
            <input
              type="text" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description" style={inputStyle}
            />

            <label style={labelStyle}>Emoji</label>
            <div style={pickerGridStyle}>
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e} type="button" onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  style={{
                    ...pickerBtnStyle,
                    border: form.emoji === e ? "2px solid #1e3a8a" : "2px solid #e5e7eb",
                    background: form.emoji === e ? "#eff6ff" : "white",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Color</label>
            <div style={pickerGridStyle}>
              {COLOR_CHOICES.map((col) => (
                <button
                  key={col} type="button" onClick={() => setForm((f) => ({ ...f, color: col }))}
                  style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: col,
                    border: form.color === col ? "3px solid #1e3a8a" : "3px solid white",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)", cursor: "pointer",
                  }}
                />
              ))}
            </div>

            <label style={labelStyle}>Display Order</label>
            <input
              type="number" value={form.display_order}
              onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleSave}
                disabled={busy === "save"}
                style={{ ...saveBtnStyle, opacity: busy === "save" ? 0.6 : 1 }}
              >
                {busy === "save" ? "Saving..." : editing ? "💾 Update" : "➕ Add"}
              </button>
              <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {showBulkModal && (
        <div style={modalOverlayStyle} onClick={() => setShowBulkModal(false)}>
          <div style={{ ...modalStyle, maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowBulkModal(false)} style={modalCloseStyle}>✕</button>
            <h2 style={{ marginTop: 0, color: "#1e3a8a", fontSize: "20px" }}>
              📦 Bulk Upload Communities
            </h2>
            <p style={{ color: "#666", fontSize: "13px", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              Paste your list below — <strong>one community per line</strong>.<br />
              Optionally add an emoji with a pipe: <code>🌟|Yadava</code>
            </p>

            <div style={{ background: "#f3f4f6", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "12px", color: "#555", fontFamily: "monospace" }}>
              <strong>Example:</strong>
              <pre style={{ margin: "6px 0 0 0", whiteSpace: "pre-wrap" }}>{SAMPLE_BULK}</pre>
            </div>

            <label style={labelStyle}>Your List ({bulkPreview} {bulkPreview === 1 ? "line" : "lines"})</label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Yadava\nPillai\nChettiar\n🌟|Gounder"}
              rows={10}
              style={{
                ...inputStyle,
                fontFamily: "monospace",
                fontSize: "13px",
                resize: "vertical",
                minHeight: "180px",
                lineHeight: "1.5",
              }}
            />

            {bulkPreview > 0 && (
              <div style={{ marginTop: "12px", maxHeight: "120px", overflowY: "auto", background: "#f0fdf4", padding: "10px", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#166534", fontWeight: "600" }}>
                  PREVIEW
                </p>
                {bulkLines.map((line, i) => {
                  let emoji = "👥";
                  let name = line;
                  if (line.includes("|")) {
                    const p = line.split("|").map((x) => x.trim());
                    if (p.length === 2) { emoji = p[0] || "👥"; name = p[1]; }
                  }
                  return (
                    <div key={i} style={{ fontSize: "12px", color: "#333", padding: "3px 0" }}>
                      {emoji} <strong>{name}</strong>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={handleBulkImport}
                disabled={bulkBusy || bulkPreview === 0}
                style={{
                  ...saveBtnStyle,
                  background: bulkBusy || bulkPreview === 0
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #16a34a, #22c55e)",
                  cursor: bulkBusy || bulkPreview === 0 ? "not-allowed" : "pointer",
                }}
              >
                {bulkBusy ? "Importing..." : `📦 Import ${bulkPreview || ""} Communities`}
              </button>
              <button onClick={() => setShowBulkModal(false)} style={cancelBtnStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = { maxWidth: "900px", margin: "0 auto", padding: "24px 16px" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" };
const backBtnStyle = { background: "#f3f4f6", color: "#1e3a8a", padding: "10px 18px", borderRadius: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" };
const addBtnStyle = { background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", padding: "10px 18px", borderRadius: "10px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(30,58,138,0.3)" };
const bulkBtnStyle = { background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "white", padding: "10px 18px", borderRadius: "10px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" };
const statsRowStyle = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" };
const statCardStyle = { background: "white", borderRadius: "12px", padding: "16px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };
const cardStyle = { background: "white", borderRadius: "14px", padding: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" };
const inactiveBadgeStyle = { background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" };
const codeStyle = { background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" };
const editBtnStyle = { background: "#eff6ff", color: "#1e40af", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const deactivateBtnStyle = { background: "#fef3c7", color: "#92400e", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const activateBtnStyle = { background: "#dcfce7", color: "#166534", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const deleteBtnStyle = { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 1000 };
const modalStyle = { background: "white", borderRadius: "18px", padding: "28px 24px", maxWidth: "460px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" };
const modalCloseStyle = { position: "absolute", top: "12px", right: "12px", background: "#f3f4f6", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", fontWeight: "bold", color: "#666" };
const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "6px", marginTop: "10px" };
const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
const pickerGridStyle = { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px" };
const pickerBtnStyle = { width: "100%", aspectRatio: "1", borderRadius: "10px", cursor: "pointer", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
const saveBtnStyle = { flex: 1, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(30,58,138,0.3)" };
const cancelBtnStyle = { background: "#f3f4f6", color: "#374151", border: "none", padding: "14px 24px", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" };
const spinnerStyle = { width: "40px", height: "40px", border: "4px solid #e5e7eb", borderTop: "4px solid #1e3a8a", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" };

export default AdminCommunities;
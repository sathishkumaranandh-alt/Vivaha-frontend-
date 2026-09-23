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

function AdminCommunities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // community being edited
  const [busy, setBusy] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [form, setForm] = useState({
    slug: "",
    name: "",
    emoji: "👥",
    color: "#1e3a8a",
    description: "",
    display_order: 10,
  });

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
      slug: "",
      name: "",
      emoji: "👥",
      color: "#1e3a8a",
      description: "",
      display_order: (communities.length + 1) * 10,
    });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      slug: c.slug,
      name: c.name,
      emoji: c.emoji || "👥",
      color: c.color || "#1e3a8a",
      description: c.description || "",
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
    if (!window.confirm(`Delete "${c.name}" community?\n\nThis cannot be undone. If users are using this community, you'll need to deactivate it instead.`)) {
      return;
    }
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

  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ color: "#1e3a8a", fontSize: isMobile ? "22px" : "28px", margin: "0 0 4px 0" }}>
            🏷️ Manage Communities
          </h1>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            Add, edit, or deactivate communities on your platform
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link to="/admin" style={backBtnStyle}>
            ← Dashboard
          </Link>
          <button onClick={openAdd} style={addBtnStyle}>
            ➕ Add Community
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
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {communities.map((c) => (
          <div key={c.id} style={{ ...cardStyle, opacity: busy === c.id ? 0.5 : 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              {/* Icon + Color */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: c.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  flexShrink: 0,
                }}
              >
                {c.emoji || "👥"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, color: "#1e3a8a", fontSize: "17px" }}>
                    {c.name}
                  </h3>
                  {!c.is_active && (
                    <span style={inactiveBadgeStyle}>⏸️ Inactive</span>
                  )}
                </div>
                <p style={{ margin: "4px 0 0 0", color: "#888", fontSize: "12px" }}>
                  Slug: <code style={codeStyle}>{c.slug}</code> • Order: {c.display_order}
                </p>
                {c.description && (
                  <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "13px" }}>
                    {c.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  onClick={() => openEdit(c)}
                  disabled={busy === c.id}
                  style={editBtnStyle}
                  title="Edit"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggle(c)}
                  disabled={busy === c.id}
                  style={c.is_active ? deactivateBtnStyle : activateBtnStyle}
                  title={c.is_active ? "Deactivate" : "Activate"}
                >
                  {c.is_active ? "⏸️ Pause" : "▶️ Activate"}
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={busy === c.id}
                  style={deleteBtnStyle}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={modalCloseStyle}>✕</button>

            <h2 style={{ marginTop: 0, color: "#1e3a8a", fontSize: "20px" }}>
              {editing ? "✏️ Edit Community" : "➕ Add New Community"}
            </h2>

            {/* Preview */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: form.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                }}
              >
                {form.emoji}
              </div>
            </div>

            {/* Name */}
            <label style={labelStyle}>Community Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  slug: editing ? f.slug : name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
                }));
              }}
              placeholder="e.g. Yadava, Pillai, Chettiar"
              style={inputStyle}
            />

            {/* Slug */}
            <label style={labelStyle}>URL Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="e.g. yadava"
              style={inputStyle}
            />
            <p style={{ fontSize: "11px", color: "#888", margin: "-6px 0 12px 0" }}>
              Used internally and in URLs. Lowercase, no spaces.
            </p>

            {/* Description */}
            <label style={labelStyle}>Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description"
              style={inputStyle}
            />

            {/* Emoji Picker */}
            <label style={labelStyle}>Emoji</label>
            <div style={pickerGridStyle}>
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
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

            {/* Color Picker */}
            <label style={labelStyle}>Color</label>
            <div style={pickerGridStyle}>
              {COLOR_CHOICES.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: col }))}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: col,
                    border: form.color === col ? "3px solid #1e3a8a" : "3px solid white",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                  }}
                  title={col}
                />
              ))}
            </div>

            {/* Display Order */}
            <label style={labelStyle}>Display Order (lower = first)</label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
              style={inputStyle}
            />

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleSave}
                disabled={busy === "save"}
                style={{ ...saveBtnStyle, opacity: busy === "save" ? 0.6 : 1 }}
              >
                {busy === "save" ? "Saving..." : editing ? "💾 Update" : "➕ Add Community"}
              </button>
              <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>
                Cancel
              </button>
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

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "20px",
};

const backBtnStyle = {
  background: "#f3f4f6",
  color: "#1e3a8a",
  padding: "10px 18px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
};

const addBtnStyle = {
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "white",
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
};

const statsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  marginBottom: "20px",
};

const statCardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};

const cardStyle = {
  background: "white",
  borderRadius: "14px",
  padding: "16px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid #f0f0f0",
  transition: "opacity 0.2s",
};

const inactiveBadgeStyle = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "2px 8px",
  borderRadius: "10px",
  fontSize: "11px",
  fontWeight: "600",
};

const codeStyle = {
  background: "#f3f4f6",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "11px",
  fontFamily: "monospace",
};

const editBtnStyle = {
  background: "#eff6ff",
  color: "#1e40af",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const deactivateBtnStyle = {
  background: "#fef3c7",
  color: "#92400e",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const activateBtnStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const deleteBtnStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalStyle = {
  background: "white",
  borderRadius: "18px",
  padding: "28px 24px",
  maxWidth: "460px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
};

const modalCloseStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "#f3f4f6",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#666",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "700",
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  marginBottom: "6px",
  marginTop: "10px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  fontFamily: "inherit",
  boxSizing: "border-box",
  outline: "none",
};

const pickerGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "6px",
};

const pickerBtnStyle = {
  width: "100%",
  aspectRatio: "1",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const saveBtnStyle = {
  flex: 1,
  background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  color: "white",
  border: "none",
  padding: "14px",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
};

const cancelBtnStyle = {
  background: "#f3f4f6",
  color: "#374151",
  border: "none",
  padding: "14px 24px",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #1e3a8a",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

export default AdminCommunities;
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=8B0A2E&color=fff&size=256&bold=true&name=";

function getAvatarFor(name, photoUrl) {
  if (photoUrl) return photoUrl;
  const encoded = encodeURIComponent(name || "Couple");
  return `${DEFAULT_AVATAR}${encoded}`;
}

function AdminSuccessStories() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    couple_names: "",
    story: "",
    photo_url: "",
    wedding_date: "",
    location: "",
    is_approved: true,
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
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || profile.role !== "admin") { navigate("/dashboard"); return; }
      await reload();
      setLoading(false);
    }
    load();
  }, [navigate]);

  const reload = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/success-stories/admin/all`);
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `story-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.${fileExt}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setForm((f) => ({ ...f, photo_url: data.publicUrl }));
      toast.success("Photo uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setForm({
      couple_names: "",
      story: "",
      photo_url: "",
      wedding_date: "",
      location: "",
      is_approved: true,
      display_order: 0,
    });
    setEditing(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.couple_names.trim()) return toast.error("Couple names required");
    if (!form.story.trim()) return toast.error("Story required");

    setSaving(true);
    try {
      const url = editing
        ? `${BACKEND_URL}/success-stories/${editing.id}`
        : `${BACKEND_URL}/success-stories`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couple_names: form.couple_names.trim(),
          story: form.story.trim(),
          photo_url: form.photo_url || null,
          wedding_date: form.wedding_date || null,
          location: form.location.trim() || null,
          is_approved: form.is_approved,
          display_order: parseInt(form.display_order, 10) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editing ? "Story updated!" : "Story added!");
      resetForm();
      await reload();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (story) => {
    setEditing(story);
    setForm({
      couple_names: story.couple_names || "",
      story: story.story || "",
      photo_url: story.photo_url || "",
      wedding_date: story.wedding_date || "",
      location: story.location || "",
      is_approved: story.is_approved !== false,
      display_order: story.display_order || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this story?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/success-stories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Story deleted");
        setStories(stories.filter((s) => s.id !== id));
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleToggleApproved = async (story) => {
    try {
      const newVal = story.is_approved === false;
      const res = await fetch(`${BACKEND_URL}/success-stories/${story.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: newVal }),
      });
      if (res.ok) {
        setStories(
          stories.map((s) =>
            s.id === story.id ? { ...s, is_approved: newVal } : s
          )
        );
        toast.success(newVal ? "Story approved" : "Story hidden");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#8a6b6b" }}>
        Loading...
      </div>
    );
  }

  const S = {
    page: {
      maxWidth: "1000px",
      margin: "0 auto",
      padding: isMobile ? "16px" : "32px",
      fontFamily: "'Inter', sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: 12,
    },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "28px",
      color: "#8B0A2E",
      marginBottom: "4px",
      marginTop: 0,
    },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    backBtn: {
      background: "#e5e7eb",
      color: "#8B0A2E",
      padding: "10px 18px",
      borderRadius: 8,
      textDecoration: "none",
      fontWeight: "bold",
      fontSize: 14,
    },
    card: {
      background: "white",
      borderRadius: "16px",
      padding: isMobile ? "18px" : "24px",
      border: "1px solid #f0e0e0",
      marginBottom: "20px",
      boxShadow: "0 4px 20px rgba(139,10,46,0.04)",
    },
    cardTitle: {
      color: "#8B0A2E",
      marginTop: 0,
      marginBottom: "16px",
      fontSize: "17px",
      fontWeight: 700,
    },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: 700,
      color: "#555",
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "11px 14px",
      borderRadius: "10px",
      border: "1.5px solid #e5e7eb",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      background: "#FAFAFA",
      boxSizing: "border-box",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "14px",
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      color: "white",
      border: "none",
      padding: "14px 28px",
      borderRadius: "10px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(139,10,46,0.25)",
    },
    btnSmall: {
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      fontSize: "11px",
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    storyRow: {
      display: "flex",
      gap: "12px",
      padding: "14px",
      background: "#FFF9F5",
      borderRadius: "12px",
      border: "1px solid #f0e0e0",
      marginBottom: "10px",
      alignItems: "flex-start",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    thumb: {
      width: isMobile ? "70px" : "80px",
      height: isMobile ? "88px" : "100px",
      borderRadius: "10px",
      objectFit: "cover",
      flexShrink: 0,
      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
    },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>💕 Success Stories</h1>
          <p style={S.sub}>Add, edit, delete success stories</p>
        </div>
        <Link to="/admin" style={S.backBtn}>
          ← Dashboard
        </Link>
      </div>

      {/* FORM */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          {editing ? "✏️ Edit Story" : "➕ Add New Story"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={S.grid}>
            <div>
              <label style={S.label}>Couple Names *</label>
              <input
                style={S.input}
                placeholder="e.g. Sathish & Priya"
                value={form.couple_names}
                onChange={(e) =>
                  setForm({ ...form, couple_names: e.target.value })
                }
              />
            </div>
            <div>
              <label style={S.label}>Wedding Date</label>
              <input
                type="date"
                style={S.input}
                value={form.wedding_date}
                onChange={(e) =>
                  setForm({ ...form, wedding_date: e.target.value })
                }
              />
            </div>
            <div>
              <label style={S.label}>Location</label>
              <input
                style={S.input}
                placeholder="e.g. Chennai"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label style={S.label}>Display Order</label>
              <input
                type="number"
                style={S.input}
                value={form.display_order}
                onChange={(e) =>
                  setForm({ ...form, display_order: e.target.value })
                }
                placeholder="0 = first"
              />
              <p
                style={{
                  fontSize: 11,
                  color: "#8a6b6b",
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                சிறிய எண் முதல்ல (0, 1, 2...)
              </p>
            </div>
          </div>

          <div style={{ marginTop: "14px" }}>
            <label style={S.label}>Story *</label>
            <textarea
              style={{ ...S.input, minHeight: "100px", resize: "vertical" }}
              placeholder="How did they meet and marry?"
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
            />
          </div>

          <div style={{ marginTop: "14px" }}>
            <label style={S.label}>Couple Photo</label>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <img
                src={getAvatarFor(form.couple_names, form.photo_url)}
                alt="Preview"
                style={{
                  width: 90,
                  height: 110,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: "2px solid #f0e0e0",
                }}
              />
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    ...S.btnSmall,
                    background: "#8B0A2E",
                    color: "white",
                    padding: "10px 16px",
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? "Uploading..." : "📤 Upload Photo"}
                </button>
                {form.photo_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photo_url: "" })}
                    style={{
                      ...S.btnSmall,
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "8px 16px",
                    }}
                  >
                    Remove
                  </button>
                )}
                <p
                  style={{
                    fontSize: 10,
                    color: "#8a6b6b",
                    margin: 0,
                    fontStyle: "italic",
                    maxWidth: 200,
                  }}
                >
                  Photo illama na, name-based avatar use aagum.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "16px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={form.is_approved}
              onChange={(e) =>
                setForm({ ...form, is_approved: e.target.checked })
              }
              style={{ width: 18, height: 18, accentColor: "#8B0A2E" }}
            />
            Approve & Show on Home Page
          </label>

          <div
            style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}
            >
              {saving
                ? "Saving..."
                : editing
                ? "💾 Update Story"
                : "➕ Add Story"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...S.btnSmall,
                  background: "#f3f4f6",
                  color: "#374151",
                  padding: "14px 22px",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LIST */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>📋 All Stories ({stories.length})</h3>
        {stories.length === 0 ? (
          <p style={{ color: "#8a6b6b", textAlign: "center", padding: 20 }}>
            No stories yet. Add your first!
          </p>
        ) : (
          stories
            .slice()
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((s) => (
              <div key={s.id} style={S.storyRow}>
                <img
                  src={getAvatarFor(s.couple_names, s.photo_url)}
                  alt={s.couple_names}
                  style={S.thumb}
                />
                <div style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#8B0A2E",
                      fontSize: 15,
                      marginBottom: 4,
                    }}
                  >
                    {s.couple_names}
                    {s.is_approved === false && (
                      <span
                        style={{
                          marginLeft: 8,
                          background: "#fee2e2",
                          color: "#991b1b",
                          padding: "2px 8px",
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        HIDDEN
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#555",
                      marginBottom: 6,
                      lineHeight: 1.5,
                    }}
                  >
                    {s.story?.substring(0, 100)}
                    {s.story?.length > 100 ? "..." : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#8a6b6b" }}>
                    {s.location && `📍 ${s.location}`}
                    {s.wedding_date &&
                      ` · 💍 ${new Date(s.wedding_date).toLocaleDateString(
                        "en-IN"
                      )}`}
                    {` · Order #${s.display_order || 0}`}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => handleEdit(s)}
                      style={{
                        ...S.btnSmall,
                        background: "#8B0A2E",
                        color: "white",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggleApproved(s)}
                      style={{
                        ...S.btnSmall,
                        background:
                          s.is_approved === false ? "#dcfce7" : "#fef3c7",
                        color: s.is_approved === false ? "#166534" : "#92400e",
                      }}
                    >
                      {s.is_approved === false ? "✓ Approve" : "👁️ Hide"}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{
                        ...S.btnSmall,
                        background: "#fee2e2",
                        color: "#991b1b",
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default AdminSuccessStories;

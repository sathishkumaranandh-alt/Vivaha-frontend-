import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import ImageUpload from "../components/ImageUpload";
import ReportModal from "../components/ReportModal";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const COMMUNITIES = [
  { value: "vanniyar", label: "Vanniyar" },
  { value: "naidu", label: "Naidu" },
  { value: "kallar", label: "Kallar" },
  { value: "thevar", label: "Thevar" },
  { value: "other", label: "Other" },
];

function Profile() {
  const { id } = useParams();
  const isOwnProfile = !id;

  const [profile, setProfile] = useState({
    name: "", age: "", gender: "", religion: "", caste: "",
    location: "", education: "", occupation: "", bio: "",
    photo_url: "", community: "",
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError("Please log in to view this page.");
          setLoading(false);
          return;
        }
        setCurrentUserId(user.id);
        const targetId = id || user.id;

        const res = await fetch(`${BACKEND_URL}/profile/${targetId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile({
              name: data.profile.name || "",
              age: data.profile.age || "",
              gender: data.profile.gender || "",
              religion: data.profile.religion || "",
              caste: data.profile.caste || "",
              location: data.profile.location || "",
              education: data.profile.education || "",
              occupation: data.profile.occupation || "",
              bio: data.profile.bio || "",
              photo_url: data.profile.photo_url || "",
              community: data.profile.community || "",
            });
            setProfileExists(true);
          }
        } else if (res.status === 404 && isOwnProfile) {
          setProfileExists(false);
          setIsEditing(true);
        } else {
          setError(isOwnProfile ? "Could not load your profile." : "This profile does not exist.");
        }
      } catch (err) {
        console.error("Load profile error:", err);
        setError("Network error. Backend may be waking up — try again in 30s.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id, isOwnProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in first."); return; }

      const profileData = {
        id: user.id,
        email: user.email,
        ...profile,
        age: profile.age ? parseInt(profile.age, 10) : null,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch(`${BACKEND_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const { error: supaError } = await supabase.from("users").upsert([profileData]);
        if (supaError) throw supaError;
      }

      toast.success("Profile saved!");
      setProfileExists(true);
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <p style={{ fontSize: "18px", color: "#666" }}>Loading profile... ⏳</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <p style={{ color: "#b91c1c", fontSize: "16px" }}>{error}</p>
      <Link to="/login" style={primaryBtn}>Go to Login</Link>
    </div>
  );

  // ============ EDIT MODE ============
  if (isOwnProfile && isEditing) {
    return (
      <div style={container}>
        <div style={card}>
          <h2 style={{ textAlign: "center", color: "#1e3a8a", marginTop: 0 }}>
            {profileExists ? "✏️ Edit Your Profile" : "📝 Create Your Profile"}
          </h2>
          <p style={{ textAlign: "center", color: "#666", marginTop: 0 }}>
            {profileExists ? "Update your details and save changes." : "Fill in your details to create your profile."}
          </p>

          {currentUserId && (
            <div style={{ marginBottom: "24px" }}>
              <ImageUpload
                userId={currentUserId}
                currentPhotoUrl={profile.photo_url}
                onUploadSuccess={(url) => setProfile({ ...profile, photo_url: url })}
              />
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input placeholder="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={input} />
            <input placeholder="Age" type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} style={input} />
            <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} style={input}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            {/* ⭐ Community selector */}
            <select value={profile.community} onChange={(e) => setProfile({ ...profile, community: e.target.value })} style={input}>
              <option value="">Select Community</option>
              {COMMUNITIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <input placeholder="Religion" value={profile.religion} onChange={(e) => setProfile({ ...profile, religion: e.target.value })} style={input} />
            <input placeholder="Caste" value={profile.caste} onChange={(e) => setProfile({ ...profile, caste: e.target.value })} style={input} />
            <input placeholder="Location (City)" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} style={input} />
            <input placeholder="Education" value={profile.education} onChange={(e) => setProfile({ ...profile, education: e.target.value })} style={input} />
            <input placeholder="Occupation" value={profile.occupation} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} style={input} />
            <textarea placeholder="About yourself (bio)" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} style={{ ...input, resize: "vertical" }} />

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button type="submit" disabled={saving} style={{ ...primaryBtn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : "💾 Save Profile"}
              </button>
              {profileExists && (
                <button type="button" onClick={() => setIsEditing(false)} style={{ ...secondaryBtn, flex: 1 }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============ CARD VIEW ============
  return (
    <div style={container}>
      <div style={card}>
        <div style={headerRow}>
          <div style={avatar}>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, color: "#1e3a8a", fontSize: "26px" }}>
              {profile.name || "Anonymous"}
            </h2>
            {profile.community && (
              <span style={communityBadge}>
                {COMMUNITIES.find(c => c.value === profile.community)?.label || profile.community}
              </span>
            )}
            <p style={{ margin: "6px 0", color: "#666", fontSize: "15px" }}>
              {profile.age ? `${profile.age} yrs` : ""}
              {profile.age && profile.location ? " • " : ""}
              {profile.location || ""}
            </p>
            {profile.gender && (
              <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>{capitalize(profile.gender)}</p>
            )}
          </div>
        </div>

        <div style={detailsGrid}>
          {profile.religion && <DetailItem label="🕉️ Religion" value={profile.religion} />}
          {profile.caste && <DetailItem label="👥 Caste" value={profile.caste} />}
          {profile.education && <DetailItem label="🎓 Education" value={profile.education} />}
          {profile.occupation && <DetailItem label="💼 Occupation" value={profile.occupation} />}
          {profile.location && <DetailItem label="📍 Location" value={profile.location} />}
          {profile.age && <DetailItem label="🎂 Age" value={`${profile.age} years`} />}
        </div>

        {profile.bio && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "6px", fontWeight: "600" }}>About</p>
            <p style={bioBox}>"{profile.bio}"</p>
          </div>
        )}

        <div style={actionRow}>
          {isOwnProfile ? (
            <>
              <button onClick={() => setIsEditing(true)} style={primaryBtn}>✏️ Edit Profile</button>
              <Link to="/matches" style={secondaryBtn}>🔍 My Matches</Link>
              <Link to="/messages" style={secondaryBtn}>💬 Messages</Link>
              <Link to="/subscription" style={secondaryBtn}>⭐ Upgrade</Link>
            </>
          ) : (
            <>
              <Link to={`/messages?to=${id}`} style={primaryBtn}>💬 Send Message</Link>
              <button onClick={() => setShowReportModal(true)} style={reportBtn}>🚨 Report User</button>
              <Link to="/matches" style={secondaryBtn}>← Back to Matches</Link>
            </>
          )}
        </div>
      </div>

      {isOwnProfile && !profileExists && (
        <div style={emptyState}>
          <p style={{ margin: 0, color: "#666" }}>
            Your profile is empty. Click <strong>✏️ Edit Profile</strong> above to add your details!
          </p>
        </div>
      )}

      {showReportModal && (
        <ReportModal
          reportedUserId={id}
          reportedUserName={profile.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={detailItem}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "15px", color: "#1e3a8a", fontWeight: "600" }}>{value}</div>
    </div>
  );
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// STYLES
const container = { maxWidth: "700px", margin: "30px auto", padding: "20px" };
const card = { background: "white", borderRadius: "16px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" };
const headerRow = { display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" };
const avatar = { width: "100px", height: "100px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", overflow: "hidden", flexShrink: 0, border: "3px solid #1e3a8a" };
const detailsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" };
const detailItem = { background: "#f9fafb", padding: "12px", borderRadius: "8px" };
const actionRow = { marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f0f0f0", display: "flex", flexWrap: "wrap", gap: "10px" };
const input = { padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const primaryBtn = { background: "#1e3a8a", color: "white", padding: "12px 20px", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "inline-block" };
const secondaryBtn = { background: "#e5e7eb", color: "#1e3a8a", padding: "12px 20px", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "inline-block" };
const reportBtn = { background: "white", color: "#dc2626", padding: "12px 20px", border: "1px solid #dc2626", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", display: "inline-block" };
const bioBox = { background: "#f9fafb", padding: "14px", borderRadius: "8px", fontStyle: "italic", color: "#444", margin: 0, lineHeight: "1.6" };
const emptyState = { marginTop: "16px", padding: "16px", background: "#fef3c7", borderRadius: "8px", textAlign: "center" };
const communityBadge = { display: "inline-block", background: "#eff6ff", color: "#1e40af", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", marginTop: "6px" };

export default Profile;
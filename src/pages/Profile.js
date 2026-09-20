import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Profile() {
  // Get :id from URL (undefined if just /profile)
  const { id } = useParams();
  const isOwnProfile = !id;

  // State
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    religion: "",
    caste: "",
    location: "",
    education: "",
    occupation: "",
    bio: "",
    photo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  // ============================================================
  // LOAD PROFILE
  // ============================================================
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Please log in to view this page.");
          setLoading(false);
          return;
        }

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
            });
            setProfileExists(true);
          }
        } else if (res.status === 404 && isOwnProfile) {
          // Profile doesn't exist yet — auto-open editing
          setProfileExists(false);
          setIsEditing(true);
        } else {
          setError(
            isOwnProfile
              ? "Could not load your profile."
              : "This profile does not exist."
          );
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

  // ============================================================
  // SAVE PROFILE
  // ============================================================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    try {
      setSaving(true);
      setSuccess(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first.");
        return;
      }

      const profileData = {
        id: user.id,
        email: user.email,
        ...profile,
        age: profile.age ? parseInt(profile.age, 10) : null,
        updated_at: new Date().toISOString(),
      };

      // Try backend first
      const res = await fetch(`${BACKEND_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      // Fallback to direct Supabase if backend fails
      if (!res.ok) {
        const { error: supaError } = await supabase
          .from("users")
          .upsert([profileData]);
        if (supaError) throw supaError;
      }

      setSuccess(true);
      setProfileExists(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDERING
  // ============================================================

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>
          Loading profile... ⏳
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#b91c1c", fontSize: "16px" }}>{error}</p>
        <Link to="/login" style={primaryButtonStyle}>
          Go to Login
        </Link>
      </div>
    );
  }

  // ============================================================
  // EDIT MODE (only for own profile)
  // ============================================================
  if (isOwnProfile && isEditing) {
    return (
      <div style={containerStyle}>
        <div style={formCardStyle}>
          <h2 style={{ textAlign: "center", color: "#1e3a8a", marginTop: 0 }}>
            {profileExists ? "✏️ Edit Your Profile" : "📝 Create Your Profile"}
          </h2>
          <p style={{ textAlign: "center", color: "#666", marginTop: 0 }}>
            {profileExists
              ? "Update your details and save changes."
              : "Fill in your details to create your profile."}
          </p>

          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              placeholder="Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Age"
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              style={inputStyle}
            />
            <select
              value={profile.gender}
              onChange={(e) =>
                setProfile({ ...profile, gender: e.target.value })
              }
              style={inputStyle}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Religion"
              value={profile.religion}
              onChange={(e) =>
                setProfile({ ...profile, religion: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Caste"
              value={profile.caste}
              onChange={(e) => setProfile({ ...profile, caste: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Location (City)"
              value={profile.location}
              onChange={(e) =>
                setProfile({ ...profile, location: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Education"
              value={profile.education}
              onChange={(e) =>
                setProfile({ ...profile, education: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Occupation"
              value={profile.occupation}
              onChange={(e) =>
                setProfile({ ...profile, occupation: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Photo URL (optional)"
              value={profile.photo_url}
              onChange={(e) =>
                setProfile({ ...profile, photo_url: e.target.value })
              }
              style={inputStyle}
            />
            <textarea
              placeholder="About yourself (bio)"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...primaryButtonStyle,
                  flex: 1,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "💾 Save Profile"}
              </button>
              {profileExists && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ ...secondaryButtonStyle, flex: 1 }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================
  // CARD VIEW (both own and others)
  // ============================================================
  return (
    <div style={containerStyle}>
      {success && (
        <div style={successBannerStyle}>
          ✅ Profile saved successfully!
        </div>
      )}

      <div style={cardStyle}>
        {/* HEADER — Photo + Name + Basic Info */}
        <div style={headerRowStyle}>
          <div style={avatarStyle}>
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "👤"
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, color: "#1e3a8a", fontSize: "26px" }}>
              {profile.name || "Anonymous"}
            </h2>
            <p style={{ margin: "6px 0", color: "#666", fontSize: "15px" }}>
              {profile.age ? `${profile.age} yrs` : ""}
              {profile.age && profile.location ? " • " : ""}
              {profile.location || ""}
            </p>
            {profile.gender && (
              <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                {capitalize(profile.gender)}
              </p>
            )}
          </div>
        </div>

        {/* DETAILS GRID */}
        <div style={detailsGridStyle}>
          {profile.religion && (
            <DetailItem label="🕉️ Religion" value={profile.religion} />
          )}
          {profile.caste && <DetailItem label="👥 Caste" value={profile.caste} />}
          {profile.education && (
            <DetailItem label="🎓 Education" value={profile.education} />
          )}
          {profile.occupation && (
            <DetailItem label="💼 Occupation" value={profile.occupation} />
          )}
          {profile.location && (
            <DetailItem label="📍 Location" value={profile.location} />
          )}
          {profile.age && (
            <DetailItem label="🎂 Age" value={`${profile.age} years`} />
          )}
        </div>

        {/* BIO */}
        {profile.bio && (
          <div style={{ marginTop: "20px" }}>
            <p
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              About
            </p>
            <p
              style={{
                background: "#f9fafb",
                padding: "14px",
                borderRadius: "8px",
                fontStyle: "italic",
                color: "#444",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              "{profile.bio}"
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div style={actionRowStyle}>
          {isOwnProfile ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                style={primaryButtonStyle}
              >
                ✏️ Edit Profile
              </button>
              <Link to="/matches" style={secondaryButtonStyle}>
                🔍 My Matches
              </Link>
              <Link to="/messages" style={secondaryButtonStyle}>
                💬 Messages
              </Link>
              <Link to="/subscription" style={secondaryButtonStyle}>
                ⭐ Upgrade
              </Link>
            </>
          ) : (
            <>
              <Link
                to={`/messages?to=${id}`}
                style={{ ...primaryButtonStyle, textAlign: "center" }}
              >
                💬 Send Message
              </Link>
              <Link
                to="/matches"
                style={{ ...secondaryButtonStyle, textAlign: "center" }}
              >
                ← Back to Matches
              </Link>
            </>
          )}
        </div>
      </div>

      {/* SAFETY: Show a message if user hasn't set profile yet (only own) */}
      {isOwnProfile && !profileExists && (
        <div style={emptyStateStyle}>
          <p style={{ margin: 0, color: "#666" }}>
            Your profile is empty. Click <strong>✏️ Edit Profile</strong> above
            to add your details and get better matches!
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function DetailItem({ label, value }) {
  return (
    <div style={detailItemStyle}>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "15px", color: "#1e3a8a", fontWeight: "600" }}>
        {value}
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// STYLES
// ============================================================
const containerStyle = {
  maxWidth: "700px",
  margin: "30px auto",
  padding: "20px",
};

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

const formCardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

const headerRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "24px",
  paddingBottom: "20px",
  borderBottom: "1px solid #f0f0f0",
  flexWrap: "wrap",
};

const avatarStyle = {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "42px",
  overflow: "hidden",
  flexShrink: 0,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "16px",
};

const detailItemStyle = {
  background: "#f9fafb",
  padding: "12px",
  borderRadius: "8px",
};

const actionRowStyle = {
  marginTop: "28px",
  paddingTop: "20px",
  borderTop: "1px solid #f0f0f0",
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const inputStyle = {
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  background: "#1e3a8a",
  color: "white",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const secondaryButtonStyle = {
  background: "#e5e7eb",
  color: "#1e3a8a",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const successBannerStyle = {
  background: "#dcfce7",
  color: "#166534",
  padding: "12px",
  borderRadius: "8px",
  textAlign: "center",
  marginBottom: "16px",
  fontWeight: "600",
};

const emptyStateStyle = {
  marginTop: "16px",
  padding: "16px",
  background: "#fef3c7",
  borderRadius: "8px",
  textAlign: "center",
};

export default Profile;
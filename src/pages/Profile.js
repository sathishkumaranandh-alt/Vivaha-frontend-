import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Profile() {
  // Get the :id from URL (undefined if just /profile)
  const { id } = useParams();
  const isOwnProfile = !id; // true if no id in URL

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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // ============================================================
  // LOAD PROFILE
  // ============================================================
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        // Get logged-in user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Please log in to view this page.");
          setLoading(false);
          return;
        }

        // Determine which user's profile to fetch
        const targetId = id || user.id;

        // Fetch from backend
        const res = await fetch(`${BACKEND_URL}/profile/${targetId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError(
              isOwnProfile
                ? "You haven't set up your profile yet. Fill in the form below to get started!"
                : "This profile does not exist."
            );
          } else {
            setError("Could not load profile. Please try again.");
          }
          setLoading(false);
          return;
        }

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
          });
        }
      } catch (err) {
        console.error("Load profile error:", err);
        setError("Network error. Backend may be waking up — try refreshing in 30 seconds.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id, isOwnProfile]);

  // ============================================================
  // SAVE PROFILE (only for own profile)
  // ============================================================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    try {
      setSaving(true);
      setSuccessMessage("");

      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first.");
        return;
      }

      // Prepare data — include id and email for new profiles
      const profileData = {
        id: user.id,
        email: user.email,
        ...profile,
        age: profile.age ? parseInt(profile.age, 10) : null,
        updated_at: new Date().toISOString(),
      };

      // Save via backend
      const res = await fetch(`${BACKEND_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        // Try creating via Supabase as fallback
        const { error: supaError } = await supabase
          .from("users")
          .upsert([profileData]);
        if (supaError) throw supaError;
      }

      setSuccessMessage("✅ Profile saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Save profile error:", err);
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
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading profile... ⏳</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        {isOwnProfile && (
          <p style={{ color: "#666" }}>
            Fill out the form below and click Save to create your profile.
          </p>
        )}
      </div>
    );
  }

  // Read-only view for other users
  if (!isOwnProfile) {
    return <ReadOnlyProfile profile={profile} userId={id} />;
  }

  // Editable view for own profile
  return (
    <div style={{ maxWidth: "600px", margin: "30px auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", color: "#1e3a8a" }}>My Profile</h2>

      {successMessage && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "10px",
            borderRadius: "8px",
            textAlign: "center",
            marginBottom: "15px",
          }}
        >
          {successMessage}
        </div>
      )}

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
          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
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
          onChange={(e) => setProfile({ ...profile, religion: e.target.value })}
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
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Education"
          value={profile.education}
          onChange={(e) => setProfile({ ...profile, education: e.target.value })}
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
        <textarea
          placeholder="About yourself (bio)"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? "#94a3b8" : "#1e3a8a",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// READ-ONLY PROFILE COMPONENT (for viewing other users)
// ============================================================
function ReadOnlyProfile({ profile, userId }) {
  return (
    <div style={{ maxWidth: "600px", margin: "30px auto", padding: "20px" }}>
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              overflow: "hidden",
            }}
          >
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
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>
              {profile.name || "Anonymous"}
            </h2>
            <p style={{ margin: "4px 0", color: "#666" }}>
              {profile.age ? `${profile.age} yrs` : ""}
              {profile.location ? ` • ${profile.location}` : ""}
            </p>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {profile.gender && (
            <DetailRow label="Gender" value={capitalize(profile.gender)} />
          )}
          {profile.religion && (
            <DetailRow
              label="Religion"
              value={`${profile.religion}${
                profile.caste ? " • " + profile.caste : ""
              }`}
            />
          )}
          {profile.education && (
            <DetailRow label="Education" value={profile.education} />
          )}
          {profile.occupation && (
            <DetailRow label="Occupation" value={profile.occupation} />
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "#666", marginBottom: "6px" }}>About:</p>
            <p
              style={{
                background: "#f9fafb",
                padding: "12px",
                borderRadius: "8px",
                fontStyle: "italic",
                color: "#444",
              }}
            >
              "{profile.bio}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
          <button
            onClick={() => alert("Chat coming soon!")}
            style={{
              flex: 1,
              background: "#1e3a8a",
              color: "white",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            💬 Send Message
          </button>
          <Link
            to="/matches"
            style={{
              flex: 1,
              background: "#e5e7eb",
              color: "#1e3a8a",
              padding: "12px",
              borderRadius: "8px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Back to Matches
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper component
function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #f0f0f0",
        paddingBottom: "8px",
      }}
    >
      <span style={{ color: "#666" }}>{label}:</span>
      <span style={{ fontWeight: "600", color: "#1e3a8a" }}>{value}</span>
    </div>
  );
}

// Helper function
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Shared input styles
const inputStyle = {
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  fontFamily: "inherit",
};

export default Profile;
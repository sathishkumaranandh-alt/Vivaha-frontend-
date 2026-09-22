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
    community: "",
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Interest status
  const [interestStatus, setInterestStatus] = useState("none");
  const [interestDirection, setInterestDirection] = useState(null);
  const [interestBusy, setInterestBusy] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

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

        if (!isOwnProfile) {
          await loadInterestStatus(user.id, targetId);
        }
      } catch (err) {
        console.error("Load profile error:", err);
        setError("Network error. Backend may be waking up — try again in 30s.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOwnProfile]);

  const loadInterestStatus = async (userId, otherId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/status/${userId}/${otherId}`);
      if (res.ok) {
        const data = await res.json();
        setInterestStatus(data.status || "none");
        setInterestDirection(data.direction || null);
      }
    } catch (err) {
      console.error("Interest status error:", err);
    }
  };

  const handleSendInterest = async () => {
    if (!currentUserId || isOwnProfile) return;

    if (interestStatus === "pending" && interestDirection === "sent") {
      toast.info("Interest already sent to this user");
      return;
    }
    if (interestStatus === "accepted") {
      toast.info("You are already connected with this user");
      return;
    }

    setInterestBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/interests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          receiver_id: id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setInterestStatus("pending");
        setInterestDirection("sent");
        toast.success(`❤️ Interest sent to ${profile.name || "user"}!`);
      } else {
        toast.error(data.error || "Could not send interest");
      }
    } catch (err) {
      console.error("Send interest error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setInterestBusy(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first.");
        return;
      }

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

  const completeness = (() => {
    const fields = ["name", "age", "gender", "religion", "location", "education", "occupation", "bio", "photo_url", "community"];
    const filled = fields.filter((f) => profile[f] && String(profile[f]).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  })();

  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ fontSize: "16px", color: "#666", marginTop: "16px" }}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "60px", marginBottom: "16px" }}>⚠️</div>
        <p style={{ color: "#b91c1c", fontSize: "16px", marginBottom: "20px" }}>{error}</p>
        <Link to="/login" style={primaryBtn}>Go to Login</Link>
      </div>
    );
  }

  // ============================================================
  // EDIT MODE
  // ============================================================
  if (isOwnProfile && isEditing) {
    return (
      <div style={editContainerStyle}>
        <div style={editHeaderCardStyle}>
          <h1 style={{ margin: 0, color: "white", fontSize: isMobile ? "20px" : "24px" }}>
            {profileExists ? "✏️ Edit Your Profile" : "📝 Create Your Profile"}
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
            {profileExists
              ? "Update your details and save changes"
              : "Fill in your details to start getting matches"}
          </p>

          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "white", fontSize: "12px", opacity: 0.9 }}>Profile completeness</span>
              <span style={{ color: "white", fontSize: "12px", fontWeight: "bold" }}>{completeness}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${completeness}%`,
                  height: "100%",
                  background: completeness >= 80 ? "#22c55e" : completeness >= 50 ? "#facc15" : "#f87171",
                  transition: "width 0.4s",
                }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} style={editFormStyle}>
          <Section title="📷 Profile Photo" isMobile={isMobile}>
            {currentUserId && (
              <ImageUpload
                userId={currentUserId}
                currentPhotoUrl={profile.photo_url}
                onUploadSuccess={(url) => setProfile({ ...profile, photo_url: url })}
              />
            )}
          </Section>

          <Section title="👤 Basic Information" isMobile={isMobile}>
            <div style={gridStyle(isMobile)}>
              <Field icon="👤" label="Full Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="e.g. Priya Raman" required />
              <Field icon="🎂" label="Age" type="number" value={profile.age} onChange={(v) => setProfile({ ...profile, age: v })} placeholder="e.g. 26" />
              <SelectField icon="⚧️" label="Gender" value={profile.gender} onChange={(v) => setProfile({ ...profile, gender: v })} options={[{ value: "", label: "Select Gender" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} />
              <SelectField icon="🏷️" label="Community" value={profile.community} onChange={(v) => setProfile({ ...profile, community: v })} options={[{ value: "", label: "Select Community" }, ...COMMUNITIES.map(c => ({ value: c.value, label: c.label }))]} />
            </div>
          </Section>

          <Section title="🕉️ Cultural Details" isMobile={isMobile}>
            <div style={gridStyle(isMobile)}>
              <Field icon="🕉️" label="Religion" value={profile.religion} onChange={(v) => setProfile({ ...profile, religion: v })} placeholder="e.g. Hindu" />
              <Field icon="👥" label="Caste" value={profile.caste} onChange={(v) => setProfile({ ...profile, caste: v })} placeholder="e.g. Vanniyar" />
            </div>
          </Section>

          <Section title="📍 Location & Career" isMobile={isMobile}>
            <div style={gridStyle(isMobile)}>
              <Field icon="📍" label="Location (City)" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} placeholder="e.g. Chennai" />
              <Field icon="🎓" label="Education" value={profile.education} onChange={(v) => setProfile({ ...profile, education: v })} placeholder="e.g. B.Tech, MBA" />
              <Field icon="💼" label="Occupation" value={profile.occupation} onChange={(v) => setProfile({ ...profile, occupation: v })} placeholder="e.g. Software Engineer" />
            </div>
          </Section>

          <Section title="✍️ About Yourself" isMobile={isMobile}>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself, your family, interests, and what you're looking for in a partner..."
                rows={5}
                maxLength={500}
                style={{ ...inputFieldStyle, resize: "vertical", minHeight: "120px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fafafa" }}
              />
              <p style={{ textAlign: "right", fontSize: "11px", color: "#888", margin: "4px 0 0 0" }}>
                {profile.bio.length}/500
              </p>
            </div>
          </Section>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                minWidth: "150px",
                background: saving ? "#94a3b8" : "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                color: "white",
                border: "none",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
              }}
            >
              {saving ? "Saving..." : "💾 Save Profile"}
            </button>
            {profileExists && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  minWidth: "150px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  padding: "14px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ============================================================
  // VIEW MODE
  // ============================================================
  return (
    <div style={viewContainerStyle}>
      <div style={viewCardStyle}>
        <div style={heroHeaderStyle}>
          <div style={heroAvatarStyle}>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "👤"
            )}
          </div>
          <h2 style={{ margin: "12px 0 4px 0", color: "white", fontSize: "24px" }}>
            {profile.name || "Anonymous"}
          </h2>
          {profile.community && (
            <span style={heroBadgeStyle}>
              🏷️ {COMMUNITIES.find(c => c.value === profile.community)?.label || profile.community}
            </span>
          )}
          <p style={{ margin: "8px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
            {profile.age ? `${profile.age} yrs` : ""}
            {profile.age && profile.location ? " • " : ""}
            {profile.location || ""}
          </p>
        </div>

        <div style={viewBodyStyle}>
          <div style={detailsGridStyle}>
            {profile.gender && <DetailCard icon="⚧️" label="Gender" value={capitalize(profile.gender)} />}
            {profile.religion && <DetailCard icon="🕉️" label="Religion" value={profile.religion} />}
            {profile.caste && <DetailCard icon="👥" label="Caste" value={profile.caste} />}
            {profile.education && <DetailCard icon="🎓" label="Education" value={profile.education} />}
            {profile.occupation && <DetailCard icon="💼" label="Occupation" value={profile.occupation} />}
            {profile.location && <DetailCard icon="📍" label="Location" value={profile.location} />}
          </div>

          {profile.bio && (
            <div style={{ marginTop: "24px" }}>
              <h3 style={sectionHeadingStyle}>✍️ About</h3>
              <p style={bioTextStyle}>"{profile.bio}"</p>
            </div>
          )}
        </div>

        {/* ============================================================
            ACTION BUTTONS
            - Message: only shows if connected (or shows as locked)
            - Interest: changes based on status
            - Report: always available
        ============================================================ */}
        <div style={viewActionsStyle}>
          {isOwnProfile ? (
            <>
              <button onClick={() => setIsEditing(true)} style={primaryActionBtn}>✏️ Edit Profile</button>
              <Link to="/matches" style={secondaryActionBtn}>🔍 My Matches</Link>
              <Link to="/messages" style={secondaryActionBtn}>💬 Messages</Link>
              <Link to="/subscription" style={secondaryActionBtn}>⭐ Upgrade</Link>
            </>
          ) : (
            <>
              {/* Message button — LOCKED unless connected */}
              {interestStatus === "accepted" ? (
                <Link to={`/messages?to=${id}`} style={messageBtn}>
                  💬 Send Message
                </Link>
              ) : (
                <button
                  onClick={() => {
                    toast.info("🔒 Send an interest first. Messaging unlocks after they accept.");
                  }}
                  style={{
                    ...messageBtn,
                    background: "#e5e7eb",
                    color: "#666",
                    cursor: "not-allowed",
                    boxShadow: "none",
                  }}
                  title="Messaging unlocks after interest is accepted"
                >
                  🔒 Message Locked
                </button>
              )}

              {/* Interest button */}
              <InterestButton
                status={interestStatus}
                direction={interestDirection}
                busy={interestBusy}
                onClick={handleSendInterest}
              />

              {/* Report button */}
              <button onClick={() => setShowReportModal(true)} style={reportActionBtn}>
                🚨 Report
              </button>

              {/* Back link */}
              <Link to="/matches" style={secondaryActionBtn}>← Back</Link>
            </>
          )}
        </div>

        {/* Safety note */}
        {!isOwnProfile && interestStatus !== "accepted" && (
          <div style={safetyNoteStyle}>
            🔒 For safety, messaging is only available after both users have accepted each other's interest.
          </div>
        )}
      </div>

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

// ============================================================
// INTEREST BUTTON
// ============================================================
function InterestButton({ status, direction, busy, onClick }) {
  if (status === "accepted") {
    return (
      <Link to="/interests" style={{ ...interestBtn, background: "#dcfce7", color: "#166534", border: "1px solid #16a34a", textDecoration: "none" }}>
        ✅ Connected
      </Link>
    );
  }

  if (status === "pending" && direction === "received") {
    return (
      <Link to="/interests" style={{ ...interestBtn, background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b", textDecoration: "none" }}>
        📥 Respond to Interest
      </Link>
    );
  }

  if (status === "pending" && direction === "sent") {
    return (
      <button disabled style={{ ...interestBtn, background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b", cursor: "not-allowed" }}>
        ⏳ Interest Sent
      </button>
    );
  }

  if (status === "declined" && direction === "sent") {
    return (
      <button disabled style={{ ...interestBtn, background: "#fee2e2", color: "#991b1b", border: "1px solid #dc2626", cursor: "not-allowed" }}>
        ✖️ Declined
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        ...interestBtn,
        background: "linear-gradient(135deg, #dc2626, #f97316)",
        color: "white",
        border: "none",
        cursor: busy ? "not-allowed" : "pointer",
        opacity: busy ? 0.6 : 1,
        boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
      }}
    >
      {busy ? "Sending..." : "💌 Send Interest"}
    </button>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function Section({ title, children, isMobile }) {
  return (
    <div style={sectionCardStyle}>
      <h3 style={{ ...sectionTitleStyle, fontSize: isMobile ? "14px" : "15px" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ icon, label, value, onChange, placeholder, type = "text", required = false }) {
  return (
    <div style={fieldWrapper}>
      <label style={labelStyle}>{label}</label>
      <div style={inputWithIcon}>
        <span style={iconStyle}>{icon}</span>
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={inputFieldStyle}
        />
      </div>
    </div>
  );
}

function SelectField({ icon, label, value, onChange, options }) {
  return (
    <div style={fieldWrapper}>
      <label style={labelStyle}>{label}</label>
      <div style={inputWithIcon}>
        <span style={iconStyle}>{icon}</span>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputFieldStyle, cursor: "pointer" }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value }) {
  return (
    <div style={detailCardStyle}>
      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "15px", color: "#1e3a8a", fontWeight: "600", marginTop: "4px" }}>{value}</div>
    </div>
  );
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// STYLES
// ============================================================
const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #1e3a8a",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

const editContainerStyle = { maxWidth: "800px", margin: "0 auto", padding: "20px" };
const viewContainerStyle = { maxWidth: "800px", margin: "30px auto", padding: "20px" };

const editHeaderCardStyle = {
  background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "20px",
  boxShadow: "0 8px 24px rgba(30, 58, 138, 0.3)",
};

const editFormStyle = { display: "flex", flexDirection: "column", gap: "16px" };
const sectionCardStyle = { background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };
const sectionTitleStyle = { margin: "0 0 16px 0", color: "#1e3a8a", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" };
const gridStyle = (isMobile) => ({ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" });
const fieldWrapper = { display: "flex", flexDirection: "column" };
const labelStyle = { fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" };
const inputWithIcon = { display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fafafa", overflow: "hidden" };
const iconStyle = { padding: "0 12px", fontSize: "18px", background: "#f3f4f6", height: "100%", display: "flex", alignItems: "center", minHeight: "46px", borderRight: "1px solid #e5e7eb" };
const inputFieldStyle = { flex: 1, padding: "12px 14px", border: "none", background: "transparent", fontSize: "15px", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };
const primaryBtn = { background: "#1e3a8a", color: "white", padding: "12px 24px", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "inline-block" };

const viewCardStyle = { background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" };
const heroHeaderStyle = { background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", padding: "30px 20px", textAlign: "center" };
const heroAvatarStyle = { width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px", overflow: "hidden", border: "4px solid white", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" };
const heroBadgeStyle = { display: "inline-block", background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 14px", borderRadius: "14px", fontSize: "12px", fontWeight: "600", marginTop: "4px" };
const viewBodyStyle = { padding: "24px" };
const detailsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" };
const detailCardStyle = { background: "#f9fafb", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1px solid #f0f0f0" };
const sectionHeadingStyle = { margin: "0 0 12px 0", color: "#1e3a8a", fontSize: "16px", fontWeight: "700" };
const bioTextStyle = { background: "#f9fafb", padding: "16px", borderRadius: "12px", fontStyle: "italic", color: "#444", margin: 0, lineHeight: "1.7", fontSize: "14px" };
const viewActionsStyle = { padding: "20px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "10px", flexWrap: "wrap" };

const primaryActionBtn = { background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", padding: "12px 20px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "inline-block", boxShadow: "0 2px 8px rgba(30, 58, 138, 0.3)" };
const secondaryActionBtn = { background: "#f3f4f6", color: "#1e3a8a", padding: "12px 20px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "inline-block" };
const reportActionBtn = { background: "white", color: "#dc2626", padding: "12px 20px", border: "1px solid #dc2626", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", display: "inline-block" };
const messageBtn = { background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "white", padding: "12px 20px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", textDecoration: "none", display: "inline-block", boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)" };
const interestBtn = { padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", display: "inline-block" };

const safetyNoteStyle = {
  padding: "12px 24px 20px 24px",
  fontSize: "12px",
  color: "#888",
  textAlign: "center",
  background: "#fafafa",
  borderTop: "1px solid #f0f0f0",
};

export default Profile;

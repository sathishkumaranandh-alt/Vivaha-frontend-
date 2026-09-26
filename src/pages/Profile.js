import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import PhotoGallery from "../components/PhotoGallery";
import ReportModal from "../components/ReportModal";
import { toast } from "../utils/toast";
import { useCommunities } from "../utils/communities";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Profile() {
  const { id } = useParams();
  const isOwnProfile = !id;
  const { communities } = useCommunities();

  const [profile, setProfile] = useState({
    name: "", age: "", gender: "", religion: "", caste: "",
    location: "", education: "", occupation: "", bio: "",
    photo_url: "", community: "", income: "", marital_status: "",
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [activeTab, setActiveTab] = useState("about");

  const [interestStatus, setInterestStatus] = useState("none");
  const [interestDirection, setInterestDirection] = useState(null);
  const [interestBusy, setInterestBusy] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
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
              income: data.profile.income || "",
              marital_status: data.profile.marital_status || "never_married",
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
          await loadShortlistStatus(user.id, targetId);
          
          // Log the profile view (silent, don't wait for it)
          fetch(`${BACKEND_URL}/visitors/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ viewerId: user.id, viewedId: targetId })
          }).catch(() => {});
              }
      } catch (err) {
        console.error(err);
        setError("Network error. Try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOwnProfile]);

  const loadInterestStatus = async (uid, other) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/status/${uid}/${other}`);
      if (res.ok) {
        const data = await res.json();
        setInterestStatus(data.status || "none");
        setInterestDirection(data.direction || null);
      }
    } catch {}
  };

  const loadShortlistStatus = async (uid, other) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlisted/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setIsShortlisted((data.shortlisted || []).some((s) => s.shortlisted_user_id === other));
      }
    } catch {}
  };

  const handleSendInterest = async () => {
    if (!currentUserId) return;
    if (interestStatus === "pending" && interestDirection === "sent") return toast.info("Interest already sent");
    if (interestStatus === "accepted") return toast.info("Already connected");

    setInterestBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/interests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: currentUserId, receiver_id: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setInterestStatus("pending");
        setInterestDirection("sent");
        toast.success("❤️ Interest sent!");
      } else {
        toast.error(data.error || "Could not send interest");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setInterestBusy(false);
    }
  };

  const handleShortlist = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, shortlisted_user_id: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsShortlisted(data.action === "added");
        toast.success(data.action === "added" ? "Shortlisted" : "Removed");
      }
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const completion = (() => {
    const fields = ["name", "age", "gender", "religion", "location", "education", "occupation", "bio", "photo_url", "community"];
    const filled = fields.filter((f) => profile[f] && String(profile[f]).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  })();

  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#8a6b6b", marginTop: "16px" }}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#b91c1c", marginBottom: "20px" }}>{error}</p>
        <Link to="/login" style={{ color: "#8B0A2E", fontWeight: "bold" }}>Go to Login</Link>
      </div>
    );
  }

  // ==================== EDIT MODE ====================
  if (isOwnProfile && isEditing) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
        <div style={{ background: "linear-gradient(135deg, #8B0A2E, #a01438)", borderRadius: "16px", padding: "24px", marginBottom: "20px", color: "white" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", margin: 0 }}>
            {profileExists ? "✏️ Edit Your Profile" : "📝 Create Your Profile"}
          </h1>
          <p style={{ margin: "6px 0 0 0", opacity: 0.9, fontSize: "13px" }}>
            {profileExists ? "Update your details" : "Fill in your details to start"}
          </p>
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
              <span>Profile Completeness</span>
              <strong>{completion}%</strong>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
              <div style={{ width: `${completion}%`, height: "100%", background: "#D4A017" }} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ background: "white", borderRadius: "14px", padding: "24px", border: "1px solid #f0e0e0" }}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              📷 Your Photos (up to 5)
            </label>
            {currentUserId && (
           <PhotoGallery
                userId={currentUserId}
                onPrimaryChange={(url) => setProfile({ ...profile, photo_url: url })}
                fallbackPhotoUrl={profile.photo_url}
              /> 
            )}
          </div>

          {[
            { label: "Name", key: "name", type: "text" },
            { label: "Age", key: "age", type: "number" },
            { label: "Religion", key: "religion", type: "text" },
            { label: "Caste", key: "caste", type: "text" },
            { label: "Location", key: "location", type: "text" },
            { label: "Education", key: "education", type: "text" },
            { label: "Occupation", key: "occupation", type: "text" },
            { label: "Income (₹ LPA)", key: "income", type: "text" },
          ].map((f) => (
            <div key={f.key} style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={profile[f.key] || ""}
                onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>Gender</label>
            <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} style={inputStyle}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>Community</label>
            <select value={profile.community} onChange={(e) => setProfile({ ...profile, community: e.target.value })} style={inputStyle}>
              <option value="">Select Community</option>
              {communities.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>About</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              maxLength={500}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, background: "#8B0A2E", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
              {saving ? "Saving..." : "💾 Save Profile"}
            </button>
            {profileExists && (
              <button type="button" onClick={() => setIsEditing(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "14px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ==================== VIEW MODE ====================
  const myCommunity = communities.find((c) => c.slug === profile.community);

  const S = {
    layout: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "16px" : "32px",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: "320px 1fr",
      gap: "24px",
      alignItems: "start",
    },
    heartBig: {
      position: "absolute",
      top: "60px",
      right: "14px",
      width: "36px",
      height: "36px",
      background: "rgba(255,255,255,0.9)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#8B0A2E",
      fontSize: "18px",
      fontWeight: "bold",
      border: "none",
      cursor: "pointer",
      zIndex: 5,
    },
    mainCard: {
      background: "white",
      borderRadius: "20px",
      padding: isMobile ? "20px" : "28px",
      boxShadow: "0 4px 20px rgba(139,10,46,0.06)",
      border: "1px solid #f0e0e0",
    },
    profileHeader: {
      display: "flex",
      justifyContent: "space-between",
      gap: "20px",
      paddingBottom: "20px",
      borderBottom: "1px solid #f0e0e0",
      flexWrap: "wrap",
      marginBottom: "20px",
    },
    nameH1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "28px",
      fontWeight: 700,
      color: "#8B0A2E",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "4px",
      flexWrap: "wrap",
    },
    badge: {
      background: "#10B981",
      color: "white",
      fontSize: "11px",
      padding: "3px 10px",
      borderRadius: "10px",
      fontWeight: 700,
      fontFamily: "'Inter', sans-serif",
    },
    sub: { color: "#8a6b6b", fontSize: "14px" },
    actionsCol: { display: "flex", flexDirection: "column", gap: "8px", minWidth: isMobile ? "100%" : "160px" },
    btnPrimary: {
      background: "#8B0A2E",
      color: "white",
      border: "none",
      padding: "11px 18px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "13px",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnOutline: {
      background: "white",
      color: "#8B0A2E",
      border: "1.5px solid #8B0A2E",
      padding: "10px 18px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "13px",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnReport: {
      background: "none",
      border: "none",
      color: "#8a6b6b",
      fontSize: "12px",
      textDecoration: "underline",
      cursor: "pointer",
      padding: "4px",
      fontFamily: "inherit",
    },
    infoRow: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "20px" },
    infoItem: { display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#2D1B1B" },
    iconBox: { width: "32px", height: "32px", borderRadius: "8px", background: "#FDF2F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 },
    tabs: { display: "flex", gap: "24px", borderBottom: "1px solid #f0e0e0", marginBottom: "20px", overflowX: "auto" },
    tab: { background: "none", border: "none", padding: "12px 0", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, color: "#8a6b6b", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "2px solid transparent", marginBottom: "-1px" },
    tabActive: { color: "#8B0A2E", borderColor: "#8B0A2E" },
    aboutText: { color: "#2D1B1B", fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" },
    tagsWrap: { display: "flex", gap: "6px", flexWrap: "wrap" },
    interestTag: { background: "#FFF9F5", border: "1px solid #f0e0e0", color: "#8a6b6b", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 500 },
    quickInfo: { background: "#FFF9F5", border: "1px solid #f0e0e0", borderRadius: "14px", padding: "20px", marginTop: "20px" },
    qiTitle: { fontFamily: "'Playfair Display', serif", color: "#8B0A2E", fontSize: "16px", marginBottom: "16px" },
    qiRow: { display: "flex", gap: "12px", padding: "9px 0", borderBottom: "1px solid #f0e0e0", fontSize: "12px", alignItems: "center" },
    qiLabel: { color: "#8a6b6b", flex: "0 0 110px" },
    qiValue: { color: "#2D1B1B", fontWeight: 600, flex: 1 },
  };

  return (
    <div style={S.layout}>
      {/* LEFT: PHOTO GALLERY */}
      <div style={{ position: "relative" }}>
        {isOwnProfile && (
          <div style={{ marginBottom: "12px", textAlign: "right" }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#FDF2F6",
                color: "#8B0A2E",
                border: "1px solid #f0e0e0",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✏️ Manage Photos
            </button>
          </div>
        )}

               <PhotoGallery
          userId={id || currentUserId}
          readOnly={!isOwnProfile}
          fallbackPhotoUrl={profile.photo_url}
          onPrimaryChange={(url) => setProfile({ ...profile, photo_url: url })}
        /> 

        {!isOwnProfile && (
          <button
            style={S.heartBig}
            onClick={handleShortlist}
            title="Shortlist"
          >
            {isShortlisted ? "♥" : "♡"}
          </button>
        )}
      </div>

      {/* RIGHT: DETAILS */}
      <div>
        <div style={S.mainCard}>
          <div style={S.profileHeader}>
            <div>
              <h1 style={S.nameH1}>
                {profile.name || "Anonymous"}
                {profile.is_verified && <span style={S.badge}>✓ Verified</span>}
              </h1>
              <div style={S.sub}>
                {profile.age ? `${profile.age} years` : ""}
                {profile.age && profile.location ? " • " : ""}
                {profile.location || ""}
              </div>
            </div>
            <div style={S.actionsCol}>
              {isOwnProfile ? (
                <>
                  <button onClick={() => setIsEditing(true)} style={S.btnPrimary}>✏️ Edit Profile</button>
                  <Link to="/dashboard" style={{ ...S.btnOutline, textDecoration: "none", textAlign: "center" }}>📊 Dashboard</Link>
                </>
              ) : (
                <>
                  {interestStatus === "accepted" ? (
                    <Link to={`/messages?to=${id}`} style={{ ...S.btnPrimary, textDecoration: "none", textAlign: "center" }}>💬 Message</Link>
                  ) : (
                    <button
                      onClick={handleSendInterest}
                      disabled={interestBusy || (interestStatus === "pending" && interestDirection === "sent")}
                      style={{ ...S.btnPrimary, opacity: interestBusy ? 0.6 : 1 }}
                    >
                      {interestStatus === "pending" && interestDirection === "sent"
                        ? "✓ Interest Sent"
                        : interestStatus === "pending" && interestDirection === "received"
                        ? "📥 Respond to Interest"
                        : "💌 Send Interest"}
                    </button>
                  )}
                  <button onClick={handleShortlist} style={S.btnOutline}>
                    {isShortlisted ? "♥ Shortlisted" : "♡ Shortlist"}
                  </button>
                  <button onClick={() => setShowReportModal(true)} style={S.btnReport}>⚐ Report</button>
                </>
              )}
            </div>
          </div>

          <div style={S.infoRow}>
            {profile.education && <div style={S.infoItem}><div style={S.iconBox}>🎓</div>{profile.education}</div>}
            {profile.occupation && <div style={S.infoItem}><div style={S.iconBox}>💼</div>{profile.occupation}</div>}
            {profile.income && <div style={S.infoItem}><div style={S.iconBox}>💰</div>₹ {profile.income} LPA</div>}
            {profile.community && <div style={S.infoItem}><div style={S.iconBox}>🏷️</div>{myCommunity?.name || profile.community}</div>}
            {profile.marital_status && <div style={S.infoItem}><div style={S.iconBox}>💍</div>{profile.marital_status.replace(/_/g, " ")}</div>}
          </div>

          <div style={S.tabs}>
            {["about", "education", "family", "lifestyle", "preferences", "horoscope"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}
              >
                {t === "about" ? "About" :
                 t === "education" ? "Education & Career" :
                 t === "family" ? "Family Details" :
                 t === "lifestyle" ? "Lifestyle" :
                 t === "preferences" ? "Partner Preferences" : "Horoscope"}
              </button>
            ))}
          </div>

          {activeTab === "about" && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#8B0A2E", fontSize: "16px", marginBottom: "10px" }}>
                About {isOwnProfile ? "Me" : profile.name?.split(" ")[0] || "Them"}
              </h3>
              <p style={S.aboutText}>
                {profile.bio || "No description provided yet."}
              </p>
              <div style={S.tagsWrap}>
                {["Reading", "Music", "Family time", "Travel", "Cooking"].map((tag) => (
                  <span key={tag} style={S.interestTag}>{tag}</span>
                ))}
              </div>
            </>
          )}

          {activeTab !== "about" && (
            <p style={{ color: "#8a6b6b", fontSize: "13px", padding: "20px 0" }}>
              This section will show {activeTab} details once filled.
            </p>
          )}
        </div>

        <div style={S.quickInfo}>
          <h3 style={S.qiTitle}>Quick Info</h3>
          <div style={S.qiRow}><span style={S.qiLabel}>🎓 Education</span><span style={S.qiValue}>{profile.education || "—"}</span></div>
          <div style={S.qiRow}><span style={S.qiLabel}>💼 Occupation</span><span style={S.qiValue}>{profile.occupation || "—"}</span></div>
          <div style={S.qiRow}><span style={S.qiLabel}>💰 Income</span><span style={S.qiValue}>{profile.income ? `₹ ${profile.income} LPA` : "—"}</span></div>
          <div style={S.qiRow}><span style={S.qiLabel}>🏷️ Community</span><span style={S.qiValue}>{myCommunity?.name || profile.community || "—"}</span></div>
          <div style={S.qiRow}><span style={S.qiLabel}>📍 Location</span><span style={S.qiValue}>{profile.location || "—"}</span></div>
        </div>
      </div>

      {showReportModal && (
        <ReportModal reportedUserId={id} reportedUserName={profile.name} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  background: "#FFF9F5",
  boxSizing: "border-box",
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #f0e0e0",
  borderTop: "4px solid #8B0A2E",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

export default Profile;

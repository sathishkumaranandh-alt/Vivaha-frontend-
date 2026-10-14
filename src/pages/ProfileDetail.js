import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import BackButton from "../components/BackButton";
import { usePhotoAccess } from "../utils/usePhotoAccess";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shouldBlur, blurAmount, canRequestPhoto } = usePhotoAccess();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [matchPopup, setMatchPopup] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setUserId(user.id);

        const res = await fetch(
          `${BACKEND_URL}/profile/${id}?viewerId=${user.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile || null);
        } else {
          toast.error("Profile not found");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  const handleInterest = async () => {
    if (busy || !userId) return;
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/interests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: userId, receiver_id: id }),
      });
      if (res.ok) {
        try {
          const data = await res.json();
          if (data?.status === "accepted" || data?.matched === true) {
            setMatchPopup(profile);
          } else {
            toast.success("💌 Interest sent!");
          }
        } catch {
          toast.success("💌 Interest sent!");
        }
      } else {
        toast.error("Could not send interest");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const handleShortlist = async () => {
    if (busy || !userId) return;
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          shortlisted_user_id: id,
        }),
      });
      if (res.ok) toast.success("⭐ Added to shortlist");
      else toast.error("Could not shortlist");
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestPhoto = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/photo-requests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: id,
        }),
      });
      if (res.ok) toast.success("📸 Photo request sent!");
      else toast.error("Could not send request");
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <BackButton />
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={spinnerStyle} />
            <p style={{ color: "#8a6b6b", marginTop: "16px" }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <BackButton />
          <div style={emptyCardStyle}>
            <div style={{ fontSize: "60px" }}>😕</div>
            <h3 style={{ color: "#8B0A2E" }}>Profile not available</h3>
            <button onClick={() => navigate("/discover")} style={primaryBtnStyle}>
              Back to Discover
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔒 CHECK if photo should be blurred
  const locked = shouldBlur ? shouldBlur(profile) : false;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <BackButton fallback="/discover" />

        {/* HERO CARD with photo lock */}
        <div style={heroCardStyle}>
          <div style={photoAreaStyle}>
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                  filter: locked ? `blur(${blurAmount ? blurAmount() : "20px"})` : "none",
                  transform: locked ? "scale(1.1)" : "scale(1)",
                  transition: "filter 0.4s ease, transform 0.4s ease",
                }}
                draggable={false}
              />
            ) : (
              <div style={placeholderStyle}>👤</div>
            )}

            {/* 🔒 LOCK OVERLAY */}
            {locked && profile.photo_url && (
              <div style={lockOverlayStyle}>
                <div style={{ fontSize: "52px", marginBottom: "10px" }}>🔒</div>
                <h3 style={lockTitleStyle}>Photo Locked</h3>
                <p style={lockSubStyle}>Upgrade to view full photos</p>
                <button
                  onClick={() => navigate("/subscription")}
                  style={upgradeBtnStyle}
                >
                  ⭐ View Plans
                </button>
                {canRequestPhoto && canRequestPhoto() && (
                  <button onClick={handleRequestPhoto} style={requestBtnStyle}>
                    📸 Request Photo
                  </button>
                )}
              </div>
            )}

            <div style={gradientOverlayStyle} />

            <div style={badgeTopLeftStyle}>
              {profile.is_verified && (
                <span style={verifiedBadgeStyle}>✓ VERIFIED</span>
              )}
              {profile.is_boosted && (
                <span style={boostedBadgeStyle}>🚀 BOOSTED</span>
              )}
            </div>

            {profile.match_score && (
              <div style={scoreBadgeStyle}>
                💯 {Math.round(profile.match_score)}%
              </div>
            )}

            <div style={infoOverlayStyle}>
              <h1 style={nameStyle}>
                {profile.name || "Anonymous"}
                {profile.age ? <span style={ageStyle}>, {profile.age}</span> : null}
              </h1>
              <div style={metaRowStyle}>
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.occupation && <span>💼 {profile.occupation}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={buttonsRowStyle}>
          <button
            onClick={() => navigate(-1)}
            style={skipBtnStyle}
            aria-label="Back"
            title="Back"
          >
            ✕
          </button>
          <button
            onClick={handleInterest}
            disabled={busy}
            style={{ ...interestBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Send Interest"
            title="Send Interest"
          >
            💌
          </button>
          <button
            onClick={handleShortlist}
            disabled={busy}
            style={{ ...shortlistBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Shortlist"
            title="Shortlist"
          >
            ⭐
          </button>
        </div>

        {/* DETAILS SECTIONS */}
        <div style={detailsWrapStyle}>
          {profile.bio && (
            <DetailSection title="About">
              <p style={bioTextStyle}>"{profile.bio}"</p>
            </DetailSection>
          )}

          <DetailSection title="Basic Details">
            <DetailRow label="Age" value={profile.age ? `${profile.age} yrs` : null} />
            <DetailRow label="Gender" value={profile.gender} />
            <DetailRow label="Height" value={profile.height} />
            <DetailRow label="Marital Status" value={profile.marital_status} />
            <DetailRow label="Mother Tongue" value={profile.mother_tongue} />
            <DetailRow label="Community" value={profile.community} />
            <DetailRow label="Sub Caste" value={profile.sub_caste} />
          </DetailSection>

          <DetailSection title="Education & Career">
            <DetailRow label="Education" value={profile.education} />
            <DetailRow label="Occupation" value={profile.occupation} />
            {!locked && <DetailRow label="Annual Income" value={profile.income} />}
            <DetailRow label="Work Location" value={profile.work_location} />
          </DetailSection>

          <DetailSection title="Location">
            <DetailRow label="Location" value={profile.location} />
            <DetailRow label="Native Place" value={profile.native_place} />
            <DetailRow label="City" value={profile.city} />
            <DetailRow label="State" value={profile.state} />
            <DetailRow label="Country" value={profile.country} />
          </DetailSection>

          <DetailSection title="Family">
            <DetailRow label="Father" value={profile.father_name} />
            <DetailRow label="Mother" value={profile.mother_name} />
            <DetailRow label="Siblings" value={profile.siblings} />
            <DetailRow label="Family Type" value={profile.family_type} />
            <DetailRow label="Family Status" value={profile.family_status} />
          </DetailSection>

          {!locked && (profile.rashi || profile.nakshatram || profile.dosham) && (
            <DetailSection title="Horoscope">
              <DetailRow label="Rashi" value={profile.rashi} />
              <DetailRow label="Nakshatram" value={profile.nakshatram} />
              <DetailRow label="Dosham" value={profile.dosham} />
              <DetailRow label="Birth Time" value={profile.birth_time} />
              <DetailRow label="Birth Place" value={profile.birth_place} />
            </DetailSection>
          )}

          {profile.about_family && (
            <DetailSection title="About Family">
              <p style={bioTextStyle}>{profile.about_family}</p>
            </DetailSection>
          )}

          <Link to={`/messages?to=${profile.id}`} style={messageBtnStyle}>
            💬 Send Message
          </Link>
        </div>
      </div>

      {matchPopup && (
        <MatchPopup profile={matchPopup} onClose={() => setMatchPopup(null)} />
      )}
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function MatchPopup({ profile, onClose }) {
  const navigate = useNavigate();
  return (
    <div style={matchPopupBgStyle} onClick={onClose}>
      <div style={matchPopupCardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: "72px", marginBottom: "8px" }}>💕</div>
        <h2 style={matchPopupTitleStyle}>It's a Match!</h2>
        <p style={matchPopupSubStyle}>
          You and <strong>{profile.name}</strong> are interested!
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={() => navigate(`/messages?to=${profile.id}`)}
            style={{ ...matchBtnPrimaryStyle, flex: 1 }}
          >
            💬 Chat Now
          </button>
          <button onClick={onClose} style={matchBtnSecondaryStyle}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== STYLES ==================== */
const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #FFF9F5 0%, #FDF2F6 100%)",
  paddingBottom: "40px",
};

const containerStyle = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "16px",
};

const heroCardStyle = {
  position: "relative",
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: "24px",
  overflow: "hidden",
  background: "white",
  boxShadow: "0 20px 50px rgba(139,10,46,0.25)",
  marginBottom: "20px",
};

const photoAreaStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
};

const placeholderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  fontSize: "100px",
};

const gradientOverlayStyle = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.92) 100%)",
  pointerEvents: "none",
};

const badgeTopLeftStyle = {
  position: "absolute",
  top: "14px",
  left: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const verifiedBadgeStyle = {
  background: "linear-gradient(135deg, #10B981, #059669)",
  color: "white",
  fontSize: "10px",
  fontWeight: 800,
  padding: "4px 10px",
  borderRadius: "20px",
  letterSpacing: "0.5px",
  width: "fit-content",
};

const boostedBadgeStyle = {
  background: "linear-gradient(135deg, #D4A017, #b8860b)",
  color: "white",
  fontSize: "10px",
  fontWeight: 800,
  padding: "4px 10px",
  borderRadius: "20px",
  width: "fit-content",
};

const scoreBadgeStyle = {
  position: "absolute",
  top: "14px",
  right: "14px",
  background: "rgba(255,255,255,0.96)",
  color: "#8B0A2E",
  fontSize: "12px",
  fontWeight: 800,
  padding: "6px 12px",
  borderRadius: "20px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
};

const infoOverlayStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "24px 20px 20px",
  color: "white",
};

const nameStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "28px",
  fontWeight: 900,
  margin: "0 0 8px 0",
  textShadow: "0 3px 14px rgba(0,0,0,0.9)",
};

const ageStyle = {
  fontWeight: 500,
  fontSize: "18px",
  opacity: 0.9,
  fontStyle: "italic",
};

const metaRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  fontSize: "13px",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 500,
};

const buttonsRowStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "24px",
};

const skipBtnStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  border: "2px solid #fee2e2",
  background: "white",
  color: "#dc2626",
  fontSize: "22px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(220,38,38,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const interestBtnStyle = {
  width: "54px",
  height: "54px",
  borderRadius: "50%",
  border: "2px solid #fef3c7",
  background: "white",
  color: "#D4A017",
  fontSize: "22px",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(212,160,23,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const shortlistBtnStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  border: "2px solid #dcfce7",
  background: "linear-gradient(135deg, #16a34a, #15803d)",
  color: "white",
  fontSize: "22px",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(22,163,74,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const detailsWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const sectionStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "18px 18px 14px",
  border: "1px solid #f0e0e0",
  boxShadow: "0 4px 14px rgba(139,10,46,0.05)",
};

const sectionTitleStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "15px",
  fontWeight: 800,
  color: "#8B0A2E",
  margin: "0 0 10px 0",
  paddingBottom: "8px",
  borderBottom: "1px solid #f5e5e5",
};

const detailRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "7px 0",
  fontSize: "13px",
  gap: "12px",
};

const detailLabelStyle = {
  color: "#8a6b6b",
  fontWeight: 600,
  flexShrink: 0,
};

const detailValueStyle = {
  color: "#2D1B1B",
  fontWeight: 700,
  textAlign: "right",
  textTransform: "capitalize",
  wordBreak: "break-word",
};

const bioTextStyle = {
  fontSize: "13px",
  color: "#4b5563",
  lineHeight: 1.6,
  margin: 0,
  fontStyle: "italic",
};

const messageBtnStyle = {
  display: "block",
  textAlign: "center",
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  padding: "14px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 8px 20px rgba(139,10,46,0.3)",
  marginTop: "8px",
};

const emptyCardStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "60px 24px",
  textAlign: "center",
  border: "1px solid #f0e0e0",
};

const primaryBtnStyle = {
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "12px",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
  marginTop: "16px",
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

// 🔒 PHOTO LOCK STYLES
const lockOverlayStyle = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(3px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 8,
  padding: "20px",
  textAlign: "center",
};

const lockTitleStyle = {
  fontFamily: "'Playfair Display', serif",
  color: "white",
  fontSize: "20px",
  margin: "0 0 6px 0",
  fontWeight: 900,
};

const lockSubStyle = {
  color: "rgba(255,255,255,0.85)",
  fontSize: "13px",
  margin: "0 0 18px 0",
};

const upgradeBtnStyle = {
  background: "linear-gradient(135deg, #D4A017, #b8860b)",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 24px rgba(212,160,23,0.5)",
  marginBottom: "10px",
};

const requestBtnStyle = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(10px)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.3)",
  padding: "10px 20px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

// MATCH POPUP
const matchPopupBgStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(8px)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const matchPopupCardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "32px 24px",
  maxWidth: "360px",
  width: "100%",
  textAlign: "center",
  boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
};

const matchPopupTitleStyle = {
  fontFamily: "'Playfair Display', serif",
  color: "#8B0A2E",
  fontSize: "26px",
  margin: "0 0 8px 0",
  fontWeight: 900,
};

const matchPopupSubStyle = {
  color: "#8a6b6b",
  fontSize: "14px",
  marginBottom: "8px",
};

const matchBtnPrimaryStyle = {
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  border: "none",
  padding: "14px",
  borderRadius: "12px",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const matchBtnSecondaryStyle = {
  background: "white",
  color: "#374151",
  border: "1.5px solid #e5e7eb",
  padding: "14px 20px",
  borderRadius: "12px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default ProfileDetail;

import React, { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import BackButton from "../components/BackButton";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function getCardTheme() {
  const D = {
    cardRadius: "14",
    cardShadow: "40",
    photoBlur: "20",
    noPhotoBg: "#FDF2F6",
    noPhotoNameColor: "#8B0A2E",
    noPhotoBodyColor: "#5c3030",
    noPhotoIconOpacity: "0.16",
    nameColor: "#ffffff",
    bodyColor: "rgba(255,255,255,0.92)",
    mutedColor: "rgba(255,255,255,0.75)",
  };
  try {
    const raw = localStorage.getItem("vivaha_home_settings_v1");
    const c = raw ? JSON.parse(raw) : {};
    return {
      cardRadius: parseInt(c.card_radius || D.cardRadius),
      cardShadow: parseInt(c.card_shadow || D.cardShadow),
      photoBlur: parseInt(c.card_photo_blur || D.photoBlur),
      noPhotoBg: c.card_no_photo_bg || D.noPhotoBg,
      noPhotoNameColor: c.card_no_photo_name_color || D.noPhotoNameColor,
      noPhotoBodyColor: c.card_no_photo_body_color || D.noPhotoBodyColor,
      noPhotoIconOpacity: c.card_no_photo_icon_opacity || D.noPhotoIconOpacity,
      nameColor: c.card_name_color || D.nameColor,
      bodyColor: c.card_body_color || D.bodyColor,
      mutedColor: c.card_muted_color || D.mutedColor,
    };
  } catch {
    return D;
  }
}

function ProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = getCardTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [matchPopup, setMatchPopup] = useState(null);
  const [photoRequestSent, setPhotoRequestSent] = useState(false);

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
          if (data.profile?.contact_request_status === "pending") {
            setPhotoRequestSent(true);
          }
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
    if (!userId || !id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/photo-requests/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_id: userId,
          owner_id: id,
        }),
      });
      if (res.ok) {
        setPhotoRequestSent(true);
        toast.success("📩 Photo request sent!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Could not send request");
      }
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

  const {
    name,
    age,
    gender,
    location: userLocation,
    education,
    occupation,
    community,
    photo_url,
    is_verified,
    is_boosted,
    is_online,
    should_blur_photo,
    should_blur_photos,
    locked_by_paid_member,
    hidden_by_owner,
    owner_is_paid,
    match_score,
    mother_tongue,
    photo_count,
    height,
    company,
    bio,
    marital_status,
    sub_caste,
    income,
    work_location,
    native_place,
    city,
    state,
    country,
    father_name,
    mother_name,
    siblings,
    family_type,
    family_status,
    rashi,
    nakshatram,
    dosham,
    birth_time,
    birth_place,
    about_family,
  } = profile;

  const hasPhoto = !!photo_url;
  const nameTextColor = hasPhoto ? theme.nameColor : theme.noPhotoNameColor;

  // 🔑 Combine all sources
  const isPaidLock =
    location.state?.lockedByPaidFromNav === true ||
    locked_by_paid_member === true;

  const shouldBlur =
    location.state?.shouldBlurFromNav === true ||
    should_blur_photo === true ||
    should_blur_photos === true ||
    isPaidLock ||
    hidden_by_owner === true;

  const getScoreColor = (s) => {
    if (!s) return "#8a6b6b";
    if (s >= 80) return "#16a34a";
    if (s >= 60) return "#22c55e";
    if (s >= 40) return "#f59e0b";
    return "#dc2626";
  };
  const scoreColor = getScoreColor(match_score);
  const scorePercent = match_score ? Math.round(match_score) : 0;

  const shadowStrength = theme.cardShadow || 0;
  const boxShadow =
    shadowStrength === 0
      ? "none"
      : `0 ${Math.round(shadowStrength / 8)}px ${Math.round(
          shadowStrength / 3
        )}px -${Math.round(shadowStrength / 15)}px rgba(139,10,46,0.15)`;

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div style={containerStyle}>
        <BackButton fallback="/discover" />

        <div
          style={{
            ...heroCardStyle,
            borderRadius: `${theme.cardRadius}px`,
            boxShadow,
          }}
        >
          <div style={{ ...photoAreaStyle, background: theme.noPhotoBg }}>
            {hasPhoto && (
              <>
                <img
                  src={photo_url}
                  alt={name || "Profile"}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center 20%",
                    filter: shouldBlur
                      ? `blur(${theme.photoBlur}px)`
                      : "none",
                    transform: shouldBlur ? "scale(1.1)" : "scale(1)",
                    transition: "filter 0.4s ease, transform 0.4s ease",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                  draggable={false}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: shouldBlur
                      ? "linear-gradient(180deg, rgba(15,3,8,0.55) 0%, rgba(15,3,8,0.45) 40%, rgba(15,3,8,0.85) 75%, rgba(15,3,8,0.98) 100%)"
                      : "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 55%, rgba(15,3,8,0.6) 78%, rgba(15,3,8,0.96) 100%)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
              </>
            )}

            {!hasPhoto && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: "14%",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-40px",
                    right: "-40px",
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(212,160,23,0.22), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-50px",
                    left: "-50px",
                    width: "160px",
                    height: "160px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(139,10,46,0.15), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    fontSize: "76px",
                    opacity: parseFloat(theme.noPhotoIconOpacity) || 0.16,
                    filter: "blur(1px)",
                    userSelect: "none",
                    lineHeight: 1,
                    marginBottom: "4px",
                  }}
                >
                  {gender === "male" ? "👨" : gender === "female" ? "👩" : "👤"}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(139,10,46,0.12)",
                    color: "#8B0A2E",
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: "10px",
                    letterSpacing: "0.6px",
                  }}
                >
                  📷 No photo yet
                </div>
              </div>
            )}

            <div style={badgeTopLeftStyle}>
              {is_boosted && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #D4A017, #b8860b)",
                    color: "white",
                    fontSize: "8px",
                    fontWeight: 800,
                    padding: "4px 9px",
                    borderRadius: "4px",
                    letterSpacing: "0.9px",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    width: "fit-content",
                  }}
                >
                  <span style={{ fontSize: "9px" }}>★</span> PAID
                </div>
              )}
              {is_verified && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    color: "white",
                    fontSize: "8px",
                    fontWeight: 800,
                    padding: "4px 9px",
                    borderRadius: "4px",
                    letterSpacing: "0.9px",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    width: "fit-content",
                  }}
                >
                  <span style={{ fontSize: "9px" }}>✓</span> VERIFIED
                </div>
              )}
              {owner_is_paid && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    color: "white",
                    fontSize: "8px",
                    fontWeight: 800,
                    padding: "4px 9px",
                    borderRadius: "4px",
                    letterSpacing: "0.9px",
                    width: "fit-content",
                  }}
                >
                  👑 MEMBER
                </div>
              )}
            </div>

            <div style={badgeTopRightStyle}>
              {is_online && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#16a34a",
                    fontSize: "7.5px",
                    fontWeight: 800,
                    padding: "3px 7px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    letterSpacing: "0.6px",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(22,163,74,0.2)",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "#16a34a",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  LIVE
                </div>
              )}
              {match_score && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.97)",
                    color: scoreColor,
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "3px 7px",
                    borderRadius: "10px",
                    border: `1px solid ${scoreColor}55`,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: scoreColor,
                      boxShadow: `0 0 4px ${scoreColor}`,
                    }}
                  />
                  {scorePercent}%
                </div>
              )}
            </div>

            {hasPhoto && shouldBlur && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  zIndex: 2,
                  padding: "0 20px",
                }}
              >
                {hidden_by_owner ? (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.98)",
                      color: "#2D1B1B",
                      fontSize: "13px",
                      fontWeight: 700,
                      padding: "9px 18px",
                      borderRadius: "24px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                    }}
                  >
                    🚫 Profile hidden
                  </div>
                ) : isPaidLock ? (
                  <>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.98)",
                        color: "#2D1B1B",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "9px 18px",
                        borderRadius: "24px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                      }}
                    >
                      🔒 Upgrade to view
                    </div>
                    <button
                      onClick={() => navigate("/subscription")}
                      style={{
                        background: "linear-gradient(135deg, #D4A017, #b8860b)",
                        color: "white",
                        border: "none",
                        padding: "9px 18px",
                        borderRadius: "24px",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        boxShadow: "0 6px 20px rgba(212,160,23,0.6)",
                      }}
                    >
                      ⭐ View Plans
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.98)",
                        color: "#2D1B1B",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "9px 18px",
                        borderRadius: "24px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                      }}
                    >
                      🔒 Photo is protected
                    </div>
                    {photoRequestSent ? (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.95)",
                          color: "#D4A017",
                          fontSize: "12px",
                          fontWeight: 800,
                          padding: "9px 18px",
                          borderRadius: "24px",
                          boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                        }}
                      >
                        ⏳ Request pending
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestPhoto}
                        style={{
                          background: "linear-gradient(135deg, #D4A017, #b8860b)",
                          color: "white",
                          border: "none",
                          padding: "9px 18px",
                          borderRadius: "24px",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          boxShadow: "0 6px 20px rgba(212,160,23,0.6)",
                        }}
                      >
                        ✉️ Request to View
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {hasPhoto && photo_count > 1 && (
              <div
                style={{
                  position: "absolute",
                  top:
                    is_boosted && is_verified
                      ? "62px"
                      : is_boosted || is_verified
                      ? "40px"
                      : "10px",
                  left: "10px",
                  background: "rgba(0,0,0,0.55)",
                  color: "white",
                  fontSize: "8px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  zIndex: 4,
                  backdropFilter: "blur(8px)",
                }}
              >
                📷 {photo_count}
              </div>
            )}

            <div style={infoOverlayStyle}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: nameTextColor,
                  textShadow: hasPhoto
                    ? "0 2px 10px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.5)"
                    : "none",
                  marginBottom: "4px",
                  lineHeight: 1.1,
                }}
              >
                {name || "Anonymous"}
                {age ? (
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: "18px",
                      opacity: 0.9,
                      marginLeft: "4px",
                      fontStyle: "italic",
                    }}
                  >
                    , {age}
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "5px",
                  alignItems: "center",
                  marginTop: "6px",
                }}
              >
                {userLocation && (
                  <span
                    style={{
                      background: hasPhoto
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(139,10,46,0.1)",
                      color: hasPhoto ? "white" : "#8B0A2E",
                      padding: "3px 10px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: 700,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    📍 {userLocation}
                  </span>
                )}
                {occupation && (
                  <span
                    style={{
                      background: hasPhoto
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(139,10,46,0.1)",
                      color: hasPhoto ? "white" : "#8B0A2E",
                      padding: "3px 10px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: 700,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    💼 {occupation}
                  </span>
                )}
                {community && (
                  <span
                    style={{
                      background: hasPhoto
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(139,10,46,0.1)",
                      color: hasPhoto ? "white" : "#8B0A2E",
                      padding: "3px 10px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    🏷️ {community}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={buttonsRowStyle}>
          <button
            onClick={() => navigate(-1)}
            style={skipBtnStyle}
            aria-label="Back"
          >
            ✕
          </button>
          <button
            onClick={handleInterest}
            disabled={busy}
            style={{ ...interestBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Send Interest"
          >
            💌
          </button>
          <button
            onClick={handleShortlist}
            disabled={busy}
            style={{ ...shortlistBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Shortlist"
          >
            ⭐
          </button>
        </div>

        <div style={detailsWrapStyle}>
          {bio && (
            <DetailSection title="About">
              <p style={bioTextStyle}>"{bio}"</p>
            </DetailSection>
          )}

          <DetailSection title="Basic Details">
            <DetailRow label="Age" value={age ? `${age} yrs` : null} />
            <DetailRow label="Gender" value={gender} />
            <DetailRow label="Height" value={height} />
            <DetailRow label="Marital Status" value={marital_status} />
            <DetailRow label="Mother Tongue" value={mother_tongue} />
            <DetailRow label="Community" value={community} />
            <DetailRow label="Sub Caste" value={sub_caste} />
          </DetailSection>

          <DetailSection title="Education & Career">
            <DetailRow label="Education" value={education} />
            <DetailRow label="Occupation" value={occupation} />
            <DetailRow label="Company" value={company} />
            <DetailRow label="Annual Income" value={income} />
            <DetailRow label="Work Location" value={work_location} />
          </DetailSection>

          <DetailSection title="Location">
            <DetailRow label="Location" value={userLocation} />
            <DetailRow label="Native Place" value={native_place} />
            <DetailRow label="City" value={city} />
            <DetailRow label="State" value={state} />
            <DetailRow label="Country" value={country} />
          </DetailSection>

          <DetailSection title="Family">
            <DetailRow label="Father" value={father_name} />
            <DetailRow label="Mother" value={mother_name} />
            <DetailRow label="Siblings" value={siblings} />
            <DetailRow label="Family Type" value={family_type} />
            <DetailRow label="Family Status" value={family_status} />
          </DetailSection>

          {(rashi || nakshatram || dosham) && (
            <DetailSection title="Horoscope">
              <DetailRow label="Rashi" value={rashi} />
              <DetailRow label="Nakshatram" value={nakshatram} />
              <DetailRow label="Dosham" value={dosham} />
              <DetailRow label="Birth Time" value={birth_time} />
              <DetailRow label="Birth Place" value={birth_place} />
            </DetailSection>
          )}

          {about_family && (
            <DetailSection title="About Family">
              <p style={bioTextStyle}>{about_family}</p>
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
  overflow: "hidden",
  background: "white",
  marginBottom: "20px",
};

const photoAreaStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
};

const badgeTopLeftStyle = {
  position: "absolute",
  top: "10px",
  left: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  zIndex: 5,
};

const badgeTopRightStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "6px",
  zIndex: 5,
};

const infoOverlayStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "24px 20px 20px",
  zIndex: 3,
  pointerEvents: "none",
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

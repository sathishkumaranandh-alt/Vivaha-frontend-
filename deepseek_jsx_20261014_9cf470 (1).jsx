import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;

function getCardTheme() {
  const D = {
    photoBlur: "20",
    noPhotoBg: "#FDF2F6",
    noPhotoIconOpacity: "0.16",
    nameColor: "#ffffff",
    bodyColor: "rgba(255,255,255,0.92)",
  };
  try {
    const raw = localStorage.getItem("vivaha_home_settings_v1");
    const c = raw ? JSON.parse(raw) : {};
    return {
      photoBlur: parseInt(c.card_photo_blur || D.photoBlur),
      noPhotoBg: c.card_no_photo_bg || D.noPhotoBg,
      noPhotoIconOpacity: c.card_no_photo_icon_opacity || D.noPhotoIconOpacity,
      nameColor: c.card_name_color || D.nameColor,
      bodyColor: c.card_body_color || D.bodyColor,
    };
  } catch {
    return D;
  }
}

function SwipeableProfileCards({
  profiles = [],
  onLike,
  onSkip,
  onSuperLike,
  busy = false,
}) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exiting, setExiting] = useState(null);
  const [photoRequestStatus, setPhotoRequestStatus] = useState({});
  const touchStartRef = useRef({ x: 0, y: 0 });

  const remaining = profiles.slice(currentIndex);
  const topCard = remaining[0];
  const nextCard = remaining[1];

  useEffect(() => {
    if (currentIndex >= profiles.length) setCurrentIndex(0);
  }, [profiles, currentIndex]);

  const handleAction = (action) => {
    if (!topCard) return;
    const id = topCard.id;
    setExiting({ dir: action, id });
    setTimeout(() => {
      setExiting(null);
      setCurrentIndex((i) => i + 1);
      if (action === "like" && onLike) onLike(topCard);
      else if (action === "skip" && onSkip) onSkip(topCard);
      else if (action === "superlike" && onSuperLike) onSuperLike(topCard);
    }, 320);
  };

  const handleRequestPhoto = async (profile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch(`${BACKEND_URL}/photo-requests/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_id: user.id,
          owner_id: profile.id,
        }),
      });
      if (res.ok) {
        setPhotoRequestStatus((prev) => ({ ...prev, [profile.id]: "pending" }));
      }
    } catch (err) {
      console.error("Photo request error:", err);
    }
  };

  // 🔑 Go to FULL profile page
  const goToProfile = (card) => {
    if (!card) return;
    navigate(`/profile/${card.id}`);
  };

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };
  const handleTouchMove = (e) => {
    if (!drag.active) return;
    const t = e.touches[0];
    setDrag({
      x: t.clientX - touchStartRef.current.x,
      y: t.clientY - touchStartRef.current.y,
      active: true,
    });
  };
  const handleTouchEnd = () => {
    if (!drag.active) return;
    const { x, y } = drag;
    setDrag({ x: 0, y: 0, active: false });

    if (Math.abs(x) < 8 && Math.abs(y) < 8) {
      goToProfile(topCard);
      return;
    }

    if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) handleAction("superlike");
    else if (x > SWIPE_THRESHOLD) handleAction("like");
    else if (x < -SWIPE_THRESHOLD) handleAction("skip");
  };

  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };

  useEffect(() => {
    if (!drag.active) return;
    const move = (e) => {
      setDrag({
        x: e.clientX - touchStartRef.current.x,
        y: e.clientY - touchStartRef.current.y,
        active: true,
      });
    };
    const up = () => {
      const { x, y } = drag;
      setDrag({ x: 0, y: 0, active: false });

      if (Math.abs(x) < 8 && Math.abs(y) < 8) {
        goToProfile(topCard);
        return;
      }

      if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) handleAction("superlike");
      else if (x > SWIPE_THRESHOLD) handleAction("like");
      else if (x < -SWIPE_THRESHOLD) handleAction("skip");
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, topCard]);

  if (!topCard) {
    return (
      <div style={emptyStyle}>
        <div style={{ fontSize: "56px" }}>🌹</div>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#8B0A2E",
            margin: "10px 0 6px",
          }}
        >
          All caught up!
        </h3>
        <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
          No more profiles to swipe right now.
        </p>
      </div>
    );
  }

  const rotation = drag.x * ROTATION_FACTOR;
  const showLike = drag.x > 50;
  const showSkip = drag.x < -50;
  const showSuper = drag.y < -50 && Math.abs(drag.y) > Math.abs(drag.x);

  let exitTransform = "";
  if (exiting) {
    if (exiting.dir === "like") exitTransform = "translateX(120%) rotate(20deg)";
    else if (exiting.dir === "skip")
      exitTransform = "translateX(-120%) rotate(-20deg)";
    else if (exiting.dir === "superlike")
      exitTransform = "translateY(-120%) scale(1.1)";
  }

  return (
    <div style={containerStyle}>
      <div style={progressRow}>
        <span style={progressText}>
          {currentIndex + 1} / {profiles.length} profiles
        </span>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "340px",
          aspectRatio: "3 / 4",
          margin: "0 auto",
        }}
      >
        {nextCard && (
          <div style={behindCardStyle}>
            <CardVisual
              profile={nextCard}
              photoRequestStatus={photoRequestStatus}
              onRequestPhoto={handleRequestPhoto}
            />
          </div>
        )}

        <div
          key={topCard.id}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{
            ...topCardStyle,
            transform: exiting
              ? exitTransform
              : `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
            opacity: exiting ? 0 : 1,
            transition: drag.active
              ? "none"
              : "transform 0.35s ease, opacity 0.35s ease",
            cursor: drag.active ? "grabbing" : "pointer",
          }}
        >
          {showLike && (
            <div style={{ ...overlayStyle, borderColor: "#16a34a" }}>
              <div
                style={{
                  ...badgeBase,
                  color: "#16a34a",
                  borderColor: "#16a34a",
                  transform: "rotate(-15deg)",
                }}
              >
                LIKE
              </div>
            </div>
          )}
          {showSkip && (
            <div style={{ ...overlayStyle, borderColor: "#dc2626" }}>
              <div
                style={{
                  ...badgeBase,
                  color: "#dc2626",
                  borderColor: "#dc2626",
                  transform: "rotate(15deg)",
                }}
              >
                SKIP
              </div>
            </div>
          )}
          {showSuper && (
            <div style={{ ...overlayStyle, borderColor: "#D4A017" }}>
              <div
                style={{
                  ...badgeBase,
                  color: "#D4A017",
                  borderColor: "#D4A017",
                }}
              >
                ⭐ SUPER
              </div>
            </div>
          )}
          <CardVisual
            profile={topCard}
            photoRequestStatus={photoRequestStatus}
            onRequestPhoto={handleRequestPhoto}
          />
        </div>
      </div>

      <div style={buttonsRow}>
        <button
          onClick={() => handleAction("skip")}
          disabled={busy}
          style={skipBtn}
          aria-label="Skip"
        >
          ✕
        </button>
        <button
          onClick={() => handleAction("superlike")}
          disabled={busy}
          style={superBtn}
          aria-label="Super Like"
        >
          ⭐
        </button>
        <button
          onClick={() => handleAction("like")}
          disabled={busy}
          style={likeBtn}
          aria-label="Like"
        >
          ♥
        </button>
      </div>

      <div style={hintText}>
        👆 Tap to view full profile · 👈 Left to skip · 👉 Right to like · ☝️ Up to super like
      </div>
    </div>
  );
}

// ============================================================
// CARD VISUAL
// ============================================================
function CardVisual({ profile, photoRequestStatus, onRequestPhoto }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const theme = getCardTheme();

  if (!profile) return null;

  const {
    name,
    age,
    gender,
    location: userLocation,
    community,
    photo_url,
    is_verified,
    is_boosted,
    should_blur_photo,
    should_blur_photos,
    locked_by_paid_member,
    hidden_by_owner,
    owner_is_paid,
    photo_count,
  } = profile;

  const hasPhoto = !!photo_url;
  const isBlur = should_blur_photo === true || should_blur_photos === true;
  const isPaidLock = locked_by_paid_member === true;
  const isHidden = hidden_by_owner === true;

  const reqStatus = photoRequestStatus && photoRequestStatus[profile.id];

  const nameTextColor = hasPhoto ? theme.nameColor : "#8B0A2E";

  return (
    <div style={photoWrapStyle}>
      {hasPhoto && (
        <>
          <img
            src={photo_url}
            alt={name}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              filter: isBlur ? `blur(${theme.photoBlur}px)` : "none",
              transform: isBlur ? "scale(1.1)" : "scale(1)",
              transition:
                "opacity 0.5s ease, filter 0.4s ease, transform 0.4s ease",
              pointerEvents: "none",
            }}
            draggable={false}
          />
          <div
            style={{
              ...gradientStyle,
              background: isBlur
                ? "linear-gradient(180deg, rgba(15,3,8,0.55) 0%, rgba(15,3,8,0.45) 40%, rgba(15,3,8,0.85) 75%, rgba(15,3,8,0.98) 100%)"
                : "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 55%, rgba(15,3,8,0.6) 78%, rgba(15,3,8,0.96) 100%)",
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
            background: theme.noPhotoBg,
          }}
        >
          <div
            style={{
              fontSize: "76px",
              opacity: parseFloat(theme.noPhotoIconOpacity) || 0.16,
              filter: "blur(1px)",
              userSelect: "none",
            }}
          >
            {gender === "male" ? "👨" : gender === "female" ? "👩" : "👤"}
          </div>
          <div
            style={{
              marginTop: "8px",
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(139,10,46,0.12)",
              color: "#8B0A2E",
              fontSize: "10px",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: "10px",
            }}
          >
            📷 No photo yet
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          zIndex: 5,
        }}
      >
        {is_verified && <div style={verifiedBadge}>✓ VERIFIED</div>}
        {is_boosted && <div style={boostedBadge}>★ PAID</div>}
        {owner_is_paid && (
          <div
            style={{
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              color: "white",
              fontSize: "9px",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: "20px",
              width: "fit-content",
            }}
          >
            👑 MEMBER
          </div>
        )}
      </div>

      {hasPhoto && photo_count > 1 && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(0,0,0,0.55)",
            color: "white",
            fontSize: "9px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            zIndex: 5,
          }}
        >
          📷 {photo_count}
        </div>
      )}

      {hasPhoto && isBlur && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            zIndex: 6,
            padding: "0 20px",
          }}
        >
          {isHidden ? (
            <div style={lockPillStyle}>🚫 Profile hidden</div>
          ) : isPaidLock ? (
            <>
              <div style={lockPillStyle}>🔒 Upgrade to view</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.location.href = "/subscription";
                }}
                style={lockBtnStyle}
              >
                ⭐ View Plans
              </button>
            </>
          ) : (
            <>
              <div style={lockPillStyle}>🔒 Photo is protected</div>
              {reqStatus === "pending" ? (
                <div
                  style={{
                    ...lockPillStyle,
                    color: "#D4A017",
                  }}
                >
                  ⏳ Request pending
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onRequestPhoto) onRequestPhoto(profile);
                  }}
                  style={lockBtnStyle}
                >
                  ✉️ Request to View
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div style={infoOverlayStyle}>
        <h2
          style={{
            ...nameStyle,
            color: nameTextColor,
          }}
        >
          {name || "Anonymous"}
          {age && <span style={ageStyle}>, {age}</span>}
        </h2>
        <div style={metaRowStyle}>
          {userLocation && <span>📍 {userLocation}</span>}
          {community && (
            <span style={{ textTransform: "capitalize" }}>
              🏷️ {community}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== STYLES ==================== */
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "6px 0",
};

const progressRow = {
  width: "100%",
  maxWidth: "340px",
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "10px",
};
const progressText = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#8a6b6b",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

const behindCardStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "22px",
  overflow: "hidden",
  background: "white",
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  transform: "scale(0.94) translateY(10px)",
  opacity: 0.55,
  pointerEvents: "none",
};

const topCardStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "22px",
  overflow: "hidden",
  background: "white",
  boxShadow: "0 20px 50px rgba(139,10,46,0.25)",
  userSelect: "none",
  touchAction: "pan-y",
  willChange: "transform",
};

const photoWrapStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
};

const gradientStyle = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

const verifiedBadge = {
  background: "linear-gradient(135deg, #10B981, #059669)",
  color: "white",
  fontSize: "9px",
  fontWeight: 800,
  padding: "4px 10px",
  borderRadius: "20px",
  letterSpacing: "0.5px",
  boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
  width: "fit-content",
};

const boostedBadge = {
  background: "linear-gradient(135deg, #D4A017, #b8860b)",
  color: "white",
  fontSize: "9px",
  fontWeight: 800,
  padding: "4px 10px",
  borderRadius: "20px",
  boxShadow: "0 4px 14px rgba(212,160,23,0.4)",
  width: "fit-content",
};

const infoOverlayStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "20px 18px 18px",
  color: "white",
  pointerEvents: "none",
  zIndex: 3,
};

const nameStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "26px",
  fontWeight: 900,
  margin: "0 0 6px 0",
  textShadow: "0 3px 14px rgba(0,0,0,0.9)",
  letterSpacing: "-0.5px",
};

const ageStyle = {
  fontWeight: 500,
  fontSize: "16px",
  opacity: 0.9,
  fontStyle: "italic",
  marginLeft: "4px",
};

const metaRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  fontSize: "13px",
  color: "rgba(255,255,255,0.92)",
  textShadow: "0 2px 8px rgba(0,0,0,0.9)",
  fontWeight: 500,
};

const lockPillStyle = {
  background: "rgba(255,255,255,0.98)",
  color: "#2D1B1B",
  fontSize: "13px",
  fontWeight: 700,
  padding: "9px 18px",
  borderRadius: "24px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
  textAlign: "center",
};

const lockBtnStyle = {
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
};

const overlayStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
  pointerEvents: "none",
};

const badgeBase = {
  fontSize: "30px",
  fontWeight: 900,
  border: "5px solid",
  padding: "12px 24px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.95)",
  letterSpacing: "2px",
};

const buttonsRow = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "20px",
  marginBottom: "14px",
};

const skipBtn = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  border: "2px solid #fee2e2",
  background: "white",
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(220,38,38,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const superBtn = {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  border: "2px solid #fef3c7",
  background: "white",
  color: "#D4A017",
  fontSize: "20px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(212,160,23,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const likeBtn = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  border: "2px solid #dcfce7",
  background: "linear-gradient(135deg, #16a34a, #15803d)",
  color: "white",
  fontSize: "26px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(22,163,74,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const hintText = {
  fontSize: "11px",
  color: "#8a6b6b",
  textAlign: "center",
  fontStyle: "italic",
  maxWidth: "320px",
  lineHeight: 1.5,
};

const emptyStyle = {
  textAlign: "center",
  padding: "50px 20px",
  background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
  borderRadius: "20px",
  border: "1.5px dashed #f0d0da",
};

export default SwipeableProfileCards;
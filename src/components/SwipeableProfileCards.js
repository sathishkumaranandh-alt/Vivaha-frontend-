import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;

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
    if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) handleAction("superlike");
    else if (x > SWIPE_THRESHOLD) handleAction("like");
    else if (x < -SWIPE_THRESHOLD) handleAction("skip");
  };

  const handleMouseDown = (e) => {
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
  }, [drag]);

  if (!topCard) {
    return (
      <div style={emptyStyle}>
        <div style={{ fontSize: "56px" }}>🌹</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#8B0A2E", margin: "10px 0 6px" }}>
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
    else if (exiting.dir === "skip") exitTransform = "translateX(-120%) rotate(-20deg)";
    else if (exiting.dir === "superlike") exitTransform = "translateY(-120%) scale(1.1)";
  }

  return (
    <div style={containerStyle}>
      <div style={progressRow}>
        <span style={progressText}>
          {currentIndex + 1} / {profiles.length} profiles
        </span>
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: "340px", aspectRatio: "3 / 4", margin: "0 auto" }}>
        {nextCard && (
          <div style={behindCardStyle}>
            <CardVisual profile={nextCard} />
          </div>
        )}

        <div
          key={topCard.id}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={() => !drag.active && navigate(`/profile/${topCard.id}`)}
          style={{
            ...topCardStyle,
            transform: exiting
              ? exitTransform
              : `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
            opacity: exiting ? 0 : 1,
            transition: drag.active ? "none" : "transform 0.35s ease, opacity 0.35s ease",
            cursor: drag.active ? "grabbing" : "grab",
          }}
        >
          {showLike && (
            <div style={{ ...overlayStyle, borderColor: "#16a34a" }}>
              <div style={{ ...badgeBase, color: "#16a34a", borderColor: "#16a34a", transform: "rotate(-15deg)" }}>
                LIKE
              </div>
            </div>
          )}
          {showSkip && (
            <div style={{ ...overlayStyle, borderColor: "#dc2626" }}>
              <div style={{ ...badgeBase, color: "#dc2626", borderColor: "#dc2626", transform: "rotate(15deg)" }}>
                SKIP
              </div>
            </div>
          )}
          {showSuper && (
            <div style={{ ...overlayStyle, borderColor: "#D4A017" }}>
              <div style={{ ...badgeBase, color: "#D4A017", borderColor: "#D4A017" }}>
                ⭐ SUPER
              </div>
            </div>
          )}
          <CardVisual profile={topCard} />
        </div>
      </div>

      <div style={buttonsRow}>
        <button onClick={() => handleAction("skip")} disabled={busy} style={skipBtn} aria-label="Skip">✕</button>
        <button onClick={() => handleAction("superlike")} disabled={busy} style={superBtn} aria-label="Super Like">⭐</button>
        <button onClick={() => handleAction("like")} disabled={busy} style={likeBtn} aria-label="Like">♥</button>
      </div>

      <div style={hintText}>
        👈 Swipe left to skip · Swipe right to like · Swipe up to super like
      </div>
    </div>
  );
}

function CardVisual({ profile }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  if (!profile) return null;
  return (
    <div style={photoWrapStyle}>
      {profile.photo_url ? (
        <img
          src={profile.photo_url}
          alt={profile.name}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.5s ease",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      ) : (
        <div style={placeholderStyle}>👤</div>
      )}
      <div style={gradientStyle} />
      {profile.is_verified && <div style={verifiedBadge}>✓ VERIFIED</div>}
      {profile.is_boosted && <div style={boostBadge}>⚡ BOOSTED</div>}
      <div style={infoOverlayStyle}>
        <h2 style={nameStyle}>
          {profile.name || "Anonymous"}
          {profile.age && <span style={ageStyle}>, {profile.age}</span>}
        </h2>
        <div style={metaRowStyle}>
          {profile.location && <span>📍 {profile.location}</span>}
          {profile.community && (
            <span style={{ textTransform: "capitalize" }}>🏷️ {profile.community}</span>
          )}
        </div>
        {profile.bio && (
          <p style={bioStyle}>
            "{profile.bio.length > 100 ? profile.bio.slice(0, 100) + "..." : profile.bio}"
          </p>
        )}
      </div>
    </div>
  );
}

/* ==================== STYLES ==================== */
const containerStyle = { display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0" };

const progressRow = { width: "100%", maxWidth: "340px", display: "flex", justifyContent: "flex-end", marginBottom: "10px" };
const progressText = { fontSize: "11px", fontWeight: 700, color: "#8a6b6b", letterSpacing: "0.5px", textTransform: "uppercase" };

const behindCardStyle = {
  position: "absolute", inset: 0, borderRadius: "22px", overflow: "hidden",
  background: "white", boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  transform: "scale(0.94) translateY(10px)", opacity: 0.55, pointerEvents: "none",
};

const topCardStyle = {
  position: "absolute", inset: 0, borderRadius: "22px", overflow: "hidden",
  background: "white", boxShadow: "0 20px 50px rgba(139,10,46,0.25)",
  userSelect: "none", touchAction: "pan-y", willChange: "transform",
};

const photoWrapStyle = {
  position: "relative", width: "100%", height: "100%",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
};

const placeholderStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  height: "100%", fontSize: "80px",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
};

const gradientStyle = {
  position: "absolute", inset: 0,
  background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
  pointerEvents: "none",
};

const verifiedBadge = {
  position: "absolute", top: "14px", left: "14px",
  background: "linear-gradient(135deg, #10B981, #059669)",
  color: "white", fontSize: "10px", fontWeight: 800,
  padding: "5px 10px", borderRadius: "20px", letterSpacing: "0.5px",
  boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
};

const boostBadge = {
  position: "absolute", top: "14px", right: "14px",
  background: "linear-gradient(135deg, #D4A017, #b8860b)",
  color: "white", fontSize: "10px", fontWeight: 800,
  padding: "5px 10px", borderRadius: "20px",
  boxShadow: "0 4px 14px rgba(212,160,23,0.4)",
};

const infoOverlayStyle = { position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 18px 18px", color: "white", pointerEvents: "none" };

const nameStyle = {
  fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 900,
  margin: "0 0 6px 0", textShadow: "0 3px 14px rgba(0,0,0,0.9)", letterSpacing: "-0.5px",
};
const ageStyle = { fontWeight: 500, fontSize: "16px", opacity: 0.9, fontStyle: "italic", marginLeft: "4px" };

const metaRowStyle = {
  display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "13px",
  color: "rgba(255,255,255,0.92)", textShadow: "0 2px 8px rgba(0,0,0,0.9)",
  marginBottom: "10px", fontWeight: 500,
};

const bioStyle = {
  fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: 0,
  fontStyle: "italic", lineHeight: 1.5, textShadow: "0 2px 8px rgba(0,0,0,0.9)",
};

const overlayStyle = { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" };

const badgeBase = {
  fontSize: "30px", fontWeight: 900, border: "5px solid",
  padding: "12px 24px", borderRadius: "16px",
  background: "rgba(255,255,255,0.95)", letterSpacing: "2px",
};

const buttonsRow = { display: "flex", gap: "20px", alignItems: "center", justifyContent: "center", marginTop: "20px", marginBottom: "14px" };

const skipBtn = {
  width: "60px", height: "60px", borderRadius: "50%",
  border: "2px solid #fee2e2", background: "white", color: "#dc2626",
  fontSize: "24px", fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(220,38,38,0.15)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const superBtn = {
  width: "50px", height: "50px", borderRadius: "50%",
  border: "2px solid #fef3c7", background: "white", color: "#D4A017",
  fontSize: "20px", fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(212,160,23,0.15)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const likeBtn = {
  width: "60px", height: "60px", borderRadius: "50%",
  border: "2px solid #dcfce7",
  background: "linear-gradient(135deg, #16a34a, #15803d)",
  color: "white", fontSize: "26px", fontWeight: 900,
  cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(22,163,74,0.3)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const hintText = {
  fontSize: "11px", color: "#8a6b6b", textAlign: "center",
  fontStyle: "italic", maxWidth: "320px", lineHeight: 1.5,
};

const emptyStyle = {
  textAlign: "center", padding: "50px 20px",
  background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
  borderRadius: "20px", border: "1.5px dashed #f0d0da",
};

export default SwipeableProfileCards;

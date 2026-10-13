import React, { useState, useRef, useEffect } from "react";


const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;

function SwipeableInterestCards({
  interests,
  onAccept,
  onDecline,
  onSuperLike,
  fromPath,
  busy,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]); // for undo
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exiting, setExiting] = useState(null); // { dir: 'left'|'right'|'up', id }
  const cardRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const remaining = interests.slice(currentIndex);
  const topCard = remaining[0];
  const nextCard = remaining[1];

  // Reset index when interests change (after accept/decline)
  useEffect(() => {
    if (currentIndex >= interests.length) {
      setCurrentIndex(0);
    }
  }, [interests, currentIndex]);

  // ============================================
  // SWIPE HANDLERS
  // ============================================
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };

  const handleTouchMove = (e) => {
    if (!drag.active) return;
    const t = e.touches[0];
    const x = t.clientX - touchStartRef.current.x;
    const y = t.clientY - touchStartRef.current.y;
    setDrag({ x, y, active: true });
  };

  const handleTouchEnd = () => {
    if (!drag.active) return;
    const { x, y } = drag;
    setDrag({ x: 0, y: 0, active: false });

    if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) {
      // Swipe UP
      handleAction("superlike");
    } else if (x > SWIPE_THRESHOLD) {
      // Swipe RIGHT
      handleAction("accept");
    } else if (x < -SWIPE_THRESHOLD) {
      // Swipe LEFT
      handleAction("decline");
    }
  };

  // Mouse drag (desktop)
  const handleMouseDown = (e) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };

  useEffect(() => {
    if (!drag.active) return;

    const handleMouseMove = (e) => {
      const x = e.clientX - touchStartRef.current.x;
      const y = e.clientY - touchStartRef.current.y;
      setDrag({ x, y, active: true });
    };

    const handleMouseUp = () => {
      const { x, y } = drag;
      setDrag({ x: 0, y: 0, active: false });

      if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) {
        handleAction("superlike");
      } else if (x > SWIPE_THRESHOLD) {
        handleAction("accept");
      } else if (x < -SWIPE_THRESHOLD) {
        handleAction("decline");
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  // ============================================
  // ACTION HANDLER
  // ============================================
  const handleAction = (action) => {
    if (!topCard) return;
    const id = topCard.id;

    // Save history for undo
    setHistory((prev) => [...prev, { id, index: currentIndex, action }]);
    setExiting({ dir: action, id });

    setTimeout(() => {
      setExiting(null);
      setCurrentIndex((i) => i + 1);

      if (action === "accept") onAccept(topCard);
      else if (action === "decline") onDecline(topCard);
      else if (action === "superlike" && onSuperLike) onSuperLike(topCard);
    }, 320);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);
  };

  // ============================================
  // RENDER
  // ============================================
  if (!topCard) {
    return (
      <div style={doneContainerStyle}>
        <div style={{ fontSize: "64px", marginBottom: "12px" }}>🎉</div>
        <h3
          style={{
            color: "#8B0A2E",
            fontFamily: "'Playfair Display', serif",
            margin: "0 0 8px 0",
          }}
        >
          All caught up!
        </h3>
        <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
          No more pending interests to review.
        </p>
        {history.length > 0 && (
          <button onClick={handleUndo} style={undoBtnStyle}>
            ↺ Undo Last
          </button>
        )}
      </div>
    );
  }

  // Rotation and transform based on drag
  const rotation = drag.x * ROTATION_FACTOR;
  const opacity = 1 - Math.min(Math.abs(drag.x) / 400, 0.4);

  // Overlay hints
  const showAccept = drag.x > 50;
  const showDecline = drag.x < -50;
  const showSuper = drag.y < -50 && Math.abs(drag.y) > Math.abs(drag.x);

  // Card is exiting
  let exitTransform = "";
  let exitOpacity = 1;
  if (exiting) {
    if (exiting.dir === "accept")
      exitTransform = "translateX(120%) rotate(20deg)";
    else if (exiting.dir === "decline")
      exitTransform = "translateX(-120%) rotate(-20deg)";
    else if (exiting.dir === "superlike")
      exitTransform = "translateY(-120%) scale(1.1)";
    exitOpacity = 0;
  }

  return (
    <div style={containerStyle}>
      {/* PROGRESS */}
      <div style={progressBarStyle}>
        <span style={progressTextStyle}>
          {currentIndex + 1} / {interests.length} pending
        </span>
        {history.length > 0 && (
          <button onClick={handleUndo} style={undoSmallBtnStyle}>
            ↺ Undo
          </button>
        )}
      </div>

      {/* CARD STACK */}
      <div style={stackStyle}>
        {/* NEXT CARD (behind) */}
        {nextCard && (
          <div style={nextCardStyle}>
            <CardContent profile={nextCard.sender} isBehind />
          </div>
        )}

        {/* TOP CARD */}
        <div
          key={topCard.id}
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{
            ...topCardStyle,
            transform: exiting
              ? exitTransform
              : `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
            opacity: exiting ? exitOpacity : opacity,
            transition: drag.active ? "none" : "transform 0.35s ease, opacity 0.35s ease",
            cursor: drag.active ? "grabbing" : "grab",
          }}
        >
          {/* ACCEPT OVERLAY */}
          {showAccept && (
            <div style={{ ...overlayStyle, borderColor: "#16a34a" }}>
              <div
                style={{
                  color: "#16a34a",
                  fontSize: "32px",
                  fontWeight: 900,
                  transform: "rotate(-15deg)",
                  border: "5px solid #16a34a",
                  padding: "12px 24px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.95)",
                  letterSpacing: "2px",
                }}
              >
                ACCEPT
              </div>
            </div>
          )}

          {/* DECLINE OVERLAY */}
          {showDecline && (
            <div style={{ ...overlayStyle, borderColor: "#dc2626" }}>
              <div
                style={{
                  color: "#dc2626",
                  fontSize: "32px",
                  fontWeight: 900,
                  transform: "rotate(15deg)",
                  border: "5px solid #dc2626",
                  padding: "12px 24px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.95)",
                  letterSpacing: "2px",
                }}
              >
                SKIP
              </div>
            </div>
          )}

          {/* SUPER LIKE OVERLAY */}
          {showSuper && (
            <div style={{ ...overlayStyle, borderColor: "#D4A017" }}>
              <div
                style={{
                  color: "#D4A017",
                  fontSize: "28px",
                  fontWeight: 900,
                  border: "5px solid #D4A017",
                  padding: "12px 24px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.95)",
                  letterSpacing: "2px",
                }}
              >
                ⭐ SUPER
              </div>
            </div>
          )}

          <CardContent profile={topCard.sender} fromPath={fromPath} />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={buttonsRowStyle}>
        <button
          onClick={() => handleAction("decline")}
          disabled={busy}
          style={declineActionBtnStyle}
          aria-label="Decline"
        >
          ✕
        </button>
        <button
          onClick={() => handleAction("superlike")}
          disabled={busy}
          style={superActionBtnStyle}
          aria-label="Super Like"
        >
          ⭐
        </button>
        <button
          onClick={() => handleAction("accept")}
          disabled={busy}
          style={acceptActionBtnStyle}
          aria-label="Accept"
        >
          ✓
        </button>
      </div>

      {/* HINT */}
      <div style={hintStyle}>
        👈 Swipe left to decline · Swipe right to accept · Swipe up to super like
      </div>
    </div>
  );
}

// ============================================================
// CARD CONTENT
// ============================================================
function CardContent({ profile, isBehind, fromPath }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!profile) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#888",
        }}
      >
        User deleted
      </div>
    );
  }

  return (
    <>
      {/* PHOTO */}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              fontSize: "80px",
              background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
            }}
          >
            👤
          </div>
        )}

        {/* GRADIENT OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* VERIFIED BADGE */}
        {profile.is_verified && (
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "white",
              fontSize: "10px",
              fontWeight: 800,
              padding: "5px 10px",
              borderRadius: "20px",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
            }}
          >
            ✓ VERIFIED
          </div>
        )}

        {/* INFO OVERLAY */}
        <div style={infoOverlayStyle}>
          <h2 style={nameStyle}>
            {profile.name || "Anonymous"}
            {profile.age && (
              <span style={ageStyle}>, {profile.age}</span>
            )}
          </h2>

          <div style={metaRowStyle}>
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.community && (
              <span style={{ textTransform: "capitalize" }}>
                🏷️ {profile.community}
              </span>
            )}
          </div>

          {profile.bio && (
            <p style={bioStyle}>
              "{profile.bio.length > 100 ? profile.bio.slice(0, 100) + "..." : profile.bio}"
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// STYLES
// ============================================================
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "10px 0",
};

const progressBarStyle = {
  width: "100%",
  maxWidth: "360px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
};

const progressTextStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#8a6b6b",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

const undoSmallBtnStyle = {
  background: "#f3f4f6",
  color: "#374151",
  border: "none",
  padding: "6px 12px",
  borderRadius: "8px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const stackStyle = {
  position: "relative",
  width: "100%",
  maxWidth: "360px",
  aspectRatio: "3 / 4",
  marginBottom: "20px",
};

const nextCardStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "24px",
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
  borderRadius: "24px",
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

const infoOverlayStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "20px 18px 18px",
  color: "white",
  pointerEvents: "none",
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
  marginBottom: "10px",
  fontWeight: 500,
};

const bioStyle = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.85)",
  margin: 0,
  fontStyle: "italic",
  lineHeight: 1.5,
  textShadow: "0 2px 8px rgba(0,0,0,0.9)",
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

const buttonsRowStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const declineActionBtnStyle = {
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
  transition: "transform 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const superActionBtnStyle = {
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
  transition: "transform 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const acceptActionBtnStyle = {
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
  transition: "transform 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const hintStyle = {
  fontSize: "11px",
  color: "#8a6b6b",
  textAlign: "center",
  fontStyle: "italic",
  maxWidth: "320px",
  lineHeight: 1.5,
};

const doneContainerStyle = {
  textAlign: "center",
  padding: "60px 20px",
  background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
  borderRadius: "20px",
  border: "1.5px dashed #f0d0da",
};

const undoBtnStyle = {
  marginTop: "20px",
  background: "white",
  color: "#8B0A2E",
  border: "1.5px solid #8B0A2E",
  padding: "10px 20px",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default SwipeableInterestCards;

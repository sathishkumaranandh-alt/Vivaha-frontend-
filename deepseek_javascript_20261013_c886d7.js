import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import BackButton from "../components/BackButton";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;

function Discover() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exiting, setExiting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [matchPopup, setMatchPopup] = useState(null);

  const touchStartRef = useRef({ x: 0, y: 0 });

  // ============================================
  // LOAD PROFILES
  // ============================================
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
          `${BACKEND_URL}/profile/recommendations/${user.id}`
        );
        if (res.ok) {
          const data = await res.json();
          let list = data.recommendations || [];
          list = list.sort(() => Math.random() - 0.5);
          setProfiles(list);
        }
      } catch (err) {
        console.error("Load error:", err);
        toast.error("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const remaining = profiles.slice(currentIndex);
  const topCard = remaining[0];
  const nextCard = remaining[1];

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

    if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) {
      handleAction("interest");
    } else if (x > SWIPE_THRESHOLD) {
      handleAction("shortlist");
    } else if (x < -SWIPE_THRESHOLD) {
      handleAction("skip");
    }
  };

  // Mouse drag
  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };

  useEffect(() => {
    if (!drag.active) return;

    const handleMouseMove = (e) => {
      setDrag({
        x: e.clientX - touchStartRef.current.x,
        y: e.clientY - touchStartRef.current.y,
        active: true,
      });
    };

    const handleMouseUp = () => {
      const { x, y } = drag;
      setDrag({ x: 0, y: 0, active: false });

      if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) {
        handleAction("interest");
      } else if (x > SWIPE_THRESHOLD) {
        handleAction("shortlist");
      } else if (x < -SWIPE_THRESHOLD) {
        handleAction("skip");
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
  // ACTION
  // ============================================
  const handleAction = async (action) => {
    if (!topCard || busy) return;

    const id = topCard.id;
    setBusy(true);
    setHistory((prev) => [...prev, { id, index: currentIndex, action }]);
    setExiting({ dir: action, id });

    setTimeout(async () => {
      setExiting(null);
      setCurrentIndex((i) => i + 1);

      try {
        if (action === "shortlist") {
          await fetch(`${BACKEND_URL}/interests/shortlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              shortlisted_user_id: id,
            }),
          });
          toast.success("⭐ Added to shortlist");
        } else if (action === "interest") {
          const res = await fetch(`${BACKEND_URL}/interests/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender_id: userId,
              receiver_id: id,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.status === "accepted" || data.matched) {
              setMatchPopup(topCard);
            } else {
              toast.success("💌 Interest sent!");
            }
          } else {
            toast.error("Could not send interest");
          }
        }
      } catch (err) {
        console.error("Action error:", err);
      } finally {
        setBusy(false);
      }
    }, 320);
  };

  // ============================================
  // UNDO
  // ============================================
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);
    toast.info("Undone");
  };

  // ============================================
  // RELOAD
  // ============================================
  const handleReload = async () => {
    setLoading(true);
    setCurrentIndex(0);
    setHistory([]);
    try {
      const res = await fetch(
        `${BACKEND_URL}/profile/recommendations/${userId}`
      );
      if (res.ok) {
        const data = await res.json();
        let list = (data.recommendations || []).sort(
          () => Math.random() - 0.5
        );
        setProfiles(list);
      }
    } catch {}
    setLoading(false);
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <BackButton />
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={spinnerStyle} />
            <p style={{ color: "#8a6b6b", marginTop: "16px" }}>
              Loading profiles...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!topCard) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <BackButton />
          <div style={doneCardStyle}>
            <div style={{ fontSize: "72px", marginBottom: "12px" }}>🎉</div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#8B0A2E",
                margin: "0 0 8px 0",
              }}
            >
              All caught up!
            </h2>
            <p style={{ color: "#8a6b6b", fontSize: "14px", marginBottom: 24 }}>
              You've reviewed all profiles. Check back later for new matches.
            </p>
            <button onClick={handleReload} style={primaryBtnStyle}>
              🔄 Reload Profiles
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rotation = drag.x * ROTATION_FACTOR;
  const opacity = 1 - Math.min(Math.abs(drag.x) / 500, 0.35);

  const showShortlist =
    drag.x > 50 && Math.abs(drag.x) > Math.abs(drag.y);
  const showSkip = drag.x < -50 && Math.abs(drag.x) > Math.abs(drag.y);
  const showInterest = drag.y < -50 && Math.abs(drag.y) > Math.abs(drag.x);

  let exitTransform = "";
  let exitOpacity = 1;
  if (exiting) {
    if (exiting.dir === "shortlist")
      exitTransform = "translateX(130%) rotate(25deg)";
    else if (exiting.dir === "skip")
      exitTransform = "translateX(-130%) rotate(-25deg)";
    else if (exiting.dir === "interest")
      exitTransform = "translateY(-130%) scale(1.1)";
    exitOpacity = 0;
  }

  const progress = ((currentIndex + 1) / profiles.length) * 100;

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .discover-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .discover-btn:active {
          transform: scale(0.92);
        }
      `}</style>

      <div style={containerStyle}>
        {/* HEADER */}
        <div style={headerBarStyle}>
          <BackButton fallback="/dashboard" />
          <div style={headerTextStyle}>
            <h1 style={headerTitleStyle}>🔥 Discover</h1>
            <p style={headerSubStyle}>
              Swipe to find your perfect match
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={progressWrapStyle}>
          <div style={progressBgStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${progress}%`,
              }}
            />
          </div>
          <div style={progressLabelStyle}>
            <span>
              {currentIndex + 1} / {profiles.length}
            </span>
            {history.length > 0 && (
              <button onClick={handleUndo} style={undoBtnStyle}>
                ↺ Undo
              </button>
            )}
          </div>
        </div>

        {/* CARD STACK */}
        <div style={stackWrapStyle}>
          {nextCard && (
            <div style={nextCardWrapStyle}>
              <CardContent profile={nextCard} fromPath="/discover" />
            </div>
          )}

          <div
            key={topCard.id}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            style={{
              ...topCardWrapStyle,
              transform: exiting
                ? exitTransform
                : `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
              opacity: exiting ? exitOpacity : opacity,
              transition: drag.active
                ? "none"
                : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease",
              cursor: drag.active ? "grabbing" : "grab",
            }}
          >
            {showShortlist && (
              <div style={{ ...overlayStyle, borderColor: "#16a34a" }}>
                <div
                  style={{
                    ...overlayBadgeStyle,
                    borderColor: "#16a34a",
                    color: "#16a34a",
                    transform: "rotate(-18deg)",
                  }}
                >
                  ⭐ SHORTLIST
                </div>
              </div>
            )}
            {showSkip && (
              <div style={{ ...overlayStyle, borderColor: "#dc2626" }}>
                <div
                  style={{
                    ...overlayBadgeStyle,
                    borderColor: "#dc2626",
                    color: "#dc2626",
                    transform: "rotate(18deg)",
                  }}
                >
                  ✕ SKIP
                </div>
              </div>
            )}
            {showInterest && (
              <div style={{ ...overlayStyle, borderColor: "#D4A017" }}>
                <div
                  style={{
                    ...overlayBadgeStyle,
                    borderColor: "#D4A017",
                    color: "#D4A017",
                  }}
                >
                  💌 INTEREST
                </div>
              </div>
            )}

            <CardContent profile={topCard} fromPath="/discover" />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={buttonsRowStyle}>
          <button
            onClick={() => handleAction("skip")}
            disabled={busy}
            className="discover-btn"
            style={{ ...skipBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Skip"
            title="Skip"
          >
            ✕
          </button>
          <button
            onClick={() => handleAction("interest")}
            disabled={busy}
            className="discover-btn"
            style={{ ...interestBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Send Interest"
            title="Send Interest"
          >
            💌
          </button>
          <button
            onClick={() => handleAction("shortlist")}
            disabled={busy}
            className="discover-btn"
            style={{ ...shortlistBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Shortlist"
            title="Shortlist"
          >
            ⭐
          </button>
        </div>

        {/* HINT */}
        <div style={hintStyle}>
          👈 Swipe left to skip · 👉 Right to shortlist · ☝️ Up to send interest
        </div>
      </div>

      {/* MATCH POPUP */}
      {matchPopup && (
        <MatchPopup
          profile={matchPopup}
          userId={userId}
          onClose={() => setMatchPopup(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// CARD CONTENT
// ============================================================
function CardContent({ profile, fromPath }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!profile) {
    return (
      <div
        style={{
          ...photoAreaStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={cardInnerStyle}>
      {/* PHOTO */}
      <div style={photoAreaStyle}>
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
              userSelect: "none",
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
              fontSize: "100px",
              background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
            }}
          >
            👤
          </div>
        )}

        {/* Gradient */}
        <div style={gradientOverlayStyle} />

        {/* Badges */}
        <div style={badgeTopLeftStyle}>
          {profile.is_verified && (
            <span style={verifiedBadgeStyle}>✓ VERIFIED</span>
          )}
          {profile.is_boosted && (
            <span style={boostedBadgeStyle}>🚀 BOOSTED</span>
          )}
        </div>

        {/* Match score */}
        {profile.match_score && (
          <div style={scoreBadgeStyle}>
            💯 {Math.round(profile.match_score)}%
          </div>
        )}

        {/* Info */}
        <div style={infoOverlayStyle}>
          <h2 style={nameStyle}>
            {profile.name || "Anonymous"}
            {profile.age ? <span style={ageStyle}>, {profile.age}</span> : null}
          </h2>

          <div style={metaRowStyle}>
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.occupation && <span>💼 {profile.occupation}</span>}
            {profile.education && <span>🎓 {profile.education}</span>}
          </div>

          {profile.bio && (
            <p style={bioStyle}>
              "{profile.bio.length <= 120
                ? profile.bio
                : profile.bio.slice(0, 120) + "..."}"
            </p>
          )}

          <div style={tagsRowStyle}>
            {profile.community && (
              <span style={tagStyle}>🏷️ {profile.community}</span>
            )}
            {profile.mother_tongue && (
              <span style={tagStyle}>🗣️ {profile.mother_tongue}</span>
            )}
            {profile.marital_status && (
              <span style={tagStyle}>💍 {profile.marital_status}</span>
            )}
          </div>
        </div>
      </div>

      {/* View full profile button */}
      <Link
        to={`/profile/${profile.id}`}
        state={{ from: fromPath }}
        onClick={(e) => e.stopPropagation()}
        style={viewProfileBtnStyle}
      >
        👁️ View
      </Link>
    </div>
  );
}

// ============================================================
// MATCH POPUP
// ============================================================
function MatchPopup({ profile, userId, onClose }) {
  return (
    <div style={matchPopupBgStyle} onClick={onClose}>
      <div style={matchPopupCardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: "72px", marginBottom: "8px" }}>💕</div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#8B0A2E",
            fontSize: "28px",
            margin: "0 0 8px 0",
            fontWeight: 900,
          }}
        >
          It's a Match!
        </h2>
        <p style={{ color: "#8a6b6b", fontSize: "14px", marginBottom: "24px" }}>
          You and <strong>{profile.name}</strong> are interested in each other!
        </p>

        <div style={matchPhotoRowStyle}>
          <div style={matchPhotoWrapStyle}>
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
          <div style={{ fontSize: "32px" }}>💕</div>
          <div
            style={{
              ...matchPhotoWrapStyle,
              background: "linear-gradient(135deg, #8B0A2E, #a01438)",
              color: "white",
              fontSize: "32px",
            }}
          >
            You
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <Link
            to={`/messages?to=${profile.id}`}
            style={{
              ...matchBtnPrimaryStyle,
              flex: 1,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            💬 Chat Now
          </Link>
          <button onClick={onClose} style={matchBtnSecondaryStyle}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
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

const headerBarStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "20px",
};

const headerTextStyle = { flex: 1 };

const headerTitleStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "22px",
  fontWeight: 900,
  color: "#8B0A2E",
  margin: 0,
  lineHeight: 1.1,
};

const headerSubStyle = {
  color: "#8a6b6b",
  fontSize: "12px",
  margin: "2px 0 0 0",
  fontWeight: 500,
};

const progressWrapStyle = { marginBottom: "16px" };

const progressBgStyle = {
  height: "4px",
  background: "rgba(139,10,46,0.1)",
  borderRadius: "4px",
  overflow: "hidden",
  marginBottom: "8px",
};

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #8B0A2E, #D4A017)",
  transition: "width 0.4s ease",
  borderRadius: "4px",
};

const progressLabelStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "11px",
  color: "#8a6b6b",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const undoBtnStyle = {
  background: "#f3f4f6",
  color: "#374151",
  border: "none",
  padding: "5px 12px",
  borderRadius: "8px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const stackWrapStyle = {
  position: "relative",
  width: "100%",
  aspectRatio: "3 / 4.2",
  marginBottom: "24px",
  maxHeight: "620px",
};

const nextCardWrapStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "24px",
  overflow: "hidden",
  background: "white",
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  transform: "scale(0.94) translateY(10px)",
  opacity: 0.5,
  pointerEvents: "none",
};

const topCardWrapStyle = {
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

const cardInnerStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
};

const photoAreaStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
};

const gradientOverlayStyle = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.92) 100%)",
  pointerEvents: "none",
};

const badgeTopLeftStyle = {
  position: "absolute",
  top: "14px",
  left: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  zIndex: 5,
};

const verifiedBadgeStyle = {
  background: "linear-gradient(135deg, #10B981, #059669)",
  color: "white",
  fontSize: "10px",
  fontWeight: 800,
  padding: "4px 10px",
  borderRadius: "20px",
  letterSpacing: "0.5px",
  boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
  width: "fit-content",
};

const boostedBadgeStyle = {
  background: "linear-gradient(135deg, #D4A017, #b8860b)",
  color: "white",
  fontSize: "10px",
  fontWeight: 800,
  padding: "4px 10px",
  borderRadius: "20px",
  letterSpacing: "0.5px",
  boxShadow: "0 4px 14px rgba(212,160,23,0.4)",
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
  backdropFilter: "blur(8px)",
  zIndex: 5,
};

const infoOverlayStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "24px 20px 20px",
  color: "white",
  zIndex: 3,
  pointerEvents: "none",
};

const nameStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "28px",
  fontWeight: 900,
  margin: "0 0 8px 0",
  textShadow: "0 3px 14px rgba(0,0,0,0.9)",
  letterSpacing: "-0.5px",
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
  textShadow: "0 2px 8px rgba(0,0,0,0.9)",
  marginBottom: "10px",
  fontWeight: 500,
};

const bioStyle = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.88)",
  margin: "0 0 12px 0",
  fontStyle: "italic",
  lineHeight: 1.5,
  textShadow: "0 2px 8px rgba(0,0,0,0.9)",
};

const tagsRowStyle = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const tagStyle = {
  background: "rgba(255,255,255,0.2)",
  backdropFilter: "blur(8px)",
  color: "white",
  fontSize: "10px",
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.3)",
  textTransform: "capitalize",
};

const viewProfileBtnStyle = {
  position: "absolute",
  bottom: "20px",
  right: "20px",
  background: "rgba(255,255,255,0.95)",
  color: "#8B0A2E",
  fontSize: "12px",
  fontWeight: 800,
  padding: "8px 14px",
  borderRadius: "20px",
  textDecoration: "none",
  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
  zIndex: 6,
  pointerEvents: "auto",
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

const overlayBadgeStyle = {
  fontSize: "28px",
  fontWeight: 900,
  border: "5px solid",
  padding: "10px 22px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.95)",
  letterSpacing: "2px",
};

const buttonsRowStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "20px",
};

const skipBtnStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  border: "2px solid #fee2e2",
  background: "white",
  color: "#dc2626",
  fontSize: "26px",
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
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  border: "2px solid #dcfce7",
  background: "linear-gradient(135deg, #16a34a, #15803d)",
  color: "white",
  fontSize: "24px",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 20px rgba(22,163,74,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const hintStyle = {
  fontSize: "11px",
  color: "#8a6b6b",
  textAlign: "center",
  fontStyle: "italic",
  lineHeight: 1.5,
};

const doneCardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "60px 24px",
  textAlign: "center",
  boxShadow: "0 10px 40px rgba(139,10,46,0.08)",
  border: "1.5px dashed #f0d0da",
};

const primaryBtnStyle = {
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  border: "none",
  padding: "14px 28px",
  borderRadius: "12px",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 24px rgba(139,10,46,0.3)",
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

// Match popup
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
  animation: "fadeIn 0.3s ease",
};

const matchPopupCardStyle = {
  background: "white",
  borderRadius: "28px",
  padding: "32px 24px",
  maxWidth: "380px",
  width: "100%",
  textAlign: "center",
  boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
  animation: "popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
};

const matchPhotoRowStyle = {
  display: "flex",
  gap: "16px",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "8px",
};

const matchPhotoWrapStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  overflow: "hidden",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "3px solid white",
  boxShadow: "0 8px 24px rgba(139,10,46,0.2)",
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
  boxShadow: "0 8px 20px rgba(139,10,46,0.3)",
  display: "inline-block",
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

export default Discover;
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import BackButton from "../components/BackButton";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;
const TAP_THRESHOLD = 8;

// ============================================
// Same theme reader as ProfileCard.js
// ============================================
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
    showLocation: true,
    showEducation: true,
    showOccupation: true,
    showHeight: true,
    showCommunity: true,
    showMotherTongue: true,
    showContact: true,
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
      showLocation: c.card_show_location !== "false",
      showEducation: c.card_show_education !== "false",
      showOccupation: c.card_show_occupation !== "false",
      showHeight: c.card_show_height !== "false",
      showCommunity: c.card_show_community !== "false",
      showMotherTongue: c.card_show_mother_tongue !== "false",
      showContact: c.card_show_contact !== "false",
    };
  } catch {
    return D;
  }
}

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
  // 🔧 FETCH PROFILES — now uses /profile/search
  // (same as Home page → returns should_blur_photo)
  // ============================================
  const fetchProfiles = async (uid, myProfile) => {
    let list = [];

    // Try opposite gender first
    if (myProfile) {
      const myGender = (myProfile.gender || "").toLowerCase();
      const opposite = myGender === "male" ? "female" : "male";
      try {
        const res = await fetch(
          `${BACKEND_URL}/profile/search?gender=${opposite}&viewerId=${uid}`
        );
        if (res.ok) {
          const data = await res.json();
          list = (data.results || []).filter((p) => p.id !== uid);
          console.log("📥 Search (gender) count:", list.length);
        }
      } catch (e) {
        console.error("Search error:", e);
      }
    }

    // Fallback: all profiles
    if (list.length === 0) {
      try {
        const res = await fetch(
          `${BACKEND_URL}/profile/search?viewerId=${uid}`
        );
        if (res.ok) {
          const data = await res.json();
          list = (data.results || []).filter((p) => p.id !== uid);
          console.log("📥 Search (all) count:", list.length);
        }
      } catch (e) {
        console.error("All profiles error:", e);
      }
    }

    return list.sort(() => Math.random() - 0.5);
  };

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

        let myProfile = null;
        try {
          const myRes = await fetch(
            `${BACKEND_URL}/profile/${user.id}?viewerId=${user.id}`
          );
          if (myRes.ok) {
            const myData = await myRes.json();
            myProfile = myData.profile;
          }
        } catch {}

        const list = await fetchProfiles(user.id, myProfile);
        setProfiles(list);
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

    if (Math.abs(x) < TAP_THRESHOLD && Math.abs(y) < TAP_THRESHOLD) {
      if (topCard) navigate(`/match/${topCard.id}`);
      return;
    }

    if (Math.abs(y) > Math.abs(x) && y < -SWIPE_THRESHOLD) {
      handleAction("interest");
    } else if (x > SWIPE_THRESHOLD) {
      handleAction("shortlist");
    } else if (x < -SWIPE_THRESHOLD) {
      handleAction("skip");
    }
  };

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

      if (Math.abs(x) < TAP_THRESHOLD && Math.abs(y) < TAP_THRESHOLD) {
        if (topCard) navigate(`/match/${topCard.id}`);
        return;
      }

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
  }, [drag, topCard]);

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
            try {
              const data = await res.json();
              if (data?.status === "accepted" || data?.matched === true) {
                setMatchPopup(topCard);
              } else {
                toast.success("💌 Interest sent!");
              }
            } catch {
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

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);
    toast.info("Undone");
  };

  const handleReload = async () => {
    if (!userId) return;
    setLoading(true);
    setCurrentIndex(0);
    setHistory([]);
    try {
      let myProfile = null;
      try {
        const myRes = await fetch(
          `${BACKEND_URL}/profile/${userId}?viewerId=${userId}`
        );
        if (myRes.ok) {
          const myData = await myRes.json();
          myProfile = myData.profile;
        }
      } catch {}

      const list = await fetchProfiles(userId, myProfile);
      setProfiles(list);
    } catch (err) {
      console.error("Reload error:", err);
    }
    setLoading(false);
  };

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

  const showShortlist = drag.x > 50 && Math.abs(drag.x) > Math.abs(drag.y);
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .discover-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .discover-btn:active { transform: scale(0.92); }
      `}</style>

      <div style={containerStyle}>
        <div style={headerBarStyle}>
          <BackButton fallback="/dashboard" />
          <div style={headerTextStyle}>
            <h1 style={headerTitleStyle}>🔥 Discover</h1>
            <p style={headerSubStyle}>Tap to view · Swipe to match</p>
          </div>
        </div>

        <div style={progressWrapStyle}>
          <div style={progressBgStyle}>
            <div style={{ ...progressFillStyle, width: `${progress}%` }} />
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

        <div style={stackWrapStyle}>
          {nextCard && (
            <div style={nextCardWrapStyle}>
              <CardContent profile={nextCard} />
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
              cursor: drag.active ? "grabbing" : "pointer",
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

            <CardContent profile={topCard} />
          </div>
        </div>

        <div style={buttonsRowStyle}>
          <button
            onClick={() => handleAction("skip")}
            disabled={busy}
            className="discover-btn"
            style={{ ...skipBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Skip"
          >
            ✕
          </button>
          <button
            onClick={() => handleAction("interest")}
            disabled={busy}
            className="discover-btn"
            style={{ ...interestBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Send Interest"
          >
            💌
          </button>
          <button
            onClick={() => handleAction("shortlist")}
            disabled={busy}
            className="discover-btn"
            style={{ ...shortlistBtnStyle, opacity: busy ? 0.5 : 1 }}
            aria-label="Shortlist"
          >
            ⭐
          </button>
        </div>

        <div style={hintStyle}>
          👆 Tap card to view full profile · 👈 Swipe to skip · 👉 To shortlist · ☝️ Up to interest
        </div>
      </div>

      {matchPopup && (
        <MatchPopup
          profile={matchPopup}
          onClose={() => setMatchPopup(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// CARD CONTENT — same rules as ProfileCard.js
// ============================================================
function CardContent({ profile }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const theme = getCardTheme();

  if (!profile) {
    return <div style={photoAreaStyle} />;
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
    should_blur_photo,
    contact_masked,
    contact_locked_reason,
    match_score,
    mother_tongue,
    photo_count,
    height,
    company,
    is_online,
  } = profile;

  const hasPhoto = !!photo_url;
  const nameTextColor = hasPhoto ? theme.nameColor : theme.noPhotoNameColor;
  const bodyTextColor = hasPhoto ? theme.bodyColor : theme.noPhotoBodyColor;

  const detailRows = [];
  if (theme.showLocation && userLocation)
    detailRows.push({ icon: "📍", text: userLocation });
  if (theme.showEducation && education)
    detailRows.push({ icon: "🎓", text: education });
  if (theme.showOccupation && occupation)
    detailRows.push({
      icon: "💼",
      text: company ? `${occupation} · ${company}` : occupation,
    });
  if (theme.showHeight && height)
    detailRows.push({ icon: "📏", text: height });

  const getScoreColor = (s) => {
    if (!s) return "#8a6b6b";
    if (s >= 80) return "#16a34a";
    if (s >= 60) return "#22c55e";
    if (s >= 40) return "#f59e0b";
    return "#dc2626";
  };
  const scoreColor = getScoreColor(match_score);
  const scorePercent = match_score ? Math.round(match_score) : 0;

  return (
    <div style={cardInnerStyle}>
      <div style={{ ...photoAreaStyle, background: theme.noPhotoBg }}>
        {hasPhoto && (
          <>
            <img
              src={photo_url}
              alt={name || "Profile"}
              onLoad={() => setImgLoaded(true)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 20%",
                filter: should_blur_photo
                  ? `blur(${theme.photoBlur}px)`
                  : "none",
                transform: should_blur_photo ? "scale(1.1)" : "scale(1)",
                transition: "filter 0.4s ease, transform 0.4s ease, opacity 0.4s",
                opacity: imgLoaded ? 1 : 0,
                pointerEvents: "none",
                userSelect: "none",
              }}
              draggable={false}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: should_blur_photo
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
                boxShadow:
                  "0 3px 10px rgba(212,160,23,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
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
                boxShadow:
                  "0 3px 10px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                width: "fit-content",
              }}
            >
              <span style={{ fontSize: "9px" }}>✓</span> VERIFIED
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

        {hasPhoto && should_blur_photo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: "38%",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.98)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  boxShadow:
                    "0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
                  border: "1.5px solid rgba(212,160,23,0.6)",
                }}
              >
                🔒
              </div>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  color: "white",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}
              >
                Tap to unlock
              </div>
            </div>
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

          {detailRows.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                marginBottom: "8px",
              }}
            >
              {detailRows.slice(0, 2).map((row, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "13px",
                    color: bodyTextColor,
                    textShadow: hasPhoto
                      ? "0 1px 3px rgba(0,0,0,0.7)"
                      : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 500,
                  }}
                >
                  <span>{row.icon}</span>
                  <span>{row.text}</span>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              alignItems: "center",
            }}
          >
            {theme.showCommunity && community && (
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
                  border: hasPhoto
                    ? "1px solid rgba(255,255,255,0.25)"
                    : "1px solid rgba(139,10,46,0.2)",
                  backdropFilter: "blur(8px)",
                }}
              >
                🏷️ {community}
              </span>
            )}
            {theme.showMotherTongue && mother_tongue && (
              <span
                style={{
                  background: hasPhoto
                    ? "rgba(139,92,246,0.4)"
                    : "rgba(139,92,246,0.15)",
                  color: hasPhoto ? "white" : "#6B21A8",
                  padding: "3px 10px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: 700,
                  border: hasPhoto
                    ? "1px solid rgba(139,92,246,0.5)"
                    : "1px solid rgba(139,92,246,0.25)",
                  backdropFilter: "blur(8px)",
                }}
              >
                🗣️ {mother_tongue}
              </span>
            )}
            {theme.showContact &&
              contact_masked &&
              contact_locked_reason === "owner_privacy" && (
                <span
                  style={{
                    background: hasPhoto
                      ? "rgba(0,0,0,0.4)"
                      : "rgba(0,0,0,0.08)",
                    color: hasPhoto ? "white" : "#4b5563",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: 600,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  🔒 Contact
                </span>
              )}
            {theme.showContact &&
              contact_masked &&
              contact_locked_reason !== "owner_privacy" && (
                <span
                  style={{
                    background: "linear-gradient(135deg, #D4A017, #b8860b)",
                    color: "white",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: 700,
                    boxShadow: "0 2px 6px rgba(212,160,23,0.4)",
                  }}
                >
                  ⭐ Unlock
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MATCH POPUP
// ============================================================
function MatchPopup({ profile, onClose }) {
  const navigate = useNavigate();
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
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: profile.should_blur_photo ? "blur(20px)" : "none",
                }}
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
          <button
            onClick={() => {
              onClose();
              navigate(`/messages?to=${profile.id}`);
            }}
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
  borderRadius: "28px",
  padding: "32px 24px",
  maxWidth: "380px",
  width: "100%",
  textAlign: "center",
  boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
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

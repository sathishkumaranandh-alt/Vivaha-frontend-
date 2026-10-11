import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const AUTO_SLIDE_INTERVAL = 4500;

function getAvatarFor(name, photoUrl) {
  if (photoUrl) return photoUrl;
  const encoded = encodeURIComponent(name || "Member");
  return `https://ui-avatars.com/api/?background=8B0A2E&color=fff&size=512&bold=true&name=${encoded}`;
}

function HeroProfileSlider({ profiles, isMobile = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoTimer = useRef(null);
  const progressTimer = useRef(null);
  const touchStartX = useRef(null);

  const total = profiles?.length || 0;
  const shouldAuto = total > 1 && !isPaused;

  useEffect(() => {
    if (!shouldAuto) {
      if (autoTimer.current) clearInterval(autoTimer.current);
      autoTimer.current = null;
      return;
    }
    autoTimer.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
      setProgress(0);
    }, AUTO_SLIDE_INTERVAL);
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [shouldAuto, total]);

  useEffect(() => {
    if (!shouldAuto) {
      setProgress(0);
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
      return;
    }
    setProgress(0);
    const start = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / AUTO_SLIDE_INTERVAL) * 100, 100));
    }, 40);
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [shouldAuto, activeIndex, total]);

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const goTo = (idx) => {
    setActiveIndex(idx);
    setProgress(0);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50 && total > 1) {
      if (diff > 0) setActiveIndex((prev) => (prev + 1) % total);
      else setActiveIndex((prev) => (prev - 1 + total) % total);
      setProgress(0);
    }
    touchStartX.current = null;
  };

  if (!profiles || profiles.length === 0) return null;

  const current = profiles[activeIndex];
  const avatar = getAvatarFor(current.name, current.photo_url);
  const blurred = current.should_blur_photo;

  return (
    <div
      style={{
        position: "relative",
        maxWidth: "440px",
        margin: "0 auto",
        width: "100%",
        userSelect: "none",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* PROGRESS BAR TOP */}
      {total > 1 && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "0 4px",
            marginBottom: "10px",
          }}
        >
          {profiles.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              style={{
                flex: 1,
                height: "3px",
                background: "rgba(255,255,255,0.25)",
                borderRadius: "2px",
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {i < activeIndex && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#D4A017",
                  }}
                />
              )}
              {i === activeIndex && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #D4A017, #f0b830)",
                    transition: "width 0.08s linear",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* MAIN CARD */}
      <div
        key={current.id || activeIndex}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: "20px",
          overflow: "hidden",
          background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          animation: "heroCardFade 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <style>{`
          @keyframes heroCardFade {
            0% { opacity: 0; transform: scale(1.03); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* PHOTO */}
        <img
          src={avatar}
          alt={current.name || "Member"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            inset: 0,
            filter: blurred ? "blur(20px)" : "none",
            transform: blurred ? "scale(1.1)" : "scale(1)",
          }}
        />

        {/* GRADIENT OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.92) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* BLUR OVERLAY */}
        {blurred && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.98)",
                padding: "12px 20px",
                borderRadius: "30px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#8B0A2E",
              }}
            >
              <span style={{ fontSize: "24px" }}>🔒</span>
              <span>Protected</span>
            </div>
          </div>
        )}

        {/* TOP BADGES */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            display: "flex",
            gap: "6px",
            zIndex: 5,
          }}
        >
          {current.is_boosted && (
            <div
              style={{
                background: "linear-gradient(135deg, #D4A017, #b8860b)",
                color: "white",
                fontSize: "9px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "20px",
                letterSpacing: "0.5px",
              }}
            >
              🚀 BOOSTED
            </div>
          )}
          {current.is_verified && (
            <div
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "white",
                fontSize: "9px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "20px",
                letterSpacing: "0.5px",
              }}
            >
              ✓ VERIFIED
            </div>
          )}
        </div>

        {/* BOTTOM CONTENT */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 18px 18px",
            zIndex: 3,
          }}
        >
          {/* Name + Age */}
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "28px",
              fontWeight: 900,
              color: "white",
              margin: "0 0 6px 0",
              lineHeight: 1.1,
              textShadow: "0 3px 14px rgba(0,0,0,0.9)",
              letterSpacing: "-0.5px",
            }}
          >
            {current.name || "Anonymous"}
            {current.age ? (
              <span
                style={{
                  fontWeight: 500,
                  fontSize: "16px",
                  opacity: 0.85,
                  marginLeft: "6px",
                  fontStyle: "italic",
                }}
              >
                , {current.age}
              </span>
            ) : null}
          </h2>

          {/* Meta line */}
          <div
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.9)",
              marginBottom: "14px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            }}
          >
            {current.location && <span>📍 {current.location}</span>}
            {current.education && <span>🎓 {current.education}</span>}
            {current.community && (
              <span style={{ textTransform: "capitalize" }}>
                🏷️ {current.community}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              to={`/profile/${current.id}`}
              state={{ from: window.location.pathname + window.location.search }}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.95)",
                color: "#2D1B1B",
                padding: "12px 20px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backdropFilter: "blur(10px)",
              }}
            >
              ▶ {blurred ? "🔒 View Profile" : "View Profile"}
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
              }}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "20px",
                cursor: "pointer",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Shortlist"
            >
              ♡
            </button>
          </div>
        </div>
      </div>

      {/* DOTS BELOW */}
      {total > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "16px",
          }}
        >
          {profiles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === activeIndex ? "20px" : "6px",
                height: "6px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                padding: 0,
                background:
                  i === activeIndex ? "#8B0A2E" : "rgba(139,10,46,0.2)",
                transition: "all 0.3s ease",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroProfileSlider;

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const AUTO_SLIDE_INTERVAL = 4500;

function getAvatarFor(name, photoUrl) {
  if (photoUrl) return photoUrl;
  const encoded = encodeURIComponent(name || "Member");
  return `https://ui-avatars.com/api/?background=8B0A2E&color=fff&size=512&bold=true&name=${encoded}`;
}

function HeroProfileSlider({ profiles, isMobile = false }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const total = profiles?.length || 0;
  const shouldAuto = total > 1 && !isPaused;

  // Center active card on mount / index change
  const centerCard = (idx, smooth = true) => {
    if (!scrollRef.current) return;
    const track = scrollRef.current;
    const card = track.children[idx];
    if (!card) return;
    const target =
      card.offsetLeft - track.clientWidth / 2 + card.clientWidth / 2;
    track.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  };

  // Auto-slide
  useEffect(() => {
    if (!shouldAuto) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % total;
      setActiveIndex(next);
      centerCard(next);
      setProgress(0);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearTimeout(timer);
  }, [activeIndex, shouldAuto, total]);

  // Progress bar increments
  useEffect(() => {
    if (!shouldAuto) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / AUTO_SLIDE_INTERVAL) * 100, 100));
    }, 50);
    return () => clearInterval(timer);
  }, [activeIndex, shouldAuto]);

  // Initial center
  useEffect(() => {
    setTimeout(() => centerCard(0, false), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync activeIndex when user scrolls
  useEffect(() => {
    const track = scrollRef.current;
    if (!track) return;
    let scrollTimeout;
    const onScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let closest = 0;
        let minDist = Infinity;
        Array.from(track.children).forEach((child, i) => {
          const childCenter = child.offsetLeft + child.clientWidth / 2;
          const dist = Math.abs(childCenter - center);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });
        if (closest !== activeIndex) {
          setActiveIndex(closest);
          setProgress(0);
        }
      }, 100);
    };
    track.addEventListener("scroll", onScroll);
    return () => track.removeEventListener("scroll", onScroll);
  }, [activeIndex]);

  if (!profiles || profiles.length === 0) return null;

  const cardWidth = isMobile ? "260px" : "300px";

  return (
    <div
      style={{ position: "relative", width: "100%", userSelect: "none" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>{`
        .vivah-hero-slider {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .vivah-hero-slider::-webkit-scrollbar { display: none; }
      `}</style>

      {/* PROGRESS BARS */}
      {total > 1 && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "0 8px",
            marginBottom: "12px",
          }}
        >
          {profiles.map((_, i) => (
            <div
              key={i}
              onClick={() => {
                setActiveIndex(i);
                centerCard(i);
                setProgress(0);
              }}
              style={{
                flex: 1,
                height: "3px",
                background: "rgba(139,10,46,0.15)",
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
                    background: "#8B0A2E",
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
                    background: "linear-gradient(90deg, #8B0A2E, #D4A017)",
                    transition: "width 0.08s linear",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* SCROLLABLE TRACK — Peek effect */}
      <div
        ref={scrollRef}
        className="vivah-hero-slider"
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollPaddingLeft: `calc(50% - ${isMobile ? "130" : "150"}px)`,
          paddingLeft: `calc(50% - ${isMobile ? "130" : "150"}px)`,
          paddingRight: `calc(50% - ${isMobile ? "130" : "150"}px)`,
          paddingBottom: "16px",
        }}
      >
        {profiles.map((p, idx) => {
          const avatar = getAvatarFor(p.name, p.photo_url);
          const blurred = p.should_blur_photo;
          const isActive = idx === activeIndex;
          return (
            <div
              key={p.id || idx}
              style={{
                flex: `0 0 ${cardWidth}`,
                scrollSnapAlign: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3 / 4",
                  borderRadius: "20px",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
                  boxShadow: isActive
                    ? "0 24px 60px rgba(139,10,46,0.35)"
                    : "0 12px 30px rgba(0,0,0,0.15)",
                  transform: isActive ? "scale(1)" : "scale(0.92)",
                  opacity: isActive ? 1 : 0.65,
                  transition:
                    "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s, box-shadow 0.5s",
                }}
              >
                {/* PHOTO */}
                <img
                  src={avatar}
                  alt={p.name || "Member"}
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

                {/* GRADIENT */}
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
                  {p.is_boosted && (
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
                  {p.is_verified && (
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
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: isMobile ? "22px" : "26px",
                      fontWeight: 900,
                      color: "white",
                      margin: "0 0 6px 0",
                      lineHeight: 1.1,
                      textShadow: "0 3px 14px rgba(0,0,0,0.9)",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {p.name || "Anonymous"}
                    {p.age ? (
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: "15px",
                          opacity: 0.85,
                          marginLeft: "6px",
                          fontStyle: "italic",
                        }}
                      >
                        , {p.age}
                      </span>
                    ) : null}
                  </h2>

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
                    {p.location && <span>📍 {p.location}</span>}
                    {p.education && <span>🎓 {p.education}</span>}
                    {p.community && (
                      <span style={{ textTransform: "capitalize" }}>
                        🏷️ {p.community}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <Link
                      to={`/profile/${p.id}`}
                      state={{
                        from:
                          window.location.pathname + window.location.search,
                      }}
                      onClick={(e) => {
                        if (!isActive) {
                          e.preventDefault();
                          setActiveIndex(idx);
                          centerCard(idx);
                          setProgress(0);
                        }
                      }}
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
                      ▶ {blurred ? "🔒 View" : "View Profile"}
                    </Link>
                    <button
                      onClick={(e) => e.preventDefault()}
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
            </div>
          );
        })}
      </div>

      {/* DOTS */}
      {total > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "4px",
          }}
        >
          {profiles.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIndex(i);
                centerCard(i);
                setProgress(0);
              }}
              style={{
                width: i === activeIndex ? "22px" : "6px",
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

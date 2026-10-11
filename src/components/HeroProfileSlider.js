import React, { useState, useEffect, useRef } from "react";

const AUTO_SLIDE_INTERVAL = 7000;

function getAvatarFor(name, photoUrl) {
  if (photoUrl) return photoUrl;
  const encoded = encodeURIComponent(name || "Member");
  return `https://ui-avatars.com/api/?background=8B0A2E&color=fff&size=512&bold=true&name=${encoded}`;
}

function HeroProfileSlider({ profiles, isMobile = false }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = profiles?.length || 0;
  const shouldAuto = total > 1 && !isPaused;

  // Scroll to a specific card (aligned to start)
  const scrollToCard = (idx, smooth = true) => {
    if (!scrollRef.current) return;
    const track = scrollRef.current;
    const card = track.children[idx];
    if (!card) return;
    track.scrollTo({
      left: card.offsetLeft,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Auto-slide
  useEffect(() => {
    if (!shouldAuto) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % total;
      setActiveIndex(next);
      scrollToCard(next);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearTimeout(timer);
  }, [activeIndex, shouldAuto, total]);

  // Sync activeIndex when user scrolls
  useEffect(() => {
    const track = scrollRef.current;
    if (!track) return;
    let scrollTimeout;
    const onScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollLeft = track.scrollLeft;
        let closest = 0;
        let minDist = Infinity;
        Array.from(track.children).forEach((child, i) => {
          const dist = Math.abs(child.offsetLeft - scrollLeft);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });
        if (closest !== activeIndex) setActiveIndex(closest);
      }, 80);
    };
    track.addEventListener("scroll", onScroll);
    return () => track.removeEventListener("scroll", onScroll);
  }, [activeIndex]);

  // Initial scroll
  useEffect(() => {
    const timer = setTimeout(() => scrollToCard(0, false), 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profiles || profiles.length === 0) return null;

  return (
    <div
      style={{
        width: "100%",
        userSelect: "none",
        position: "relative",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>{`
        .vivah-hero-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .vivah-hero-track::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Track with peek effect */}
      <div
        ref={scrollRef}
        className="vivah-hero-track"
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          paddingBottom: "4px",
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
                flex: "0 0 88%",
                scrollSnapAlign: "start",
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
                    ? "0 20px 50px rgba(139,10,46,0.28)"
                    : "0 8px 20px rgba(0,0,0,0.08)",
                  transition: "box-shadow 0.4s ease",
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
                    filter: blurred ? "blur(22px)" : "none",
                    transform: blurred ? "scale(1.1)" : "scale(1)",
                  }}
                />

                {/* Bottom gradient for text readability */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.5) 72%, rgba(0,0,0,0.92) 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* BLUR LOCK */}
                {blurred && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.35)",
                      zIndex: 2,
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

                {/* NAME + LOCATION (bottom) */}
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
                      margin: "0 0 4px 0",
                      lineHeight: 1.1,
                      textShadow: "0 3px 14px rgba(0,0,0,0.9)",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {p.name || "Anonymous"}
                    {p.age ? (
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: "15px",
                          opacity: 0.88,
                          marginLeft: "6px",
                          fontStyle: "italic",
                        }}
                      >
                        , {p.age}
                      </span>
                    ) : null}
                  </h2>

                  {p.location && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.92)",
                        textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                        fontWeight: 500,
                      }}
                    >
                      📍 {p.location}
                    </div>
                  )}
                </div>

                {/* CLICK OVERLAY — opens profile */}
                <a
                  href={`/profile/${p.id}`}
                  onClick={(e) => {
                    if (!isActive) {
                      e.preventDefault();
                      setActiveIndex(idx);
                      scrollToCard(idx);
                    }
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 4,
                  }}
                  aria-label={`View ${p.name}'s profile`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HeroProfileSlider;

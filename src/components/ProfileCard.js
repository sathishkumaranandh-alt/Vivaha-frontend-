import React, { useState } from "react";
import { Link } from "react-router-dom";

function ProfileCard({ user, isMobile = false }) {
  const [hovered, setHovered] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

    const {
    id, name, age, location, education, occupation, community,
    photo_url, is_verified, is_boosted, should_blur_photo,
    contact_masked, contact_locked_reason, match_score,
    // Optional fields (won't break if undefined)
    company, mother_tongue, is_online, photo_count, height,
  } = user;

  const getScoreColor = (score) => {
    if (!score) return "#8a6b6b";
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#dc2626";
  };

  const scoreColor = getScoreColor(match_score);
  const scorePercent = match_score ? Math.round(match_score) : 0;

  // Circular progress ring
  const RING_SIZE = 44;
  const RING_STROKE = 3.5;
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRC = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRC - (scorePercent / 100) * RING_CIRC;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        borderRadius: "18px",
        overflow: "hidden",
        border: hovered ? "1.5px solid #f0c8d4" : "1.5px solid #f0e0e0",
        boxShadow: hovered
          ? "0 20px 45px rgba(139,10,46,0.18), 0 0 0 4px rgba(139,10,46,0.04)"
          : "0 6px 18px rgba(139,10,46,0.07)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
      }}
    >
      {/* ============================================
          PHOTO SECTION (4:5)
      ============================================ */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/5",
          background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
          overflow: "hidden",
        }}
      >
        {photo_url ? (
          <>
            <img
              src={photo_url}
              alt={name || "Profile"}
              onLoad={() => setImgLoaded(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 20%",
                filter: should_blur_photo ? "blur(22px)" : "none",
                transform: should_blur_photo
                  ? "scale(1.15)"
                  : hovered
                  ? "scale(1.07)"
                  : "scale(1.01)",
                transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
                opacity: imgLoaded ? 1 : 0,
              }}
            />
            {/* Bottom gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.85) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            {/* Top gradient for badges */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "90px",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "56px",
              color: "#D4A017",
              background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
            }}
          >
            👤
          </div>
        )}

        {/* ============================================
            TOP-LEFT: BADGES (Verified + Boost)
        ============================================ */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            zIndex: 3,
          }}
        >
          {is_boosted && (
            <div
              style={{
                background: "linear-gradient(135deg, #D4A017, #b8860b)",
                color: "white",
                fontSize: "8px",
                fontWeight: 800,
                padding: "4px 9px",
                borderRadius: "18px",
                boxShadow:
                  "0 3px 10px rgba(212,160,23,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
                letterSpacing: "0.5px",
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>🚀</span> BOOSTED
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
                borderRadius: "18px",
                boxShadow:
                  "0 3px 10px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
                letterSpacing: "0.5px",
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span style={{ fontSize: "10px" }}>✓</span> VERIFIED
            </div>
          )}
        </div>

        {/* ============================================
            TOP-RIGHT: HEART + ONLINE DOT
        ============================================ */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
            zIndex: 3,
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShortlisted((s) => !s);
            }}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: shortlisted ? "#8B0A2E" : "rgba(255,255,255,0.97)",
              border: shortlisted
                ? "1.5px solid #D4A017"
                : "1.5px solid rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              color: shortlisted ? "#D4A017" : "#8B0A2E",
              cursor: "pointer",
              boxShadow: shortlisted
                ? "0 4px 14px rgba(139,10,46,0.45)"
                : "0 3px 10px rgba(0,0,0,0.2)",
              transition: "all 0.25s ease",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              fontFamily: "inherit",
            }}
            title="Shortlist"
          >
            {shortlisted ? "♥" : "♡"}
          </button>

          {/* Online Status Indicator */}
          {is_online && (
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#16a34a",
                fontSize: "9px",
                fontWeight: 800,
                padding: "4px 8px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  boxShadow: "0 0 6px #16a34a",
                  animation: "pulse 2s infinite",
                }}
              />
              LIVE
            </div>
          )}
        </div>

        {/* ============================================
            CIRCULAR MATCH SCORE (Premium)
        ============================================ */}
        {match_score && (
          <div
            style={{
              position: "absolute",
              bottom: "76px",
              right: "12px",
              zIndex: 3,
              width: `${RING_SIZE}px`,
              height: `${RING_SIZE}px`,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
            }}
          >
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="rgba(255,255,255,0.95)"
                stroke="rgba(139,10,46,0.12)"
                strokeWidth={RING_STROKE}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="transparent"
                stroke={scoreColor}
                strokeWidth={RING_STROKE}
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: "rotate(0deg)",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  color: scoreColor,
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {scorePercent}
              </span>
              <span
                style={{
                  fontSize: "6px",
                  fontWeight: 700,
                  color: "#8a6b6b",
                  letterSpacing: "0.5px",
                  marginTop: "1px",
                }}
              >
                MATCH
              </span>
            </div>
          </div>
        )}

        {/* ============================================
            BLUR OVERLAY (Premium)
        ============================================ */}
        {should_blur_photo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 100%)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.98)",
                padding: "14px 20px",
                borderRadius: "22px",
                fontSize: "10px",
                fontWeight: 800,
                color: "#8B0A2E",
                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                border: "1.5px solid rgba(212,160,23,0.4)",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                }}
              >
                🔒
              </span>
              <span style={{ letterSpacing: "0.3px" }}>Photo Protected</span>
              <span
                style={{
                  fontSize: "8.5px",
                  fontWeight: 600,
                  color: "#8a6b6b",
                  marginTop: "1px",
                }}
              >
                Tap to view
              </span>
            </div>
          </div>
        )}

        {/* ============================================
            PHOTO COUNT INDICATOR (Bottom-Left of Photo)
        ============================================ */}
        {photo_count > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "14px",
              background: "rgba(0,0,0,0.55)",
              color: "white",
              fontSize: "9px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "10px",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              zIndex: 3,
              letterSpacing: "0.3px",
            }}
          >
            <span>📷</span> {photo_count}
          </div>
        )}

        {/* ============================================
            NAME + AGE + LOCATION (Bottom)
        ============================================ */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 14px 12px",
            zIndex: 3,
          }}
        >
          {/* Animated gold divider */}
          <div
            style={{
              width: hovered ? "36px" : "20px",
              height: "1.5px",
              background:
                "linear-gradient(90deg, #D4A017, rgba(212,160,23,0))",
              marginBottom: "7px",
              transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "15px" : "17px",
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.5)",
              marginBottom: "4px",
              lineHeight: 1.15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.2px",
            }}
          >
            {name || "Anonymous"}
            {age ? (
              <span
                style={{
                  fontWeight: 500,
                  fontSize: "13px",
                  opacity: 0.9,
                  marginLeft: "4px",
                }}
              >
                , {age}
              </span>
            ) : null}
          </div>

          <div
            style={{
              fontSize: "10.5px",
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontWeight: 500,
            }}
          >
            {location ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "140px",
                }}
              >
                <span style={{ fontSize: "9px" }}>📍</span>
                {location}
              </span>
            ) : null}
            {height ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <span style={{ fontSize: "9px" }}>📏</span>
                {height}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ============================================
          BODY SECTION
      ============================================ */}
      <div
        style={{
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "7px",
        }}
      >
        {/* Education / Occupation / Company */}
        {(education || occupation || company) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            {education && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#5c3030",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: "11px", opacity: 0.85 }}>🎓</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {education}
                </span>
              </div>
            )}
            {occupation && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#5c3030",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: "11px", opacity: 0.85 }}>💼</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {occupation}
                  {company ? (
                    <span
                      style={{
                        color: "#8a6b6b",
                        fontWeight: 500,
                        fontSize: "10px",
                      }}
                    >
                      {" "}· {company}
                    </span>
                  ) : null}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Elegant thin divider */}
        {(education || occupation) && (
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(212,160,23,0.25) 0%, transparent 100%)",
              marginTop: "2px",
            }}
          />
        )}

        {/* Community + Mother Tongue Row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            alignItems: "center",
            marginTop: "2px",
          }}
        >
          {community && (
            <span
              style={{
                background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
                color: "#8B0A2E",
                padding: "3px 10px",
                borderRadius: "16px",
                fontSize: "9.5px",
                fontWeight: 700,
                textTransform: "capitalize",
                display: "inline-block",
                border: "1px solid #f0e0e0",
                letterSpacing: "0.2px",
              }}
            >
              🏷️ {community}
            </span>
          )}

          {mother_tongue && (
            <span
              style={{
                background: "#F5F3FF",
                color: "#6B21A8",
                padding: "3px 10px",
                borderRadius: "16px",
                fontSize: "9.5px",
                fontWeight: 700,
                display: "inline-block",
                border: "1px solid #EDE9FE",
                letterSpacing: "0.2px",
              }}
            >
              🗣️ {mother_tongue}
            </span>
          )}

          {contact_masked && contact_locked_reason === "owner_privacy" && (
            <span
              style={{
                background: "#f3f4f6",
                color: "#6b7280",
                padding: "3px 10px",
                borderRadius: "16px",
                fontSize: "9.5px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              🔒 Contact
            </span>
          )}

          {contact_masked && contact_locked_reason !== "owner_privacy" && (
            <Link
              to="/subscription"
              style={{
                background: "linear-gradient(135deg, #D4A017, #b8860b)",
                color: "white",
                padding: "3px 10px",
                borderRadius: "16px",
                fontSize: "9.5px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                boxShadow: "0 2px 8px rgba(212,160,23,0.35)",
                letterSpacing: "0.2px",
              }}
            >
              ⭐ Unlock
            </Link>
          )}
        </div>

        {/* ============================================
            CTA BUTTON (with shimmer)
        ============================================ */}
        <Link
          to={`/profile/${id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            background: should_blur_photo
              ? "linear-gradient(135deg, #8a6b6b, #5c3030)"
              : hovered
              ? "linear-gradient(135deg, #a01438, #8B0A2E)"
              : "linear-gradient(135deg, #8B0A2E, #a01438)",
            color: "white",
            padding: "10px 12px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "11.5px",
            boxShadow: hovered
              ? "0 8px 20px rgba(139,10,46,0.42), inset 0 1px 0 rgba(255,255,255,0.15)"
              : "0 4px 12px rgba(139,10,46,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
            marginTop: "auto",
            transition: "all 0.3s ease",
            letterSpacing: "0.3px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Shimmer effect on hover */}
          <span
            style={{
              position: "absolute",
              top: 0,
              left: hovered ? "100%" : "-100%",
              width: "60%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
              transition: "left 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <span style={{ position: "relative", zIndex: 2 }}>
            {should_blur_photo ? "🔒 Unlock Profile" : "View Profile"}
          </span>
          {!should_blur_photo && (
            <span
              style={{
                position: "relative",
                zIndex: 2,
                transform: hovered ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.3s ease",
              }}
            >
              →
            </span>
          )}
        </Link>
      </div>

      {/* Pulsing keyframe - inline for React */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default ProfileCard;

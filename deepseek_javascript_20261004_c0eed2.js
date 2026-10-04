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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        borderRadius: "14px",
        overflow: "hidden",
        border: hovered ? "1px solid #f0d0da" : "1px solid #f0e0e0",
        boxShadow: hovered
          ? "0 18px 40px -12px rgba(139,10,46,0.18), 0 4px 12px rgba(139,10,46,0.06)"
          : "0 3px 14px -4px rgba(139,10,46,0.06)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
      }}
    >
      {/* ============================================
          PHOTO SECTION
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
                objectPosition: "center 18%",
                filter: should_blur_photo ? "blur(24px)" : "none",
                transform: should_blur_photo
                  ? "scale(1.15)"
                  : hovered
                  ? "scale(1.06)"
                  : "scale(1.01)",
                transition:
                  "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease",
                opacity: imgLoaded ? 1 : 0,
              }}
            />

            {/* Soft bottom gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(15,3,8,0.35) 65%, rgba(15,3,8,0.9) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {/* Subtle top gradient for badges */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "80px",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 100%)",
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #FAF3F5, #f4dde5)",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #8B0A2E, #a01438)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: "30px",
                fontWeight: 700,
                color: "#D4A017",
                boxShadow: "0 6px 20px rgba(139,10,46,0.22)",
              }}
            >
              {(name || "?")[0].toUpperCase()}
            </div>
            <div
              style={{
                fontSize: "8.5px",
                fontWeight: 700,
                color: "#8a6b6b",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Photo Pending
            </div>
          </div>
        )}

        {/* ============================================
            TOP-LEFT: BADGES (Refined)
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
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(10px)",
                color: "#b8860b",
                fontSize: "7.5px",
                fontWeight: 800,
                padding: "4px 8px",
                borderRadius: "4px",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                border: "1px solid rgba(212,160,23,0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                width: "fit-content",
              }}
            >
              <span style={{ fontSize: "8px", color: "#D4A017" }}>◆</span> PREMIUM
            </div>
          )}
          {is_verified && (
            <div
              style={{
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(10px)",
                color: "#059669",
                fontSize: "7.5px",
                fontWeight: 800,
                padding: "4px 8px",
                borderRadius: "4px",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                border: "1px solid rgba(16,185,129,0.35)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                width: "fit-content",
              }}
            >
              <span style={{ fontSize: "9px" }}>✓</span> VERIFIED
            </div>
          )}
        </div>

        {/* ============================================
            TOP-RIGHT: HEART + MATCH RING + ONLINE
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
          {/* Heart button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShortlisted((s) => !s);
            }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: shortlisted
                ? "linear-gradient(135deg, #8B0A2E, #a01438)"
                : "rgba(255,255,255,0.96)",
              border: shortlisted
                ? "1.5px solid #D4A017"
                : "1px solid rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: shortlisted ? "#D4A017" : "#8B0A2E",
              cursor: "pointer",
              boxShadow: shortlisted
                ? "0 4px 14px rgba(139,10,46,0.4)"
                : "0 2px 8px rgba(0,0,0,0.15)",
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              transform: hovered ? "scale(1.08)" : "scale(1)",
              fontFamily: "inherit",
              backdropFilter: "blur(8px)",
            }}
            title="Shortlist"
          >
            {shortlisted ? "♥" : "♡"}
          </button>

          {/* Online status */}
          {is_online && (
            <div
              style={{
                background: "rgba(255,255,255,0.96)",
                color: "#16a34a",
                fontSize: "8px",
                fontWeight: 800,
                padding: "3px 7px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                backdropFilter: "blur(8px)",
                letterSpacing: "0.8px",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
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
            ELEGANT "PROTECTED" OVERLAY
        ============================================ */}
        {should_blur_photo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15,3,8,0.42)",
              backdropFilter: "blur(3px)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {/* Elegant circular lock with gold ring */}
              <div
                style={{
                  position: "relative",
                  width: "62px",
                  height: "62px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Outer gold ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(212,160,23,0.6)",
                    opacity: 0.7,
                  }}
                />
                {/* Inner white circle */}
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.98)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    boxShadow:
                      "0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  🔒
                </div>
              </div>
              <div
                style={{
                  fontSize: "8.5px",
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  fontFamily: "inherit",
                }}
              >
                Protected
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            PHOTO COUNT (Bottom-Left)
        ============================================ */}
        {photo_count > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "14px",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              color: "white",
              fontSize: "8.5px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              zIndex: 3,
              letterSpacing: "0.5px",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <span style={{ fontSize: "9px" }}>📷</span> {photo_count}
          </div>
        )}

        {/* ============================================
            NAME + AGE + LOCATION
        ============================================ */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "14px 14px 12px",
            zIndex: 3,
          }}
        >
          {/* Animated gold divider */}
          <div
            style={{
              width: hovered ? "32px" : "18px",
              height: "1.5px",
              background:
                "linear-gradient(90deg, #D4A017, rgba(212,160,23,0))",
              marginBottom: "8px",
              transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "15px" : "17px",
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 10px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.4)",
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
                  opacity: 0.88,
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
              fontSize: "10px",
              color: "rgba(255,255,255,0.9)",
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontWeight: 500,
              letterSpacing: "0.2px",
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
                  maxWidth: "130px",
                }}
              >
                <span style={{ fontSize: "9px", opacity: 0.9 }}>📍</span>
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
                <span style={{ fontSize: "9px", opacity: 0.9 }}>📏</span>
                {height}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ============================================
          BODY SECTION (Refined)
      ============================================ */}
      <div
        style={{
          padding: "13px 14px 14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "8px",
        }}
      >
        {/* Education / Occupation */}
        {(education || occupation) && (
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
                  color: "#3d2828",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontWeight: 500,
                  letterSpacing: "0.1px",
                }}
              >
                <span
                  style={{
                    color: "#D4A017",
                    fontSize: "7px",
                    lineHeight: 1,
                  }}
                >
                  ◆
                </span>
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
                  color: "#3d2828",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontWeight: 500,
                  letterSpacing: "0.1px",
                }}
              >
                <span
                  style={{
                    color: "#D4A017",
                    fontSize: "7px",
                    lineHeight: 1,
                  }}
                >
                  ◆
                </span>
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

        {/* Elegant gold-tinted divider */}
        {(education || occupation) && (
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.05) 50%, transparent 100%)",
            }}
          />
        )}

        {/* Community + Mother Tongue + Contact chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
            alignItems: "center",
            marginTop: "1px",
          }}
        >
          {community && (
            <span
              style={{
                background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
                color: "#8B0A2E",
                padding: "3px 9px",
                borderRadius: "14px",
                fontSize: "9px",
                fontWeight: 700,
                textTransform: "capitalize",
                display: "inline-block",
                border: "1px solid #f5dce4",
                letterSpacing: "0.3px",
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
                padding: "3px 9px",
                borderRadius: "14px",
                fontSize: "9px",
                fontWeight: 700,
                display: "inline-block",
                border: "1px solid #EDE9FE",
                letterSpacing: "0.3px",
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
                padding: "3px 9px",
                borderRadius: "14px",
                fontSize: "9px",
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
                padding: "3px 9px",
                borderRadius: "14px",
                fontSize: "9px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                boxShadow: "0 2px 8px rgba(212,160,23,0.3)",
                letterSpacing: "0.3px",
              }}
            >
              ⭐ Unlock
            </Link>
          )}
        </div>

        {/* ============================================
            ELEGANT CTA BUTTON
        ============================================ */}
        <Link
          to={`/profile/${id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            background: should_blur_photo
              ? hovered
                ? "linear-gradient(135deg, #6b5050, #4a3535)"
                : "linear-gradient(135deg, #8a6b6b, #5c3030)"
              : hovered
              ? "linear-gradient(135deg, #a01438, #8B0A2E)"
              : "linear-gradient(135deg, #8B0A2E, #a01438)",
            color: "white",
            padding: "10px 12px",
            borderRadius: "9px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "11px",
            boxShadow: hovered
              ? "0 8px 20px rgba(139,10,46,0.42), inset 0 1px 0 rgba(255,255,255,0.15)"
              : "0 3px 10px rgba(139,10,46,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
            marginTop: "auto",
            transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
            letterSpacing: "0.5px",
            position: "relative",
            overflow: "hidden",
            textTransform: "uppercase",
          }}
        >
          <span style={{ position: "relative", zIndex: 2 }}>
            {should_blur_photo ? "🔒 Unlock" : "View"}
          </span>
          {!should_blur_photo && (
            <span
              style={{
                position: "relative",
                zIndex: 2,
                transform: hovered ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.3s ease",
                fontSize: "12px",
              }}
            >
              →
            </span>
          )}
          {/* Shimmer */}
          <span
            style={{
              position: "absolute",
              top: 0,
              left: hovered ? "100%" : "-100%",
              width: "50%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
              transition: "left 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        </Link>
      </div>

      {/* Pulsing animation for LIVE dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default ProfileCard;
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
        borderRadius: "6px",
        overflow: "hidden",
        border: "1px solid #ede4e6",
        boxShadow: hovered
          ? "0 24px 48px -12px rgba(139,10,46,0.22)"
          : "0 4px 16px -4px rgba(139,10,46,0.06)",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        transition: "all 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
      }}
    >
      {/* TOP GOLD LINE */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(90deg, transparent 0%, #D4A017 20%, #b8860b 50%, #D4A017 80%, transparent 100%)",
          zIndex: 10,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* PHOTO SECTION */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3/4",
          background: "linear-gradient(135deg, #FAF3F5, #f4dde5)",
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
                objectPosition: "center 15%",
                filter: should_blur_photo ? "blur(22px)" : "none",
                transform: should_blur_photo
                  ? "scale(1.15)"
                  : hovered
                  ? "scale(1.06)"
                  : "scale(1)",
                transition:
                  "transform 0.9s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.6s ease",
                opacity: imgLoaded ? 1 : 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(20,5,10,0.92) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "100px",
                background:
                  "linear-gradient(180deg, rgba(20,5,10,0.4) 0%, rgba(0,0,0,0) 100%)",
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
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #8B0A2E, #a01438)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: "32px",
                fontWeight: 700,
                color: "#D4A017",
                boxShadow: "0 8px 24px rgba(139,10,46,0.2)",
              }}
            >
              {(name || "?")[0].toUpperCase()}
            </div>
            <div
              style={{
                fontSize: "9px",
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

        {/* TOP-LEFT BADGES */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            zIndex: 3,
          }}
        >
          {is_verified && (
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#059669",
                fontSize: "8.5px",
                fontWeight: 800,
                padding: "4px 9px",
                borderRadius: "4px",
                letterSpacing: "0.8px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                border: "1px solid rgba(16,185,129,0.35)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <span style={{ fontSize: "9px" }}>✓</span> VERIFIED
            </div>
          )}
          {is_boosted && (
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#b8860b",
                fontSize: "8.5px",
                fontWeight: 800,
                padding: "4px 9px",
                borderRadius: "4px",
                letterSpacing: "0.8px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                border: "1px solid rgba(212,160,23,0.4)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <span style={{ fontSize: "9px" }}>★</span> PREMIUM
            </div>
          )}
        </div>

        {/* SHORTLIST HEART */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShortlisted((s) => !s);
          }}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            color: shortlisted ? "#8B0A2E" : "#8a6b6b",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            backdropFilter: "blur(8px)",
            fontFamily: "inherit",
            transform: hovered ? "scale(1.08)" : "scale(1)",
            zIndex: 3,
          }}
          title={shortlisted ? "Remove from shortlist" : "Shortlist"}
        >
          {shortlisted ? "♥" : "♡"}
        </button>

        {/* BLUR OVERLAY */}
        {should_blur_photo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(20,5,10,0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.98)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9)",
                border: "1.5px solid rgba(212,160,23,0.5)",
                position: "relative",
              }}
            >
              🔒
              <div
                style={{
                  position: "absolute",
                  bottom: "-22px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  fontSize: "8.5px",
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                Protected
              </div>
            </div>
          </div>
        )}

        {/* NAME OVERLAY */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "18px 16px 16px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: hovered ? "40px" : "24px",
              height: "1.5px",
              background: "linear-gradient(90deg, #D4A017, rgba(212,160,23,0))",
              marginBottom: "10px",
              transition: "width 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
            }}
          />

          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "16px" : "19px",
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 10px rgba(0,0,0,0.7)",
              marginBottom: "6px",
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.3px",
            }}
          >
            {name || "Anonymous"}
          </div>

          <div
            style={{
              fontSize: "10.5px",
              color: "rgba(255,255,255,0.88)",
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontWeight: 500,
              letterSpacing: "0.3px",
              fontStyle: "italic",
            }}
          >
            {age ? <span>{age} yrs</span> : null}
            {age && location ? (
              <span
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                }}
              />
            ) : null}
            {location ? (
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "140px",
                }}
              >
                {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* BODY SECTION */}
      <div
        style={{
          padding: "16px 16px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "10px",
        }}
      >
        {(education || occupation) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {education && (
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#3d2828",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 500,
                  letterSpacing: "0.1px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#D4A017",
                    fontWeight: 700,
                    fontFamily: "serif",
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
                  fontSize: "11.5px",
                  color: "#3d2828",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 500,
                  letterSpacing: "0.1px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#D4A017",
                    fontWeight: 700,
                    fontFamily: "serif",
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
                </span>
              </div>
            )}
          </div>
        )}

        {(education || occupation) && (
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(212,160,23,0.3) 0%, transparent 100%)",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {community ? (
            <span
              style={{
                fontSize: "10px",
                color: "#8B0A2E",
                fontWeight: 700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
              }}
            >
              {community}
            </span>
          ) : (
            <span />
          )}

          {match_score && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "10.5px",
                fontWeight: 800,
                color: scoreColor,
                letterSpacing: "0.3px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: scoreColor,
                  boxShadow: `0 0 8px ${scoreColor}`,
                }}
              />
              {scorePercent}% MATCH
            </div>
          )}
        </div>

        {contact_masked && (
          <div style={{ marginTop: "-2px" }}>
            {contact_locked_reason === "owner_privacy" ? (
              <div
                style={{
                  fontSize: "9.5px",
                  color: "#8a6b6b",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  fontStyle: "italic",
                }}
              >
                🔒 Contact hidden by user
              </div>
            ) : (
              <Link
                to="/subscription"
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  textDecoration: "none",
                  color: "#b8860b",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                ⭐ Upgrade to view
              </Link>
            )}
          </div>
        )}

        {/* CTA BUTTON - FIXED: removed duplicate color property */}
        <Link
          to={`/profile/${id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            border: "1.5px solid #8B0A2E",
            padding: "11px 16px",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginTop: "auto",
            transition: "all 0.4s cubic-bezier(0.19, 1, 0.22, 1)",
            fontFamily: "inherit",
            position: "relative",
            overflow: "hidden",
            backgroundColor: hovered ? "#8B0A2E" : "white",
            color: hovered ? "white" : "#8B0A2E",
          }}
        >
          <span style={{ position: "relative", zIndex: 2 }}>
            {should_blur_photo ? "Unlock" : "View Profile"}
          </span>
          <span
            style={{
              position: "relative",
              zIndex: 2,
              transform: hovered ? "translateX(6px)" : "translateX(0)",
              transition: "transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)",
              fontSize: "13px",
            }}
          >
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

export default ProfileCard;

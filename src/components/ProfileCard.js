import React, { useState } from "react";
import { Link } from "react-router-dom";

function ProfileCard({ user, isMobile = false }) {
  const [hovered, setHovered] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const {
    id, name, age, location, education, occupation, community,
    photo_url, is_verified, is_boosted, should_blur_photo,
    contact_masked, contact_locked_reason, match_score,
  } = user;

  // Match score color coding
  const getScoreColor = (score) => {
    if (!score) return "#8a6b6b";
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#dc2626";
  };

  const scoreColor = getScoreColor(match_score);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid #f0e0e0",
        boxShadow: hovered
          ? "0 16px 40px rgba(139,10,46,0.18)"
          : "0 8px 24px rgba(139,10,46,0.08)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
      }}
    >
      {/* ============ PHOTO SECTION ============ */}
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
          <img
            src={photo_url}
            alt={name || "Profile"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: should_blur_photo ? "blur(22px)" : "none",
              transform: should_blur_photo
                ? "scale(1.15)"
                : hovered
                ? "scale(1.05)"
                : "scale(1)",
              transition: "transform 0.5s ease",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "60px",
              color: "#D4A017",
              background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
            }}
          >
            👤
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.82) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* TOP-LEFT BADGES */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 3,
          }}
        >
          {is_boosted && (
            <div
              style={{
                background: "linear-gradient(135deg, #D4A017, #b8860b)",
                color: "white",
                fontSize: "9px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "20px",
                boxShadow: "0 3px 10px rgba(212,160,23,0.5)",
                letterSpacing: "0.5px",
                width: "fit-content",
              }}
            >
              🚀 BOOSTED
            </div>
          )}
          {is_verified && (
            <div
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "white",
                fontSize: "9px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "20px",
                boxShadow: "0 3px 10px rgba(16,185,129,0.45)",
                letterSpacing: "0.5px",
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "10px" }}>✓</span> VERIFIED
            </div>
          )}
        </div>

        {/* MATCH SCORE BADGE (Top-Right, below heart) */}
        {match_score && (
          <div
            style={{
              position: "absolute",
              top: "58px",
              right: "12px",
              background: "rgba(255,255,255,0.98)",
              color: scoreColor,
              fontSize: "11px",
              fontWeight: 800,
              padding: "5px 10px",
              borderRadius: "20px",
              border: `1.5px solid ${scoreColor}`,
              boxShadow: `0 4px 12px ${scoreColor}40`,
              backdropFilter: "blur(6px)",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "10px" }}>💯</span>
            {Math.round(match_score)}%
          </div>
        )}

        {/* SHORTLIST HEART BUTTON */}
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
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: shortlisted
              ? "#8B0A2E"
              : "rgba(255,255,255,0.96)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            color: shortlisted ? "white" : "#8B0A2E",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            zIndex: 3,
            transition: "all 0.2s ease",
            transform: hovered ? "scale(1.08)" : "scale(1)",
          }}
          title="Shortlist"
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
              background: "rgba(0,0,0,0.35)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.98)",
                padding: "12px 20px",
                borderRadius: "24px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#8B0A2E",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "22px" }}>🔒</span>
              <span>Photo Protected</span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "#8a6b6b",
                  marginTop: "2px",
                }}
              >
                Tap to view
              </span>
            </div>
          </div>
        )}

        {/* NAME + AGE + LOCATION (bottom of photo) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 16px 14px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "17px" : "20px",
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              marginBottom: "6px",
              lineHeight: 1.15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name || "Anonymous"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontWeight: 500,
            }}
          >
            {age ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                🎂 {age} yrs
              </span>
            ) : null}
            {location ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "120px",
                }}
              >
                📍 {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ============ BODY SECTION ============ */}
      <div
        style={{
          padding: "14px 16px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "6px",
        }}
      >
        {/* Education */}
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
            <span style={{ fontSize: "12px" }}>🎓</span>
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

        {/* Occupation */}
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
            <span style={{ fontSize: "12px" }}>💼</span>
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

        {/* Community Chip */}
        {community && (
          <div style={{ marginTop: "4px" }}>
            <span
              style={{
                background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
                color: "#8B0A2E",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "capitalize",
                display: "inline-block",
                border: "1px solid #f0e0e0",
              }}
            >
              🏷️ {community}
            </span>
          </div>
        )}

        {/* Contact masked badge */}
        {contact_masked && (
          <div style={{ marginTop: "4px" }}>
            {contact_locked_reason === "owner_privacy" ? (
              <div
                style={{
                  fontSize: "10px",
                  color: "#8a6b6b",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                🔒 Contact hidden
              </div>
            ) : (
              <Link
                to="/subscription"
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #D4A017, #b8860b)",
                  color: "white",
                  padding: "5px 12px",
                  borderRadius: "14px",
                  display: "inline-block",
                  boxShadow: "0 3px 10px rgba(212,160,23,0.35)",
                }}
              >
                ⭐ Upgrade to unlock
              </Link>
            )}
          </div>
        )}

        {/* View Profile Button */}
        <Link
          to={`/profile/${id}`}
          style={{
            display: "block",
            textAlign: "center",
            background: should_blur_photo
              ? "linear-gradient(135deg, #8a6b6b, #5c3030)"
              : "linear-gradient(135deg, #8B0A2E, #a01438)",
            color: "white",
            padding: "11px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "12px",
            boxShadow: hovered
              ? "0 6px 18px rgba(139,10,46,0.4)"
              : "0 4px 14px rgba(139,10,46,0.28)",
            marginTop: "auto",
            transition: "box-shadow 0.3s ease",
            letterSpacing: "0.3px",
          }}
        >
          {should_blur_photo ? "🔒 View Profile" : "View Profile →"}
        </Link>
      </div>
    </div>
  );
}

export default ProfileCard;

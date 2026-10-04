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
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #f0e0e0",
        boxShadow: hovered
          ? "0 12px 28px rgba(139,10,46,0.14)"
          : "0 4px 14px rgba(139,10,46,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
      }}
    >
      {/* ============ PHOTO (Compact 1:1 ratio) ============ */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1/1",
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
              objectPosition: "center top",
              filter: should_blur_photo ? "blur(20px)" : "none",
              transform: should_blur_photo
                ? "scale(1.12)"
                : hovered
                ? "scale(1.04)"
                : "scale(1)",
              transition: "transform 0.45s ease",
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
              fontSize: "44px",
              color: "#D4A017",
              background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
            }}
          >
            👤
          </div>
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* TOP-LEFT BADGES (Smaller) */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
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
                padding: "3px 8px",
                borderRadius: "14px",
                boxShadow: "0 2px 6px rgba(212,160,23,0.5)",
                letterSpacing: "0.4px",
                width: "fit-content",
              }}
            >
              🚀 BOOST
            </div>
          )}
          {is_verified && (
            <div
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "white",
                fontSize: "8px",
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: "14px",
                boxShadow: "0 2px 6px rgba(16,185,129,0.45)",
                letterSpacing: "0.4px",
                width: "fit-content",
              }}
            >
              ✓ VERIFIED
            </div>
          )}
        </div>

        {/* MATCH SCORE (Top-Right, below heart) */}
        {match_score && (
          <div
            style={{
              position: "absolute",
              top: "46px",
              right: "8px",
              background: "rgba(255,255,255,0.98)",
              color: scoreColor,
              fontSize: "10px",
              fontWeight: 800,
              padding: "3px 8px",
              borderRadius: "12px",
              border: `1.2px solid ${scoreColor}`,
              boxShadow: `0 2px 8px ${scoreColor}35`,
              backdropFilter: "blur(6px)",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span style={{ fontSize: "9px" }}>💯</span>
            {Math.round(match_score)}%
          </div>
        )}

        {/* SHORTLIST HEART (Smaller) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShortlisted((s) => !s);
          }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: shortlisted ? "#8B0A2E" : "rgba(255,255,255,0.96)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            color: shortlisted ? "white" : "#8B0A2E",
            cursor: "pointer",
            boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
            zIndex: 3,
            transition: "all 0.2s ease",
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
          title="Shortlist"
        >
          {shortlisted ? "♥" : "♡"}
        </button>

        {/* BLUR OVERLAY (Compact) */}
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
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 800,
                color: "#8B0A2E",
                boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "16px" }}>🔒</span>
              <span>Protected</span>
            </div>
          </div>
        )}

        {/* NAME + AGE + LOCATION */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "10px 12px 10px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 6px rgba(0,0,0,0.6)",
              marginBottom: "3px",
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
              fontSize: "10px",
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontWeight: 500,
            }}
          >
            {age ? <span>🎂 {age}</span> : null}
            {location ? (
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "110px",
                }}
              >
                📍 {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ============ BODY (Compact) ============ */}
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "4px",
        }}
      >
        {/* Education */}
        {education && (
          <div
            style={{
              fontSize: "10.5px",
              color: "#5c3030",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "11px" }}>🎓</span>
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
              fontSize: "10.5px",
              color: "#5c3030",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "11px" }}>💼</span>
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
          <div style={{ marginTop: "2px" }}>
            <span
              style={{
                background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
                color: "#8B0A2E",
                padding: "3px 10px",
                borderRadius: "16px",
                fontSize: "9px",
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

        {/* Contact masked */}
        {contact_masked && (
          <div style={{ marginTop: "2px" }}>
            {contact_locked_reason === "owner_privacy" ? (
              <div
                style={{
                  fontSize: "9px",
                  color: "#8a6b6b",
                  fontWeight: 600,
                }}
              >
                🔒 Contact hidden
              </div>
            ) : (
              <Link
                to="/subscription"
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #D4A017, #b8860b)",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  display: "inline-block",
                  boxShadow: "0 2px 6px rgba(212,160,23,0.35)",
                }}
              >
                ⭐ Upgrade
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
            padding: "9px",
            borderRadius: "9px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "11px",
            boxShadow: hovered
              ? "0 5px 14px rgba(139,10,46,0.38)"
              : "0 3px 10px rgba(139,10,46,0.25)",
            marginTop: "auto",
            transition: "box-shadow 0.25s ease",
            letterSpacing: "0.3px",
          }}
        >
          {should_blur_photo ? "🔒 View" : "View Profile →"}
        </Link>
      </div>
    </div>
  );
}

export default ProfileCard;

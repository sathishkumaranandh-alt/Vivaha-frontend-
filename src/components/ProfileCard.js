import React from "react";
import { Link } from "react-router-dom";

function ProfileCard({ user, isMobile = false }) {
  const {
    id, name, age, location, education, occupation, community,
    photo_url, is_verified, is_boosted, should_blur_photo,
    contact_masked, contact_locked_reason, match_score,
  } = user;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid #f0e0e0",
        boxShadow: "0 8px 24px rgba(139,10,46,0.08)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* PHOTO */}
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
              transform: should_blur_photo ? "scale(1.15)" : "scale(1)",
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
              "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* TOP-LEFT BADGES */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
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
              }}
            >
              ✓ VERIFIED
            </div>
          )}
        </div>

        {/* MATCH SCORE (if present) */}
        {match_score && !is_boosted && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(139,10,46,0.9)",
              color: "white",
              fontSize: "10px",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: "20px",
              backdropFilter: "blur(6px)",
              zIndex: 3,
            }}
          >
            {Math.round(match_score)}% Match
          </div>
        )}

        {/* HEART BUTTON */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.96)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            color: "#8B0A2E",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            zIndex: 3,
          }}
          title="Shortlist"
        >
          ♡
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
              background: "rgba(0,0,0,0.3)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.98)",
                padding: "10px 18px",
                borderRadius: "24px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#8B0A2E",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "20px" }}>🔒</span>
              <span>Protected</span>
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
            padding: "14px 16px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "17px" : "19px",
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 6px rgba(0,0,0,0.55)",
              marginBottom: "3px",
              lineHeight: 1.15,
            }}
          >
            {name || "Anonymous"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 3px rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {age ? <span>🎂 {age} yrs</span> : null}
            {location ? <span>📍 {location}</span> : null}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div
        style={{
          padding: "14px 16px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {education && (
          <div
            style={{
              fontSize: "11px",
              color: "#8a6b6b",
              marginBottom: "5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🎓</span>
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
              color: "#8a6b6b",
              marginBottom: "5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>💼</span>
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

        {community && (
          <div style={{ marginTop: "6px", marginBottom: "10px" }}>
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

        {contact_masked && (
          <div style={{ marginBottom: "10px" }}>
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
                🔒 Contact hidden by user
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
                ⭐ Upgrade for contact
              </Link>
            )}
          </div>
        )}

        <Link
          to={`/profile/${id}`}
          style={{
            display: "block",
            textAlign: "center",
            background: "linear-gradient(135deg, #8B0A2E, #a01438)",
            color: "white",
            padding: "10px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "12px",
            boxShadow: "0 4px 14px rgba(139,10,46,0.28)",
            marginTop: "auto",
          }}
        >
          {should_blur_photo ? "🔒 View Profile" : "View Profile →"}
        </Link>
      </div>
    </div>
  );
}

export default ProfileCard;

import React, { useState } from "react";
import { Link } from "react-router-dom";

function getCardTheme() {
  const D = {
    cardBg: "#ffffff",
    cardBorder: "#f0e0e0",
    cardBorderWidth: "1",
    cardRadius: "14",
    cardShadow: "40",
    photoRatio: "2/3",
    photoBlur: "20",
    nameColor: "#ffffff",
    nameSize: "17",
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
      cardBg: c.card_bg || D.cardBg,
      cardBorder: c.card_border_color || D.cardBorder,
      cardBorderWidth: parseInt(c.card_border_width || D.cardBorderWidth),
      cardRadius: parseInt(c.card_radius || D.cardRadius),
      cardShadow: parseInt(c.card_shadow || D.cardShadow),
      photoRatio: c.card_photo_ratio || D.photoRatio,
      photoBlur: parseInt(c.card_photo_blur || D.photoBlur),
      nameColor: c.card_name_color || D.nameColor,
      nameSize: c.card_name_size || D.nameSize,
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

function ProfileCard({ user, isMobile = false }) {
  const [hovered, setHovered] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const theme = getCardTheme();

  const {
    id, name, age, location, education, occupation, community,
    photo_url, is_verified, is_boosted, should_blur_photo,
    contact_masked, contact_locked_reason, match_score,
    company, mother_tongue, is_online, photo_count, height,
  } = user;

  const getScoreColor = (s) => {
    if (!s) return "#8a6b6b";
    if (s >= 80) return "#16a34a";
    if (s >= 60) return "#22c55e";
    if (s >= 40) return "#f59e0b";
    return "#dc2626";
  };

  const scoreColor = getScoreColor(match_score);
  const scorePercent = match_score ? Math.round(match_score) : 0;

  const shadowStrength = theme.cardShadow || 0;
  const boxShadow = shadowStrength === 0
    ? "none"
    : `0 ${Math.round(shadowStrength / 8)}px ${Math.round(shadowStrength / 3)}px -${Math.round(shadowStrength / 15)}px rgba(139,10,46,0.15)`;

  const detailRows = [];
  if (theme.showLocation && location) detailRows.push({ icon: "📍", text: location });
  if (theme.showEducation && education) detailRows.push({ icon: "🎓", text: education });
  if (theme.showOccupation && occupation) detailRows.push({ icon: "💼", text: company ? `${occupation} · ${company}` : occupation });
  if (theme.showHeight && height) detailRows.push({ icon: "📏", text: height });

  const hasPhoto = !!photo_url;

  // When blurred OR no photo, the bottom overlay position should be adjusted
  // so "Tap to unlock" / placeholder doesn't overlap with name.
  // We move the lock icon higher when blurred.
  const blurTopOffset = hasPhoto ? "8%" : "0"; // push lock up slightly when blur

  return (
    <Link
      to={`/profile/${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        position: "relative",
        width: "100%",
        aspectRatio: theme.photoRatio,
        borderRadius: `${theme.cardRadius}px`,
        overflow: "hidden",
        border: `${theme.cardBorderWidth}px solid ${hovered ? "#f0d0da" : theme.cardBorder}`,
        boxShadow: hovered
          ? `0 ${Math.round(shadowStrength / 4)}px ${Math.round(shadowStrength / 2)}px -8px rgba(139,10,46,0.28)`
          : boxShadow,
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        cursor: "pointer",
        textDecoration: "none",
        background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
      }}
    >
      {/* ==================== PHOTO / NO-PHOTO ==================== */}
      {hasPhoto ? (
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
              filter: should_blur_photo ? `blur(${theme.photoBlur}px)` : "none",
              transform: should_blur_photo ? "scale(1.1)" : hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s",
              opacity: imgLoaded ? 1 : 0,
            }}
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
      ) : (
        /* ==================== ELEGANT NO-PHOTO ==================== */
        /* Only a soft circle — no text (bottom overlay handles name) */
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #FFF9F5 0%, #FDF2F6 50%, #F8E8ED 100%)",
            paddingBottom: "35%",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.75)",
              border: "2px solid rgba(139,10,46,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 24px rgba(139,10,46,0.06)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(139,10,46,0.08), rgba(212,160,23,0.08))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: "26px",
                fontWeight: 700,
                color: "#8B0A2E",
                opacity: 0.55,
              }}
            >
              {(name || "?")[0].toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOP-LEFT: PAID + VERIFIED BADGES ==================== */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          zIndex: 5,
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
              borderRadius: "4px",
              letterSpacing: "0.9px",
              boxShadow: "0 3px 10px rgba(212,160,23,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
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
              boxShadow: "0 3px 10px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
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

      {/* ==================== TOP-RIGHT: HEART + LIVE + MATCH ==================== */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "6px",
          zIndex: 5,
        }}
      >
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
            border: shortlisted ? "1.5px solid #D4A017" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            color: shortlisted ? "#D4A017" : "#8B0A2E",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            transition: "all 0.25s",
            fontFamily: "inherit",
            backdropFilter: "blur(8px)",
          }}
        >
          {shortlisted ? "♥" : "♡"}
        </button>

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

      {/* ==================== BLUR OVERLAY (Only on photo) ==================== */}
      {hasPhoto && should_blur_photo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: "38%", // pushes lock icon up so it doesn't overlap name
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
                boxShadow: "0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
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

      {/* ==================== PHOTO COUNT ==================== */}
      {hasPhoto && photo_count > 1 && (
        <div
          style={{
            position: "absolute",
            top: is_boosted && is_verified ? "62px" : (is_boosted || is_verified) ? "40px" : "10px",
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

      {/* ==================== BOTTOM-LEFT DETAILS ==================== */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 12px 12px",
          zIndex: 3,
          textAlign: "left",
        }}
      >
        {/* Name + Age */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? "15px" : "17px",
            fontWeight: 700,
            color: hasPhoto ? theme.nameColor : "#8B0A2E",
            textShadow: hasPhoto
              ? "0 2px 10px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.5)"
              : "none",
            marginBottom: "4px",
            lineHeight: 1.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name || "Anonymous"}
          {age ? (
            <span
              style={{
                fontWeight: 500,
                fontSize: "12px",
                opacity: 0.9,
                marginLeft: "4px",
                fontStyle: "italic",
              }}
            >
              , {age}
            </span>
          ) : null}
        </div>

        {/* Detail rows */}
        {detailRows.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "6px" }}>
            {detailRows.slice(0, 2).map((row, i) => (
              <div
                key={i}
                style={{
                  fontSize: "9.5px",
                  color: hasPhoto ? theme.bodyColor : "#5c3030",
                  textShadow: hasPhoto ? "0 1px 3px rgba(0,0,0,0.7)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: "9px", opacity: 0.95 }}>{row.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Chips row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
          {theme.showCommunity && community && (
            <span
              style={{
                background: hasPhoto ? "rgba(255,255,255,0.2)" : "rgba(139,10,46,0.08)",
                color: hasPhoto ? "white" : "#8B0A2E",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "8px",
                fontWeight: 700,
                textTransform: "capitalize",
                border: hasPhoto ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(139,10,46,0.15)",
                backdropFilter: "blur(8px)",
                textShadow: hasPhoto ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              🏷️ {community}
            </span>
          )}
          {theme.showMotherTongue && mother_tongue && (
            <span
              style={{
                background: hasPhoto ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.12)",
                color: hasPhoto ? "white" : "#6B21A8",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "8px",
                fontWeight: 700,
                border: hasPhoto ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(139,92,246,0.2)",
                backdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
              }}
            >
              🗣️ {mother_tongue}
            </span>
          )}
          {theme.showContact && contact_masked && contact_locked_reason === "owner_privacy" && (
            <span
              style={{
                background: hasPhoto ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)",
                color: hasPhoto ? "white" : "#4b5563",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "8px",
                fontWeight: 600,
                backdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
              }}
            >
              🔒 Contact
            </span>
          )}
          {theme.showContact && contact_masked && contact_locked_reason !== "owner_privacy" && (
            <span
              style={{
                background: "linear-gradient(135deg, #D4A017, #b8860b)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "8px",
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(212,160,23,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              ⭐ Unlock
            </span>
          )}
        </div>
      </div>

      {/* "View →" hint on hover */}
      {hovered && !should_blur_photo && hasPhoto && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            fontSize: "9px",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
            zIndex: 4,
            animation: "fadeIn 0.3s ease",
          }}
        >
          View →
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </Link>
  );
}

export default ProfileCard;
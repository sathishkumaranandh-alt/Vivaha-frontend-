import React, { useState } from "react";
import { Link } from "react-router-dom";

function getCardTheme() {
  const D = {
    cardBg: "#ffffff",
    cardBorder: "#f0e0e0",
    cardBorderWidth: "1",
    cardRadius: "14",
    cardShadow: "40",
    photoRatio: "3/4",
    photoBlur: "20",
    nameColor: "#ffffff",
    nameSize: "17",
    bodyColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.85)",
    chipBg: "rgba(255,255,255,0.15)",
    chipText: "#ffffff",
    buttonBg: "#8B0A2E",
    buttonBgHover: "#a01438",
    buttonText: "#ffffff",
    protectedBg: "#8a6b6b",
    protectedHover: "#5c3030",
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
      chipBg: c.card_chip_bg || D.chipBg,
      chipText: c.card_chip_text || D.chipText,
      buttonBg: c.card_button_bg || D.buttonBg,
      buttonBgHover: c.card_button_bg_hover || D.buttonBgHover,
      buttonText: c.card_button_text || D.buttonText,
      protectedBg: c.card_protected_bg || D.protectedBg,
      protectedHover: c.card_protected_bg_hover || D.protectedHover,
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
      {/* ==================== FULL PHOTO ==================== */}
      {photo_url ? (
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
              objectPosition: "center 18%",
              filter: should_blur_photo ? `blur(${theme.photoBlur}px)` : "none",
              transform: should_blur_photo
                ? "scale(1.1)"
                : hovered
                ? "scale(1.06)"
                : "scale(1)",
              transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s",
              opacity: imgLoaded ? 1 : 0,
            }}
          />

          {/* Deep bottom gradient for readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 40%, rgba(15,3,8,0.75) 70%, rgba(15,3,8,0.96) 100%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
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
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8B0A2E, #a01438)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Playfair Display', serif",
              fontSize: "28px",
              fontWeight: 700,
              color: "#D4A017",
            }}
          >
            {(name || "?")[0].toUpperCase()}
          </div>
          <div style={{ fontSize: "9px", fontWeight: 700, color: "#8a6b6b", letterSpacing: "2px", textTransform: "uppercase" }}>No Photo</div>
        </div>
      )}

      {/* ==================== TOP-LEFT BADGES ==================== */}
      <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "5px", zIndex: 4 }}>
        {is_boosted && (
          <div style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", fontSize: "7.5px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.8px", boxShadow: "0 2px 8px rgba(212,160,23,0.5)" }}>◆ PREMIUM</div>
        )}
        {is_verified && (
          <div style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "white", fontSize: "7.5px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.8px", boxShadow: "0 2px 8px rgba(16,185,129,0.5)" }}>✓ VERIFIED</div>
        )}
      </div>

      {/* ==================== TOP-RIGHT: HEART + LIVE + MATCH ==================== */}
      <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", zIndex: 4 }}>
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
            background: shortlisted ? "linear-gradient(135deg, #8B0A2E, #a01438)" : "rgba(255,255,255,0.96)",
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
          <div style={{ background: "rgba(255,255,255,0.95)", color: "#16a34a", fontSize: "7.5px", fontWeight: 800, padding: "3px 7px", borderRadius: "9px", display: "flex", alignItems: "center", gap: "3px", letterSpacing: "0.6px", backdropFilter: "blur(8px)" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#16a34a", animation: "pulse 2s infinite" }} />LIVE
          </div>
        )}

        {match_score && (
          <div style={{ background: "rgba(255,255,255,0.97)", color: scoreColor, fontSize: "9px", fontWeight: 800, padding: "3px 7px", borderRadius: "10px", border: `1px solid ${scoreColor}55`, display: "flex", alignItems: "center", gap: "4px", backdropFilter: "blur(8px)" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: scoreColor, boxShadow: `0 0 4px ${scoreColor}` }} />
            {scorePercent}%
          </div>
        )}
      </div>

      {/* ==================== PROTECTED OVERLAY ==================== */}
      {should_blur_photo && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,3,8,0.4)", zIndex: 2 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(255,255,255,0.98)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", border: "1.5px solid rgba(212,160,23,0.5)" }}>🔒</div>
            <div style={{ fontSize: "8px", fontWeight: 700, color: "white", letterSpacing: "2px", textTransform: "uppercase", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>Protected</div>
          </div>
        </div>
      )}

      {/* ==================== PHOTO COUNT ==================== */}
      {photo_count > 1 && (
        <div style={{ position: "absolute", top: "10px", left: "10px", marginTop: is_boosted && is_verified ? "46px" : is_boosted || is_verified ? "24px" : "0px", background: "rgba(0,0,0,0.55)", color: "white", fontSize: "8px", fontWeight: 700, padding: "2px 7px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "3px", zIndex: 3, backdropFilter: "blur(8px)" }}>📷 {photo_count}</div>
      )}

      {/* ==================== BOTTOM CONTENT (Overlay on Photo) ==================== */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 12px 10px", zIndex: 3 }}>
        {/* Name + Age */}
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? `${Math.round(parseFloat(theme.nameSize) * 0.9)}px` : `${theme.nameSize}px`, fontWeight: 700, color: theme.nameColor, textShadow: "0 2px 10px rgba(0,0,0,0.7)", marginBottom: "3px", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name || "Anonymous"}
          {age ? <span style={{ fontWeight: 500, fontSize: "12px", opacity: 0.9, marginLeft: "4px", fontStyle: "italic" }}>, {age}</span> : null}
        </div>

        {/* Location + Height */}
        <div style={{ fontSize: "9.5px", color: theme.mutedColor, textShadow: "0 1px 3px rgba(0,0,0,0.7)", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontWeight: 500, marginBottom: "6px" }}>
          {location && <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>📍 {location}</span>}
          {height && <span>📏 {height}</span>}
        </div>

        {/* Education / Occupation */}
        {(education || occupation) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "6px" }}>
            {education && (
              <div style={{ fontSize: "9.5px", color: theme.bodyColor, display: "flex", alignItems: "center", gap: "5px", fontWeight: 500, textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>
                <span style={{ color: "#D4A017", fontSize: "6px" }}>◆</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{education}</span>
              </div>
            )}
            {occupation && (
              <div style={{ fontSize: "9.5px", color: theme.bodyColor, display: "flex", alignItems: "center", gap: "5px", fontWeight: 500, textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>
                <span style={{ color: "#D4A017", fontSize: "6px" }}>◆</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {occupation}{company ? <span style={{ color: theme.mutedColor, fontSize: "8.5px" }}> · {company}</span> : null}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Chips (Community, Mother Tongue, Contact) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center", marginBottom: "8px" }}>
          {community && (
            <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "8px", fontWeight: 700, textTransform: "capitalize", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>🏷️ {community}</span>
          )}
          {mother_tongue && (
            <span style={{ background: "rgba(139,92,246,0.35)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "8px", fontWeight: 700, border: "1px solid rgba(139,92,246,0.5)", backdropFilter: "blur(8px)" }}>🗣️ {mother_tongue}</span>
          )}
          {contact_masked && contact_locked_reason === "owner_privacy" && (
            <span style={{ background: "rgba(0,0,0,0.4)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "8px", fontWeight: 600, backdropFilter: "blur(8px)" }}>🔒 Contact</span>
          )}
          {contact_masked && contact_locked_reason !== "owner_privacy" && (
            <span style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "8px", fontWeight: 700, boxShadow: "0 2px 6px rgba(212,160,23,0.4)" }}>⭐ Unlock</span>
          )}
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            background: should_blur_photo
              ? (hovered ? theme.protectedHover : theme.protectedBg)
              : (hovered ? theme.buttonBgHover : theme.buttonBg),
            color: theme.buttonText,
            padding: "8px 10px",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            transition: "all 0.3s",
            boxShadow: hovered ? "0 5px 14px rgba(139,10,46,0.4)" : "0 2px 8px rgba(139,10,46,0.3)",
          }}
        >
          <span>{should_blur_photo ? "🔒 Unlock" : "View Profile"}</span>
          {!should_blur_photo && (
            <span style={{ transform: hovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.3s" }}>→</span>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </Link>
  );
}

export default ProfileCard;

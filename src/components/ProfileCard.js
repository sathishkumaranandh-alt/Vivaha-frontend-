import React, { useState } from "react";
import { Link } from "react-router-dom";

function getCardTheme() {
  const D = {
    cardBg: "#ffffff",
    cardBorder: "#f0e0e0",
    cardBorderWidth: "1",
    cardRadius: "12",
    cardShadow: "40",
    photoRatio: "4/5",
    photoBlur: "20",
    nameColor: "#ffffff",
    nameSize: "14.5",
    bodyColor: "#3d2828",
    mutedColor: "#8a6b6b",
    chipBg: "#FDF2F6",
    chipText: "#8B0A2E",
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
    : `0 ${Math.round(shadowStrength / 8)}px ${Math.round(shadowStrength / 3)}px -${Math.round(shadowStrength / 15)}px rgba(139,10,46,0.12)`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.cardBg,
        borderRadius: `${theme.cardRadius}px`,
        overflow: "hidden",
        border: `${theme.cardBorderWidth}px solid ${hovered ? "#f0d0da" : theme.cardBorder}`,
        boxShadow: hovered
          ? `0 ${Math.round(shadowStrength / 5)}px ${Math.round(shadowStrength / 2.5)}px -10px rgba(139,10,46,0.18)`
          : boxShadow,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
      }}
    >
      {/* ==================== PHOTO (4:5 - Taller) ==================== */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: theme.photoRatio,
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
                objectPosition: "center 15%",
                filter: should_blur_photo ? `blur(${theme.photoBlur}px)` : "none",
                transform: should_blur_photo
                  ? "scale(1.12)"
                  : hovered
                  ? "scale(1.05)"
                  : "scale(1)",
                transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s",
                opacity: imgLoaded ? 1 : 0,
              }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(15,3,8,0.88) 100%)", pointerEvents: "none", zIndex: 1 }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 100%)", pointerEvents: "none", zIndex: 1 }} />
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #FAF3F5, #f4dde5)", gap: "8px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #8B0A2E, #a01438)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 700, color: "#D4A017" }}>
              {(name || "?")[0].toUpperCase()}
            </div>
            <div style={{ fontSize: "8px", fontWeight: 700, color: "#8a6b6b", letterSpacing: "1.5px", textTransform: "uppercase" }}>No Photo</div>
          </div>
        )}

        {/* BADGES */}
        <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 3 }}>
          {is_boosted && (
            <div style={{ background: "rgba(255,255,255,0.96)", color: "#b8860b", fontSize: "7px", fontWeight: 800, padding: "3px 6px", borderRadius: "3px", letterSpacing: "0.8px", border: "1px solid rgba(212,160,23,0.4)", width: "fit-content" }}>◆ PREMIUM</div>
          )}
          {is_verified && (
            <div style={{ background: "rgba(255,255,255,0.96)", color: "#059669", fontSize: "7px", fontWeight: 800, padding: "3px 6px", borderRadius: "3px", letterSpacing: "0.8px", border: "1px solid rgba(16,185,129,0.35)", width: "fit-content" }}>✓ VERIFIED</div>
          )}
        </div>

        {/* HEART */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShortlisted((s) => !s); }}
          style={{
            position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%",
            background: shortlisted ? "linear-gradient(135deg, #8B0A2E, #a01438)" : "rgba(255,255,255,0.96)",
            border: shortlisted ? "1.5px solid #D4A017" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", color: shortlisted ? "#D4A017" : "#8B0A2E",
            cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "all 0.25s", zIndex: 3, fontFamily: "inherit",
          }}
        >{shortlisted ? "♥" : "♡"}</button>

        {/* LIVE */}
        {is_online && (
          <div style={{ position: "absolute", top: "40px", right: "8px", background: "rgba(255,255,255,0.96)", color: "#16a34a", fontSize: "7px", fontWeight: 800, padding: "3px 6px", borderRadius: "9px", display: "flex", alignItems: "center", gap: "3px", letterSpacing: "0.6px", zIndex: 3 }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#16a34a", animation: "pulse 2s infinite" }} />LIVE
          </div>
        )}

        {/* PROTECTED */}
        {should_blur_photo && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,3,8,0.4)", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "rgba(255,255,255,0.98)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", border: "1.5px solid rgba(212,160,23,0.5)" }}>🔒</div>
              <div style={{ fontSize: "7.5px", fontWeight: 700, color: "white", letterSpacing: "2px", textTransform: "uppercase", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>Protected</div>
            </div>
          </div>
        )}

        {/* PHOTO COUNT */}
        {photo_count > 1 && (
          <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.55)", color: "white", fontSize: "8px", fontWeight: 700, padding: "2px 7px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "3px", zIndex: 3 }}>📷 {photo_count}</div>
        )}

        {/* MATCH SCORE */}
        {match_score ? (
          <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(255,255,255,0.97)", color: scoreColor, fontSize: "9px", fontWeight: 800, padding: "3px 7px", borderRadius: "10px", border: `1px solid ${scoreColor}55`, display: "flex", alignItems: "center", gap: "4px", zIndex: 3 }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: scoreColor, boxShadow: `0 0 4px ${scoreColor}` }} />
            {scorePercent}%
          </div>
        ) : null}

        {/* NAME */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 10px 8px", zIndex: 3 }}>
          <div style={{ width: hovered ? "24px" : "14px", height: "1.5px", background: "linear-gradient(90deg, #D4A017, rgba(212,160,23,0))", marginBottom: "5px", transition: "width 0.4s" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? `${Math.round(parseFloat(theme.nameSize) * 0.9)}px` : `${theme.nameSize}px`, fontWeight: 700, color: theme.nameColor, textShadow: "0 2px 8px rgba(0,0,0,0.65)", marginBottom: "2px", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name || "Anonymous"}
            {age ? <span style={{ fontWeight: 500, fontSize: "11px", opacity: 0.88, marginLeft: "3px", fontStyle: "italic" }}>, {age}</span> : null}
          </div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.9)", textShadow: "0 1px 3px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
            {location ? <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>📍 {location}</span> : null}
            {height ? <span>📏 {height}</span> : null}
          </div>
        </div>
      </div>

      {/* ==================== BODY (Compact) ==================== */}
      <div style={{ padding: "7px 9px 8px", display: "flex", flexDirection: "column", flex: 1, gap: "3px" }}>
        {(education || occupation) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {education && (
              <div style={{ fontSize: "9.5px", color: theme.bodyColor, display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                <span style={{ color: "#D4A017", fontSize: "6px" }}>◆</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{education}</span>
              </div>
            )}
            {occupation && (
              <div style={{ fontSize: "9.5px", color: theme.bodyColor, display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                <span style={{ color: "#D4A017", fontSize: "6px" }}>◆</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {occupation}{company ? <span style={{ color: theme.mutedColor, fontSize: "8.5px" }}> · {company}</span> : null}
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", alignItems: "center" }}>
          {community && (
            <span style={{ background: theme.chipBg, color: theme.chipText, padding: "2px 7px", borderRadius: "9px", fontSize: "7.5px", fontWeight: 700, textTransform: "capitalize", border: `1px solid ${theme.chipText}20` }}>🏷️ {community}</span>
          )}
          {mother_tongue && (
            <span style={{ background: "#F5F3FF", color: "#6B21A8", padding: "2px 7px", borderRadius: "9px", fontSize: "7.5px", fontWeight: 700, border: "1px solid #EDE9FE" }}>🗣️ {mother_tongue}</span>
          )}
          {contact_masked && contact_locked_reason === "owner_privacy" && (
            <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "2px 7px", borderRadius: "9px", fontSize: "7.5px", fontWeight: 600 }}>🔒 Contact</span>
          )}
          {contact_masked && contact_locked_reason !== "owner_privacy" && (
            <Link to="/subscription" style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "2px 7px", borderRadius: "9px", fontSize: "7.5px", fontWeight: 700, textDecoration: "none" }}>⭐ Unlock</Link>
          )}
        </div>

        <Link
          to={`/profile/${id}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            background: should_blur_photo
              ? (hovered ? theme.protectedHover : theme.protectedBg)
              : (hovered ? theme.buttonBgHover : theme.buttonBg),
            color: theme.buttonText,
            padding: "7px 10px", borderRadius: "7px", textDecoration: "none",
            fontWeight: 700, fontSize: "9.5px", letterSpacing: "0.4px",
            marginTop: "auto", textTransform: "uppercase", transition: "all 0.3s",
            boxShadow: hovered ? "0 5px 14px rgba(139,10,46,0.35)" : "0 2px 6px rgba(139,10,46,0.2)",
          }}
        >
          <span>{should_blur_photo ? "🔒 Unlock" : "View"}</span>
          {!should_blur_photo && (
            <span style={{ transform: hovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.3s" }}>→</span>
          )}
        </Link>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

export default ProfileCard;

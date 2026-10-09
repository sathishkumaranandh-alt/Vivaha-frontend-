import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPageTheme, getCardStyle } from "../utils/pageTheme";

function ProfileCompletionCard({ profile, isMobile }) {
  const navigate = useNavigate();
  const [pageTheme, setPageTheme] = useState(getPageTheme("dashboard"));

  useEffect(() => {
    const handler = () => setPageTheme(getPageTheme("dashboard"));
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
  }, []);

  const pageHeading = pageTheme.heading;
  const pageMuted = pageTheme.muted;
  const pageLink = pageTheme.link;
  const cardStyle = getCardStyle(pageTheme);

  const essentialFields = [
    { key: "photo_url", label: "Profile Photo", icon: "📷" },
    { key: "bio", label: "About You", icon: "✍️" },
    { key: "education", label: "Education", icon: "🎓" },
    { key: "occupation", label: "Occupation", icon: "💼" },
    { key: "location", label: "Location", icon: "📍" },
    { key: "father_occ", label: "Family Details", icon: "👨‍👩‍👧" },
    { key: "gothram", label: "Gothram / Rasi", icon: "🕉️" },
    { key: "pref_age_min", label: "Partner Preference", icon: "💕" },
  ];

  const totalCount = essentialFields.length;
  const completedFields = essentialFields.filter(
    (f) => profile[f.key] && String(profile[f.key]).trim() !== ""
  );
  const missingFields = essentialFields.filter(
    (f) => !profile[f.key] || String(profile[f.key]).trim() === ""
  );
  const percent = Math.round((completedFields.length / totalCount) * 100);

  // Success state
  if (percent === 100) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          borderRadius: `${pageTheme.cardRadius}px`,
          padding: `${pageTheme.cardPadding}px`,
          border: "2px solid #86efac",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "42px", marginBottom: "8px" }}>🎉</div>
        <h3
          style={{
            color: "#16a34a",
            fontSize: "18px",
            fontWeight: "800",
            margin: "0 0 6px 0",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Profile Complete!
        </h3>
        <p
          style={{
            color: "#166534",
            fontSize: "13px",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Your profile is 100% complete. You'll now appear higher in search results and get better matches.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...cardStyle,
        background: "linear-gradient(135deg, #fff9f5 0%, #fdf2f6 100%)",
        border: `2px dashed ${pageTheme.cardBorder}`,
        marginBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "32px" }}>✨</div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              color: pageHeading,
              fontSize: "16px",
              fontWeight: "800",
              margin: "0 0 2px 0",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Complete Your Profile
          </h3>
          <p style={{ color: pageMuted, fontSize: "12px", margin: 0 }}>
            {missingFields.length} details left to unlock 3x more matches
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          <span style={{ color: pageHeading }}>Progress</span>
          <span style={{ color: pageHeading }}>{percent}%</span>
        </div>
        <div
          style={{
            background: "#f3f4f6",
            borderRadius: "10px",
            height: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "10px",
              width: `${percent}%`,
              transition: "width 0.5s ease, background 0.5s ease",
              background:
                percent < 40
                  ? "linear-gradient(90deg, #dc2626, #f59e0b)"
                  : percent < 80
                  ? "linear-gradient(90deg, #f59e0b, #eab308)"
                  : "linear-gradient(90deg, #16a34a, #22c55e)",
            }}
          />
        </div>
      </div>

      {/* Missing field chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "16px",
        }}
      >
        {missingFields.slice(0, 6).map((f) => (
          <span
            key={f.key}
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "white",
              border: `1px solid ${pageTheme.cardBorder}`,
              color: pageHeading,
              padding: "5px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "600",
            }}
          >
            <span style={{ marginRight: "4px" }}>{f.icon}</span>
            {f.label}
          </span>
        ))}
        {missingFields.length > 6 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: pageLink,
              color: "white",
              border: `1px solid ${pageLink}`,
              padding: "5px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "600",
            }}
          >
            +{missingFields.length - 6} more
          </span>
        )}
      </div>

      {/* CTA — CHANGED: /profile → /onboarding */}
      <button
        onClick={() => navigate("/onboarding")}
        style={{
          width: "100%",
          background: pageLink,
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontWeight: "700",
          fontSize: "14px",
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 6px 16px rgba(139,10,46,0.25)",
          padding: isMobile ? "12px" : "14px",
        }}
      >
        Complete Profile Now →
      </button>

      <p
        style={{
          margin: "12px 0 0 0",
          fontSize: "11px",
          color: pageMuted,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        💡 <b>Tip:</b> Profiles with photos & complete details get <b>5x more interests</b> from matches.
      </p>
    </div>
  );
}

export default ProfileCompletionCard;

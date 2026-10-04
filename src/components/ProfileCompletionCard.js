import React from "react";
import { useNavigate } from "react-router-dom";

function ProfileCompletionCard({ profile, isMobile }) {
  const navigate = useNavigate();

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

  if (percent === 100) {
    return (
      <div style={styles.successCard}>
        <div style={{ fontSize: "42px", marginBottom: "8px" }}>🎉</div>
        <h3 style={styles.successTitle}>Profile Complete!</h3>
        <p style={styles.successText}>
          Your profile is 100% complete. You'll now appear higher in search results and get better matches.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{ fontSize: "32px" }}>✨</div>
        <div style={{ flex: 1 }}>
          <h3 style={styles.title}>Complete Your Profile</h3>
          <p style={styles.subtitle}>
            {missingFields.length} details left to unlock 3x more matches
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px", fontWeight: "700" }}>
          <span style={{ color: "#8B0A2E" }}>Progress</span>
          <span style={{ color: "#8B0A2E" }}>{percent}%</span>
        </div>
        <div style={styles.progressBg}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percent}%`,
              background: percent < 40
                ? "linear-gradient(90deg, #dc2626, #f59e0b)"
                : percent < 80
                ? "linear-gradient(90deg, #f59e0b, #eab308)"
                : "linear-gradient(90deg, #16a34a, #22c55e)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
        {missingFields.slice(0, 6).map((f) => (
          <span key={f.key} style={styles.chip}>
            <span style={{ marginRight: "4px" }}>{f.icon}</span>
            {f.label}
          </span>
        ))}
        {missingFields.length > 6 && (
          <span style={{ ...styles.chip, background: "#8B0A2E", color: "white", borderColor: "#8B0A2E" }}>
            +{missingFields.length - 6} more
          </span>
        )}
      </div>

      <button
        onClick={() => navigate("/profile")}
        style={{
          ...styles.btn,
          padding: isMobile ? "12px" : "14px",
        }}
      >
        Complete Profile Now →
      </button>

      <p style={styles.tip}>
        💡 <b>Tip:</b> Profiles with photos & complete details get <b>5x more interests</b> from matches.
      </p>
    </div>
  );
}

const styles = {
  card: {
    borderRadius: "16px",
    padding: "20px",
    border: "2px dashed #f0c8d4",
    background: "linear-gradient(135deg, #fff9f5 0%, #fdf2f6 100%)",
    marginBottom: "20px",
  },
  successCard: {
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    borderRadius: "16px",
    padding: "24px",
    border: "2px solid #86efac",
    textAlign: "center",
    marginBottom: "20px",
  },
  successTitle: {
    color: "#16a34a",
    fontSize: "18px",
    fontWeight: "800",
    margin: "0 0 6px 0",
    fontFamily: "'Playfair Display', serif",
  },
  successText: {
    color: "#166534",
    fontSize: "13px",
    margin: 0,
    lineHeight: 1.6,
  },
  title: {
    color: "#8B0A2E",
    fontSize: "16px",
    fontWeight: "800",
    margin: "0 0 2px 0",
    fontFamily: "'Playfair Display', serif",
  },
  subtitle: {
    color: "#8a6b6b",
    fontSize: "12px",
    margin: 0,
  },
  progressBg: {
    background: "#f3f4f6",
    borderRadius: "10px",
    height: "10px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 0.5s ease, background 0.5s ease",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    background: "white",
    border: "1px solid #f0c8d4",
    color: "#8B0A2E",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  },
  btn: {
    width: "100%",
    background: "linear-gradient(135deg, #8B0A2E, #a01438)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 6px 16px rgba(139,10,46,0.25)",
  },
  tip: {
    margin: "12px 0 0 0",
    fontSize: "11px",
    color: "#8a6b6b",
    lineHeight: 1.5,
    textAlign: "center",
  },
};

export default ProfileCompletionCard;

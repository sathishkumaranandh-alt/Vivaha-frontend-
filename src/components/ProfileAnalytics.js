import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileAnalytics({ userId, isMobile }) {
  const [stats, setStats] = useState(null);
  const [recentViewers, setRecentViewers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BACKEND_URL}/profile/analytics/${userId}`)
      .then(r => r.json())
      .then(data => {
        setStats(data.stats || {});
        setRecentViewers(data.recentViewers || []);
      })
      .catch(err => console.error("Analytics fetch error:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return null;
  if (!stats) return null;

  const statCards = [
    { label: "Profile Views", value: stats.totalViews, icon: "👀", color: "#3b82f6" },
    { label: "Unique Visitors", value: stats.uniqueViewers, icon: "👥", color: "#8b5cf6" },
    { label: "Interests Received", value: stats.interestsReceived, icon: "💌", color: "#ec4899" },
    { label: "Mutual Matches", value: stats.interestsAccepted, icon: "💕", color: "#16a34a" },
    { label: "Times Shortlisted", value: stats.shortlisted, icon: "⭐", color: "#f59e0b" },
  ];

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h3 style={styles.title}>📊 Your Profile Analytics</h3>
        <p style={styles.subtitle}>See how your profile is performing</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
        gap: "10px",
        marginBottom: "20px"
      }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ ...styles.statCard, borderColor: `${s.color}30` }}>
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>{s.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "#8a6b6b", fontWeight: "600", textAlign: "center" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {recentViewers.length > 0 && (
        <div style={styles.recentSection}>
          <h4 style={styles.recentTitle}>👀 Recently Viewed By</h4>
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
            {recentViewers.map(v => (
              <Link
                key={v.id}
                to={`/profile/${v.id}`}
                style={{ minWidth: "90px", textDecoration: "none", textAlign: "center", flexShrink: 0 }}
              >
                <div style={{
                  position: "relative",
                  width: "60px", height: "60px", borderRadius: "50%",
                  background: "#f0e0e0", margin: "0 auto 6px",
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", color: "#8B0A2E", fontWeight: "800", border: "2px solid #f0c8d4"
                }}>
                  {v.photo_url ? (
                    <img 
                      src={v.photo_url} 
                      alt={v.name} 
                      style={{ 
                        width: "100%", height: "100%", objectFit: "cover",
                        filter: v.should_blur_photo ? "blur(8px)" : "none"
                      }} 
                    />
                  ) : (
                    (v.name || "?")[0].toUpperCase()
                  )}
                  {v.should_blur_photo && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: "18px"
                    }}>🔒</div>
                  )}
                </div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#2D1B1B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.name?.split(" ")[0] || "User"}
                </div>
                <div style={{ fontSize: "10px", color: "#8a6b6b" }}>
                  {v.age ? `${v.age}y` : ""}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={styles.tip}>
        💡 <b>Tip:</b> {stats.totalViews === 0
          ? "Complete your profile and add photos to start appearing in searches!"
          : stats.interestsReceived < 3
          ? "Add more photos and complete your bio to get more interests."
          : "Great going! Keep your profile active and updated."}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    background: "white", borderRadius: "16px", padding: "20px",
    border: "1px solid #f0e0e0", boxShadow: "0 4px 16px rgba(139,10,46,0.05)", marginBottom: "20px",
  },
  header: { marginBottom: "16px" },
  title: { fontFamily: "'Playfair Display', serif", color: "#8B0A2E", fontSize: "18px", margin: "0 0 2px 0", fontWeight: "800" },
  subtitle: { color: "#8a6b6b", fontSize: "12px", margin: 0 },
  statCard: {
    background: "#fafafa", border: "1.5px solid", borderRadius: "12px",
    padding: "14px 8px", textAlign: "center", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  recentSection: { borderTop: "1px solid #f0e0e0", paddingTop: "16px", marginTop: "8px" },
  recentTitle: { fontSize: "13px", fontWeight: "800", color: "#8B0A2E", margin: "0 0 12px 0" },
  tip: {
    background: "#FFF9F5", border: "1px dashed #f0c8d4", borderRadius: "10px",
    padding: "10px 14px", fontSize: "12px", color: "#8a6b6b", marginTop: "16px", lineHeight: 1.5,
  },
};

export default ProfileAnalytics;

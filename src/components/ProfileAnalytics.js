import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPageTheme, getCardStyle } from "../utils/pageTheme";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

// Helper — multiple possible field names-a support panna
function getPhotoUrl(user) {
  if (!user) return "";
  return (
    user.photo_url ||
    user.photo ||
    user.profile_photo ||
    user.primary_photo ||
    ""
  );
}

function ProfileAnalytics({ userId, isMobile }) {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [recentViewers, setRecentViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTheme, setPageTheme] = useState(getPageTheme("dashboard"));

  useEffect(() => {
    const handler = () => setPageTheme(getPageTheme("dashboard"));
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BACKEND_URL}/profile/analytics/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats || {});
        setRecentViewers(data.recentViewers || []);
        // Debug log — browser console la API response print aagum
        console.log("[ProfileAnalytics] recentViewers:", data.recentViewers);
      })
      .catch((err) => console.error("Analytics fetch error:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return null;
  if (!stats) return null;

  const pageHeading = pageTheme.heading;
  const pageMuted = pageTheme.muted;
  const cardStyle = getCardStyle(pageTheme);

  // Current page path — Back button correct-a work aagum
  const fromPath = location.pathname + location.search;

  const statCards = [
    { label: "Profile Views", value: stats.totalViews, icon: "👀", color: "#3b82f6" },
    { label: "Unique Visitors", value: stats.uniqueViewers, icon: "👥", color: "#8b5cf6" },
    { label: "Interests Received", value: stats.interestsReceived, icon: "💌", color: "#ec4899" },
    { label: "Mutual Matches", value: stats.interestsAccepted, icon: "💕", color: "#16a34a" },
    { label: "Times Shortlisted", value: stats.shortlisted, icon: "⭐", color: "#f59e0b" },
  ];

  return (
    <div style={{ ...cardStyle, marginBottom: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            color: pageHeading,
            fontSize: "18px",
            margin: "0 0 2px 0",
            fontWeight: "800",
          }}
        >
          📊 Your Profile Analytics
        </h3>
        <p style={{ color: pageMuted, fontSize: "12px", margin: 0 }}>
          See how your profile is performing
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {statCards.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#fafafa",
              border: `1.5px solid ${s.color}30`,
              borderRadius: "12px",
              padding: "14px 8px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>{s.icon}</div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "800",
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: pageMuted,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent viewers */}
      {recentViewers.length > 0 && (
        <div
          style={{
            borderTop: `1px solid ${pageTheme.cardBorder}`,
            paddingTop: "16px",
            marginTop: "8px",
          }}
        >
          <h4
            style={{
              fontSize: "13px",
              fontWeight: "800",
              color: pageHeading,
              margin: "0 0 12px 0",
            }}
          >
            👀 Recently Viewed By
          </h4>
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
          >
            {recentViewers.map((v) => {
              const photoUrl = getPhotoUrl(v);
              const initial = (v.name || "?")[0].toUpperCase();
              return (
                <Link
                  key={v.id}
                  to={`/profile/${v.id}`}
                  state={{ from: fromPath }}
                  style={{
                    minWidth: "90px",
                    textDecoration: "none",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
                      margin: "0 auto 6px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      color: pageHeading,
                      fontWeight: "800",
                      border: `2px solid ${pageTheme.cardBorder}`,
                    }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={v.name || "Viewer"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: v.should_blur_photo ? "blur(8px)" : "none",
                        }}
                        onError={(e) => {
                          // Photo broken-a irundha, initials fallback
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<span style="font-size:22px;font-weight:800;color:#8B0A2E;">${initial}</span>`;
                        }}
                      />
                    ) : (
                      initial
                    )}
                    {v.should_blur_photo && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          fontSize: "18px",
                        }}
                      >
                        🔒
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: pageHeading,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v.name?.split(" ")[0] || "User"}
                  </div>
                  <div style={{ fontSize: "10px", color: pageMuted }}>
                    {v.age ? `${v.age}y` : ""}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tip */}
      <div
        style={{
          background: "#FFF9F5",
          border: `1px dashed ${pageTheme.cardBorder}`,
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "12px",
          color: pageMuted,
          marginTop: "16px",
          lineHeight: 1.5,
        }}
      >
        💡 <b>Tip:</b>{" "}
        {stats.totalViews === 0
          ? "Complete your profile and add photos to start appearing in searches!"
          : stats.interestsReceived < 3
          ? "Add more photos and complete your bio to get more interests."
          : "Great going! Keep your profile active and updated."}
      </div>
    </div>
  );
}

export default ProfileAnalytics;

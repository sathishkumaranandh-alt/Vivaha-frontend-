import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({
    matches: 0,
    interests: 0,
    shortlisted: 0,
    messages: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setUser(user);

        // Load my profile
        const profileRes = await fetch(`${BACKEND_URL}/profile/${user.id}`);
        let myProfile = null;
        if (profileRes.ok) {
          const data = await profileRes.json();
          myProfile = data.profile;
          setProfile(myProfile);
        }

        // Load counts in parallel
        const [intRes, shortRes, msgRes, matchRes] = await Promise.all([
          fetch(`${BACKEND_URL}/interests/received/${user.id}?status=pending`),
          fetch(`${BACKEND_URL}/interests/shortlisted/${user.id}`),
          fetch(`${BACKEND_URL}/messages/unread/${user.id}`),
          fetch(`${BACKEND_URL}/interests/received/${user.id}?status=accepted`),
        ]);

        const newCounts = { matches: 0, interests: 0, shortlisted: 0, messages: 0 };
        if (intRes.ok) newCounts.interests = (await intRes.json()).total || 0;
        if (shortRes.ok) newCounts.shortlisted = (await shortRes.json()).total || 0;
        if (msgRes.ok) newCounts.messages = (await msgRes.json()).unreadCount || 0;
        if (matchRes.ok) newCounts.matches = (await matchRes.json()).total || 0;
        setCounts(newCounts);

        // ⭐ SUGGESTED PROFILES — filtered by OPPOSITE gender + same community
        const myGender = myProfile?.gender || null;
        const oppositeGender =
          myGender === "male" ? "female" : myGender === "female" ? "male" : "";

        const params = new URLSearchParams();
        if (oppositeGender) params.append("gender", oppositeGender);
        if (myProfile?.community) params.append("community", myProfile.community);

        const searchUrl = `${BACKEND_URL}/profile/search${
          params.toString() ? "?" + params.toString() : ""
        }`;

        const recRes = await fetch(searchUrl);
        if (recRes.ok) {
          const data = await recRes.json();
          const filtered = (data.results || [])
            .filter((u) => u.id !== user.id)
            .filter((u) => !oppositeGender || u.gender === oppositeGender)
            .slice(0, 3);
          setRecent(filtered);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const completion = (() => {
    if (!profile) return 0;
    const fields = ["name", "age", "gender", "religion", "location", "education", "occupation", "bio", "photo_url", "community"];
    const filled = fields.filter((f) => profile[f] && String(profile[f]).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  })();

  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#8a6b6b", marginTop: "16px" }}>Loading dashboard...</p>
      </div>
    );
  }

  const S = {
    page: { background: "#FFF9F5", minHeight: "calc(100vh - 70px)" },
    layout: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "16px" : "28px 32px 60px",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: isMobile ? undefined : "240px 1fr",
      gap: "24px",
      alignItems: "start",
    },
    sidebar: {
      background: "white",
      borderRadius: "14px",
      padding: "16px",
      boxShadow: "0 2px 12px rgba(139,10,46,0.05)",
      border: "1px solid #f0e0e0",
      position: isMobile ? "static" : "sticky",
      top: "90px",
      marginBottom: isMobile ? "16px" : 0,
    },
    navItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "11px 14px",
      borderRadius: "10px",
      color: "#8a6b6b",
      textDecoration: "none",
      fontSize: "13px",
      fontWeight: 600,
      marginBottom: "2px",
      cursor: "pointer",
    },
    navItemActive: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "11px 14px",
      borderRadius: "10px",
      background: "#8B0A2E",
      color: "white",
      fontSize: "13px",
      fontWeight: 600,
      marginBottom: "2px",
      cursor: "pointer",
    },
    badgeDot: {
      marginLeft: "auto",
      background: "#D4A017",
      color: "#8B0A2E",
      fontSize: "10px",
      padding: "2px 7px",
      borderRadius: "10px",
      fontWeight: 700,
    },
    header: { marginBottom: "20px" },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "26px",
      fontWeight: 700,
      color: "#8B0A2E",
      marginBottom: "4px",
    },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    completionCard: {
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      color: "white",
      borderRadius: "16px",
      padding: isMobile ? "16px" : "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginBottom: "24px",
      flexWrap: "wrap",
    },
    completionRing: {
      width: "70px",
      height: "70px",
      borderRadius: "50%",
      background: `conic-gradient(#D4A017 0% ${completion}%, rgba(255,255,255,0.15) ${completion}% 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      flexShrink: 0,
    },
    completionRingInner: {
      position: "absolute",
      inset: "6px",
      background: "#8B0A2E",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 800,
      fontSize: "16px",
    },
    completionText: { flex: 1, minWidth: "160px" },
    completeBtn: {
      background: "#D4A017",
      color: "#8B0A2E",
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      fontWeight: 700,
      fontSize: "12px",
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "none",
      display: "inline-block",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: isMobile ? "10px" : "16px",
      marginBottom: "24px",
    },
    statCard: {
      background: "white",
      borderRadius: "12px",
      padding: isMobile ? "14px" : "18px",
      border: "1px solid #f0e0e0",
    },
    statTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "10px",
    },
    statValue: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "26px" : "32px",
      fontWeight: 700,
      color: "#8B0A2E",
      lineHeight: 1,
      marginBottom: "4px",
    },
    statLabel: { fontSize: "11px", color: "#8a6b6b", fontWeight: 500 },
    sectionHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: "14px",
    },
    rvGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: "16px",
    },
    rvCard: {
      background: "white",
      borderRadius: "14px",
      padding: "16px",
      border: "1px solid #f0e0e0",
      display: "flex",
      gap: "12px",
      alignItems: "center",
    },
    rvPhoto: {
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "26px",
      flexShrink: 0,
      overflow: "hidden",
    },
    rvName: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#8B0A2E",
      marginBottom: "2px",
    },
    rvMeta: { fontSize: "11px", color: "#8a6b6b", marginBottom: "8px" },
    rvBtn: {
      background: "#8B0A2E",
      color: "white",
      border: "none",
      padding: "5px 12px",
      borderRadius: "6px",
      fontSize: "10px",
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-block",
      fontFamily: "inherit",
    },
    quote: {
      background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
      border: "1px solid #f0e0e0",
      borderRadius: "14px",
      padding: isMobile ? "20px" : "28px 32px",
      marginTop: "24px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
    },
  };

  return (
    <div style={S.page}>
      <div style={S.layout}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <div style={S.navItemActive}>🏠 Dashboard</div>
          <Link to={`/profile`} style={S.navItem}>
            👤 My Profile
          </Link>
          <Link to="/matches" style={S.navItem}>
            💕 My Matches
          </Link>
          <Link to="/interests?tab=shortlisted" style={S.navItem}>
            ♡ Shortlisted Profiles
          </Link>
          <Link to="/interests?tab=received" style={S.navItem}>
            💌 Interests Received
          </Link>
          <Link to="/interests?tab=sent" style={S.navItem}>
            📤 Interests Sent
          </Link>
          <Link to="/messages" style={S.navItem}>
            💬 Messages
            {counts.messages > 0 && (
              <span style={S.badgeDot}>{counts.messages}</span>
            )}
          </Link>
          <Link to="/admin-settings" style={S.navItem}>
            ⚙️ Settings
          </Link>
        </aside>

        {/* MAIN */}
        <main>
          <div style={S.header}>
            <h1 style={S.h1}>My Dashboard</h1>
            <p style={S.sub}>
              Welcome back, {profile?.name || user?.email?.split("@")[0] || "there"}! Here's what's happening with your profile.
            </p>
          </div>

          {/* Completion */}
          <div style={S.completionCard}>
            <div style={S.completionRing}>
              <div style={S.completionRingInner}>{completion}%</div>
            </div>
            <div style={S.completionText}>
              <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
                Profile Completion
              </div>
              <div style={{ fontSize: "12px", opacity: 0.85 }}>
                {completion < 80
                  ? "Complete your profile to get better matches"
                  : "Great! Your profile is well-filled"}
              </div>
            </div>
            <Link to="/profile" style={S.completeBtn}>
              {completion < 100 ? "Complete Now →" : "View Profile →"}
            </Link>
          </div>

          {/* Stats */}
          <div style={S.statsGrid}>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>💕</span>
                <Link to="/matches" style={{ fontSize: "11px", color: "#8B0A2E", textDecoration: "none", fontWeight: 600 }}>
                  View All →
                </Link>
              </div>
              <div style={S.statValue}>{counts.matches}</div>
              <div style={S.statLabel}>New Matches</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>💌</span>
                <Link to="/interests" style={{ fontSize: "11px", color: "#8B0A2E", textDecoration: "none", fontWeight: 600 }}>
                  View All →
                </Link>
              </div>
              <div style={S.statValue}>{counts.interests}</div>
              <div style={S.statLabel}>Interests Received</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>♡</span>
                <Link to="/interests?tab=shortlisted" style={{ fontSize: "11px", color: "#8B0A2E", textDecoration: "none", fontWeight: 600 }}>
                  View All →
                </Link>
              </div>
              <div style={S.statValue}>{counts.shortlisted}</div>
              <div style={S.statLabel}>Shortlisted Profiles</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>💬</span>
                <Link to="/messages" style={{ fontSize: "11px", color: "#8B0A2E", textDecoration: "none", fontWeight: 600 }}>
                  View All →
                </Link>
              </div>
              <div style={S.statValue}>{counts.messages}</div>
              <div style={S.statLabel}>Unread Messages</div>
            </div>
          </div>

          {/* Suggested */}
          <div style={S.sectionHead}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#8B0A2E", margin: 0 }}>
              Suggested Profiles
            </h2>
            <Link to="/search" style={{ color: "#8B0A2E", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          <div style={S.rvGrid}>
            {recent.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", background: "white", padding: "40px", borderRadius: "14px", textAlign: "center", border: "1px solid #f0e0e0" }}>
                <div style={{ fontSize: "50px", marginBottom: "8px" }}>🔎</div>
                <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
                  No suggestions yet.{" "}
                  <Link to="/profile" style={{ color: "#8B0A2E", fontWeight: "bold" }}>
                    Complete your profile
                  </Link>{" "}
                  to see personalized matches.
                </p>
              </div>
            ) : (
              recent.map((u) => (
                <div key={u.id} style={S.rvCard}>
                  <div style={S.rvPhoto}>
                    {u.photo_url ? (
                      <img
                        src={u.photo_url}
                        alt={u.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.rvName}>{u.name || "Anonymous"}</div>
                    <div style={S.rvMeta}>
                      {u.age ? `${u.age} yrs` : ""}
                      {u.age && u.location ? " • " : ""}
                      {u.location || ""}
                    </div>
                    <Link to={`/profile/${u.id}`} style={S.rvBtn}>
                      View Profile
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quote */}
          <div style={S.quote}>
            <div style={{ fontSize: "32px" }}>💑</div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: isMobile ? "14px" : "16px", color: "#8B0A2E", lineHeight: 1.5, margin: 0 }}>
              "A good marriage is not just about finding the right person, but
              about building a beautiful future together."
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #f0e0e0",
  borderTop: "4px solid #8B0A2E",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

export default Dashboard;

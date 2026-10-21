import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { getPageTheme, getCardStyle } from "../utils/pageTheme";
import ProfileAnalytics from "../components/ProfileAnalytics";
import ProfileCompletionCard from "../components/ProfileCompletionCard";
import ProfileCard from "../components/ProfileCard";
import HeroProfileSlider from "../components/HeroProfileSlider";
import { apiFetch } from "../utils/api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState("free");
  const [counts, setCounts] = useState({
    matches: 0,
    interests: 0,
    shortlisted: 0,
    messages: 0,
  });
  const [recent, setRecent] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const [pageTheme, setPageTheme] = useState(getPageTheme("dashboard"));

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const handler = () => setPageTheme(getPageTheme("dashboard"));
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
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

        const profileRes = await apiFetch(`/profile/${user.id}`);
        let myProfile = null;
        if (profileRes.ok) {
          const data = await profileRes.json();
          myProfile = data.profile;
          setProfile(myProfile);
        }

        const [intRes, shortRes, msgRes, matchRes] = await Promise.all([
          apiFetch(`/interests/received/${user.id}?status=pending`),
          apiFetch(`/interests/shortlisted/${user.id}`),
          apiFetch(`/messages/unread/${user.id}`),
          apiFetch(`/interests/received/${user.id}?status=accepted`),
        ]);

        const newCounts = { matches: 0, interests: 0, shortlisted: 0, messages: 0 };
        if (intRes.ok) newCounts.interests = (await intRes.json()).total || 0;
        if (shortRes.ok) newCounts.shortlisted = (await shortRes.json()).total || 0;
        if (msgRes.ok) newCounts.messages = (await msgRes.json()).unreadCount || 0;
        if (matchRes.ok) newCounts.matches = (await matchRes.json()).total || 0;
        setCounts(newCounts);

        let recList = [];
        try {
          const recRes = await apiFetch(`/profile/recommendations/${user.id}`);
          if (recRes.ok) {
            const data = await recRes.json();
            recList = data.recommendations || [];
            console.log("📥 Recommendations count:", recList.length);
          } else {
            console.warn("⚠️ Recommendations API failed:", recRes.status);
          }
        } catch (e) {
          console.error("❌ Recommendations error:", e);
        }

        if (recList.length === 0 && myProfile) {
          console.log("⚠️ Empty recommendations, using fallback search...");
          const myGender = (myProfile.gender || "").toLowerCase();
          const opposite = myGender === "male" ? "female" : "male";

          try {
            const fbRes = await apiFetch(`/profile/search?gender=${opposite}`);
            if (fbRes.ok) {
              const fbData = await fbRes.json();
              recList = (fbData.results || [])
                .filter((p) => p.id !== user.id)
                .slice(0, 12);
              console.log("📥 Fallback count:", recList.length);
            }
          } catch (e) {
            console.error("❌ Fallback error:", e);
          }
        }

        if (recList.length === 0) {
          console.log("⚠️ Still empty, fetching all profiles...");
          try {
            const allRes = await apiFetch(`/profile/search`);
            if (allRes.ok) {
              const allData = await allRes.json();
              recList = (allData.results || [])
                .filter((p) => p.id !== user.id)
                .slice(0, 12);
              console.log("📥 All profiles count:", recList.length);
            }
          } catch (e) {
            console.error("❌ All profiles error:", e);
          }
        }

        setRecent(recList);

        const planRes = await apiFetch(`/plans/user-plan/${user.id}`);
        if (planRes.ok) {
          const data = await planRes.json();
          setPlan((data.plan || "Free").toLowerCase());
        }

        if (myProfile?.location && myProfile.location.trim()) {
          try {
            const gender =
              (myProfile.gender || "").toLowerCase() === "male"
                ? "female"
                : "male";
            const params = new URLSearchParams();
            params.append("location", myProfile.location);
            params.append("gender", gender);

            const nearbyRes = await apiFetch(`/profile/search?${params.toString()}`);
            if (nearbyRes.ok) {
              const nearbyData = await nearbyRes.json();
              const list = (nearbyData.results || [])
                .filter((p) => p.id !== user.id)
                .slice(0, 8);
              setNearby(list);
            }
          } catch (err) {
            console.error("Nearby fetch error:", err);
          }
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          background: `radial-gradient(circle at 50% 50%, #fff5f5 0%, ${pageTheme.bg} 100%)`,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={spinnerStyle} />
        <p style={{ color: pageTheme.muted, marginTop: "16px", fontWeight: 500 }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  const pageBg = pageTheme.bg;
  const pageHeading = pageTheme.heading;
  const pageBody = pageTheme.body;
  const pageMuted = pageTheme.muted;
  const pageLink = pageTheme.link;
  const baseSize = `${pageTheme.baseSize}px`;
  const headingSize = `${pageTheme.headingSize}px`;
  const headingSizeMobile = `${Math.round(pageTheme.headingSize * 0.85)}px`;

  const glassCardStyle = {
    background: "rgba(255, 255, 255, 0.45)",
    backdropFilter: "blur(16px) saturate(120%)",
    WebkitBackdropFilter: "blur(16px) saturate(120%)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.65)",
    boxShadow: "0 8px 32px 0 rgba(139, 10, 46, 0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
    padding: "24px",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
  };

  const S = {
    page: {
      background: `radial-gradient(circle at top right, rgba(253, 242, 246, 0.8), transparent 40%), 
                  radial-gradient(circle at bottom left, rgba(255, 249, 245, 0.8), transparent 40%), ${pageBg}`,
      minHeight: "calc(100vh - 70px)",
      fontSize: baseSize,
      color: pageBody,
      boxSizing: "border-box",
    },
    layout: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "16px" : "28px 32px 60px",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: isMobile ? undefined : "260px 1fr",
      gap: "28px",
      alignItems: "start",
    },
    sidebar: {
      ...glassCardStyle,
      padding: "16px",
      position: isMobile ? "static" : "sticky",
      top: "90px",
      marginBottom: isMobile ? "16px" : 0,
      background: "rgba(255, 255, 255, 0.6)",
    },
    navItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "14px",
      color: pageBody,
      textDecoration: "none",
      fontSize: "13.5px",
      fontWeight: 500,
      marginBottom: "4px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    navItemActive: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #8B0A2E 0%, #b81d4a 100%)",
      color: "white",
      fontSize: "13.5px",
      fontWeight: 600,
      marginBottom: "4px",
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(139, 10, 46, 0.25)",
    },
    badgeDot: {
      marginLeft: "auto",
      background: "linear-gradient(135deg, #FFD700 0%, #D4A017 100%)",
      color: "#8B0A2E",
      fontSize: "10px",
      padding: "3px 8px",
      borderRadius: "20px",
      fontWeight: 700,
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    },
    header: { marginBottom: "24px" },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? headingSizeMobile : headingSize,
      fontWeight: 800,
      color: pageHeading,
      marginBottom: "6px",
      letterSpacing: "-0.5px",
    },
    sub: { color: pageMuted, fontSize: baseSize, margin: 0, fontWeight: 500 },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: isMobile ? "12px" : "18px",
      marginBottom: "28px",
    },
    statCard: { 
      ...glassCardStyle,
      padding: "20px",
    },
    statTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px",
    },
    statValue: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "28px" : "36px",
      fontWeight: 800,
      color: pageHeading,
      lineHeight: 1,
      marginBottom: "6px",
    },
    statLabel: { fontSize: "12px", color: pageMuted, fontWeight: 600, letterSpacing: "0.2px" },
    sectionHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "26px",
      fontWeight: 700,
      color: pageHeading,
      margin: 0,
    },
    viewAll: {
      color: pageLink,
      fontSize: "13px",
      fontWeight: 700,
      textDecoration: "none",
      padding: "6px 12px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.5)",
      border: "1px solid rgba(255, 255, 255, 0.7)",
      transition: "all 0.2s ease",
    },
    quote: {
      ...glassCardStyle,
      background: "linear-gradient(135deg, rgba(253, 242, 246, 0.6) 0%, rgba(255, 249, 245, 0.6) 100%)",
      marginTop: "28px",
      display: "flex",
      alignItems: "center",
      gap: "24px",
      border: "1px solid rgba(255, 255, 255, 0.8)",
    },
    emptyState: {
      ...glassCardStyle,
      gridColumn: "1 / -1",
      textAlign: "center",
      padding: "50px 20px",
    },
  };

  return (
    <div style={S.page}>
      <style>{`
        .vivah-carousel {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .vivah-carousel::-webkit-scrollbar {
          display: none;
        }
        .vivah-carousel-arrow {
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.2s ease;
        }
        .vivah-carousel-wrap:hover .vivah-carousel-arrow {
          opacity: 1;
        }
        .vivah-carousel-arrow:hover {
          transform: translateY(-50%) scale(1.1) !important;
        }
        .glass-nav-item:hover {
          background: rgba(255, 255, 255, 0.5) !important;
          transform: translateX(4px);
        }
        .glass-stat-card:hover {
          transform: translateY(-6px);
          background: rgba(255, 255, 255, 0.6) !important;
          box-shadow: 0 12px 40px 0 rgba(139, 10, 46, 0.08) !important;
        }
        .glass-btn-viewall:hover {
          background: #8B0A2E !important;
          color: white !important;
        }
      `}</style>

      <div style={S.layout}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <div style={S.navItemActive}>🏠 Dashboard</div>
          <Link to={`/profile`} className="glass-nav-item" style={S.navItem}>👤 My Profile</Link>
          <Link to="/matches" className="glass-nav-item" style={S.navItem}>💕 My Matches</Link>
          <Link to="/interests?tab=shortlisted" className="glass-nav-item" style={S.navItem}>♡ Shortlisted Profiles</Link>
          <Link to="/interests?tab=received" className="glass-nav-item" style={S.navItem}>💌 Interests Received</Link>
          <Link to="/interests?tab=sent" className="glass-nav-item" style={S.navItem}>📤 Interests Sent</Link>
          <Link to="/messages" className="glass-nav-item" style={S.navItem}>
            💬 Messages
            {counts.messages > 0 && <span style={S.badgeDot}>{counts.messages}</span>}
          </Link>
          <Link to="/visitors" className="glass-nav-item" style={S.navItem}>👀 Who Viewed Me</Link>
          <Link to="/settings" className="glass-nav-item" style={S.navItem}>⚙️ Settings</Link>
        </aside>

        {/* MAIN CONTENT */}
        <main>
          <div style={S.header}>
            <h1 style={S.h1}>My Dashboard</h1>
            <p style={S.sub}>
              Welcome back,{" "}
              {profile?.name || user?.email?.split("@")[0] || "there"}!{" "}
              <span
                style={{
                  background:
                    plan === "platinum"
                      ? "rgba(252, 231, 243, 0.7)"
                      : plan === "gold"
                      ? "rgba(254, 243, 199, 0.7)"
                      : "rgba(243, 244, 246, 0.7)",
                  backdropFilter: "blur(4px)",
                  color:
                    plan === "platinum"
                      ? "#9f1239"
                      : plan === "gold"
                      ? "#92400e"
                      : "#4b5563",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  marginLeft: "6px",
                  border: "1px solid rgba(255,255,255,0.4)",
                  textTransform: "capitalize",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {plan === "platinum" ? "💎" : plan === "gold" ? "🥇" : "👤"} {plan}
              </span>
            </p>
          </div>

          {/* 📍 NEAR BY YOU */}
          {((nearby && nearby.length > 0) ||
            (recent && recent.length > 0)) && (
            <div
              style={{
                ...glassCardStyle,
                marginBottom: "28px",
                padding: isMobile ? "20px" : "26px",
                background: "linear-gradient(135deg, rgba(255, 249, 245, 0.5) 0%, rgba(253, 242, 246, 0.5) 100%)",
                overflow: "hidden",
              }}
            >
              <div style={S.sectionHead}>
                <div>
                  <h2 style={S.sectionTitle}>
                    {nearby && nearby.length > 0
                      ? "📍 Near By You"
                      : "🔥 For You"}
                  </h2>
                  <p style={{ color: pageMuted, fontSize: "12.5px", margin: "4px 0 0 0", fontWeight: 500 }}>
                    {nearby && nearby.length > 0
                      ? `Profiles from ${profile?.location || "your area"}`
                      : "Personalized matches for you"}
                  </p>
                </div>
                {nearby && nearby.length > 0 && profile?.location && (
                  <Link
                    to={`/search?location=${encodeURIComponent(profile.location)}`}
                    className="glass-btn-viewall"
                    style={S.viewAll}
                  >
                    View All →
                  </Link>
                )}
              </div>
              <HeroProfileSlider
                profiles={
                  nearby && nearby.length > 0
                    ? nearby
                    : (recent || []).slice(0, 8)
                }
                isMobile={isMobile}
              />
            </div>
          )}

          <ProfileCompletionCard profile={profile || {}} isMobile={isMobile} />

          {user?.id && <ProfileAnalytics userId={user.id} isMobile={isMobile} />}

          {/* STATS TILES GRID */}
          <div style={S.statsGrid}>
            <div className="glass-stat-card" style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "22px" }}>💕</span>
                <Link to="/matches" className="glass-btn-viewall" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.matches}</div>
              <div style={S.statLabel}>New Matches</div>
            </div>
            <div className="glass-stat-card" style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "22px" }}>💌</span>
                <Link to="/interests" className="glass-btn-viewall" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.interests}</div>
              <div style={S.statLabel}>Interests Received</div>
            </div>
            <div className="glass-stat-card" style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "22px" }}>♡</span>
                <Link to="/interests?tab=shortlisted" className="glass-btn-viewall" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.shortlisted}</div>
              <div style={S.statLabel}>Shortlisted Profiles</div>
            </div>
            <div className="glass-stat-card" style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "22px" }}>💬</span>
                <Link to="/messages" className="glass-btn-viewall" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.messages}</div>
              <div style={S.statLabel}>Unread Messages</div>
            </div>
          </div>

          {/* RECOMMENDATIONS */}
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>💫 Recommended for You</h2>
            <Link to="/recommendations" className="glass-btn-viewall" style={S.viewAll}>
              View All →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔎</div>
              <p style={{ color: pageMuted, fontSize: baseSize, margin: 0, fontWeight: 500 }}>
                No suggestions yet.{" "}
                <Link to="/profile" style={{ color: pageLink, fontWeight: "bold" }}>
                  Complete your profile
                </Link>{" "}
                to see personalized matches.
              </p>
            </div>
          ) : (
            <RecommendedCarousel profiles={recent} isMobile={isMobile} glassCardStyle={glassCardStyle} />
          )}

          {/* QUOTE BLOCK */}
          <div style={S.quote}>
            <div style={{ fontSize: "36px" }}>💑</div>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontSize: isMobile ? "14px" : "16px",
                color: pageHeading,
                lineHeight: 1.6,
                margin: 0,
                fontWeight: 500,
              }}
            >
              "A good marriage is not just about finding the right person, but about building a beautiful future together."
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function RecommendedCarousel({ profiles, isMobile, glassCardStyle }) {
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setShowLeftFade(el.scrollLeft > 10);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const cardW = isMobile ? 150 : 190;
    scrollRef.current.scrollBy({ left: dir * cardW * 2, behavior: "smooth" });
  };

  if (!profiles || profiles.length === 0) return null;

  const cardWidth = isMobile ? "150px" : "190px";

  return (
    <div style={{ position: "relative" }} className="vivah-carousel-wrap">
      <div
        ref={scrollRef}
        className="vivah-carousel"
        onScroll={handleScroll}
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          padding: "8px 4px 16px 4px",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {profiles.map((u) => (
          <div
            key={u.id}
            style={{
              flex: "0 0 auto",
              width: cardWidth,
              scrollSnapAlign: "start",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "20px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
              backdropFilter: "blur(5px)",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            <ProfileCard user={u} isMobile={isMobile} />
          </div>
        ))}
      </div>

      {showLeftFade && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "40px",
            background: "linear-gradient(90deg, rgba(254, 246, 249, 0.9), rgba(255,255,255,0))",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      )}

      {showRightFade && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "40px",
            background: "linear-gradient(270deg, rgba(254, 246, 249, 0.9), rgba(255,255,255,0))",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      )}

      {!isMobile && profiles.length > 2 && (
        <>
          <button
            onClick={() => scroll(-1)}
            className="vivah-carousel-arrow"
            style={{
              position: "absolute",
              left: "-18px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.6)",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(8px)",
              color: "#8B0A2E",
              fontSize: "22px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(139,10,46,0.12)",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            className="vivah-carousel-arrow"
            style={{
              position: "absolute",
              right: "-18px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.6)",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(8px)",
              color: "#8B0A2E",
              fontSize: "22px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(139,10,46,0.12)",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Scroll right"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

const spinnerStyle = {
  width: "44px",
  height: "44px",
  border: "4px solid rgba(139, 10, 46, 0.1)",
  borderTop: "4px solid #8B0A2E",
  borderRadius: "50%",
  animation: "spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite",
  margin: "0 auto",
};

export default Dashboard;

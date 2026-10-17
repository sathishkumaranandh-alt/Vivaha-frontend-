import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { getPageTheme, getCardStyle } from "../utils/pageTheme";
import ProfileAnalytics from "../components/ProfileAnalytics";
import ProfileCompletionCard from "../components/ProfileCompletionCard";
import ProfileCard from "../components/ProfileCard";
import HeroProfileSlider from "../components/HeroProfileSlider";
import { apiFetch } from "../utils/api";
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

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

        // ============================================
        // 🔧 FIX: Recommendations + Fallback to Search
        // ============================================
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

        // 🔧 FALLBACK: If empty, fetch from search API
        if (recList.length === 0 && myProfile) {
          console.log("⚠️ Empty recommendations, using fallback search...");
          const myGender = (myProfile.gender || "").toLowerCase();
          const opposite = myGender === "male" ? "female" : "male";

          try {
            const fbRes = await fetch(
              `${BACKEND_URL}/profile/search?gender=${opposite}&viewerId=${user.id}`
            );
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

        // 🔧 SECOND FALLBACK: If still empty, fetch without gender filter
        if (recList.length === 0) {
          console.log("⚠️ Still empty, fetching all profiles...");
          try {
            const allRes = await fetch(
              `${BACKEND_URL}/profile/search?viewerId=${user.id}`
            );
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

        const planRes = await fetch(`${BACKEND_URL}/plans/user-plan/${user.id}`);
        if (planRes.ok) {
          const data = await planRes.json();
          setPlan((data.plan || "Free").toLowerCase());
        }

        // Fetch nearby profiles based on user's location
        if (myProfile?.location && myProfile.location.trim()) {
          try {
            const gender =
              (myProfile.gender || "").toLowerCase() === "male"
                ? "female"
                : "male";
            const params = new URLSearchParams();
            params.append("location", myProfile.location);
            params.append("gender", gender);
            params.append("viewerId", user.id);

            const nearbyRes = await fetch(
              `${BACKEND_URL}/profile/search?${params.toString()}`
            );
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
          background: pageTheme.bg,
          minHeight: "100vh",
        }}
      >
        <div style={spinnerStyle} />
        <p style={{ color: pageTheme.muted, marginTop: "16px" }}>
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

  const cardStyle = getCardStyle(pageTheme);

  const S = {
    page: {
      background: pageBg,
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
      gridTemplateColumns: isMobile ? undefined : "240px 1fr",
      gap: "24px",
      alignItems: "start",
    },
    sidebar: {
      ...cardStyle,
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
      color: pageMuted,
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
      background: pageLink,
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
      fontSize: isMobile ? headingSizeMobile : headingSize,
      fontWeight: 700,
      color: pageHeading,
      marginBottom: "4px",
    },
    sub: { color: pageMuted, fontSize: baseSize, margin: 0 },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: isMobile ? "10px" : "16px",
      marginBottom: "24px",
    },
    statCard: { ...cardStyle },
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
      color: pageHeading,
      lineHeight: 1,
      marginBottom: "4px",
    },
    statLabel: { fontSize: "11px", color: pageMuted, fontWeight: 500 },
    sectionHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: "14px",
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "20px" : "24px",
      color: pageHeading,
      margin: 0,
    },
    viewAll: {
      color: pageLink,
      fontSize: "13px",
      fontWeight: 600,
      textDecoration: "none",
    },
    quote: {
      ...cardStyle,
      background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
      marginTop: "24px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
    },
    emptyState: {
      ...cardStyle,
      gridColumn: "1 / -1",
      textAlign: "center",
      padding: "40px 20px",
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
      `}</style>

      <div style={S.layout}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <div style={S.navItemActive}>🏠 Dashboard</div>
          <Link to={`/profile`} style={S.navItem}>👤 My Profile</Link>
          <Link to="/matches" style={S.navItem}>💕 My Matches</Link>
          <Link to="/interests?tab=shortlisted" style={S.navItem}>♡ Shortlisted Profiles</Link>
          <Link to="/interests?tab=received" style={S.navItem}>💌 Interests Received</Link>
          <Link to="/interests?tab=sent" style={S.navItem}>📤 Interests Sent</Link>
          <Link to="/messages" style={S.navItem}>
            💬 Messages
            {counts.messages > 0 && <span style={S.badgeDot}>{counts.messages}</span>}
          </Link>
          <Link to="/visitors" style={S.navItem}>👀 Who Viewed Me</Link>
          <Link to="/settings" style={S.navItem}>⚙️ Settings</Link>
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
                      ? "#fce7f3"
                      : plan === "gold"
                      ? "#fef3c7"
                      : "#f3f4f6",
                  color:
                    plan === "platinum"
                      ? "#9f1239"
                      : plan === "gold"
                      ? "#92400e"
                      : "#4b5563",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  marginLeft: "6px",
                  textTransform: "capitalize",
                }}
              >
                {plan === "platinum" ? "💎" : plan === "gold" ? "🥇" : "👤"} {plan}
              </span>
            </p>
          </div>

          {/* ============================================ */}
          {/* 📍 NEAR BY YOU — with fallback to Recommended */}
          {/* ============================================ */}
          {((nearby && nearby.length > 0) ||
            (recent && recent.length > 0)) && (
            <div
              style={{
                ...cardStyle,
                marginBottom: "24px",
                padding: isMobile ? "16px" : "24px",
                background:
                  "linear-gradient(135deg, #FFF9F5 0%, #FDF2F6 100%)",
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
                  <p
                    style={{
                      color: pageMuted,
                      fontSize: "12px",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {nearby && nearby.length > 0
                      ? `Profiles from ${profile?.location || "your area"}`
                      : "Personalized matches for you"}
                  </p>
                </div>
                {nearby && nearby.length > 0 && profile?.location && (
                  <Link
                    to={`/search?location=${encodeURIComponent(
                      profile.location
                    )}`}
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

          <div style={S.statsGrid}>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>💕</span>
                <Link to="/matches" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.matches}</div>
              <div style={S.statLabel}>New Matches</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>💌</span>
                <Link to="/interests" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.interests}</div>
              <div style={S.statLabel}>Interests Received</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>♡</span>
                <Link to="/interests?tab=shortlisted" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.shortlisted}</div>
              <div style={S.statLabel}>Shortlisted Profiles</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statTop}>
                <span style={{ fontSize: "20px" }}>💬</span>
                <Link to="/messages" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.messages}</div>
              <div style={S.statLabel}>Unread Messages</div>
            </div>
          </div>

          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>💫 Recommended for You</h2>
            <Link to="/recommendations" style={S.viewAll}>
              View All →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: "50px", marginBottom: "8px" }}>🔎</div>
              <p style={{ color: pageMuted, fontSize: baseSize, margin: 0 }}>
                No suggestions yet.{" "}
                <Link
                  to="/profile"
                  style={{ color: pageLink, fontWeight: "bold" }}
                >
                  Complete your profile
                </Link>{" "}
                to see personalized matches.
              </p>
            </div>
          ) : (
            <RecommendedCarousel profiles={recent} isMobile={isMobile} />
          )}

          <div style={S.quote}>
            <div style={{ fontSize: "32px" }}>💑</div>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontSize: isMobile ? "14px" : "16px",
                color: pageHeading,
                lineHeight: 1.5,
                margin: 0,
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

/* ============================================ */
/* RECOMMENDED CAROUSEL */
/* ============================================ */
function RecommendedCarousel({ profiles, isMobile }) {
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
          gap: 0,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: "10px",
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
            width: "30px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0))",
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
            width: "30px",
            background:
              "linear-gradient(270deg, rgba(255,255,255,0.9), rgba(255,255,255,0))",
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
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "none",
              background: "white",
              color: "#8B0A2E",
              fontSize: "20px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
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
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "none",
              background: "white",
              color: "#8B0A2E",
              fontSize: "20px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
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
  width: "40px",
  height: "40px",
  border: "4px solid #f0e0e0",
  borderTop: "4px solid #8B0A2E",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

export default Dashboard;

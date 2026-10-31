import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { getPageTheme } from "../utils/pageTheme";
import ProfileAnalytics from "../components/ProfileAnalytics";
import ProfileCompletionCard from "../components/ProfileCompletionCard";
import ProfileCard from "../components/ProfileCard";
import HeroProfileSlider from "../components/HeroProfileSlider";
import { apiFetch } from "../utils/api";

/* ============================================ */
/* 🌿 GREEN GLASS THEME TOKENS                  */
/* ============================================ */
const PAGE_BG = "transparent"; // global Sunset Candy background comes from styles/glass-theme.css
const ACTIVE_NAV_BG = "linear-gradient(135deg, rgba(190,24,93,0.16), rgba(124,58,237,0.14))";
const C_BODY = "var(--vg-text)";
const C_HEADING = "var(--vg-accent)";
const C_MUTED = "var(--vg-muted)";

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
  const [showTgBanner, setShowTgBanner] = useState(false);
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

        // 📱 Telegram nudge: show only if not linked and not dismissed
        try {
          const dismissed = localStorage.getItem("tg_banner_dismissed") === "1";
          if (!dismissed) {
            const { data: tg } = await supabase
              .from("users")
              .select("telegram_chat_id")
              .eq("id", user.id)
              .single();
            if (tg && !tg.telegram_chat_id) setShowTgBanner(true);
          }
        } catch (e) { /* ignore */ }

        const profileRes = await apiFetch(`/profile/${user.id}`);
        let myProfile = null;
        if (profileRes.ok) {
          const data = await profileRes.json();
          myProfile = data.profile;
          setProfile(myProfile);
        }

        // 🛡️ SECURITY FIX: Switched to apiFetch for all 4 calls
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
            // 🛡️ SECURITY FIX: Switched to apiFetch & removed viewerId
            const fbRes = await apiFetch(
              `/profile/search?gender=${opposite}`
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
            // 🛡️ SECURITY FIX: Switched to apiFetch & removed viewerId
            const allRes = await apiFetch(
              `/profile/search`
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

        // 🛡️ SECURITY FIX: Switched to apiFetch
        const planRes = await apiFetch(`/plans/user-plan/${user.id}`);
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
            // 🛡️ SECURITY FIX: Removed viewerId

            const nearbyRes = await apiFetch(
              `/profile/search?${params.toString()}`
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
          background: PAGE_BG,
          minHeight: "100vh",
        }}
      >
        <div style={spinnerStyle} />
        <p style={{ color: C_MUTED, marginTop: "16px" }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  const pageHeading = C_HEADING;
  const pageMuted = C_MUTED;
  const pageLink = C_HEADING;
  const baseSize = `${pageTheme.baseSize}px`;
  const headingSize = `${pageTheme.headingSize}px`;
  const headingSizeMobile = `${Math.round(pageTheme.headingSize * 0.85)}px`;

  const cardStyle = {
    background: "rgba(255,255,255,0.64)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.88)",
    borderRadius: "22px",
    boxShadow: "0 10px 30px rgba(190,24,93,0.09)",
    padding: isMobile ? "16px" : "22px",
    boxSizing: "border-box",
  };

  const S = {
    page: {
      background: PAGE_BG,
      minHeight: "calc(100vh - 70px)",
      fontSize: baseSize,
      color: C_BODY,
      boxSizing: "border-box",
    },
    layout: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: isMobile ? "14px" : "28px 32px 50px",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: isMobile ? undefined : "245px 1fr",
      gap: "22px",
      alignItems: "start",
    },
    sidebar: {
      background: "rgba(255,255,255,0.58)",
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      border: "1px solid rgba(255,255,255,0.85)",
      borderRadius: "24px",
      boxShadow: "0 12px 35px rgba(190,24,93,0.10)",
      padding: "18px",
      position: isMobile ? "static" : "sticky",
      top: "90px",
      marginBottom: isMobile ? "16px" : 0,
    },
    navItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "11px 14px",
      borderRadius: "14px",
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
      borderRadius: "999px",
      background: ACTIVE_NAV_BG,
      boxShadow: "0 6px 16px rgba(190,24,93,0.14)",
      color: "var(--vg-accent)",
      fontSize: "13px",
      fontWeight: 600,
      marginBottom: "2px",
      cursor: "pointer",
    },
    badgeDot: {
      marginLeft: "auto",
      background: "rgba(190,24,93,0.14)",
      color: "var(--vg-accent)",
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
    statCard: { ...cardStyle, transition: "transform .25s ease, box-shadow .25s ease" },
    iconBubble: {
      width: "40px", height: "40px", borderRadius: "14px", fontSize: "20px",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)",
      boxShadow: "0 4px 12px rgba(190,24,93,0.10)",
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap');

        /* ---- sidebar links ---- */
        .glx-nav { transition: background .2s ease, color .2s ease, transform .2s ease; }
        .glx-nav:hover { background: rgba(255,255,255,0.7); color: var(--vg-accent) !important; transform: translateX(3px); }

        /* ---- hover lift on stat cards ---- */
        .glx-lift:hover { transform: translateY(-4px); box-shadow: 0 16px 38px rgba(190,24,93,0.16) !important; }

        /* ---- existing child cards (analytics / profile completion) → same glass ---- */
        .glx-embed > div {
          background: rgba(255,255,255,0.64) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255,255,255,0.88) !important;
          border-radius: 22px !important;
          box-shadow: 0 10px 30px rgba(190,24,93,0.09) !important;
        }

        /* ---- browsers without backdrop-filter: stay readable ---- */
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .glx-embed > div { background: rgba(255,255,255,0.85) !important; }
        }

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
          <div className="glx-nav-active" style={S.navItemActive}>🏠 Dashboard</div>
          <Link to={`/profile`} className="glx-nav" style={S.navItem}>👤 My Profile</Link>
          <Link to="/matches" className="glx-nav" style={S.navItem}>💕 My Matches</Link>
          <Link to="/interests?tab=shortlisted" className="glx-nav" style={S.navItem}>♡ Shortlisted Profiles</Link>
          <Link to="/interests?tab=received" className="glx-nav" style={S.navItem}>💌 Interests Received</Link>
          <Link to="/interests?tab=sent" className="glx-nav" style={S.navItem}>📤 Interests Sent</Link>
          <Link to="/messages" className="glx-nav" style={S.navItem}>
            💬 Messages
            {counts.messages > 0 && <span style={S.badgeDot}>{counts.messages}</span>}
          </Link>
          <Link to="/visitors" className="glx-nav" style={S.navItem}>👀 Who Viewed Me</Link>
          <Link to="/settings" className="glx-nav" style={S.navItem}>⚙️ Settings</Link>
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
                      ? "rgba(190,24,93,0.12)"
                      : plan === "gold"
                      ? "#fef3c7"
                      : "rgba(255,255,255,0.6)",
                  color:
                    plan === "platinum"
                      ? "var(--vg-accent)"
                      : plan === "gold"
                      ? "#92400e"
                      : "var(--vg-muted)",
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

          {showTgBanner && (
            <div
              style={{
                ...cardStyle,
                marginBottom: "20px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: "26px" }}>📱</div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>Get instant alerts on Telegram</div>
                <div style={{ fontSize: "12px", opacity: 0.75 }}>
                  New matches, interests and profile views — right on your phone.
                </div>
              </div>
              <Link
                to="/settings"
                style={{ padding: "9px 16px", borderRadius: "10px", background: "#229ED9", color: "#fff", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
              >
                Connect
              </Link>
              <button
                onClick={() => {
                  try { localStorage.setItem("tg_banner_dismissed", "1"); } catch (e) { /* ignore */ }
                  setShowTgBanner(false);
                }}
                aria-label="Dismiss"
                style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", opacity: 0.6 }}
              >
                ✕
              </button>
            </div>
          )}

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

          <div className="glx-embed">
            <ProfileCompletionCard profile={profile || {}} isMobile={isMobile} />
          </div>

          {user?.id && (
            <div className="glx-embed">
              <ProfileAnalytics userId={user.id} isMobile={isMobile} />
            </div>
          )}

          <div style={S.statsGrid}>
            <div className="glx-lift" style={S.statCard}>
              <div style={S.statTop}>
                <span style={S.iconBubble}>💕</span>
                <Link to="/matches" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.matches}</div>
              <div style={S.statLabel}>New Matches</div>
            </div>
            <div className="glx-lift" style={S.statCard}>
              <div style={S.statTop}>
                <span style={S.iconBubble}>💌</span>
                <Link to="/interests" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.interests}</div>
              <div style={S.statLabel}>Interests Received</div>
            </div>
            <div className="glx-lift" style={S.statCard}>
              <div style={S.statTop}>
                <span style={S.iconBubble}>♡</span>
                <Link to="/interests?tab=shortlisted" style={S.viewAll}>View All →</Link>
              </div>
              <div style={S.statValue}>{counts.shortlisted}</div>
              <div style={S.statLabel}>Shortlisted Profiles</div>
            </div>
            <div className="glx-lift" style={S.statCard}>
              <div style={S.statTop}>
                <span style={S.iconBubble}>💬</span>
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
              "linear-gradient(90deg, rgba(255,228,230,0.95), rgba(255,228,230,0))",
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
              "linear-gradient(270deg, rgba(255,228,230,0.95), rgba(255,228,230,0))",
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
              color: "var(--vg-accent)",
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
              color: "var(--vg-accent)",
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
  border: "4px solid rgba(190,24,93,0.2)",
  borderTop: "4px solid var(--vg-accent)",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

export default Dashboard;

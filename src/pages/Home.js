import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommunities } from "../utils/communities";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80";

const DEFAULTS = {
  // Text content
  home_eyebrow: "TRADITION · TRUST · TOGETHER FOREVER",
  home_title: "Find Your Perfect Life Partner",
  home_tamil_subtitle: "நம் பாரம்பரியம்... உங்கள் வாழ்க்கைத் துணைக்கு...",
  home_subtitle: "Vivaha Matrimony brings together like-minded hearts for a better tomorrow.",

  // Image
  home_hero_image: DEFAULT_HERO_IMAGE,
  home_hero_height: "600",     // px
  home_overlay_opacity: "90",   // %
  home_content_width: "560",    // px

  // Text colors
  home_color_eyebrow: "#8B0A2E",
  home_color_title: "#8B0A2E",
  home_color_tamil: "#8B0A2E",
  home_color_subtitle: "#5c3030",
  home_color_trust: "#8B0A2E",

  // Text sizes (desktop px)
  home_size_eyebrow: "11",
  home_size_title: "56",
  home_size_tamil: "19",
  home_size_subtitle: "16",

  // Search box
  home_search_width: "520",
  home_search_padding: "16",
  home_search_visible: "true",
  home_search_button_color: "#8B0A2E",

  // Visibility
  home_show_eyebrow: "true",
  home_show_tamil: "true",
  home_show_subtitle: "true",
  home_show_trust: "true",
  home_show_search: "true",

  // Trust badges
  home_trust_1_title: "Verified Profiles",
  home_trust_1_desc: "100% genuine",
  home_trust_2_title: "Safe & Secure",
  home_trust_2_desc: "Privacy first",
  home_trust_3_title: "Wide Community",
  home_trust_3_desc: "All communities",
  home_trust_4_title: "Dedicated Support",
  home_trust_4_desc: "We are here",
};

function Home() {
  const navigate = useNavigate();
  const { communities } = useCommunities();
  const [featured, setFeatured] = useState([]);
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const [heroSearch, setHeroSearch] = useState({
    lookingFor: "female",
    age: "21-30",
    location: "",
    community: "",
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, featuredRes] = await Promise.all([
          fetch(`${BACKEND_URL}/settings`),
          fetch(`${BACKEND_URL}/profile/search`),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings({ ...DEFAULTS, ...(data.settings || {}) });
        }

        if (featuredRes.ok) {
          const data = await featuredRes.json();
          setFeatured((data.results || []).slice(0, 4));
        }
      } catch (err) {
        console.error("Home load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append("gender", heroSearch.lookingFor);
    if (heroSearch.age) {
      const [min, max] = heroSearch.age.split("-");
      params.append("age_min", min);
      params.append("age_max", max);
    }
    if (heroSearch.location) params.append("location", heroSearch.location);
    if (heroSearch.community) params.append("community", heroSearch.community);
    navigate(`/search?${params.toString()}`);
  };

  const heroImage = settings.home_hero_image || DEFAULT_HERO_IMAGE;
  const overlayOpacity = parseInt(settings.home_overlay_opacity) || 90;

  // Mobile doesn't override admin-specified sizes (uses 75% of desktop)
  const size = (key) => {
    const desktopPx = parseInt(settings[key]) || 0;
    return isMobile ? `${Math.round(desktopPx * 0.7)}px` : `${desktopPx}px`;
  };

  const S = {
    page: { background: "#FFF9F5", fontFamily: "'Inter', sans-serif" },

    // ============ HERO ============
    hero: {
      position: "relative",
      minHeight: isMobile ? "auto" : `${settings.home_hero_height}px`,
      backgroundImage: `url('${heroImage}')`,
      backgroundSize: "cover",
      backgroundPosition: isMobile ? "center" : "center top",
      backgroundRepeat: "no-repeat",
      display: "flex",
      alignItems: "center",
      padding: isMobile ? "40px 20px" : "60px 60px",
      overflow: "hidden",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background: isMobile
        ? `linear-gradient(180deg, rgba(255,249,245,${overlayOpacity / 100}) 0%, rgba(255,249,245,${overlayOpacity / 130}) 60%, rgba(255,249,245,0.4) 100%)`
        : `linear-gradient(90deg, rgba(255,249,245,${overlayOpacity / 100}) 0%, rgba(255,249,245,${overlayOpacity / 105}) 35%, rgba(255,249,245,0.5) 55%, rgba(255,249,245,0.1) 100%)`,
      zIndex: 1,
    },
    heroContent: {
      position: "relative",
      zIndex: 2,
      maxWidth: isMobile ? "100%" : `${settings.home_content_width}px`,
    },

    eyebrow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: size("home_size_eyebrow"),
      color: settings.home_color_eyebrow,
      fontWeight: 700,
      letterSpacing: "2.5px",
      textTransform: "uppercase",
      marginBottom: "20px",
    },
    eyebrowIcon: { color: settings.home_color_eyebrow, fontSize: "14px" },

    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: size("home_size_title"),
      fontWeight: 900,
      color: settings.home_color_title,
      lineHeight: 1.05,
      letterSpacing: "-1.5px",
      marginBottom: "18px",
    },

    tamilSubtitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: size("home_size_tamil"),
      color: settings.home_color_tamil,
      marginBottom: "14px",
      fontWeight: 500,
    },

    subtitle: {
      color: settings.home_color_subtitle,
      fontSize: size("home_size_subtitle"),
      marginBottom: "26px",
      maxWidth: "480px",
      lineHeight: 1.7,
    },

    // ============ TRUST BADGES ============
    trustRow: {
      display: "flex",
      gap: isMobile ? "12px" : "20px",
      flexWrap: "wrap",
      marginBottom: "28px",
    },
    trustItem: { display: "flex", alignItems: "center", gap: "8px" },
    trustIcon: {
      width: "34px",
      height: "34px",
      borderRadius: "50%",
      background: "#FFF9F5",
      border: `1.5px solid ${settings.home_color_trust}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "15px",
      color: settings.home_color_trust,
      flexShrink: 0,
    },
    trustText: { lineHeight: 1.2 },
    trustTitle: { fontWeight: 700, color: settings.home_color_trust, fontSize: "12px" },
    trustDesc: { color: "#8a6b6b", fontSize: "10px" },

    // ============ SEARCH BOX ============
    searchBox: {
      background: "white",
      borderRadius: "16px",
      padding: `${settings.home_search_padding}px`,
      boxShadow: "0 12px 40px rgba(139,10,46,0.15)",
      border: "1px solid rgba(240,224,224,0.8)",
      maxWidth: `${settings.home_search_width}px`,
    },
    searchGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      marginBottom: "12px",
    },
    searchField: {
      background: "#FFF9F5",
      border: "1px solid #f0e0e0",
      borderRadius: "10px",
      padding: "11px 12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    select: {
      border: "none",
      background: "transparent",
      fontFamily: "inherit",
      fontSize: "13px",
      fontWeight: 500,
      color: "#2D1B1B",
      outline: "none",
      width: "100%",
      cursor: "pointer",
    },
    searchBtn: {
      width: "100%",
      background: settings.home_search_button_color,
      color: "white",
      border: "none",
      padding: "14px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },

    // ============ FEATURED ============
    section: { maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 32px" },
    sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "26px",
      fontWeight: 700,
      color: "#8B0A2E",
    },
    viewAll: { color: "#8B0A2E", fontSize: "13px", fontWeight: 600, textDecoration: "none" },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: isMobile ? "12px" : "20px",
    },
    fcard: {
      background: "white",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(139,10,46,0.06)",
      border: "1px solid #f0e0e0",
    },
    fcardPhoto: {
      height: isMobile ? "150px" : "200px",
      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isMobile ? "50px" : "60px",
      position: "relative",
      overflow: "hidden",
    },
    verifiedBadge: {
      position: "absolute",
      top: "10px",
      right: "10px",
      background: "#10B981",
      color: "white",
      fontSize: "10px",
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: "10px",
    },
    fcardBody: { padding: "14px 16px 16px" },
    fcardName: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "17px",
      fontWeight: 700,
      color: "#8B0A2E",
      marginBottom: "4px",
    },
    fcardMeta: { fontSize: "11px", color: "#8a6b6b", marginBottom: "10px", lineHeight: 1.4 },
    fcardTag: {
      display: "inline-block",
      background: "#FDF2F6",
      color: "#8B0A2E",
      padding: "3px 9px",
      borderRadius: "8px",
      fontSize: "10px",
      fontWeight: 600,
      margin: "2px 2px 2px 0",
    },
    fcardBtn: {
      display: "block",
      textAlign: "center",
      marginTop: "12px",
      background: "#8B0A2E",
      color: "white",
      padding: "9px",
      borderRadius: "8px",
      textDecoration: "none",
      fontWeight: 700,
      fontSize: "12px",
    },
  };

  const showEyebrow = settings.home_show_eyebrow !== "false" && settings.home_eyebrow;
  const showTamil = settings.home_show_tamil !== "false" && settings.home_tamil_subtitle;
  const showSubtitle = settings.home_show_subtitle !== "false" && settings.home_subtitle;
  const showTrust = settings.home_show_trust !== "false";
  const showSearch = settings.home_show_search !== "false";

  return (
    <div style={S.page}>
      <section style={S.hero}>
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          {showEyebrow && (
            <div style={S.eyebrow}>
              <span style={S.eyebrowIcon}>❁</span>
              {settings.home_eyebrow}
            </div>
          )}

          <h1 style={S.h1}>{settings.home_title}</h1>

          {showTamil && <div style={S.tamilSubtitle}>{settings.home_tamil_subtitle}</div>}

          {showSubtitle && <p style={S.subtitle}>{settings.home_subtitle}</p>}

          {showTrust && (
            <div style={S.trustRow}>
              <TrustBadge icon="🛡️" title={settings.home_trust_1_title} desc={settings.home_trust_1_desc} styles={S} />
              <TrustBadge icon="🔒" title={settings.home_trust_2_title} desc={settings.home_trust_2_desc} styles={S} />
              <TrustBadge icon="👥" title={settings.home_trust_3_title} desc={settings.home_trust_3_desc} styles={S} />
              <TrustBadge icon="❤️" title={settings.home_trust_4_title} desc={settings.home_trust_4_desc} styles={S} />
            </div>
          )}

          {showSearch && (
            <form onSubmit={handleHeroSearch} style={S.searchBox}>
              <div style={S.searchGrid}>
                <div style={S.searchField}>
                  <span>👤</span>
                  <select
                    value={heroSearch.lookingFor}
                    onChange={(e) => setHeroSearch({ ...heroSearch, lookingFor: e.target.value })}
                    style={S.select}
                  >
                    <option value="female">Bride</option>
                    <option value="male">Groom</option>
                  </select>
                </div>
                <div style={S.searchField}>
                  <span>🎂</span>
                  <select
                    value={heroSearch.age}
                    onChange={(e) => setHeroSearch({ ...heroSearch, age: e.target.value })}
                    style={S.select}
                  >
                    <option value="21-30">21 - 30 years</option>
                    <option value="25-35">25 - 35 years</option>
                    <option value="30-40">30 - 40 years</option>
                  </select>
                </div>
                <div style={S.searchField}>
                  <span>📍</span>
                  <input
                    type="text"
                    placeholder="Location"
                    value={heroSearch.location}
                    onChange={(e) => setHeroSearch({ ...heroSearch, location: e.target.value })}
                    style={S.select}
                  />
                </div>
                <div style={S.searchField}>
                  <span>🏷️</span>
                  <select
                    value={heroSearch.community}
                    onChange={(e) => setHeroSearch({ ...heroSearch, community: e.target.value })}
                    style={S.select}
                  >
                    <option value="">Any Community</option>
                    {communities.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" style={S.searchBtn}>🔍 Search Profiles</button>
            </form>
          )}
        </div>
      </section>

      <div style={S.section}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Featured Profiles</h2>
          <Link to="/search" style={S.viewAll}>View All →</Link>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#8a6b6b" }}>Loading profiles...</p>
        ) : featured.length === 0 ? (
          <p style={{ textAlign: "center", color: "#8a6b6b" }}>
            No profiles yet.{" "}
            <Link to="/register" style={{ color: "#8B0A2E", fontWeight: "bold" }}>Be the first to register!</Link>
          </p>
        ) : (
          <div style={S.grid}>
            {featured.map((user) => (
              <div key={user.id} style={S.fcard}>
                <div style={S.fcardPhoto}>
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : ("👤")}
                  {user.is_verified && <div style={S.verifiedBadge}>✓ Verified</div>}
                </div>
                <div style={S.fcardBody}>
                  <div style={S.fcardName}>{user.name || "Anonymous"}</div>
                  <div style={S.fcardMeta}>
                    {user.age ? `${user.age} yrs` : ""}
                    {user.age && user.location ? " • " : ""}
                    {user.location || ""}
                  </div>
                  {user.community && (
                    <span style={S.fcardTag}>
                      {user.community.charAt(0).toUpperCase() + user.community.slice(1)}
                    </span>
                  )}
                  {user.education && <span style={S.fcardTag}>{user.education}</span>}
                  <Link to={`/profile/${user.id}`} style={S.fcardBtn}>View Profile</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrustBadge({ icon, title, desc, styles }) {
  return (
    <div style={styles.trustItem}>
      <div style={styles.trustIcon}>{icon}</div>
      <div style={styles.trustText}>
        <div style={styles.trustTitle}>{title}</div>
        <div style={styles.trustDesc}>{desc}</div>
      </div>
    </div>
  );
}

export default Home;
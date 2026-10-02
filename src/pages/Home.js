import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";
import ProfileCard from "../components/ProfileCard";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const CACHE_KEY = "vivaha_home_settings_v1";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80";

const DEFAULTS = {
  home_eyebrow: "TRADITION · TRUST · TOGETHER FOREVER",
  home_title: "Your Life Partner is Just a Search Away...",
  home_tamil_subtitle: "நம் பாரம்பரியம்... உங்கள் வாழ்க்கைத் துணைக்கு...",
  home_subtitle: "Find genuine matches from our trusted Tamil matrimony community.",
  home_hero_image: DEFAULT_HERO_IMAGE,
  home_hero_height: "600",
  home_overlay_opacity: "90",
  home_color_eyebrow: "#8B0A2E",
  home_color_title: "#8B0A2E",
  home_color_tamil: "#8B0A2E",
  home_color_subtitle: "#5c3030",
  home_color_trust: "#8B0A2E",
  home_size_eyebrow: "11",
  home_size_title: "56",
  home_size_tamil: "19",
  home_size_subtitle: "16",
  home_search_padding: "16",
  home_search_button_color: "#8B0A2E",
  home_show_eyebrow: "true",
  home_show_tamil: "true",
  home_show_subtitle: "true",
  home_show_trust: "true",
  home_show_search: "true",
  home_text_x: "6",
  home_text_y: "18",
  home_text_width: "50",
  home_trust_x: "6",
  home_trust_y: "65",
  home_trust_width: "50",
  home_search_x: "6",
  home_search_y: "74",
  home_search_width: "45",
  home_trust_1_title: "Verified Profiles",
  home_trust_1_desc: "100% genuine",
  home_trust_2_title: "Advanced Search",
  home_trust_2_desc: "Find your perfect match",
  home_trust_3_title: "Privacy Protected",
  home_trust_3_desc: "Your data is secure",
  home_trust_4_title: "Premium Support",
  home_trust_4_desc: "We are always here",
};

// Load cached settings synchronously (before first render)
function getCachedSettings() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function Home() {
  const navigate = useNavigate();
  const { communities } = useCommunities();
  const [featured, setFeatured] = useState([]);
  const [stories, setStories] = useState([]);
  const [settings, setSettings] = useState(getCachedSettings);
  const [loading, setLoading] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
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
        const { data: { user } } = await supabase.auth.getUser();
        const viewerId = user?.id || "";

        const [settingsRes, featuredRes, storiesRes] = await Promise.all([
          fetch(`${BACKEND_URL}/settings`),
          fetch(`${BACKEND_URL}/profile/search?viewerId=${viewerId}`),
          fetch(`${BACKEND_URL}/success-stories`),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const freshSettings = data.settings || {};
          // Merge with DEFAULTS so missing keys still have values
          const merged = { ...DEFAULTS, ...freshSettings };
          setSettings(merged);
          // Save to cache for instant load next time
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(freshSettings));
          } catch {}
        }
        setSettingsReady(true);

        if (featuredRes.ok) {
          const data = await featuredRes.json();
          const all = data.results || [];
          all.sort((a, b) => {
            if (a.is_boosted && !b.is_boosted) return -1;
            if (!a.is_boosted && b.is_boosted) return 1;
            if (a.is_verified && !b.is_verified) return -1;
            if (!a.is_verified && b.is_verified) return 1;
            return 0;
          });
          setFeatured(all.slice(0, 4));
        }

        if (storiesRes.ok) {
          const storyData = await storiesRes.json();
          setStories((storyData.stories || []).slice(0, 3));
        }
      } catch (err) {
        console.error("Home load error:", err);
        setSettingsReady(true);
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

  const size = (key) => {
    const desktopPx = parseInt(settings[key]) || 0;
    return isMobile ? `${Math.round(desktopPx * 0.7)}px` : `${desktopPx}px`;
  };

  const blockPos = (xKey, yKey, wKey) => {
    if (isMobile) return { position: "relative", width: "100%", marginBottom: "20px" };
    return {
      position: "absolute",
      left: `${parseFloat(settings[xKey]) || 0}%`,
      top: `${parseFloat(settings[yKey]) || 0}%`,
      width: `${parseFloat(settings[wKey]) || 50}%`,
      zIndex: 3,
    };
  };

  const showEyebrow = settings.home_show_eyebrow !== "false" && settings.home_eyebrow;
  const showTamil = settings.home_show_tamil !== "false" && settings.home_tamil_subtitle;
  const showSubtitle = settings.home_show_subtitle !== "false" && settings.home_subtitle;
  const showTrust = settings.home_show_trust !== "false";
  const showSearch = settings.home_show_search !== "false";

  const S = {
    page: { background: "transparent", minHeight: "100vh", width: "100%", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" },
    hero: {
      position: "relative",
      minHeight: isMobile ? "auto" : `${settings.home_hero_height}px`,
      backgroundImage: `url('${heroImage}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "scroll",
      display: "block",
      padding: isMobile ? "60px 20px 80px" : "0",
      overflow: "hidden",
      width: "100%",
      boxSizing: "border-box",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background: isMobile
        ? `linear-gradient(180deg, rgba(255,249,245,${Math.min(overlayOpacity, 96) / 100}) 0%, rgba(255,249,245,${Math.min(overlayOpacity, 96) / 100}) 100%)`
        : `linear-gradient(90deg, rgba(255,249,245,${overlayOpacity / 100}) 0%, rgba(255,249,245,${overlayOpacity / 105}) 35%, rgba(255,249,245,0.5) 55%, rgba(255,249,245,0.1) 100%)`,
      zIndex: 1,
    },
    mobileContentWrapper: isMobile
      ? { position: "relative", zIndex: 3, display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "20px" }
      : { position: "relative", zIndex: 3, width: "100%", height: "100%", minHeight: isMobile ? "auto" : `${settings.home_hero_height}px` },
    eyebrow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: size("home_size_eyebrow"),
      color: settings.home_color_eyebrow,
      fontWeight: 700,
      letterSpacing: "2.5px",
      textTransform: "uppercase",
      marginBottom: "14px",
    },
    eyebrowIcon: { color: settings.home_color_eyebrow, fontSize: "14px" },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: size("home_size_title"),
      fontWeight: 900,
      color: settings.home_color_title,
      lineHeight: 1.05,
      letterSpacing: "-1.5px",
      marginBottom: "14px",
    },
    tamilSubtitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: size("home_size_tamil"),
      color: settings.home_color_tamil,
      marginBottom: "10px",
      fontWeight: 500,
    },
    subtitle: {
      color: settings.home_color_subtitle,
      fontSize: size("home_size_subtitle"),
      marginBottom: 0,
      lineHeight: 1.7,
    },
    trustRow: { display: "flex", gap: isMobile ? "12px" : "18px", flexWrap: "wrap" },
    trustItem: { display: "flex", alignItems: "center", gap: "8px" },
    trustIcon: {
      width: "34px", height: "34px", borderRadius: "50%", background: "#FFF9F5",
      border: `1.5px solid ${settings.home_color_trust}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "15px", color: settings.home_color_trust, flexShrink: 0,
    },
    trustText: { lineHeight: 1.2 },
    trustTitle: { fontWeight: 700, color: settings.home_color_trust, fontSize: "12px" },
    trustDesc: { color: "#8a6b6b", fontSize: "10px" },
    searchBox: {
      background: "white", borderRadius: "16px",
      padding: `${settings.home_search_padding}px`,
      boxShadow: "0 12px 40px rgba(139,10,46,0.15)",
      border: "1px solid rgba(240,224,224,0.8)", width: "100%",
    },
    searchGrid: {
      display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "10px", marginBottom: "12px",
    },
    searchField: {
      background: "#FFF9F5", border: "1px solid #f0e0e0", borderRadius: "10px",
      padding: "11px 12px", display: "flex", alignItems: "center", gap: "8px",
    },
    select: {
      border: "none", background: "transparent", fontFamily: "inherit",
      fontSize: "13px", fontWeight: 500, color: "#2D1B1B",
      outline: "none", width: "100%", cursor: "pointer",
    },
    searchBtn: {
      width: "100%", background: settings.home_search_button_color,
      color: "white", border: "none", padding: "14px", borderRadius: "10px",
      fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    },
    section: { maxWidth: "1300px", margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 32px", width: "100%", boxSizing: "border-box" },
    sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "26px", fontWeight: 700, color: "#8B0A2E",
    },
    viewAll: { color: "#8B0A2E", fontSize: "13px", fontWeight: 600, textDecoration: "none" },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
      gap: isMobile ? "14px" : "20px",
    },
    bannerSection: {
      background: "linear-gradient(135deg, #FDF2F6 0%, #FFF9F5 100%)",
      padding: isMobile ? "40px 20px" : "60px 40px", textAlign: "center",
      borderTop: "1px solid #f0e0e0", borderBottom: "1px solid #f0e0e0",
      width: "100%", boxSizing: "border-box",
    },
    bannerTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "24px" : "32px", fontWeight: 700,
      color: "#8B0A2E", marginBottom: "12px",
    },
    bannerSub: {
      color: "#8a6b6b", fontSize: "14px", maxWidth: "600px",
      margin: "0 auto 24px auto", lineHeight: 1.6,
    },
    bannerBtn: {
      background: "#8B0A2E", color: "white", padding: "14px 32px",
      borderRadius: "10px", textDecoration: "none", fontWeight: 700,
      fontSize: "15px", display: "inline-block",
      boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
    },
    storyCard: {
      background: "white", borderRadius: "20px", overflow: "hidden",
      border: "1px solid #f0e0e0", boxShadow: "0 8px 24px rgba(139,10,46,0.08)",
    },
    storyPhoto: {
      width: "100%", aspectRatio: "4/5",
      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "60px", overflow: "hidden",
    },
    storyBody: { padding: "14px 16px 16px" },
    storyName: {
      fontFamily: "'Playfair Display', serif", fontSize: "17px",
      fontWeight: 700, color: "#8B0A2E", marginBottom: "6px",
    },
    storyText: { fontSize: "12px", color: "#8a6b6b", marginBottom: "12px", lineHeight: 1.6 },
    storyBtn: {
      display: "block", textAlign: "center",
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      color: "white", padding: "10px", borderRadius: "10px",
      textDecoration: "none", fontWeight: 700, fontSize: "12px",
      boxShadow: "0 4px 14px rgba(139,10,46,0.28)",
    },
  };

  return (
    <div style={S.page}>
      {/* HERO — only render after settings ready to avoid flash */}
      <section style={S.hero}>
        <div style={S.heroOverlay} />

        {settingsReady && (
          <div style={S.mobileContentWrapper}>
            <div style={!isMobile ? blockPos("home_text_x", "home_text_y", "home_text_width") : {}}>
              {showEyebrow && (
                <div style={S.eyebrow}>
                  <span style={S.eyebrowIcon}>❁</span>
                  {settings.home_eyebrow}
                </div>
              )}
              <h1 style={S.h1}>{settings.home_title}</h1>
              {showTamil && <div style={S.tamilSubtitle}>{settings.home_tamil_subtitle}</div>}
              {showSubtitle && <p style={S.subtitle}>{settings.home_subtitle}</p>}
            </div>

            {showSearch && (
              <div style={!isMobile ? blockPos("home_search_x", "home_search_y", "home_search_width") : {}}>
                <form onSubmit={handleHeroSearch} style={S.searchBox}>
                  <div style={S.searchGrid}>
                    <div style={S.searchField}>
                      <span>👤</span>
                      <select value={heroSearch.lookingFor} onChange={(e) => setHeroSearch({ ...heroSearch, lookingFor: e.target.value })} style={S.select}>
                        <option value="female">Looking for Bride</option>
                        <option value="male">Looking for Groom</option>
                      </select>
                    </div>
                    <div style={S.searchField}>
                      <span>🎂</span>
                      <select value={heroSearch.age} onChange={(e) => setHeroSearch({ ...heroSearch, age: e.target.value })} style={S.select}>
                        <option value="21-30">Age 21 - 30</option>
                        <option value="25-35">Age 25 - 35</option>
                        <option value="30-40">Age 30 - 40</option>
                      </select>
                    </div>
                    <div style={S.searchField}>
                      <span>📍</span>
                      <input type="text" placeholder="Location" value={heroSearch.location} onChange={(e) => setHeroSearch({ ...heroSearch, location: e.target.value })} style={S.select} />
                    </div>
                    <div style={S.searchField}>
                      <span>🏷️</span>
                      <select value={heroSearch.community} onChange={(e) => setHeroSearch({ ...heroSearch, community: e.target.value })} style={S.select}>
                        <option value="">Any Community</option>
                        {communities.map((c) => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" style={S.searchBtn}>🔍 Search Profiles</button>
                </form>
              </div>
            )}

            {showTrust && (
              <div style={!isMobile ? blockPos("home_trust_x", "home_trust_y", "home_trust_width") : {}}>
                <div style={S.trustRow}>
                  <TrustBadge icon="🛡️" title={settings.home_trust_1_title} desc={settings.home_trust_1_desc} styles={S} />
                  <TrustBadge icon="🔍" title={settings.home_trust_2_title} desc={settings.home_trust_2_desc} styles={S} />
                  <TrustBadge icon="🔒" title={settings.home_trust_3_title} desc={settings.home_trust_3_desc} styles={S} />
                  <TrustBadge icon="❤️" title={settings.home_trust_4_title} desc={settings.home_trust_4_desc} styles={S} />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* FEATURED PROFILES */}
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
              <ProfileCard key={user.id} user={user} isMobile={isMobile} />
            ))}
          </div>
        )}
      </div>

      {/* SUCCESS STORIES */}
      {stories.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>Success Stories</h2>
            <Link to="/success-stories" style={S.viewAll}>View All →</Link>
          </div>
          <div style={S.grid}>
            {stories.map((story) => (
              <div key={story.id} style={S.storyCard}>
                <div style={S.storyPhoto}>
                  {story.photo_url ? (
                    <img src={story.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : ("💑")}
                </div>
                <div style={S.storyBody}>
                  <div style={S.storyName}>{story.couple_names || "Happy Couple"}</div>
                  <div style={S.storyText}>
                    {story.story ? (story.story.length > 100 ? story.story.substring(0, 100) + "..." : story.story) : "Found their perfect match!"}
                  </div>
                  <Link to="/success-stories" style={S.storyBtn}>Read More</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BANNER */}
      <div style={S.bannerSection}>
        <h2 style={S.bannerTitle}>Thousands of Happy Marriages Start Here</h2>
        <p style={S.bannerSub}>
          Join Vivaha Matrimony and take the first step towards your happy future.
        </p>
        <Link to="/register" style={S.bannerBtn}>Register Now →</Link>
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

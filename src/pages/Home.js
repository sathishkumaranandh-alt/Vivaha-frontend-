import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";
import { getPageTheme } from "../utils/pageTheme";
import ProfileCard from "../components/ProfileCard";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const CACHE_KEY = "vivaha_home_settings_v1";
const HERO_SLIDE_INTERVAL = 5000;
const STORY_SLIDE_INTERVAL = 5000;

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=8B0A2E&color=fff&size=512&bold=true&name=";

const DEFAULTS = {
  home_eyebrow: "TRADITION · TRUST · TOGETHER FOREVER",
  home_title: "Find Your Perfect Life Partner",
  home_tamil_subtitle: "நம் பாரம்பரியம்... உங்கள் வாழ்க்கைத் துணைக்கு...",
  home_subtitle: "Vivaha Matrimony brings together like-minded hearts for a better tomorrow.",
  home_hero_image: DEFAULT_HERO_IMAGE,
  home_hero_height: "600",
  home_overlay_opacity: "40",
  home_color_eyebrow: "#D4A017",
  home_color_title: "#ffffff",
  home_color_tamil: "#ffffff",
  home_color_subtitle: "#f5e5e5",
  home_color_trust: "#8B0A2E",
  home_size_eyebrow: "11",
  home_size_title: "44",
  home_size_tamil: "17",
  home_size_subtitle: "15",
  home_search_padding: "16",
  home_search_button_color: "#8B0A2E",
  home_show_eyebrow: "true",
  home_show_tamil: "true",
  home_show_subtitle: "true",
  home_show_trust: "true",
  home_show_search: "true",
  home_text_x: "6",
  home_text_y: "12",
  home_text_width: "55",
  home_trust_x: "6",
  home_trust_y: "58",
  home_trust_width: "55",
  home_search_x: "6",
  home_search_y: "70",
  home_search_width: "45",
  home_trust_1_title: "Verified Profiles",
  home_trust_1_desc: "100% genuine",
  home_trust_2_title: "Safe & Secure",
  home_trust_2_desc: "Privacy first",
  home_trust_3_title: "Wide Community",
  home_trust_3_desc: "All communities",
  home_trust_4_title: "Dedicated Support",
  home_trust_4_desc: "We are here",
  theme_heading_color: "#8B0A2E",
  theme_body_color: "#2D1B1B",
  theme_muted_color: "#8a6b6b",
  theme_link_color: "#8B0A2E",
  card_bg: "#ffffff",
  card_border_color: "#f0e0e0",
  card_border_width: "1",
  card_radius: "14",
  card_shadow: "40",
  card_photo_ratio: "2/3",
  card_photo_blur: "20",
  card_name_color: "#ffffff",
  card_name_size: "17",
  card_body_color: "rgba(255,255,255,0.92)",
  card_muted_color: "rgba(255,255,255,0.75)",
  card_chip_bg: "rgba(255,255,255,0.2)",
  card_chip_text: "#ffffff",
  card_button_bg: "#8B0A2E",
  card_button_bg_hover: "#a01438",
  card_button_text: "#ffffff",
  card_protected_bg: "#8a6b6b",
  card_protected_bg_hover: "#5c3030",
  card_show_location: "true",
  card_show_education: "true",
  card_show_occupation: "true",
  card_show_height: "true",
  card_show_community: "true",
  card_show_mother_tongue: "true",
  card_show_contact: "true",
};

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

function getAvatarFor(name, photoUrl) {
  if (photoUrl) return photoUrl;
  const encoded = encodeURIComponent(name || "Member");
  return `${DEFAULT_AVATAR}${encoded}`;
}

function Home() {
  const navigate = useNavigate();
  const { communities } = useCommunities();
  const [featured, setFeatured] = useState([]);
  const [stories, setStories] = useState([]);
  const [stats, setStats] = useState({ users: 0, matches: 0, stories: 0 });
  const [settings, setSettings] = useState(getCachedSettings);
  const [pageTheme, setPageTheme] = useState(getPageTheme("home"));
  const [loading, setLoading] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const [heroSearch, setHeroSearch] = useState({
    lookingFor: "female",
    age: "21-30",
    location: "",
    community: "",
  });

  // ============ HERO SLIDESHOW ============
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [heroHovering, setHeroHovering] = useState(false);
  const heroAutoTimer = useRef(null);
  const heroProgressTimer = useRef(null);
  const heroTouchStartX = useRef(null);

  // ============ STORY SLIDESHOW ============
  const [storySlideIndex, setStorySlideIndex] = useState(0);
  const [storyHovering, setStoryHovering] = useState(false);
  const storyAutoTimer = useRef(null);
  const storyTouchStartX = useRef(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const handler = () => {
      setPageTheme(getPageTheme("home"));
      setSettings(getCachedSettings());
    };
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const viewerId = user?.id || "";

        const [settingsRes, featuredRes, storiesRes, statsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/settings`),
          fetch(`${BACKEND_URL}/profile/search?viewerId=${viewerId}`),
          fetch(`${BACKEND_URL}/success-stories`),
          fetch(`${BACKEND_URL}/profile/admin/stats`).catch(() => null),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const freshSettings = data.settings || {};
          const merged = { ...DEFAULTS, ...freshSettings };
          setSettings(merged);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(freshSettings));
          } catch {}
        }
        setPageTheme(getPageTheme("home"));
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
          setFeatured(all.slice(0, 12));
        }

        if (storiesRes.ok) {
          const storyData = await storiesRes.json();
          const storyList = (storyData.stories || []);
          setStories(storyList.slice(0, 6));
          setStats((s) => ({ ...s, stories: storyList.length }));
        }

        if (statsRes && statsRes.ok) {
          const statData = await statsRes.json();
          setStats((s) => ({
            ...s,
            users: statData.totalUsers || 0,
            matches: statData.totalMessages ? statData.totalUsers * 2 : 0,
          }));
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

  // Build hero slides
  const heroSlides = (() => {
    const list = (featured || [])
      .filter((f) => f.photo_url || f.photo || f.profile_photo)
      .map((f) => ({
        id: f.id,
        photo: f.photo_url || f.photo || f.profile_photo,
        name: f.name || "Member",
        age: f.age || "",
        location: f.location || "",
        occupation: f.occupation || "",
      }));
    if (list.length > 0) return list;
    return [
      {
        id: null,
        photo: settings.home_hero_image || DEFAULT_HERO_IMAGE,
        name: settings.home_title || "Welcome",
        age: "",
        location: "",
        occupation: "",
      },
    ];
  })();

  const totalHeroSlides = heroSlides.length;
  const heroSlideshowActive =
    totalHeroSlides > 1 && !heroHovering && settingsReady;

  useEffect(() => {
    if (!heroSlideshowActive) {
      if (heroAutoTimer.current) clearInterval(heroAutoTimer.current);
      heroAutoTimer.current = null;
      return;
    }
    heroAutoTimer.current = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % totalHeroSlides);
      setHeroProgress(0);
    }, HERO_SLIDE_INTERVAL);
    return () => {
      if (heroAutoTimer.current) clearInterval(heroAutoTimer.current);
    };
  }, [heroSlideshowActive, totalHeroSlides]);

  useEffect(() => {
    if (!heroSlideshowActive) {
      setHeroProgress(0);
      if (heroProgressTimer.current) clearInterval(heroProgressTimer.current);
      heroProgressTimer.current = null;
      return;
    }
    setHeroProgress(0);
    const start = Date.now();
    heroProgressTimer.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setHeroProgress(Math.min((elapsed / HERO_SLIDE_INTERVAL) * 100, 100));
    }, 40);
    return () => {
      if (heroProgressTimer.current) clearInterval(heroProgressTimer.current);
    };
  }, [heroSlideshowActive, heroSlideIndex, totalHeroSlides]);

  // ============ STORY SLIDESHOW ============
  const totalStories = stories.length;
  const storySlideshowActive = totalStories > 1 && !storyHovering;

  useEffect(() => {
    if (!storySlideshowActive) {
      if (storyAutoTimer.current) clearInterval(storyAutoTimer.current);
      storyAutoTimer.current = null;
      return;
    }
    storyAutoTimer.current = setInterval(() => {
      setStorySlideIndex((prev) => (prev + 1) % totalStories);
    }, STORY_SLIDE_INTERVAL);
    return () => {
      if (storyAutoTimer.current) clearInterval(storyAutoTimer.current);
    };
  }, [storySlideshowActive, totalStories]);

  useEffect(() => {
    return () => {
      if (heroAutoTimer.current) clearInterval(heroAutoTimer.current);
      if (heroProgressTimer.current) clearInterval(heroProgressTimer.current);
      if (storyAutoTimer.current) clearInterval(storyAutoTimer.current);
    };
  }, []);

  const goToHeroSlide = (idx) => {
    setHeroSlideIndex(idx);
    setHeroProgress(0);
  };

  const handleHeroTouchStart = (e) => {
    heroTouchStartX.current = e.touches[0].clientX;
  };
  const handleHeroTouchEnd = (e) => {
    if (heroTouchStartX.current === null) return;
    const diff = heroTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50 && totalHeroSlides > 1) {
      if (diff > 0) setHeroSlideIndex((prev) => (prev + 1) % totalHeroSlides);
      else setHeroSlideIndex((prev) => (prev - 1 + totalHeroSlides) % totalHeroSlides);
      setHeroProgress(0);
    }
    heroTouchStartX.current = null;
  };

  const handleStoryTouchStart = (e) => {
    storyTouchStartX.current = e.touches[0].clientX;
  };
  const handleStoryTouchEnd = (e) => {
    if (storyTouchStartX.current === null || totalStories < 2) return;
    const diff = storyTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setStorySlideIndex((prev) => (prev + 1) % totalStories);
      else setStorySlideIndex((prev) => (prev - 1 + totalStories) % totalStories);
    }
    storyTouchStartX.current = null;
  };

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

  const size = (key) => {
    const desktopPx = parseInt(settings[key]) || 0;
    return isMobile ? `${Math.round(desktopPx * 0.7)}px` : `${desktopPx}px`;
  };

  const blockPos = (xKey, yKey, wKey) => {
    if (isMobile) return { position: "relative", width: "100%", marginBottom: "12px" };
    return {
      position: "absolute",
      left: `${parseFloat(settings[xKey]) || 0}%`,
      top: `${parseFloat(settings[yKey]) || 0}%`,
      width: `${parseFloat(settings[wKey]) || 50}%`,
      zIndex: 5,
    };
  };

  const showEyebrow = settings.home_show_eyebrow !== "false" && settings.home_eyebrow;
  const showTamil = settings.home_show_tamil !== "false" && settings.home_tamil_subtitle;
  const showSubtitle = settings.home_show_subtitle !== "false" && settings.home_subtitle;
  const showTrust = settings.home_show_trust !== "false";
  const showSearch = settings.home_show_search !== "false";

  const pageBg = pageTheme.bg;
  const pageHeading = pageTheme.heading;
  const pageBody = pageTheme.body;
  const pageMuted = pageTheme.muted;
  const pageLink = pageTheme.link;
  const baseSize = `${pageTheme.baseSize}px`;
  const headingSize = `${pageTheme.headingSize}px`;
  const headingSizeMobile = `${Math.round(pageTheme.headingSize * 0.85)}px`;

  const howItWorks = [
    { icon: "📝", title: "Register Free", desc: "Create your profile in 2 minutes" },
    { icon: "✨", title: "Complete Profile", desc: "Add photos & details for better matches" },
    { icon: "💌", title: "Send Interest", desc: "Connect with profiles you like" },
    { icon: "💍", title: "Get Married", desc: "Find your perfect life partner" },
  ];

  const whyChooseUs = [
    { icon: "✓", title: "Verified Profiles", desc: "All profiles are manually verified for authenticity" },
    { icon: "🔒", title: "100% Privacy", desc: "Your data is encrypted and never shared" },
    { icon: "🎯", title: "Smart Matching", desc: "AI-powered match score for better compatibility" },
    { icon: "🕉️", title: "Horoscope Match", desc: "Traditional Guna Milan for Tamil families" },
    { icon: "💬", title: "Instant Chat", desc: "Connect with your matches directly" },
    { icon: "📱", title: "Telegram Alerts", desc: "Get instant notifications on Telegram" },
  ];

  const S = {
    page: {
      background: pageBg,
      minHeight: "100vh",
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "'Inter', sans-serif",
      fontSize: baseSize,
      color: pageBody,
    },
    hero: {
      position: "relative",
      height: isMobile ? "72vh" : `${settings.home_hero_height}px`,
      minHeight: isMobile ? "480px" : `${settings.home_hero_height}px`,
      maxHeight: isMobile ? "640px" : `${settings.home_hero_height}px`,
      background: "#0a0308",
      display: "block",
      padding: "0",
      overflow: "hidden",
      width: "100%",
      boxSizing: "border-box",
    },
    mobileContentWrapper: isMobile
      ? {
          position: "absolute",
          inset: 0,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 18px 96px 18px",
          gap: "10px",
        }
      : {
          position: "relative",
          zIndex: 5,
          width: "100%",
          height: "100%",
          minHeight: `${settings.home_hero_height}px`,
        },
    eyebrow: {
      display: "flex", alignItems: "center", gap: "8px",
      fontSize: isMobile ? "9px" : size("home_size_eyebrow"),
      color: settings.home_color_eyebrow || "#D4A017",
      fontWeight: 700, letterSpacing: isMobile ? "1.5px" : "2.5px",
      textTransform: "uppercase", marginBottom: isMobile ? "6px" : "14px",
      textShadow: "0 2px 8px rgba(0,0,0,0.75)",
    },
    eyebrowIcon: { color: settings.home_color_eyebrow || "#D4A017", fontSize: "12px" },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "26px" : size("home_size_title"),
      fontWeight: 900,
      color: settings.home_color_title || "#ffffff",
      lineHeight: 1.1, letterSpacing: isMobile ? "-0.5px" : "-1.5px",
      marginBottom: isMobile ? "6px" : "14px",
      textShadow: "0 3px 14px rgba(0,0,0,0.85)",
    },
    tamilSubtitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "13px" : size("home_size_tamil"),
      color: settings.home_color_tamil || "#ffffff",
      marginBottom: "6px", fontWeight: 500,
      textShadow: "0 2px 10px rgba(0,0,0,0.8)",
    },
    subtitle: {
      color: settings.home_color_subtitle || "#f5e5e5",
      fontSize: isMobile ? "12px" : size("home_size_subtitle"),
      marginBottom: 0, lineHeight: 1.55,
      textShadow: "0 2px 10px rgba(0,0,0,0.8)",
    },
    trustRow: { display: "flex", gap: isMobile ? "6px" : "16px", flexWrap: "wrap" },
    trustItem: {
      display: "flex", alignItems: "center", gap: "6px",
      background: "rgba(255,255,255,0.92)",
      padding: isMobile ? "4px 8px 4px 4px" : "6px 12px 6px 6px",
      borderRadius: "30px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    },
    trustIcon: {
      width: isMobile ? "22px" : "32px",
      height: isMobile ? "22px" : "32px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: isMobile ? "10px" : "14px",
      color: settings.home_color_trust || "#8B0A2E", flexShrink: 0,
    },
    trustText: { lineHeight: 1.15 },
    trustTitle: { fontWeight: 700, color: settings.home_color_trust || "#8B0A2E", fontSize: isMobile ? "9px" : "11px" },
    trustDesc: { color: "#8a6b6b", fontSize: isMobile ? "8px" : "9px" },
    searchBox: {
      background: "white", borderRadius: "14px",
      padding: isMobile ? "10px" : `${settings.home_search_padding}px`,
      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      border: "1px solid rgba(240,224,224,0.8)", width: "100%",
    },
    searchGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px", marginBottom: "8px",
    },
    searchField: {
      background: "#FFF9F5", border: "1px solid #f0e0e0", borderRadius: "10px",
      padding: isMobile ? "8px 10px" : "11px 12px",
      display: "flex", alignItems: "center", gap: "6px",
    },
    select: {
      border: "none", background: "transparent", fontFamily: "inherit",
      fontSize: isMobile ? "11px" : "13px", fontWeight: 500, color: pageBody,
      outline: "none", width: "100%", cursor: "pointer",
    },
    searchBtn: {
      width: "100%", background: settings.home_search_button_color || pageLink,
      color: "white", border: "none",
      padding: isMobile ? "11px" : "14px",
      borderRadius: "10px",
      fontWeight: 700, fontSize: isMobile ? "13px" : "14px",
      cursor: "pointer", fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    },
    section: { maxWidth: "1300px", margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 32px", width: "100%", boxSizing: "border-box" },
    sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? headingSizeMobile : headingSize, fontWeight: 700, color: pageHeading, margin: 0,
    },
    viewAll: { color: pageLink, fontSize: "13px", fontWeight: 600, textDecoration: "none" },
    bannerSection: {
      background: "linear-gradient(135deg, #FDF2F6 0%, #FFF9F5 100%)",
      padding: isMobile ? "32px 16px" : "48px 32px", textAlign: "center",
      borderTop: "1px solid #f0e0e0", borderBottom: "1px solid #f0e0e0",
      width: "100%", boxSizing: "border-box",
    },
    bannerTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "32px", fontWeight: 700, color: pageHeading, marginBottom: "12px",
    },
    bannerSub: {
      color: pageMuted, fontSize: baseSize, maxWidth: "600px",
      margin: "0 auto 24px auto", lineHeight: 1.6,
    },
    bannerBtn: {
      background: pageLink, color: "white", padding: "14px 32px",
      borderRadius: "10px", textDecoration: "none", fontWeight: 700,
      fontSize: "15px", display: "inline-block",
      boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
    },
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes heroDotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.35); }
        }
        @keyframes heroFloatUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroTextIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .vivah-hero-dot-active { animation: heroDotPulse 1.4s ease-in-out infinite; }
        .vivah-hero-counter { animation: heroFloatUp 0.5s ease-out; }
        .vivah-hero-text-in { animation: heroTextIn 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
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

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section
        style={S.hero}
        onMouseEnter={() => setHeroHovering(true)}
        onMouseLeave={() => setHeroHovering(false)}
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
      >
        {/* Slideshow track */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              width: `${totalHeroSlides * 100}%`,
              height: "100%",
              transform: `translateX(-${(heroSlideIndex * 100) / totalHeroSlides}%)`,
              transition: "transform 0.9s cubic-bezier(0.65, 0, 0.35, 1)",
              willChange: "transform",
            }}
          >
            {heroSlides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                style={{
                  width: `${100 / totalHeroSlides}%`,
                  height: "100%",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url('${slide.photo}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center top",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isMobile
                      ? "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.92) 100%)"
                      : "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.05) 100%), linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress bars */}
        {totalHeroSlides > 1 && (
          <div
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "3px",
              zIndex: 10, display: "flex", gap: "3px", padding: "0 3px", boxSizing: "border-box",
            }}
          >
            {heroSlides.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: "100%",
                  background: "rgba(255,255,255,0.25)",
                  borderRadius: "2px", overflow: "hidden", position: "relative",
                }}
              >
                {i < heroSlideIndex && (
                  <div style={{ position: "absolute", inset: 0, background: "#D4A017" }} />
                )}
                {i === heroSlideIndex && (
                  <div
                    style={{
                      position: "absolute", top: 0, left: 0, bottom: 0,
                      width: `${heroProgress}%`,
                      background: "linear-gradient(90deg, #D4A017, #f0b830)",
                      transition: "width 0.08s linear",
                      boxShadow: "0 0 8px rgba(212,160,23,0.7)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Featured counter */}
        {totalHeroSlides > 1 && (
          <div
            className="vivah-hero-counter"
            style={{
              position: "absolute", top: "14px", right: "14px",
              background: "rgba(0,0,0,0.55)", color: "white",
              padding: "5px 12px", borderRadius: "14px",
              fontSize: "10px", fontWeight: 700,
              backdropFilter: "blur(10px)", zIndex: 10,
              letterSpacing: "0.5px",
              border: "1px solid rgba(212,160,23,0.4)",
            }}
          >
            ✨ Featured · {heroSlideIndex + 1} / {totalHeroSlides}
          </div>
        )}

        {/* Admin text overlay */}
        {settingsReady && (
          <div style={S.mobileContentWrapper}>
            <div
              key={`text-${heroSlideIndex}`}
              className="vivah-hero-text-in"
              style={!isMobile ? blockPos("home_text_x", "home_text_y", "home_text_width") : {}}
            >
              {showEyebrow && (
                <div style={S.eyebrow}>
                  <span style={S.eyebrowIcon}>❁</span>
                  {settings.home_eyebrow}
                </div>
              )}
              <h1 style={S.h1}>{settings.home_title}</h1>
              {showTamil && !isMobile && <div style={S.tamilSubtitle}>{settings.home_tamil_subtitle}</div>}
              {showSubtitle && !isMobile && <p style={S.subtitle}>{settings.home_subtitle}</p>}
            </div>

            {showSearch && (
              <div style={!isMobile ? blockPos("home_search_x", "home_search_y", "home_search_width") : {}}>
                <form onSubmit={handleHeroSearch} style={S.searchBox}>
                  <div style={S.searchGrid}>
                    <div style={S.searchField}>
                      <span>👤</span>
                      <select value={heroSearch.lookingFor} onChange={(e) => setHeroSearch({ ...heroSearch, lookingFor: e.target.value })} style={S.select}>
                        <option value="female">Bride</option>
                        <option value="male">Groom</option>
                      </select>
                    </div>
                    <div style={S.searchField}>
                      <span>🎂</span>
                      <select value={heroSearch.age} onChange={(e) => setHeroSearch({ ...heroSearch, age: e.target.value })} style={S.select}>
                        <option value="21-30">21-30</option>
                        <option value="25-35">25-35</option>
                        <option value="30-40">30-40</option>
                      </select>
                    </div>
                    {!isMobile && (
                      <>
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
                      </>
                    )}
                  </div>
                  <button type="submit" style={S.searchBtn}>🔍 Search Profiles</button>
                </form>
              </div>
            )}

            {showTrust && !isMobile && (
              <div style={blockPos("home_trust_x", "home_trust_y", "home_trust_width")}>
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

        {/* Featured profile info — Desktop */}
        {!isMobile && heroSlides[heroSlideIndex] && heroSlides[heroSlideIndex].id && (
          <div
            key={`slide-info-${heroSlideIndex}`}
            className="vivah-hero-text-in"
            style={{
              position: "absolute", right: "6%", bottom: "60px",
              maxWidth: "38%", zIndex: 9, color: "white", textAlign: "right",
            }}
          >
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#D4A017", fontWeight: 700, marginBottom: "8px", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
              ⭐ FEATURED PROFILE
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontWeight: 900, margin: "0 0 8px 0", lineHeight: 1.05, textShadow: "0 4px 20px rgba(0,0,0,0.9)", letterSpacing: "-1px" }}>
              {heroSlides[heroSlideIndex].name}
            </h2>
            <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.9)", marginBottom: "14px", fontWeight: 500, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
              {[
                heroSlides[heroSlideIndex].age && `${heroSlides[heroSlideIndex].age} yrs`,
                heroSlides[heroSlideIndex].location,
                heroSlides[heroSlideIndex].occupation,
              ].filter(Boolean).join(" · ")}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Link to={`/profile/${heroSlides[heroSlideIndex].id}`} style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "13px", boxShadow: "0 6px 20px rgba(212,160,23,0.5)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                View Profile →
              </Link>
              <Link to="/search" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", color: "white", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "13px", border: "1px solid rgba(255,255,255,0.3)" }}>
                Browse All
              </Link>
            </div>
          </div>
        )}

        {/* Featured profile — Mobile compact badge */}
        {isMobile && heroSlides[heroSlideIndex] && heroSlides[heroSlideIndex].id && (
          <div
            key={`mobile-slide-${heroSlideIndex}`}
            className="vivah-hero-text-in"
            style={{
              position: "absolute", bottom: "54px", left: "14px", right: "14px",
              zIndex: 9,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(212,160,23,0.4)",
              borderRadius: "12px", padding: "10px 12px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "8px", letterSpacing: "2px", color: "#D4A017", fontWeight: 700, marginBottom: "2px" }}>
                ⭐ FEATURED
              </div>
              <div style={{ color: "white", fontWeight: 800, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {heroSlides[heroSlideIndex].name}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {[
                  heroSlides[heroSlideIndex].age && `${heroSlides[heroSlideIndex].age} yrs`,
                  heroSlides[heroSlideIndex].location,
                ].filter(Boolean).join(" · ")}
              </div>
            </div>
            <Link to={`/profile/${heroSlides[heroSlideIndex].id}`} style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "7px 12px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>
              View →
            </Link>
          </div>
        )}

        {/* Dots */}
        {totalHeroSlides > 1 && (
          <div
            style={{
              position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: "5px", zIndex: 10,
              background: "rgba(0,0,0,0.45)",
              padding: "5px 10px", borderRadius: "20px",
              backdropFilter: "blur(10px)",
            }}
          >
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToHeroSlide(i)}
                className={i === heroSlideIndex ? "vivah-hero-dot-active" : ""}
                style={{
                  width: i === heroSlideIndex ? "9px" : "6px",
                  height: i === heroSlideIndex ? "9px" : "6px",
                  borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
                  background: i === heroSlideIndex ? "#D4A017" : "rgba(255,255,255,0.65)",
                  transition: "all 0.3s ease",
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* STATS BAR */}
      {/* ============================================ */}
      <div style={modernStyles.statsBar}>
        <div style={modernStyles.statsGrid}>
          <StatItem icon="👥" value={`${stats.users > 0 ? stats.users + "+" : "1,000+"}`} label="Registered Members" />
          <StatItem icon="💕" value={`${stats.matches > 0 ? stats.matches + "+" : "500+"}`} label="Successful Matches" />
          <StatItem icon="✨" value={`${stats.stories > 0 ? stats.stories + "+" : "100+"}`} label="Success Stories" />
          <StatItem icon="🛡️" value="100%" label="Verified Profiles" />
        </div>
      </div>

      {/* ============================================ */}
      {/* FEATURED PROFILES — Hotstar Carousel */}
      {/* ============================================ */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionTitle}>⭐ Featured Profiles</h2>
          <Link to="/search" style={S.viewAll}>View All →</Link>
        </div>
        {loading ? (
          <p style={{ textAlign: "center", color: pageMuted }}>Loading profiles...</p>
        ) : featured.length === 0 ? (
          <p style={{ textAlign: "center", color: pageMuted }}>
            No profiles yet.{" "}
            <Link to="/register" style={{ color: pageLink, fontWeight: "bold" }}>Be the first to register!</Link>
          </p>
        ) : (
          <ProfileCarousel profiles={featured} isMobile={isMobile} />
        )}
      </div>

      {/* ============================================ */}
      {/* RECOMMENDED — Hotstar Carousel */}
      {/* ============================================ */}
      {featured.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>💫 Recommended for You</h2>
            <Link to="/search" style={S.viewAll}>View All →</Link>
          </div>
          <ProfileCarousel
            profiles={[...featured].reverse()}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <div style={{ ...modernStyles.howSection, background: pageBg }}>
        <div style={S.section}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ ...S.sectionTitle, marginBottom: "8px" }}>How It Works</h2>
            <p style={{ color: pageMuted, fontSize: baseSize, maxWidth: "500px", margin: "0 auto" }}>
              Find your perfect life partner in 4 simple steps
            </p>
          </div>
          <div style={modernStyles.howGrid}>
            {howItWorks.map((step, i) => (
              <div key={i} style={modernStyles.howCard}>
                <div style={modernStyles.howNumber}>{i + 1}</div>
                <div style={modernStyles.howIcon}>{step.icon}</div>
                <h3 style={{ ...modernStyles.howTitle, color: pageHeading }}>{step.title}</h3>
                <p style={{ ...modernStyles.howDesc, color: pageMuted }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SUCCESS STORIES SLIDESHOW */}
      {/* ============================================ */}
      {stories.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>💕 Success Stories</h2>
            <Link to="/success-stories" style={S.viewAll}>View All →</Link>
          </div>

          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setStoryHovering(true)}
            onMouseLeave={() => setStoryHovering(false)}
            onTouchStart={handleStoryTouchStart}
            onTouchEnd={handleStoryTouchEnd}
          >
            <div style={{ overflow: "hidden", borderRadius: "20px" }}>
              <div
                style={{
                  display: "flex",
                  width: `${totalStories * 100}%`,
                  transform: `translateX(-${(storySlideIndex * 100) / totalStories}%)`,
                  transition: "transform 0.7s cubic-bezier(0.65, 0, 0.35, 1)",
                  willChange: "transform",
                }}
              >
                {stories.map((story, idx) => (
                  <div
                    key={story.id || idx}
                    style={{
                      width: `${100 / totalStories}%`,
                      padding: "0 4px",
                      boxSizing: "border-box",
                      flexShrink: 0,
                    }}
                  >
                    <StoryCard story={story} pageHeading={pageHeading} pageMuted={pageMuted} pageLink={pageLink} baseSize={baseSize} />
                  </div>
                ))}
              </div>
            </div>

            {totalStories > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "6px",
                  marginTop: "14px",
                }}
              >
                {stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStorySlideIndex(i)}
                    className={i === storySlideIndex ? "vivah-hero-dot-active" : ""}
                    style={{
                      width: i === storySlideIndex ? "10px" : "7px",
                      height: i === storySlideIndex ? "10px" : "7px",
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      background: i === storySlideIndex ? "#D4A017" : "#e5c8d2",
                      transition: "all 0.3s ease",
                    }}
                    aria-label={`Story ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* WHY CHOOSE US */}
      {/* ============================================ */}
      <div style={{ ...modernStyles.whySection, background: pageBg }}>
        <div style={S.section}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ ...S.sectionTitle, marginBottom: "8px" }}>Why Choose Vivaha Matrimony?</h2>
            <p style={{ color: pageMuted, fontSize: baseSize, maxWidth: "600px", margin: "0 auto" }}>
              Trusted by thousands of Tamil families across the world
            </p>
          </div>
          <div style={modernStyles.whyGrid}>
            {whyChooseUs.map((feature, i) => (
              <div key={i} style={modernStyles.whyCard}>
                <div style={modernStyles.whyIcon}>{feature.icon}</div>
                <h3 style={{ ...modernStyles.whyTitle, color: pageHeading }}>{feature.title}</h3>
                <p style={{ ...modernStyles.whyDesc, color: pageMuted }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* COMMUNITIES */}
      {/* ============================================ */}
      {communities && communities.length > 0 && (
        <div style={S.section}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{ ...S.sectionTitle, marginBottom: "8px" }}>Browse by Community</h2>
            <p style={{ color: pageMuted, fontSize: baseSize }}>
              Find matches from your own community
            </p>
          </div>
          <div style={modernStyles.communityGrid}>
            {communities.slice(0, 8).map((c) => (
              <Link key={c.slug} to={`/search?community=${c.slug}`} style={modernStyles.communityChip}>
                <div style={modernStyles.communityEmoji}>{c.emoji || "👥"}</div>
                <div style={{ ...modernStyles.communityName, color: pageHeading }}>{c.name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Banner */}
      <div style={S.bannerSection}>
        <h2 style={S.bannerTitle}>Thousands of Happy Marriages Start Here</h2>
        <p style={S.bannerSub}>
          Join Vivah Matrimony and take the first step towards your happy future.
        </p>
        <Link to="/register" style={S.bannerBtn}>Register Now →</Link>
      </div>
    </div>
  );
}

/* ============================================ */
/* PROFILE CAROUSEL — Hotstar Style Horizontal Scroll */
/* ============================================ */
function ProfileCarousel({ profiles, isMobile }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const step = (isMobile ? 160 : 200) * 2;
    scrollRef.current.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!profiles || profiles.length === 0) return null;

  const cardWidth = isMobile ? "150px" : "190px";

  return (
    <div style={{ position: "relative" }} className="vivah-carousel-wrap">
      <div
        ref={scrollRef}
        className="vivah-carousel"
        style={{
          display: "flex",
          gap: isMobile ? "10px" : "14px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: "10px",
          scrollBehavior: "smooth",
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

        {/* "See All" card */}
        <Link
          to="/search"
          style={{
            flex: "0 0 auto",
            width: cardWidth,
            borderRadius: "14px",
            background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
            border: "2px dashed #f0c8d4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            padding: "20px 10px",
            scrollSnapAlign: "start",
            gap: "8px",
            minHeight: isMobile ? "220px" : "280px",
          }}
        >
          <span style={{ fontSize: "32px" }}>🔍</span>
          <span style={{ color: "#8B0A2E", fontWeight: 800, fontSize: "13px" }}>See All</span>
        </Link>
      </div>

      {/* Desktop arrows */}
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
              border: "none",
              background: "white",
              color: "#8B0A2E",
              fontSize: "22px",
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
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              background: "white",
              color: "#8B0A2E",
              fontSize: "22px",
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

function StoryCard({ story, pageHeading, pageMuted, pageLink, baseSize }) {
  const hasPhoto = story.photo_url;
  const coupleName = story.couple_names || "Happy Couple";
  const avatar = getAvatarFor(coupleName, hasPhoto);
  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid #f0e0e0",
        boxShadow: "0 8px 24px rgba(139,10,46,0.08)",
        height: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "4/5",
          background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "60px",
          overflow: "hidden",
        }}
      >
        <img src={avatar} alt={coupleName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", fontWeight: 700, color: pageHeading, marginBottom: "6px" }}>
          {coupleName}
        </div>
        <div style={{ fontSize: baseSize, color: pageMuted, marginBottom: "12px", lineHeight: 1.6 }}>
          {story.story ? (story.story.length > 100 ? story.story.substring(0, 100) + "..." : story.story) : "Found their perfect match!"}
        </div>
        <Link to="/success-stories" style={{ display: "block", textAlign: "center", background: pageLink, color: "white", padding: "10px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "12px", boxShadow: "0 4px 14px rgba(139,10,46,0.28)" }}>
          Read More
        </Link>
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

function StatItem({ icon, value, label }) {
  return (
    <div style={modernStyles.statItem}>
      <div style={modernStyles.statIcon}>{icon}</div>
      <div style={modernStyles.statValue}>{value}</div>
      <div style={modernStyles.statLabel}>{label}</div>
    </div>
  );
}

const modernStyles = {
  statsBar: { background: "linear-gradient(135deg, #8B0A2E 0%, #6B0722 100%)", padding: "28px 16px", width: "100%", boxSizing: "border-box" },
  statsGrid: { maxWidth: "1300px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" },
  statItem: { textAlign: "center", padding: "12px 8px" },
  statIcon: { fontSize: "24px", marginBottom: "6px" },
  statValue: { fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "900", color: "#D4A017", marginBottom: "4px", lineHeight: 1 },
  statLabel: { fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: "600", letterSpacing: "0.5px" },
  howSection: { padding: "16px 0", width: "100%", boxSizing: "border-box" },
  howGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" },
  howCard: { background: "white", borderRadius: "18px", padding: "24px 18px", textAlign: "center", border: "1px solid #f0e0e0", boxShadow: "0 6px 20px rgba(139,10,46,0.06)", position: "relative", transition: "transform 0.2s" },
  howNumber: { position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", boxShadow: "0 4px 12px rgba(139,10,46,0.3)" },
  howIcon: { fontSize: "36px", marginBottom: "10px", marginTop: "6px" },
  howTitle: { fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: "800", marginBottom: "6px" },
  howDesc: { fontSize: "12px", lineHeight: 1.5, margin: 0 },
  whySection: { padding: "16px 0", width: "100%", boxSizing: "border-box" },
  whyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
  whyCard: { background: "white", borderRadius: "14px", padding: "20px 18px", border: "1px solid #f0e0e0", boxShadow: "0 4px 14px rgba(139,10,46,0.05)" },
  whyIcon: { width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#8B0A2E", fontWeight: "800", marginBottom: "12px" },
  whyTitle: { fontFamily: "'Playfair Display', serif", fontSize: "15px", fontWeight: "800", marginBottom: "6px" },
  whyDesc: { fontSize: "12px", lineHeight: 1.5, margin: 0 },
  communityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" },
  communityChip: { background: "white", borderRadius: "14px", padding: "16px 10px", textAlign: "center", textDecoration: "none", border: "1px solid #f0e0e0", boxShadow: "0 4px 12px rgba(139,10,46,0.05)", transition: "transform 0.2s, box-shadow 0.2s" },
  communityEmoji: { fontSize: "26px", marginBottom: "6px" },
  communityName: { fontSize: "12px", fontWeight: "700" },
};

export default Home;

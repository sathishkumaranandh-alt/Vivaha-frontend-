import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommunities } from "../utils/communities";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Home() {
  const navigate = useNavigate();
  const { communities } = useCommunities();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  // Hero search form
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
    async function loadFeatured() {
      try {
        const res = await fetch(`${BACKEND_URL}/profile/search`);
        if (res.ok) {
          const data = await res.json();
          setFeatured((data.results || []).slice(0, 4));
        }
      } catch (err) {
        console.error("Featured load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
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

  const S = {
    hero: {
      display: isMobile ? "flex" : "grid",
      gridTemplateColumns: isMobile ? undefined : "1fr 1fr",
      flexDirection: isMobile ? "column" : undefined,
      minHeight: isMobile ? "auto" : "520px",
      background: "linear-gradient(135deg, #FFF5F0 0%, #FFE9E3 100%)",
    },
    heroText: {
      padding: isMobile ? "40px 20px" : "70px 50px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    trustline: {
      display: "flex",
      gap: "14px",
      fontSize: "11px",
      color: "#D4A017",
      fontWeight: 700,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      marginBottom: "20px",
    },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "30px" : "42px",
      fontWeight: 700,
      color: "#8B0A2E",
      lineHeight: 1.15,
      letterSpacing: "-0.5px",
      marginBottom: "16px",
    },
    subtitle: {
      color: "#8a6b6b",
      fontSize: isMobile ? "14px" : "15px",
      marginBottom: "28px",
      maxWidth: "460px",
    },
    searchBox: {
      background: "white",
      borderRadius: "16px",
      padding: "16px",
      boxShadow: "0 12px 40px rgba(139,10,46,0.12)",
      border: "1px solid #f0e0e0",
      maxWidth: "480px",
    },
    searchGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "10px",
      marginBottom: "12px",
    },
    searchField: {
      background: "#FFF9F5",
      border: "1px solid #f0e0e0",
      borderRadius: "10px",
      padding: "10px 12px",
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
      background: "#8B0A2E",
      color: "white",
      border: "none",
      padding: "14px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
    },
    heroImage: {
      backgroundImage:
        "url('https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: isMobile ? "260px" : "auto",
      order: isMobile ? -1 : 0,
    },
    trustBar: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      background: "white",
      padding: isMobile ? "20px" : "24px 40px",
      gap: isMobile ? "16px" : "20px",
      borderBottom: "1px solid #f0e0e0",
    },
    trustItem: { display: "flex", alignItems: "center", gap: "12px" },
    trustIcon: {
      width: "42px",
      height: "42px",
      borderRadius: "50%",
      background: "#FDF2F6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      flexShrink: 0,
    },
    section: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "40px 16px" : "60px 32px",
    },
    sectionHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: "28px",
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "26px",
      fontWeight: 700,
      color: "#8B0A2E",
    },
    viewAll: {
      color: "#8B0A2E",
      fontSize: "13px",
      fontWeight: 600,
      textDecoration: "none",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr 1fr"
        : "repeat(4, 1fr)",
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
    fcardMeta: {
      fontSize: "11px",
      color: "#8a6b6b",
      marginBottom: "10px",
      lineHeight: 1.4,
    },
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

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ========== HERO ========== */}
      <section style={S.hero}>
        <div style={S.heroText}>
          <div style={S.trustline}>
            <span>Trusted</span>
            <span>•</span>
            <span>Secure</span>
            <span>•</span>
            <span>Genuine</span>
          </div>
          <h1 style={S.h1}>
            Find Your
            <br />
            Perfect Life Partner
          </h1>
          <p style={S.subtitle}>
            Vivaha Matrimony brings together like-minded hearts for a better
            tomorrow.
          </p>

          <form onSubmit={handleHeroSearch} style={S.searchBox}>
            <div style={S.searchGrid}>
              <div style={S.searchField}>
                <span>👤</span>
                <select
                  value={heroSearch.lookingFor}
                  onChange={(e) =>
                    setHeroSearch({ ...heroSearch, lookingFor: e.target.value })
                  }
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
                  onChange={(e) =>
                    setHeroSearch({ ...heroSearch, age: e.target.value })
                  }
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
                  onChange={(e) =>
                    setHeroSearch({ ...heroSearch, location: e.target.value })
                  }
                  style={S.select}
                />
              </div>
              <div style={S.searchField}>
                <span>🏷️</span>
                <select
                  value={heroSearch.community}
                  onChange={(e) =>
                    setHeroSearch({ ...heroSearch, community: e.target.value })
                  }
                  style={S.select}
                >
                  <option value="">Any Community</option>
                  {communities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" style={S.searchBtn}>
              🔍 Search Profiles
            </button>
          </form>
        </div>
        <div style={S.heroImage} />
      </section>

      {/* ========== TRUST BAR ========== */}
      <div style={S.trustBar}>
        <div style={S.trustItem}>
          <div style={S.trustIcon}>✅</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#8B0A2E" }}>
              Verified Profiles
            </div>
            <div style={{ fontSize: "11px", color: "#8a6b6b" }}>
              100% genuine profiles
            </div>
          </div>
        </div>
        <div style={S.trustItem}>
          <div style={S.trustIcon}>🔒</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#8B0A2E" }}>
              Safe & Secure
            </div>
            <div style={{ fontSize: "11px", color: "#8a6b6b" }}>
              Your privacy our priority
            </div>
          </div>
        </div>
        <div style={S.trustItem}>
          <div style={S.trustIcon}>👥</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#8B0A2E" }}>
              Wide Community
            </div>
            <div style={{ fontSize: "11px", color: "#8a6b6b" }}>
              All major communities
            </div>
          </div>
        </div>
        <div style={S.trustItem}>
          <div style={S.trustIcon}>💬</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#8B0A2E" }}>
              Dedicated Support
            </div>
            <div style={{ fontSize: "11px", color: "#8a6b6b" }}>
              We are here for you
            </div>
          </div>
        </div>
      </div>


      {/* ========== FEATURED ========== */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Featured Profiles</h2>
          <Link to="/search" style={S.viewAll}>
            View All →
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#8a6b6b" }}>
            Loading profiles...
          </p>
        ) : featured.length === 0 ? (
          <p style={{ textAlign: "center", color: "#8a6b6b" }}>
            No profiles yet.{" "}
            <Link to="/register" style={{ color: "#8B0A2E", fontWeight: "bold" }}>
              Be the first to register!
            </Link>
          </p>
        ) : (
          <div style={S.grid}>
            {featured.map((user) => (
              <div key={user.id} style={S.fcard}>
                <div style={S.fcardPhoto}>
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={user.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "👤"
                  )}
                  {user.is_verified && (
                    <div style={S.verifiedBadge}>✓ Verified</div>
                  )}
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
                      {user.community.charAt(0).toUpperCase() +
                        user.community.slice(1)}
                    </span>
                  )}
                  {user.education && (
                    <span style={S.fcardTag}>{user.education}</span>
                  )}
                  <Link to={`/profile/${user.id}`} style={S.fcardBtn}>
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
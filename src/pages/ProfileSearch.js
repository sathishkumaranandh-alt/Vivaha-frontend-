import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";
import { getPageTheme } from "../utils/pageTheme";
import ProfileCard from "../components/ProfileCard";
import BackButton from "../components/BackButton";
import { apiFetch } from "../utils/api";

function ProfileSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { communities } = useCommunities();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [myCommunity, setMyCommunity] = useState("");
  const [adminSettings, setAdminSettings] = useState({});

  const [showFilters, setShowFilters] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const [pageTheme, setPageTheme] = useState(getPageTheme("search"));

  const [filters, setFilters] = useState({
    gender: searchParams.get("gender") || "",
    age_min: searchParams.get("age_min") || "21",
    age_max: searchParams.get("age_max") || "35",
    location: searchParams.get("location") || "",
    community: searchParams.get("community") || "",
    religion: searchParams.get("religion") || "",
  });
  const [showAllCommunities, setShowAllCommunities] = useState(
    searchParams.get("allCommunities") === "true"
  );

  const syncURL = (f, allComm) => {
    const params = new URLSearchParams();
    if (f.gender) params.append("gender", f.gender);
    if (f.age_min) params.append("age_min", f.age_min);
    if (f.age_max) params.append("age_max", f.age_max);
    if (f.location) params.append("location", f.location);
    if (f.community) params.append("community", f.community);
    if (f.religion) params.append("religion", f.religion);
    if (allComm) params.append("allCommunities", "true");
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const handler = () => setPageTheme(getPageTheme("search"));
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
  }, []);

  useEffect(() => {
    apiFetch(`/settings`)
      .then((r) => r.json())
      .then((data) => setAdminSettings(data.settings || {}))
      .catch(console.error);
  }, []);

  useEffect(() => {
    async function loadMyProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("community, gender")
        .eq("id", user.id)
        .single();
      if (data) {
        setMyCommunity(data.community || "");

        const hasURLParams = searchParams.toString().length > 0;
        if (!hasURLParams) {
          const defaultLookFor = data.gender === "male" ? "female" : "male";
          const newFilters = {
            ...filters,
            gender: defaultLookFor,
            community: data.community || "",
          };
          setFilters(newFilters);
          syncURL(newFilters, false);
        }
      }
    }
    loadMyProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.age_min) params.append("age_min", filters.age_min);
      if (filters.age_max) params.append("age_max", filters.age_max);
      if (filters.location) params.append("location", filters.location);
      if (filters.community) params.append("community", filters.community);
      if (filters.religion) params.append("religion", filters.religion);
      if (showAllCommunities) params.append("allCommunities", "true");

      const res = await apiFetch(`/profile/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, showAllCommunities]);

  useEffect(() => {
    if (filters.gender) loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.gender]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    syncURL(newFilters, showAllCommunities);
  };

  const handleCommunityChange = (value) => {
    const newFilters = { ...filters, community: value };
    setFilters(newFilters);
    const newAllComm = value === "" && !myCommunity;
    setShowAllCommunities(newAllComm);
    syncURL(newFilters, newAllComm);
  };

  const toggleAllCommunities = () => {
    const newVal = !showAllCommunities;
    let newFilters = { ...filters };
    if (newVal) {
      newFilters.community = "";
    } else if (myCommunity) {
      newFilters.community = myCommunity;
    }
    setShowAllCommunities(newVal);
    setFilters(newFilters);
    syncURL(newFilters, newVal);
  };

  const handleSearchClick = () => {
    setHasSearched(true);
    setShowFilters(false);
    if (isMobile) document.body.style.overflow = "";
    loadProfiles();
  };

  const handleEditFilters = () => {
    setShowFilters(true);
    if (isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
    if (isMobile) document.body.style.overflow = "";
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const pageHeading = pageTheme.heading;
  const pageBody = pageTheme.body;
  const pageMuted = pageTheme.muted;
  const pageLink = pageTheme.link;
  const baseSize = `${pageTheme.baseSize}px`;
  const headingSize = `${pageTheme.headingSize}px`;
  const headingSizeMobile = `${Math.round(pageTheme.headingSize * 0.85)}px`;

  // ============================================
  // GLASS STYLE OVERRIDES (Green Theme)
  // ============================================
  const glassPanel = {
    background: "rgba(255, 255, 255, 0.55)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(40,76,48,0.1)",
    padding: "24px",
  };

  const glassInput = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    background: "rgba(255, 255, 255, 0.6)",
    boxSizing: "border-box",
    color: "#193a2d",
    backdropFilter: "blur(5px)",
  };

  // Filter chips
  const filterChips = [];
  if (filters.gender) filterChips.push({ icon: "👤", label: filters.gender === "female" ? "Bride" : "Groom" });
  if (filters.age_min && filters.age_max) filterChips.push({ icon: "🎂", label: `${filters.age_min}-${filters.age_max} yrs` });
  if (filters.location) filterChips.push({ icon: "📍", label: filters.location });
  if (filters.community) filterChips.push({ icon: "🏷️", label: filters.community });
  if (showAllCommunities) filterChips.push({ icon: "🌐", label: "All communities" });

  const lookingOptions = adminSettings.search_looking_options
    ? adminSettings.search_looking_options.split(",").map((o) => {
        const t = o.trim();
        if (!t) return null;
        return { label: t, value: t.toLowerCase().includes("female") ? "female" : "male" };
      }).filter(Boolean)
    : [
        { label: "Bride (Female)", value: "female" },
        { label: "Groom (Male)", value: "male" },
      ];

  const locationOptions = adminSettings.search_location_options
    ? adminSettings.search_location_options.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  const renderFilterContent = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
        {adminSettings.search_show_looking_for !== "false" && (
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#247443", marginBottom: "8px", textTransform: "uppercase" }}>Looking For</label>
            <select style={glassInput} value={filters.gender} onChange={(e) => handleFilterChange("gender", e.target.value)}>
              <option value="">Select</option>
              {lookingOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {adminSettings.search_show_age !== "false" && (
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#247443", marginBottom: "8px", textTransform: "uppercase" }}>Age Range</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input type="number" style={glassInput} placeholder="Min" value={filters.age_min} onChange={(e) => setFilters({ ...filters, age_min: e.target.value })} onBlur={() => syncURL(filters, showAllCommunities)} />
              <input type="number" style={glassInput} placeholder="Max" value={filters.age_max} onChange={(e) => setFilters({ ...filters, age_max: e.target.value })} onBlur={() => syncURL(filters, showAllCommunities)} />
            </div>
          </div>
        )}

        {adminSettings.search_show_location !== "false" && (
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#247443", marginBottom: "8px", textTransform: "uppercase" }}>Location</label>
            {locationOptions.length > 0 ? (
              <select style={glassInput} value={filters.location} onChange={(e) => { const newFilters = { ...filters, location: e.target.value }; setFilters(newFilters); syncURL(newFilters, showAllCommunities); }}>
                <option value="">Any Location</option>
                {locationOptions.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            ) : (
              <input style={glassInput} placeholder="City" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} onBlur={() => syncURL(filters, showAllCommunities)} />
            )}
          </div>
        )}

        {adminSettings.search_show_community !== "false" && (
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#247443", marginBottom: "8px", textTransform: "uppercase" }}>Community</label>
            <select style={glassInput} value={filters.community} onChange={(e) => handleCommunityChange(e.target.value)} disabled={showAllCommunities}>
              <option value="">Select Community</option>
              {communities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {adminSettings.search_show_community !== "false" && adminSettings.search_show_all_communities !== "false" && (
        <div style={{ marginTop: "16px" }}>
          {myCommunity && (
            <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#247443", marginBottom: "12px" }}>
              🏷️ Your community: <strong style={{ textTransform: "capitalize" }}>{myCommunity}</strong>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#193a2d", cursor: "pointer", fontWeight: 600 }}>
            <input type="checkbox" checked={showAllCommunities} onChange={toggleAllCommunities} style={{ width: 18, height: 18, accentColor: "#247443" }} />
            Show all communities
          </label>
        </div>
      )}

      <button onClick={handleSearchClick} disabled={loading} style={{ width: "100%", background: "linear-gradient(110deg, #5b9b50, #17633c)", color: "white", border: "none", padding: "16px", borderRadius: "12px", fontWeight: 800, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", marginTop: "20px", boxShadow: "0 8px 20px rgba(32,103,55,0.25)", opacity: loading ? 0.6 : 1 }}>
        {loading ? "Searching..." : "🔍 Search Profiles"}
      </button>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eaf3df 0%, #fff8e9 48%, #e4efdc 100%)", paddingBottom: "40px" }}>
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .orb-search {
          position: fixed; border-radius: 50%; filter: blur(60px); opacity: 0.4; z-index: 0; pointer-events: none;
        }
      `}</style>

      {/* Background Orbs */}
      <div className="orb-search" style={{ width: "400px", height: "400px", background: "#b7d6a7", top: "-100px", left: "-100px" }} />
      <div className="orb-search" style={{ width: "300px", height: "300px", background: "#f2d9a9", bottom: "10%", right: "-50px" }} />

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "16px 16px 100px 16px" : "32px", position: "relative", zIndex: 1 }}>
        <BackButton />

        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? headingSizeMobile : headingSize, color: "#123f2c", marginBottom: "8px", textShadow: "0 2px 10px rgba(255,255,255,0.8)" }}>🔍 Search Profiles</h1>
          <p style={{ color: "#435b4e", fontSize: baseSize, margin: 0 }}>Find your perfect match</p>
        </div>

        {/* DESKTOP filter panel */}
        {!isMobile && showFilters && (
          <div style={glassPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#247443", fontFamily: "'Playfair Display', serif", display: "flex", alignItems: "center", gap: "8px" }}>⚙️ Search Filters</div>
              {hasSearched && (
                <button onClick={handleCloseFilters} style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.9)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", color: "#247443", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              )}
            </div>
            {renderFilterContent()}
          </div>
        )}

        {/* MOBILE bottom sheet */}
        {isMobile && showFilters && (
          <>
            <div onClick={handleCloseFilters} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 998, backdropFilter: "blur(4px)" }} />
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, maxHeight: "88vh", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(25px)", WebkitBackdropFilter: "blur(25px)", borderRadius: "24px 24px 0 0", zIndex: 999, display: "flex", flexDirection: "column", boxShadow: "0 -10px 40px rgba(40,76,48,0.15)", borderTop: "1px solid rgba(255,255,255,0.8)" }}>
              <div style={{ width: "44px", height: "5px", borderRadius: "3px", background: "rgba(36,116,67,0.3)", margin: "10px auto 4px auto", flexShrink: 0 }} />
              <div style={{ padding: "8px 20px 14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.5)", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: "#247443", display: "flex", alignItems: "center", gap: "8px" }}>⚙️ Filters</div>
                <button onClick={handleCloseFilters} style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.9)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", color: "#247443", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <div style={{ padding: "18px 20px 24px 20px", overflowY: "auto", flex: 1 }}>{renderFilterContent()}</div>
            </div>
          </>
        )}

        {/* COMPACT BAR after search */}
        {!showFilters && hasSearched && (
          <div style={{ ...glassPanel, marginBottom: "20px", padding: "16px", position: "sticky", top: "10px", zIndex: 8 }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              {filterChips.length > 0 ? (
                filterChips.map((chip, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", color: "#247443", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                    <span>{chip.icon}</span><span>{chip.label}</span>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: "12px", color: "#435b4e", fontStyle: "italic" }}>No filters applied</span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#435b4e", fontWeight: 600 }}>
              <span>
                {loading ? "Searching..." : <><strong style={{ color: "#123f2c" }}>{results.length}</strong> {results.length === 1 ? "profile" : "profiles"} found</>}
              </span>
              <button onClick={handleEditFilters} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(110deg, #5b9b50, #17633c)", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(32,103,55,0.2)" }}>✏️ Edit</button>
            </div>
          </div>
        )}

        {/* FLOATING Filters button (mobile) */}
        {isMobile && !showFilters && hasSearched && (
          <button onClick={handleEditFilters} style={{ position: "fixed", bottom: "24px", right: "20px", background: "linear-gradient(110deg, #5b9b50, #17633c)", color: "white", border: "1px solid rgba(255,255,255,0.4)", padding: "14px 22px", borderRadius: "30px", fontSize: "14px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(32,103,55,0.3)", display: "flex", alignItems: "center", gap: "8px", zIndex: 50 }}>
            <span style={{ fontSize: "16px" }}>⚙️</span><span>Filters</span>
            {filterChips.length > 0 && <span style={{ background: "white", color: "#247443", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 900, marginLeft: "2px" }}>{filterChips.length}</span>}
          </button>
        )}

        {/* RESULTS */}
        <main style={{ position: "relative", zIndex: 1 }}>
          {loading && !hasSearched ? (
            <p style={{ textAlign: "center", color: "#435b4e", padding: "40px 0" }}>Loading profiles...</p>
          ) : loading ? null : results.length === 0 && hasSearched ? (
            <div style={{ ...glassPanel, textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔎</div>
              <h3 style={{ color: "#123f2c", marginBottom: "8px" }}>No matches found</h3>
              <p style={{ color: "#435b4e", fontSize: baseSize, marginBottom: "16px" }}>Try loosening your filters.</p>
              <button onClick={handleEditFilters} style={{ background: "linear-gra

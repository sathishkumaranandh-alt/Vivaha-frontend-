import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";
import { getPageTheme, getCardStyle } from "../utils/pageTheme";
import ProfileCard from "../components/ProfileCard";
import BackButton from "../components/BackButton";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { communities } = useCommunities();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [myCommunity, setMyCommunity] = useState("");
  const [adminSettings, setAdminSettings] = useState({});

  // NEW: Smart UI states
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
    fetch(`${BACKEND_URL}/settings`)
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
        setMyGender(data.gender || "");

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

  const loadProfiles = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const viewerId = user?.id || "";

        const params = new URLSearchParams();
        if (filters.gender) params.append("gender", filters.gender);
        if (filters.age_min) params.append("age_min", filters.age_min);
        if (filters.age_max) params.append("age_max", filters.age_max);
        if (filters.location) params.append("location", filters.location);
        if (filters.community) params.append("community", filters.community);
        if (filters.religion) params.append("religion", filters.religion);
        if (viewerId) params.append("viewerId", viewerId);
        if (showAllCommunities) params.append("allCommunities", "true");

        const res = await fetch(
          `${BACKEND_URL}/profile/search?${params.toString()}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }

        // After search → hide filters, show results
        if (opts.hideFilters !== false) {
          setHasSearched(true);
          setShowFilters(false);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters, showAllCommunities]
  );

  useEffect(() => {
    if (filters.gender) loadProfiles({ hideFilters: false });
  }, [loadProfiles, filters.gender]);

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
    loadProfiles();
  };

  const handleEditFilters = () => {
    setShowFilters(true);
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCloseFilters = () => {
    if (hasSearched) {
      setShowFilters(false);
    }
  };

  const pageBg = pageTheme.bg;
  const pageHeading = pageTheme.heading;
  const pageBody = pageTheme.body;
  const pageMuted = pageTheme.muted;
  const pageLink = pageTheme.link;
  const baseSize = `${pageTheme.baseSize}px`;
  const headingSize = `${pageTheme.headingSize}px`;
  const headingSizeMobile = `${Math.round(pageTheme.headingSize * 0.85)}px`;

  const cardStyle = getCardStyle(pageTheme);

  // ============================================
  // BUILD FILTER CHIPS
  // ============================================
  const filterChips = [];
  if (filters.gender) {
    filterChips.push({
      icon: "👤",
      label: filters.gender === "female" ? "Bride" : "Groom",
    });
  }
  if (filters.age_min && filters.age_max) {
    filterChips.push({
      icon: "🎂",
      label: `${filters.age_min}-${filters.age_max} yrs`,
    });
  }
  if (filters.location) {
    filterChips.push({ icon: "📍", label: filters.location });
  }
  if (filters.community) {
    filterChips.push({
      icon: "🏷️",
      label: filters.community.charAt(0).toUpperCase() + filters.community.slice(1),
    });
  }
  if (showAllCommunities) {
    filterChips.push({ icon: "🌐", label: "All communities" });
  }

  const lookingOptions = adminSettings.search_looking_options
    ? adminSettings.search_looking_options
        .split(",")
        .map((o) => {
          const t = o.trim();
          if (!t) return null;
          return {
            label: t,
            value: t.toLowerCase().includes("female") ? "female" : "male",
          };
        })
        .filter(Boolean)
    : [
        { label: "Bride (Female)", value: "female" },
        { label: "Groom (Male)", value: "male" },
      ];

  const locationOptions = adminSettings.search_location_options
    ? adminSettings.search_location_options
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  const S = {
    page: {
      maxWidth: "1300px",
      margin: "0 auto",
      padding: isMobile ? "16px" : "32px",
      background: pageBg,
      minHeight: "100vh",
      boxSizing: "border-box",
      fontSize: baseSize,
      color: pageBody,
    },
    header: { marginBottom: "20px" },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? headingSizeMobile : headingSize,
      color: pageHeading,
      marginBottom: "4px",
    },
    sub: { color: pageMuted, fontSize: baseSize, margin: 0 },

    // Filter panel
    filterPanel: {
      ...cardStyle,
      marginBottom: "20px",
      animation: "slideDown 0.3s ease-out",
    },
    panelHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    panelTitle: {
      fontSize: "15px",
      fontWeight: 800,
      color: pageHeading,
      fontFamily: "'Playfair Display', serif",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    closeBtn: {
      background: "#f3f4f6",
      border: "none",
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "16px",
      fontFamily: "inherit",
      color: "#666",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    // Compact bar
    compactBar: {
      ...cardStyle,
      marginBottom: "20px",
      position: "sticky",
      top: "10px",
      zIndex: 8,
      padding: "12px 16px",
      background: "linear-gradient(135deg, #FFF9F5, #FDF2F6)",
      border: "1.5px solid #f0d0da",
    },
    chipRow: {
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginBottom: "10px",
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: "white",
      border: "1.5px solid #f0d0da",
      color: pageHeading,
      padding: "5px 12px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 700,
    },
    editBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      background: pageLink,
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "10px",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(139,10,46,0.25)",
    },
    countRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "12px",
      color: pageMuted,
      fontWeight: 600,
    },

    // Filters
    filterGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "14px",
    },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: 700,
      color: pageBody,
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.4px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1.5px solid #e5e7eb",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      background: "#FFF9F5",
      boxSizing: "border-box",
      color: pageBody,
    },
    searchBtn: {
      width: "100%",
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      color: "white",
      border: "none",
      padding: "15px",
      borderRadius: "12px",
      fontWeight: 800,
      fontSize: "15px",
      cursor: "pointer",
      fontFamily: "inherit",
      marginTop: "16px",
      boxShadow: "0 6px 20px rgba(139,10,46,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    checkboxRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: pageBody,
      cursor: "pointer",
      marginTop: "4px",
    },
    notice: {
      background: "#FDF2F6",
      border: "1px solid #f0e0e0",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "12px",
      color: pageMuted,
      marginBottom: "12px",
    },

    // Results
    resultsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(180px, 1fr))",
      gap: isMobile ? "10px" : "14px",
    },
    emptyState: {
      ...cardStyle,
      textAlign: "center",
      padding: "60px 20px",
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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <BackButton />

      {/* HEADER */}
      <div style={S.header}>
        <h1 style={S.h1}>🔍 Search Profiles</h1>
        <p style={S.sub}>Find your perfect match</p>
      </div>

      {/* ============================================ */}
      {/* SMART FILTER VIEW */}
      {/* ============================================ */}

      {/* 1) FULL FILTER PANEL — Show when filters open */}
      {showFilters && (
        <div style={S.filterPanel}>
          <div style={S.panelHeader}>
            <div style={S.panelTitle}>⚙️ Search Filters</div>
            {hasSearched && (
              <button
                onClick={handleCloseFilters}
                style={S.closeBtn}
                aria-label="Close filters"
              >
                ✕
              </button>
            )}
          </div>

          <div style={S.filterGrid}>
            {/* Looking For */}
            {adminSettings.search_show_looking_for !== "false" && (
              <div>
                <label style={S.label}>Looking For</label>
                <select
                  style={S.input}
                  value={filters.gender}
                  onChange={(e) => handleFilterChange("gender", e.target.value)}
                >
                  <option value="">Select</option>
                  {lookingOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Age */}
            {adminSettings.search_show_age !== "false" && (
              <div>
                <label style={S.label}>Age Range</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="number"
                    style={S.input}
                    placeholder="Min"
                    value={filters.age_min}
                    onChange={(e) => setFilters({ ...filters, age_min: e.target.value })}
                    onBlur={() => syncURL(filters, showAllCommunities)}
                  />
                  <input
                    type="number"
                    style={S.input}
                    placeholder="Max"
                    value={filters.age_max}
                    onChange={(e) => setFilters({ ...filters, age_max: e.target.value })}
                    onBlur={() => syncURL(filters, showAllCommunities)}
                  />
                </div>
              </div>
            )}

            {/* Location */}
            {adminSettings.search_show_location !== "false" && (
              <div>
                <label style={S.label}>Location</label>
                {locationOptions.length > 0 ? (
                  <select
                    style={S.input}
                    value={filters.location}
                    onChange={(e) => {
                      const newFilters = { ...filters, location: e.target.value };
                      setFilters(newFilters);
                      syncURL(newFilters, showAllCommunities);
                    }}
                  >
                    <option value="">Any Location</option>
                    {locationOptions.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={S.input}
                    placeholder="City"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                    onBlur={() => syncURL(filters, showAllCommunities)}
                  />
                )}
              </div>
            )}

            {/* Community */}
            {adminSettings.search_show_community !== "false" && (
              <div>
                <label style={S.label}>Community</label>
                <select
                  style={S.input}
                  value={filters.community}
                  onChange={(e) => handleCommunityChange(e.target.value)}
                  disabled={showAllCommunities}
                >
                  <option value="">Select Community</option>
                  {communities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Community notice + checkbox */}
          {adminSettings.search_show_community !== "false" &&
            adminSettings.search_show_all_communities !== "false" && (
              <div style={{ marginTop: "14px" }}>
                {myCommunity && (
                  <div style={S.notice}>
                    🏷️ Your community:{" "}
                    <strong style={{ textTransform: "capitalize" }}>
                      {myCommunity}
                    </strong>
                  </div>
                )}
                <label style={S.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={showAllCommunities}
                    onChange={toggleAllCommunities}
                    style={{ width: 18, height: 18, accentColor: pageLink }}
                  />
                  Show all communities
                </label>
              </div>
            )}

          {/* Search Button */}
          <button
            onClick={handleSearchClick}
            disabled={loading}
            style={{ ...S.searchBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              "Searching..."
            ) : (
              <>
                <span>🔍</span>
                <span>Search Profiles</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2) COMPACT BAR — Show when filters hidden + searched */}
      {!showFilters && hasSearched && (
        <div style={S.compactBar}>
          <div style={S.chipRow}>
            {filterChips.length > 0 ? (
              filterChips.map((chip, i) => (
                <span key={i} style={S.chip}>
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </span>
              ))
            ) : (
              <span style={{ fontSize: "12px", color: pageMuted, fontStyle: "italic" }}>
                No filters applied
              </span>
            )}
          </div>
          <div style={S.countRow}>
            <span>
              {loading ? (
                "Searching..."
              ) : (
                <>
                  <strong style={{ color: pageHeading }}>{results.length}</strong>{" "}
                  {results.length === 1 ? "profile" : "profiles"} found
                </>
              )}
            </span>
            <button onClick={handleEditFilters} style={S.editBtn}>
              ✏️ Edit Filters
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* RESULTS */}
      {/* ============================================ */}
      <main>
        {loading && !hasSearched ? (
          <p style={{ textAlign: "center", color: pageMuted, padding: "40px 0" }}>
            Loading profiles...
          </p>
        ) : loading ? null : results.length === 0 && hasSearched ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔎</div>
            <h3 style={{ color: pageHeading, marginBottom: "8px" }}>
              No matches found
            </h3>
            <p style={{ color: pageMuted, fontSize: baseSize, marginBottom: "16px" }}>
              Try loosening your filters.
            </p>
            <button onClick={handleEditFilters} style={S.editBtn}>
              ✏️ Edit Filters
            </button>
          </div>
        ) : (
          <div style={S.resultsGrid}>
            {results.map((u) => (
              <ProfileCard key={u.id} user={u} isMobile={isMobile} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfileSearch;

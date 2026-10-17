import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";
import { getPageTheme, getCardStyle } from "../utils/pageTheme";
import ProfileCard from "../components/ProfileCard";
import BackButton from "../components/BackButton";
import { apiFetch } from "../utils/api";

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

  // 🔧 FIX: loadProfiles does NOT hide filters — that's done by the caller
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      

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

  // 🔧 FIX: Auto-load on gender change (does NOT hide filters)
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

  // 🔧 FIX: Close filters IMMEDIATELY, then fetch
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
  // FILTER CHIPS
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
      label:
        filters.community.charAt(0).toUpperCase() + filters.community.slice(1),
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

  // ============================================
  // SHARED FILTER CONTENT
  // ============================================
  const renderFilterContent = () => (
    <>
      <div style={S.filterGrid}>
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

        {adminSettings.search_show_age !== "false" && (
          <div>
            <label style={S.label}>Age Range</label>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
            >
              <input
                type="number"
                style={S.input}
                placeholder="Min"
                value={filters.age_min}
                onChange={(e) =>
                  setFilters({ ...filters, age_min: e.target.value })
                }
                onBlur={() => syncURL(filters, showAllCommunities)}
              />
              <input
                type="number"
                style={S.input}
                placeholder="Max"
                value={filters.age_max}
                onChange={(e) =>
                  setFilters({ ...filters, age_max: e.target.value })
                }
                onBlur={() => syncURL(filters, showAllCommunities)}
              />
            </div>
          </div>
        )}

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
    </>
  );

  const S = {
    page: {
      maxWidth: "1300px",
      margin: "0 auto",
      padding: isMobile ? "16px 16px 100px 16px" : "32px",
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

    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 998,
      animation: "fadeIn 0.25s ease-out",
      backdropFilter: "blur(2px)",
    },
    bottomSheet: {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: "88vh",
      background: "white",
      borderRadius: "24px 24px 0 0",
      zIndex: 999,
      display: "flex",
      flexDirection: "column",
      animation: "slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      boxShadow: "0 -10px 40px rgba(139,10,46,0.25)",
    },
    sheetHandle: {
      width: "44px",
      height: "5px",
      borderRadius: "3px",
      background: "#e5c8d2",
      margin: "10px auto 4px auto",
      flexShrink: 0,
    },
    sheetHeader: {
      padding: "8px 20px 14px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #f0e0e0",
      flexShrink: 0,
    },
    sheetTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "18px",
      fontWeight: 800,
      color: pageHeading,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    sheetBody: {
      padding: "18px 20px 24px 20px",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      flex: 1,
    },

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

    floatingBtn: {
      position: "fixed",
      bottom: "24px",
      right: "20px",
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      color: "white",
      border: "none",
      padding: "14px 22px",
      borderRadius: "30px",
      fontSize: "14px",
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 8px 24px rgba(139,10,46,0.4)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      zIndex: 50,
      animation: "floatPulse 2.5s ease-in-out infinite",
    },

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

    resultsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr 1fr"
        : "repeat(auto-fill, minmax(180px, 1fr))",
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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes floatPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <BackButton />

      <div style={S.header}>
        <h1 style={S.h1}>🔍 Search Profiles</h1>
        <p style={S.sub}>Find your perfect match</p>
      </div>

      {/* DESKTOP filter panel */}
      {!isMobile && showFilters && (
        <div style={S.filterPanel}>
          <div style={S.panelHeader}>
            <div style={S.panelTitle}>⚙️ Search Filters</div>
            {hasSearched && (
              <button onClick={handleCloseFilters} style={S.closeBtn}>
                ✕
              </button>
            )}
          </div>
          {renderFilterContent()}
        </div>
      )}

      {/* MOBILE bottom sheet */}
      {isMobile && showFilters && (
        <>
          <div style={S.backdrop} onClick={handleCloseFilters} />
          <div style={S.bottomSheet}>
            <div style={S.sheetHandle} />
            <div style={S.sheetHeader}>
              <div style={S.sheetTitle}>⚙️ Filters</div>
              <button onClick={handleCloseFilters} style={S.closeBtn}>
                ✕
              </button>
            </div>
            <div style={S.sheetBody}>{renderFilterContent()}</div>
          </div>
        </>
      )}

      {/* COMPACT BAR after search */}
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
              <span
                style={{
                  fontSize: "12px",
                  color: pageMuted,
                  fontStyle: "italic",
                }}
              >
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
                  <strong style={{ color: pageHeading }}>
                    {results.length}
                  </strong>{" "}
                  {results.length === 1 ? "profile" : "profiles"} found
                </>
              )}
            </span>
            <button onClick={handleEditFilters} style={S.editBtn}>
              ✏️ Edit
            </button>
          </div>
        </div>
      )}

      {/* FLOATING Filters button (mobile) */}
      {isMobile && !showFilters && hasSearched && (
        <button onClick={handleEditFilters} style={S.floatingBtn}>
          <span style={{ fontSize: "16px" }}>⚙️</span>
          <span>Filters</span>
          {filterChips.length > 0 && (
            <span
              style={{
                background: "white",
                color: "#8B0A2E",
                borderRadius: "10px",
                padding: "1px 7px",
                fontSize: "11px",
                fontWeight: 900,
                marginLeft: "2px",
              }}
            >
              {filterChips.length}
            </span>
          )}
        </button>
      )}

      {/* RESULTS */}
      <main>
        {loading && !hasSearched ? (
          <p
            style={{
              textAlign: "center",
              color: pageMuted,
              padding: "40px 0",
            }}
          >
            Loading profiles...
          </p>
        ) : loading ? null : results.length === 0 && hasSearched ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔎</div>
            <h3 style={{ color: pageHeading, marginBottom: "8px" }}>
              No matches found
            </h3>
            <p
              style={{
                color: pageMuted,
                fontSize: baseSize,
                marginBottom: "16px",
              }}
            >
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

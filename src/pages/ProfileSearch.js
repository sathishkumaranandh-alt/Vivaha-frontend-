import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";
import ProfileCard from "../components/ProfileCard";
import BackButton from "../components/BackButton";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { communities } = useCommunities();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [myCommunity, setMyCommunity] = useState("");
  const [myGender, setMyGender] = useState("");

  // Read ALL state from URL
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

  // Sync filters to URL (so back button works)
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
    async function loadMyProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("users").select("community, gender").eq("id", user.id).single();
      if (data) {
        setMyCommunity(data.community || "");
        setMyGender(data.gender || "");

        // If no URL params at all, apply default (user's community + opposite gender)
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

      const res = await fetch(`${BACKEND_URL}/profile/search?${params.toString()}`);
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

  const S = {
    page: { maxWidth: "1300px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { marginBottom: "20px" },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    layout: { display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "280px 1fr", gap: "24px" },
    sidebar: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0", height: "fit-content", position: isMobile ? "static" : "sticky", top: "90px", marginBottom: isMobile ? "16px" : 0 },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase" },
    input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box", marginBottom: "12px" },
    btn: { width: "100%", background: "#8B0A2E", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" },
    checkboxRow: { display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", marginBottom: "12px", fontSize: "12px", color: "#555", cursor: "pointer" },
    grid: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: isMobile ? "14px" : "20px" },
    notice: { background: "#FDF2F6", border: "1px solid #f0e0e0", borderRadius: "10px", padding: "10px 12px", fontSize: "11px", color: "#8a6b6b", marginBottom: "12px", lineHeight: 1.5 },
  };

  return (
    <div style={S.page}>
      <BackButton />

      <div style={S.header}>
        <h1 style={S.h1}>🔍 Search Profiles</h1>
        <p style={S.sub}>Find your perfect match</p>
      </div>

      <div style={S.layout}>
        <aside style={S.sidebar}>
          <label style={S.label}>Looking For</label>
          <select style={S.input} value={filters.gender} onChange={(e) => handleFilterChange("gender", e.target.value)}>
            <option value="female">Bride (Female)</option>
            <option value="male">Groom (Male)</option>
          </select>

          {myGender && (
            <div style={{ fontSize: "11px", color: "#8a6b6b", marginTop: "-8px", marginBottom: "12px", fontStyle: "italic" }}>
              Based on your profile ({myGender})
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={S.label}>Age From</label>
              <input type="number" style={S.input} value={filters.age_min} onChange={(e) => setFilters({ ...filters, age_min: e.target.value })} onBlur={() => syncURL(filters, showAllCommunities)} />
            </div>
            <div>
              <label style={S.label}>Age To</label>
              <input type="number" style={S.input} value={filters.age_max} onChange={(e) => setFilters({ ...filters, age_max: e.target.value })} onBlur={() => syncURL(filters, showAllCommunities)} />
            </div>
          </div>

          <label style={S.label}>Location</label>
          <input style={S.input} placeholder="City" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} onBlur={() => syncURL(filters, showAllCommunities)} />

          {myCommunity && (
            <div style={S.notice}>🏷️ Your community: <strong style={{ textTransform: "capitalize" }}>{myCommunity}</strong></div>
          )}

          <label style={S.label}>Community</label>
          <select style={S.input} value={filters.community} onChange={(e) => handleCommunityChange(e.target.value)} disabled={showAllCommunities}>
            <option value="">Select Community</option>
            {communities.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <label style={S.checkboxRow}>
            <input type="checkbox" checked={showAllCommunities} onChange={toggleAllCommunities} style={{ width: 16, height: 16, accentColor: "#8B0A2E" }} />
            Show all communities
          </label>

          <button onClick={loadProfiles} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Searching..." : "🔍 Search"}
          </button>
        </aside>

        <main>
          {loading ? (
            <p style={{ textAlign: "center", color: "#8a6b6b", padding: "40px 0" }}>Loading profiles...</p>
          ) : results.length === 0 ? (
            <div style={{ background: "white", borderRadius: "14px", padding: "60px 20px", textAlign: "center", border: "1px solid #f0e0e0" }}>
              <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔎</div>
              <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>No matches found</h3>
              <p style={{ color: "#8a6b6b", fontSize: "13px" }}>
                {!showAllCommunities && myCommunity
                  ? `No profiles in "${myCommunity}" community. Try "Show all communities".`
                  : "Try loosening your filters."}
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "16px", fontSize: "13px", color: "#8a6b6b" }}>
                Found <strong>{results.length}</strong> profile{results.length !== 1 ? "s" : ""}
                {showAllCommunities ? " (all communities)" : filters.community ? ` in ${filters.community}` : ""}
              </div>
              <div style={S.grid}>
                {results.map((u) => (
                  <ProfileCard key={u.id} user={u} isMobile={isMobile} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProfileSearch;

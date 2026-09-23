import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { useCommunities } from "../utils/communities";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { communities } = useCommunities();

  const [filters, setFilters] = useState({
    age_min: "",
    age_max: "",
    gender: "",
    religion: "",
    location: "",
    community: "",
    education: "",
    marital_status: "",
    verified_only: false,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myGender, setMyGender] = useState(null);
  const [shortlistedIds, setShortlistedIds] = useState(new Set());
  const [sentInterestIds, setSentInterestIds] = useState(new Set());
  const [sortBy, setSortBy] = useState("recent");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Read URL params (from hero search)
        const urlGender = searchParams.get("gender") || "";
        const urlAgeMin = searchParams.get("age_min") || "";
        const urlAgeMax = searchParams.get("age_max") || "";
        const urlLocation = searchParams.get("location") || "";
        const urlCommunity = searchParams.get("community") || "";

        if (!user) {
          const initial = {
            age_min: urlAgeMin,
            age_max: urlAgeMax,
            gender: urlGender,
            religion: "",
            location: urlLocation,
            community: urlCommunity,
            education: "",
            marital_status: "",
            verified_only: false,
          };
          setFilters(initial);
          await runSearch(initial, null);
          return;
        }

        setCurrentUserId(user.id);

        const res = await fetch(`${BACKEND_URL}/profile/${user.id}`);
        let myProfile = null;
        if (res.ok) myProfile = (await res.json()).profile;

        const gender = myProfile?.gender || null;
        setMyGender(gender);

        await Promise.all([loadShortlists(user.id), loadSentInterests(user.id)]);

        const oppositeGender = urlGender ||
          (gender === "male" ? "female" : gender === "female" ? "male" : "");

        const initial = {
          age_min: urlAgeMin,
          age_max: urlAgeMax,
          gender: oppositeGender,
          religion: "",
          location: urlLocation,
          community: urlCommunity || myProfile?.community || "",
          education: "",
          marital_status: "",
          verified_only: false,
        };
        setFilters(initial);
        await runSearch(initial, user.id);
      } catch (err) {
        console.error("Init error:", err);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShortlists = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlisted/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setShortlistedIds(new Set((data.shortlisted || []).map((s) => s.shortlisted_user_id)));
      }
    } catch {}
  };

  const loadSentInterests = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/sent/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSentInterestIds(new Set((data.interests || []).map((i) => i.receiver_id)));
      }
    } catch {}
  };

  const runSearch = async (customFilters = null, excludeId = null) => {
    try {
      setLoading(true);
      const f = customFilters || filters;
      const userIdToExclude = excludeId || currentUserId;

      const params = new URLSearchParams();
      if (f.age_min) params.append("age_min", f.age_min);
      if (f.age_max) params.append("age_max", f.age_max);
      if (f.gender) params.append("gender", f.gender);
      if (f.religion) params.append("religion", f.religion);
      if (f.location) params.append("location", f.location);
      if (f.community) params.append("community", f.community);

      const url = `${BACKEND_URL}/profile/search${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      let filtered = (data.results || []).filter((p) => {
        if (userIdToExclude && p.id === userIdToExclude) return false;
        if (myGender && p.gender && p.gender === myGender && !f.gender) return false;
        if (f.education && !(p.education || "").toLowerCase().includes(f.education.toLowerCase())) return false;
        if (f.marital_status && (p.marital_status || "never_married") !== f.marital_status) return false;
        if (f.verified_only && !p.is_verified) return false;
        return true;
      });

      // Apply sorting
      if (sortBy === "age_low") filtered.sort((a, b) => (a.age || 0) - (b.age || 0));
      else if (sortBy === "age_high") filtered.sort((a, b) => (b.age || 0) - (a.age || 0));
      else filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setResults(filtered);
      setSearched(true);
      setPage(1);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Could not load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    setShowFiltersMobile(false);
    runSearch();
  };

  const handleReset = () => {
    const oppositeGender = myGender === "male" ? "female" : myGender === "female" ? "male" : "";
    const cleared = {
      age_min: "", age_max: "", gender: oppositeGender,
      religion: "", location: "", community: "",
      education: "", marital_status: "", verified_only: false,
    };
    setFilters(cleared);
    runSearch(cleared);
  };

  const toggleShortlist = async (userId, name) => {
    if (!currentUserId) return toast.error("Please log in");
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, shortlisted_user_id: userId }),
      });
      if (res.ok) {
        const data = await res.json();
        const newSet = new Set(shortlistedIds);
        if (data.action === "added") {
          newSet.add(userId);
          toast.success(`Shortlisted ${name || "profile"}`);
        } else {
          newSet.delete(userId);
          toast.info("Removed from shortlist");
        }
        setShortlistedIds(newSet);
      }
    } catch {}
  };

  const sendInterest = async (userId, name) => {
    if (!currentUserId) return toast.error("Please log in");
    if (sentInterestIds.has(userId)) return toast.info("Interest already sent");
    try {
      const res = await fetch(`${BACKEND_URL}/interests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: currentUserId, receiver_id: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        const newSet = new Set(sentInterestIds);
        newSet.add(userId);
        setSentInterestIds(newSet);
        toast.success(`❤️ Interest sent to ${name || "user"}!`);
      } else {
        toast.error(data.error || "Could not send interest");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const totalPages = Math.ceil(results.length / PER_PAGE);
  const paginated = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const S = {
    page: { background: "#FFF9F5", minHeight: "calc(100vh - 70px)" },
    breadcrumb: { maxWidth: "1200px", margin: "0 auto", padding: "24px 32px 0", fontSize: "12px", color: "#8a6b6b" },
    layout: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "16px" : "24px 32px 60px",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: "280px 1fr",
      gap: "24px",
      alignItems: "start",
    },
    pageTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "26px",
      fontWeight: 700,
      color: "#8B0A2E",
      marginBottom: "20px",
    },
    filterPanel: {
      background: "white",
      borderRadius: "14px",
      padding: "22px",
      boxShadow: "0 2px 12px rgba(139,10,46,0.05)",
      border: "1px solid #f0e0e0",
      position: isMobile ? "fixed" : "sticky",
      top: isMobile ? 0 : "90px",
      left: isMobile ? 0 : "auto",
      right: isMobile ? 0 : "auto",
      bottom: isMobile ? 0 : "auto",
      zIndex: isMobile ? 1000 : 1,
      overflowY: isMobile ? "auto" : "visible",
      display: isMobile && !showFiltersMobile ? "none" : "block",
    },
    filterLabel: { display: "block", fontSize: "12px", fontWeight: 700, color: "#2D1B1B", marginBottom: "8px" },
    filterSelect: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #f0e0e0",
      borderRadius: "8px",
      fontFamily: "inherit",
      fontSize: "13px",
      background: "#FFF9F5",
      color: "#2D1B1B",
      outline: "none",
      cursor: "pointer",
    },
    filterGroup: { marginBottom: "16px" },
    ageRow: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "8px", alignItems: "center" },
    check: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 500, color: "#2D1B1B", margin: "14px 0", cursor: "pointer" },
    resetBtn: {
      width: "100%",
      background: "white",
      border: "1.5px solid #8B0A2E",
      color: "#8B0A2E",
      padding: "11px",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "12px",
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: "8px",
    },
    applyBtn: {
      width: "100%",
      background: "#8B0A2E",
      border: "none",
      color: "white",
      padding: "11px",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "12px",
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 4px 12px rgba(139,10,46,0.25)",
    },
    resultsHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" },
    count: { fontSize: "13px", color: "#8a6b6b" },
    sortSelect: {
      padding: "8px 14px",
      border: "1px solid #f0e0e0",
      borderRadius: "8px",
      fontFamily: "inherit",
      fontSize: "12px",
      fontWeight: 600,
      color: "#8B0A2E",
      background: "white",
      cursor: "pointer",
    },
    list: { display: "flex", flexDirection: "column", gap: "14px" },
    card: {
      background: "white",
      borderRadius: "14px",
      padding: isMobile ? "14px" : "18px",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: isMobile ? undefined : "100px 1fr auto",
      gap: isMobile ? "12px" : "20px",
      alignItems: "center",
      boxShadow: "0 2px 12px rgba(139,10,46,0.05)",
      border: "1px solid #f0e0e0",
    },
    photo: {
      width: isMobile ? "70px" : "100px",
      height: isMobile ? "70px" : "100px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isMobile ? "30px" : "40px",
      position: "relative",
      overflow: "hidden",
      float: isMobile ? "left" : "none",
      marginRight: isMobile ? "12px" : 0,
      flexShrink: 0,
    },
    online: {
      position: "absolute",
      top: "6px",
      right: "6px",
      width: "10px",
      height: "10px",
      background: "#10B981",
      borderRadius: "50%",
      border: "2px solid white",
    },
    name: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 700, color: "#8B0A2E" },
    verified: { background: "#10B981", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "8px", fontWeight: 600 },
    lastActive: { fontSize: "10px", color: "#8a6b6b", marginLeft: "auto" },
    metaRow: { display: "flex", gap: "14px", fontSize: "12px", color: "#8a6b6b", marginTop: "4px", marginBottom: "8px", flexWrap: "wrap" },
    metaAccent: { color: "#8B0A2E", fontWeight: 600, fontSize: "12px", marginBottom: "8px" },
    tags: { display: "flex", gap: "5px", flexWrap: "wrap" },
    tag: { background: "#FDF2F6", color: "#8B0A2E", fontSize: "10px", padding: "3px 9px", borderRadius: "8px", fontWeight: 600 },
    actions: { display: isMobile ? "flex" : "flex", flexDirection: isMobile ? "row" : "column", gap: "8px", alignItems: isMobile ? "center" : "stretch", minWidth: isMobile ? 0 : "130px", marginTop: isMobile ? "12px" : 0, clear: isMobile ? "both" : "none" },
    sendBtn: {
      background: "#8B0A2E",
      color: "white",
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "12px",
      cursor: "pointer",
      fontFamily: "inherit",
      flex: isMobile ? 1 : "none",
    },
    viewBtn: {
      background: "white",
      color: "#8B0A2E",
      border: "1.5px solid #8B0A2E",
      padding: "10px 16px",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "12px",
      cursor: "pointer",
      fontFamily: "inherit",
      flex: isMobile ? 1 : "none",
    },
    pagination: { display: "flex", justifyContent: "center", gap: "6px", marginTop: "32px", flexWrap: "wrap" },
    pageBtn: {
      minWidth: "36px",
      height: "36px",
      padding: "0 10px",
      borderRadius: "8px",
      border: "1px solid #f0e0e0",
      background: "white",
      color: "#8B0A2E",
      fontWeight: 700,
      fontSize: "13px",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    pageBtnActive: {
      background: "#8B0A2E",
      color: "white",
      borderColor: "#8B0A2E",
    },
    mobileFilterBtn: {
      background: "#8B0A2E",
      color: "white",
      border: "none",
      padding: "10px 18px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "13px",
      cursor: "pointer",
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 999,
      boxShadow: "0 8px 24px rgba(139,10,46,0.4)",
      fontFamily: "inherit",
    },
    closeFiltersBtn: {
      background: "white",
      color: "#8B0A2E",
      border: "1.5px solid #8B0A2E",
      padding: "11px",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "12px",
      cursor: "pointer",
      fontFamily: "inherit",
      width: "100%",
      marginTop: "8px",
      display: isMobile ? "block" : "none",
    },
  };

  return (
    <div style={S.page}>
      {/* Mobile filter button */}
      {isMobile && (
        <button style={S.mobileFilterBtn} onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
          {showFiltersMobile ? "✕ Close" : "⚙️ Filters"}
        </button>
      )}

      <div style={S.breadcrumb}>
        <Link to="/" style={{ color: "#8a6b6b", textDecoration: "none" }}>Home</Link>
        <span> › </span>
        <strong style={{ color: "#8B0A2E", fontWeight: 600 }}>Search</strong>
      </div>

      <div style={S.layout}>
        {/* SIDEBAR FILTERS */}
        <div style={S.filterPanel}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "#8B0A2E", marginBottom: "16px" }}>
            Filters
          </h3>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Age Range</label>
            <div style={S.ageRow}>
              <input
                type="number"
                placeholder="21"
                value={filters.age_min}
                onChange={(e) => setFilters({ ...filters, age_min: e.target.value })}
                style={S.filterSelect}
              />
              <span style={{ color: "#8a6b6b" }}>–</span>
              <input
                type="number"
                placeholder="35"
                value={filters.age_max}
                onChange={(e) => setFilters({ ...filters, age_max: e.target.value })}
                style={S.filterSelect}
              />
            </div>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Location</label>
            <input
              type="text"
              placeholder="Select Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              style={S.filterSelect}
            />
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Community</label>
            <select
              value={filters.community}
              onChange={(e) => setFilters({ ...filters, community: e.target.value })}
              style={S.filterSelect}
            >
              <option value="">All Communities</option>
              {communities.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Education</label>
            <input
              type="text"
              placeholder="All Education"
              value={filters.education}
              onChange={(e) => setFilters({ ...filters, education: e.target.value })}
              style={S.filterSelect}
            />
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Marital Status</label>
            <select
              value={filters.marital_status}
              onChange={(e) => setFilters({ ...filters, marital_status: e.target.value })}
              style={S.filterSelect}
            >
              <option value="">All</option>
              <option value="never_married">Never Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          <label style={S.check}>
            <input
              type="checkbox"
              checked={filters.verified_only}
              onChange={(e) => setFilters({ ...filters, verified_only: e.target.checked })}
              style={{ accentColor: "#8B0A2E" }}
            />
            Only Verified Profiles
          </label>

          <button onClick={handleReset} style={S.resetBtn}>Reset Filters</button>
          <button onClick={handleApply} style={S.applyBtn}>Apply Filters</button>
          <button onClick={() => setShowFiltersMobile(false)} style={S.closeFiltersBtn}>Close Filters</button>
        </div>

        {/* RESULTS */}
        <div>
          <h1 style={S.pageTitle}>Search Profiles</h1>

          <div style={S.resultsHead}>
            <p style={S.count}>
              Showing <strong style={{ color: "#8B0A2E" }}>{paginated.length}</strong> of{" "}
              <strong style={{ color: "#8B0A2E" }}>{results.length}</strong> profiles
            </p>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); runSearch(); }} style={S.sortSelect}>
              <option value="recent">Recently Active</option>
              <option value="age_low">Age (Low to High)</option>
              <option value="age_high">Age (High to Low)</option>
            </select>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#8a6b6b", padding: "60px" }}>Loading profiles...</p>
          ) : results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: "14px", border: "1px solid #f0e0e0" }}>
              <div style={{ fontSize: "60px", marginBottom: "12px" }}>🔎</div>
              <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>No profiles found</h3>
              <p style={{ color: "#8a6b6b", fontSize: "13px" }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={S.list}>
              {paginated.map((profile) => (
                <div key={profile.id} style={S.card}>
                  <div style={S.photo}>
                    {profile.photo_url ? (
                      <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : "👤"}
                    <div style={S.online} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={S.name}>{profile.name || "Anonymous"}</span>
                      {profile.is_verified && <span style={S.verified}>✓ Verified</span>}
                      {!isMobile && profile.created_at && (
                        <span style={S.lastActive}>
                          Last active {Math.floor((Date.now() - new Date(profile.created_at)) / 86400000)} days ago
                        </span>
                      )}
                    </div>

                    <div style={S.metaRow}>
                      {profile.age && <span>🎂 {profile.age} years</span>}
                      {profile.location && <span>📍 {profile.location}</span>}
                    </div>

                    {(profile.education || profile.occupation) && (
                      <div style={S.metaAccent}>
                        {profile.education && `🎓 ${profile.education}`}
                        {profile.education && profile.occupation && " · "}
                        {profile.occupation && `💼 ${profile.occupation}`}
                      </div>
                    )}

                    <div style={S.tags}>
                      {profile.community && (
                        <span style={S.tag}>
                          {profile.community.charAt(0).toUpperCase() + profile.community.slice(1)}
                        </span>
                      )}
                      {profile.religion && <span style={S.tag}>{profile.religion}</span>}
                    </div>
                  </div>

                  <div style={S.actions}>
                    <button
                      onClick={() => sendInterest(profile.id, profile.name)}
                      disabled={sentInterestIds.has(profile.id)}
                      style={{
                        ...S.sendBtn,
                        opacity: sentInterestIds.has(profile.id) ? 0.6 : 1,
                        cursor: sentInterestIds.has(profile.id) ? "not-allowed" : "pointer",
                      }}
                    >
                      {sentInterestIds.has(profile.id) ? "✓ Sent" : "💌 Send Interest"}
                    </button>
                    <Link to={`/profile/${profile.id}`} style={{ ...S.viewBtn, textAlign: "center", textDecoration: "none", display: "block" }}>
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div style={S.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{ ...S.pageBtn, ...(page === n ? S.pageBtnActive : {}) }}
                >
                  {n}
                </button>
              ))}
              {page < totalPages && (
                <button onClick={() => setPage(page + 1)} style={S.pageBtn}>›</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileSearch;
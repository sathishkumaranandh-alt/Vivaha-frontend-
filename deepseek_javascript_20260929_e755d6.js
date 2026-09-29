import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileSearch() {
  const [searchParams] = useSearchParams();
  const { communities } = useCommunities();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const [filters, setFilters] = useState({
    gender: searchParams.get("gender") || "female",
    age_min: searchParams.get("age_min") || "21",
    age_max: searchParams.get("age_max") || "35",
    location: searchParams.get("location") || "",
    community: searchParams.get("community") || "",
    religion: "",
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadProfiles = async () => {
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
  };

  useEffect(() => { loadProfiles(); }, []);

  const S = {
    page: { maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { marginBottom: "20px" },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    layout: { display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "280px 1fr", gap: "24px" },
    sidebar: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0", height: "fit-content", position: isMobile ? "static" : "sticky", top: "90px", marginBottom: isMobile ? "16px" : 0 },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase" },
    input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box", marginBottom: "12px" },
    btn: { width: "100%", background: "#8B0A2E", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" },
    grid: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? "12px" : "16px" },
    card: { background: "white", borderRadius: "14px", overflow: "hidden", border: "1px solid #f0e0e0", boxShadow: "0 4px 20px rgba(139,10,46,0.06)" },
    cardPhoto: { height: isMobile ? "140px" : "180px", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px", position: "relative", overflow: "hidden" },
    cardBody: { padding: "12px 14px 14px" },
    cardName: { fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: "#8B0A2E", marginBottom: "3px" },
    cardMeta: { fontSize: "11px", color: "#8a6b6b", marginBottom: "4px", lineHeight: 1.4 },
    viewBtn: { display: "block", textAlign: "center", marginTop: "10px", background: "#8B0A2E", color: "white", padding: "8px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "11px" },
    badge: { position: "absolute", top: "8px", left: "8px", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px", color: "white", zIndex: 3 },
    blurOverlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)", zIndex: 2 },
    blurBadge: { background: "white", padding: "5px 12px", borderRadius: "12px", fontSize: "10px", fontWeight: 700, color: "#8B0A2E", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>🔍 Search Profiles</h1>
        <p style={S.sub}>Find your perfect match</p>
      </div>

      <div style={S.layout}>
        <aside style={S.sidebar}>
          <label style={S.label}>Looking For</label>
          <select style={S.input} value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
            <option value="female">Bride</option>
            <option value="male">Groom</option>
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={S.label}>Age From</label>
              <input type="number" style={S.input} value={filters.age_min} onChange={(e) => setFilters({ ...filters, age_min: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Age To</label>
              <input type="number" style={S.input} value={filters.age_max} onChange={(e) => setFilters({ ...filters, age_max: e.target.value })} />
            </div>
          </div>

          <label style={S.label}>Location</label>
          <input style={S.input} placeholder="City" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} />

          <label style={S.label}>Community</label>
          <select style={S.input} value={filters.community} onChange={(e) => setFilters({ ...filters, community: e.target.value })}>
            <option value="">Any Community</option>
            {communities.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

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
              <p style={{ color: "#8a6b6b", fontSize: "13px" }}>Try loosening your filters.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "16px", fontSize: "13px", color: "#8a6b6b" }}>
                Found <strong>{results.length}</strong> profile{results.length !== 1 ? "s" : ""}
              </div>
              <div style={S.grid}>
                {results.map((u) => (
                  <div key={u.id} style={S.card}>
                    <div style={S.cardPhoto}>
                      {u.photo_url ? (
                        <img
                          src={u.photo_url}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: u.should_blur_photo ? "blur(15px)" : "none"
                          }}
                        />
                      ) : ("👤")}

                      {u.should_blur_photo && (
                        <div style={S.blurOverlay}>
                          <div style={S.blurBadge}>🔒 Protected</div>
                        </div>
                      )}

                      {!u.should_blur_photo && (
                        <>
                          {u.is_boosted && <div style={{ ...S.badge, background: "#D4A017" }}>🚀 Boosted</div>}
                          {!u.is_boosted && u.is_verified && <div style={{ ...S.badge, background: "#10B981" }}>✓ Verified</div>}
                        </>
                      )}
                    </div>
                    <div style={S.cardBody}>
                      <div style={S.cardName}>{u.name || "Anonymous"}</div>
                      <div style={S.cardMeta}>
                        {u.age ? `${u.age} yrs` : ""}
                        {u.age && u.location ? " • " : ""}
                        {u.location || ""}
                      </div>
                      <div style={S.cardMeta}>{u.education || ""}</div>
                      <Link to={`/profile/${u.id}`} style={S.viewBtn}>
                        {u.should_blur_photo ? "🔒 View Profile" : "View Profile"}
                      </Link>
                    </div>
                  </div>
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
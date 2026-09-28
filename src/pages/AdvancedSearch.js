import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { useCommunities } from "../utils/communities";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function AdvancedSearch() {
  const navigate = useNavigate();
  const { communities } = useCommunities();
  const [userId, setUserId] = useState(null);
  const [plan, setPlan] = useState("free");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const [filters, setFilters] = useState({
    gender: "female",
    age_min: "21",
    age_max: "35",
    location: "",
    community: "",
    religion: "",
    education: "",
    income: "",
    marital_status: "",
    food_pref: "",
    has_horoscope: false,
    verified_only: false,
  });

  const isPremium = plan === "gold" || plan === "platinum";

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);

      // Check plan
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.plan) setPlan(data.plan);
    }
    load();
  }, [navigate]);

  const handleSearch = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ viewerId: userId });
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== false) params.append(k, v);
      });

      const res = await fetch(`${BACKEND_URL}/premium/advanced-search?${params.toString()}`);
      const data = await res.json();

      if (res.status === 403) {
        toast.error(data.error || "Upgrade required");
        return;
      }

      if (res.ok) {
        setResults(data.results || []);
        setPlan(data.plan || "free");
        setSearched(true);
      } else {
        toast.error(data.error || "Search failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const S = {
    page: { maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { marginBottom: "20px" },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    layout: { display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "280px 1fr", gap: "24px" },
    sidebar: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0", height: "fit-content", position: isMobile ? "static" : "sticky", top: "90px", marginBottom: isMobile ? "16px" : 0 },
    card: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0" },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" },
    input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box", marginBottom: "12px" },
    inputLocked: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#9ca3af", boxSizing: "border-box", marginBottom: "12px", cursor: "not-allowed" },
    premiumBadge: { background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", fontSize: "9px", padding: "2px 6px", borderRadius: "6px", fontWeight: 700, marginLeft: "6px" },
    section: { marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0e0e0" },
    sectionTitle: { fontSize: "12px", fontWeight: 800, color: "#8B0A2E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" },
    searchBtn: { width: "100%", background: "#8B0A2E", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginTop: "8px" },
    upgradeBanner: { background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)", border: "1px solid #f0e0e0", borderRadius: "12px", padding: "14px", marginBottom: "16px", fontSize: "12px", color: "#8a6b6b", lineHeight: 1.5 },
    upgradeBtn: { display: "inline-block", marginTop: "8px", background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "12px" },
    grid: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? "12px" : "16px" },
    card2: { background: "white", borderRadius: "14px", overflow: "hidden", border: "1px solid #f0e0e0", boxShadow: "0 4px 20px rgba(139,10,46,0.06)" },
    cardPhoto: { height: isMobile ? "140px" : "180px", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px", position: "relative" },
    cardBody: { padding: "12px 14px 14px" },
    cardName: { fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: "#8B0A2E", marginBottom: "3px" },
    cardMeta: { fontSize: "11px", color: "#8a6b6b", marginBottom: "4px", lineHeight: 1.4 },
    viewBtn: { display: "block", textAlign: "center", marginTop: "10px", background: "#8B0A2E", color: "white", padding: "8px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "11px" },
    badge: { position: "absolute", top: "8px", left: "8px", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px", color: "white" },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>🔍 Advanced Search</h1>
        <p style={S.sub}>
          Find your perfect match with detailed filters · Your plan:{" "}
          <strong style={{ color: plan === "platinum" ? "#9f1239" : plan === "gold" ? "#92400e" : "#666", textTransform: "capitalize" }}>
            {plan}
          </strong>
        </p>
      </div>

      <div style={S.layout}>
        {/* FILTERS */}
        <aside style={S.sidebar}>
          <div style={S.section}>
            <div style={S.sectionTitle}>Basic Filters</div>

            <label style={S.label}>Looking For</label>
            <select style={S.input} value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
              <option value="female">Bride</option>
              <option value="male">Groom</option>
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
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
          </div>

          {/* PREMIUM FILTERS */}
          <div style={S.section}>
            <div style={S.sectionTitle}>
              Premium Filters {!isPremium && <span style={S.premiumBadge}>⭐ GOLD+</span>}
            </div>

            {!isPremium && (
              <div style={S.upgradeBanner}>
                🔒 Advanced filters are available on <strong>Gold</strong> and <strong>Platinum</strong> plans.
                <br />
                <Link to="/subscription" style={S.upgradeBtn}>⭐ Upgrade Now</Link>
              </div>
            )}

            <label style={S.label}>Education</label>
            <input
              style={isPremium ? S.input : S.inputLocked}
              placeholder={isPremium ? "e.g. B.Tech, MBA" : "Premium only"}
              value={filters.education}
              onChange={(e) => isPremium && setFilters({ ...filters, education: e.target.value })}
              disabled={!isPremium}
            />

            <label style={S.label}>Income Range</label>
            <select
              style={isPremium ? S.input : S.inputLocked}
              value={filters.income}
              onChange={(e) => isPremium && setFilters({ ...filters, income: e.target.value })}
              disabled={!isPremium}
            >
              <option value="">Any Income</option>
              <option value="Below ₹3 Lakh">Below ₹3 Lakh</option>
              <option value="₹3 - ₹5 Lakh">₹3 - ₹5 Lakh</option>
              <option value="₹5 - ₹10 Lakh">₹5 - ₹10 Lakh</option>
              <option value="₹10 - ₹20 Lakh">₹10 - ₹20 Lakh</option>
              <option value="₹20 Lakh+">₹20 Lakh+</option>
            </select>

            <label style={S.label}>Marital Status</label>
            <select
              style={isPremium ? S.input : S.inputLocked}
              value={filters.marital_status}
              onChange={(e) => isPremium && setFilters({ ...filters, marital_status: e.target.value })}
              disabled={!isPremium}
            >
              <option value="">Any</option>
              <option value="Never Married">Never Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>

            <label style={S.label}>Food Preference</label>
            <select
              style={isPremium ? S.input : S.inputLocked}
              value={filters.food_pref}
              onChange={(e) => isPremium && setFilters({ ...filters, food_pref: e.target.value })}
              disabled={!isPremium}
            >
              <option value="">Any</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
            </select>

            <label style={{ ...S.label, display: "flex", alignItems: "center", gap: "8px", cursor: isPremium ? "pointer" : "not-allowed" }}>
              <input
                type="checkbox"
                checked={filters.has_horoscope}
                onChange={(e) => isPremium && setFilters({ ...filters, has_horoscope: e.target.checked })}
                disabled={!isPremium}
                style={{ accentColor: "#8B0A2E" }}
              />
              Has Horoscope Details
            </label>

            <label style={{ ...S.label, display: "flex", alignItems: "center", gap: "8px", cursor: isPremium ? "pointer" : "not-allowed", marginTop: "10px" }}>
              <input
                type="checkbox"
                checked={filters.verified_only}
                onChange={(e) => isPremium && setFilters({ ...filters, verified_only: e.target.checked })}
                disabled={!isPremium}
                style={{ accentColor: "#8B0A2E" }}
              />
              Verified Profiles Only
            </label>
          </div>

          <button onClick={handleSearch} disabled={loading} style={{ ...S.searchBtn, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Searching..." : "🔍 Search"}
          </button>
        </aside>

        {/* RESULTS */}
        <main>
          {!searched ? (
            <div style={{ ...S.card, textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔎</div>
              <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>Start Your Search</h3>
              <p style={{ color: "#8a6b6b", fontSize: "13px" }}>Adjust filters and click Search to find matches.</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "50px", marginBottom: "12px" }}>😔</div>
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
                  <div key={u.id} style={S.card2}>
                    <div style={S.cardPhoto}>
                      {u.photo_url ? (
                        <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : ("👤")}
                      {u.is_boosted && <div style={{ ...S.badge, background: "#D4A017" }}>🚀 Boosted</div>}
                      {!u.is_boosted && u.is_verified && <div style={{ ...S.badge, background: "#10B981" }}>✓ Verified</div>}
                    </div>
                    <div style={S.cardBody}>
                      <div style={S.cardName}>{u.name || "Anonymous"}</div>
                      <div style={S.cardMeta}>
                        {u.age ? `${u.age} yrs` : ""}
                        {u.age && u.location ? " • " : ""}
                        {u.location || ""}
                      </div>
                      <div style={S.cardMeta}>{u.education || ""}</div>
                      <Link to={`/profile/${u.id}`} style={S.viewBtn}>View Profile</Link>
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

export default AdvancedSearch;

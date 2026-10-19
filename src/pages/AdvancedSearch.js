import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCommunities } from "../utils/communities";
import BackButton from "../components/BackButton";
import { toast } from "../utils/toast";
import usePlan from "../utils/usePlan";
import ProfileCard from "../components/ProfileCard";
import { apiFetch } from "../utils/api"; // 🛡️ Added for JWT Security

function AdvancedSearch() {
  const { communities } = useCommunities();
  const { plan, permissions, loading: planLoading, userId } = usePlan();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [adminSettings, setAdminSettings] = useState({});

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

  const canUseAdvanced = permissions.advanced_search === true;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    // 🛡️ SECURITY FIX: Switched to apiFetch
    apiFetch(`/settings`)
      .then((r) => r.json())
      .then((data) => setAdminSettings(data.settings || {}))
      .catch(console.error);
  }, []);

  const handleSearch = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 🛡️ SECURITY FIX: Removed viewerId
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== false) params.append(k, v);
      });

      // 🛡️ SECURITY FIX: Switched to apiFetch
      const res = await apiFetch(
        `/premium/advanced-search?${params.toString()}`
      );
      const data = await res.json();

      if (res.status === 403) {
        toast.error(data.error || "Upgrade required");
        return;
      }

      if (res.ok) {
        setResults(data.results || []);
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
    page: { maxWidth: "1300px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { marginBottom: "20px" },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    layout: { display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "280px 1fr", gap: "24px" },
    sidebar: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0", height: "fit-content", position: isMobile ? "static" : "sticky", top: "90px", marginBottom: isMobile ? "16px" : 0 },
    card: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0" },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: "#555", marginBottom: "6px", textTransform: "uppercase" },
    input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box", marginBottom: "12px" },
    inputLocked: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#9ca3af", boxSizing: "border-box", marginBottom: "12px", cursor: "not-allowed" },
    premiumBadge: { background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", fontSize: "9px", padding: "2px 6px", borderRadius: "6px", fontWeight: 700, marginLeft: "6px" },
    section: { marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0e0e0" },
    sectionTitle: { fontSize: "12px", fontWeight: 800, color: "#8B0A2E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" },
    searchBtn: { width: "100%", background: "#8B0A2E", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginTop: "8px" },
    upgradeBanner: { background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)", border: "1px solid #f0e0e0", borderRadius: "12px", padding: "14px", marginBottom: "16px", fontSize: "12px", color: "#8a6b6b", lineHeight: 1.5 },
    upgradeBtn: { display: "inline-block", marginTop: "8px", background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "12px" },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
      gap: isMobile ? "14px" : "20px",
    },
  };

  if (planLoading)
    return <div style={{ padding: "80px 20px", textAlign: "center" }}>Loading...</div>;

  const incomeOptions = adminSettings.adv_income_options
    ? adminSettings.adv_income_options.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  const educationOptions = adminSettings.adv_education_options
    ? adminSettings.adv_education_options.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  const maritalOptions = adminSettings.adv_marital_options
    ? adminSettings.adv_marital_options.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  const foodOptions = adminSettings.adv_food_options
    ? adminSettings.adv_food_options.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  const locationOptions = adminSettings.search_location_options
    ? adminSettings.search_location_options.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  return (
    <div style={S.page}>
      <BackButton />
      <div style={S.header}>
        <h1 style={S.h1}>🔍 Advanced Search</h1>
        <p style={S.sub}>
          Find your perfect match · Your plan:{" "}
          <strong
            style={{
              color:
                plan === "Platinum"
                  ? "#9f1239"
                  : plan === "Gold"
                  ? "#92400e"
                  : "#666",
              textTransform: "capitalize",
            }}
          >
            {plan}
          </strong>
        </p>
      </div>

      <div style={S.layout}>
        <aside style={S.sidebar}>
          <div style={S.section}>
            <div style={S.sectionTitle}>Basic Filters</div>

            {adminSettings.search_show_looking_for !== "false" && (
              <>
                <label style={S.label}>Looking For</label>
                <select
                  style={S.input}
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                >
                  <option value="female">Bride</option>
                  <option value="male">Groom</option>
                </select>
              </>
            )}

            {adminSettings.search_show_age !== "false" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={S.label}>Age From</label>
                  <input
                    type="number"
                    style={S.input}
                    value={filters.age_min}
                    onChange={(e) => setFilters({ ...filters, age_min: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>Age To</label>
                  <input
                    type="number"
                    style={S.input}
                    value={filters.age_max}
                    onChange={(e) => setFilters({ ...filters, age_max: e.target.value })}
                  />
                </div>
              </div>
            )}

            {adminSettings.search_show_location !== "false" && (
              <>
                <label style={S.label}>Location</label>
                {locationOptions.length > 0 ? (
                  <select
                    style={S.input}
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
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
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                )}
              </>
            )}

            {adminSettings.search_show_community !== "false" && (
              <>
                <label style={S.label}>Community</label>
                <select
                  style={S.input}
                  value={filters.community}
                  onChange={(e) => setFilters({ ...filters, community: e.target.value })}
                >
                  <option value="">Any Community</option>
                  {communities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>
              Premium Filters{" "}
              {!canUseAdvanced && <span style={S.premiumBadge}>⭐ UPGRADE</span>}
            </div>

            {!canUseAdvanced && (
              <div style={S.upgradeBanner}>
                🔒 Advanced filters are available on <strong>Gold</strong> and{" "}
                <strong>Platinum</strong> plans.
                <br />
                <Link to="/subscription" style={S.upgradeBtn}>
                  ⭐ Upgrade Now
                </Link>
              </div>
            )}

            {adminSettings.adv_show_education !== "false" && (
              <>
                <label style={S.label}>Education</label>
                {educationOptions.length > 0 ? (
                  <select
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    value={filters.education}
                    onChange={(e) =>
                      canUseAdvanced && setFilters({ ...filters, education: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  >
                    <option value="">Any Education</option>
                    {educationOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    placeholder="e.g. B.Tech, MBA"
                    value={filters.education}
                    onChange={(e) =>
                      canUseAdvanced && setFilters({ ...filters, education: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  />
                )}
              </>
            )}

            {adminSettings.adv_show_income !== "false" && (
              <>
                <label style={S.label}>Income Range</label>
                {incomeOptions.length > 0 ? (
                  <select
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    value={filters.income}
                    onChange={(e) =>
                      canUseAdvanced && setFilters({ ...filters, income: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  >
                    <option value="">Any Income</option>
                    {incomeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    placeholder="e.g. 5-10 Lakh"
                    value={filters.income}
                    onChange={(e) =>
                      canUseAdvanced && setFilters({ ...filters, income: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  />
                )}
              </>
            )}

            {adminSettings.adv_show_marital !== "false" && (
              <>
                <label style={S.label}>Marital Status</label>
                {maritalOptions.length > 0 ? (
                  <select
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    value={filters.marital_status}
                    onChange={(e) =>
                      canUseAdvanced &&
                      setFilters({ ...filters, marital_status: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  >
                    <option value="">Any</option>
                    {maritalOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    placeholder="e.g. Never Married"
                    value={filters.marital_status}
                    onChange={(e) =>
                      canUseAdvanced &&
                      setFilters({ ...filters, marital_status: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  />
                )}
              </>
            )}

            {adminSettings.adv_show_food !== "false" && (
              <>
                <label style={S.label}>Food Preference</label>
                {foodOptions.length > 0 ? (
                  <select
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    value={filters.food_pref}
                    onChange={(e) =>
                      canUseAdvanced &&
                      setFilters({ ...filters, food_pref: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  >
                    <option value="">Any</option>
                    {foodOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={canUseAdvanced ? S.input : S.inputLocked}
                    placeholder="e.g. Vegetarian"
                    value={filters.food_pref}
                    onChange={(e) =>
                      canUseAdvanced &&
                      setFilters({ ...filters, food_pref: e.target.value })
                    }
                    disabled={!canUseAdvanced}
                  />
                )}
              </>
            )}

            {adminSettings.adv_show_horoscope !== "false" && (
              <label
                style={{
                  ...S.label,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: canUseAdvanced ? "pointer" : "not-allowed",
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.has_horoscope}
                  onChange={(e) =>
                    canUseAdvanced &&
                    setFilters({ ...filters, has_horoscope: e.target.checked })
                  }
                  disabled={!canUseAdvanced}
                  style={{ accentColor: "#8B0A2E" }}
                />
                Has Horoscope Details
              </label>
            )}

            {adminSettings.adv_show_verified !== "false" && (
              <label
                style={{
                  ...S.label,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: canUseAdvanced ? "pointer" : "not-allowed",
                  marginTop: "10px",
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.verified_only}
                  onChange={(e) =>
                    canUseAdvanced &&
                    setFilters({ ...filters, verified_only: e.target.checked })
                  }
                  disabled={!canUseAdvanced}
                  style={{ accentColor: "#8B0A2E" }}
                />
                Verified Profiles Only
              </label>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ ...S.searchBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Searching..." : "🔍 Search"}
          </button>
        </aside>

        <main>
          {!searched ? (
            <div style={{ ...S.card, textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔎</div>
              <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>
                Start Your Search
              </h3>
              <p style={{ color: "#8a6b6b", fontSize: "13px" }}>
                Adjust filters and click Search to find matches.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "50px", marginBottom: "12px" }}>😔</div>
              <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>
                No matches found
              </h3>
              <p style={{ color: "#8a6b6b", fontSize: "13px" }}>
                Try loosening your filters.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#8a6b6b",
                }}
              >
                Found <strong>{results.length}</strong> profile
                {results.length !== 1 ? "s" : ""}
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

export default AdvancedSearch;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileSearch() {
  // Filter state
  const [filters, setFilters] = useState({
    age_min: "",
    age_max: "",
    gender: "",
    religion: "",
    location: "",
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // LOAD ALL PROFILES ON FIRST LOAD
  // ============================================================
  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // RUN SEARCH
  // ============================================================
  const runSearch = async (customFilters = null) => {
    try {
      setLoading(true);
      setError(null);

      const f = customFilters || filters;

      // Build query string
      const params = new URLSearchParams();
      if (f.age_min) params.append("age_min", f.age_min);
      if (f.age_max) params.append("age_max", f.age_max);
      if (f.gender) params.append("gender", f.gender);
      if (f.religion) params.append("religion", f.religion);
      if (f.location) params.append("location", f.location);

      const url = `${BACKEND_URL}/profile/search${
        params.toString() ? "?" + params.toString() : ""
      }`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setError("Could not load results. Backend may be waking up — try again in 30 seconds.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  const handleClear = () => {
    const cleared = {
      age_min: "",
      age_max: "",
      gender: "",
      religion: "",
      location: "",
    };
    setFilters(cleared);
    runSearch(cleared);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={pageStyle}>
      {/* ===== HEADER ===== */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>🔍 Find Your Match</h1>
        <p style={subtitleStyle}>
          Use the filters below to discover compatible partners
        </p>
      </div>

      {/* ===== FILTERS ===== */}
      <form onSubmit={handleSubmit} style={filterCardStyle}>
        <div style={filterGridStyle}>
          {/* Age min */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Min Age</label>
            <input
              type="number"
              name="age_min"
              placeholder="18"
              value={filters.age_min}
              onChange={handleChange}
              style={inputStyle}
              min="18"
              max="80"
            />
          </div>

          {/* Age max */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Max Age</label>
            <input
              type="number"
              name="age_max"
              placeholder="60"
              value={filters.age_max}
              onChange={handleChange}
              style={inputStyle}
              min="18"
              max="80"
            />
          </div>

          {/* Gender */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Gender</label>
            <select
              name="gender"
              value={filters.gender}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Religion */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Religion</label>
            <input
              type="text"
              name="religion"
              placeholder="e.g. Hindu"
              value={filters.religion}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Location */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Chennai"
              value={filters.location}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={buttonRowStyle}>
          <button type="submit" disabled={loading} style={searchButtonStyle}>
            {loading ? "Searching... ⏳" : "🔍 Search"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            style={clearButtonStyle}
          >
            Clear Filters
          </button>
        </div>
      </form>

      {/* ===== RESULTS ===== */}
      <div style={resultsSectionStyle}>
        {loading && !searched && (
          <p style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>
            Loading profiles... ⏳
          </p>
        )}

        {error && (
          <p style={{ textAlign: "center", color: "#b91c1c", marginTop: "40px" }}>
            {error}
          </p>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>🔎</div>
            <p style={{ color: "#666", fontSize: "17px" }}>No profiles found</p>
            <p style={{ color: "#999", fontSize: "14px" }}>
              Try adjusting your filters
            </p>
          </div>
        )}

        {!loading && results.length > 0 && !error && (
          <>
            <h3 style={resultsHeaderStyle}>
              Found <span style={{ color: "#1e3a8a" }}>{results.length}</span>{" "}
              {results.length === 1 ? "profile" : "profiles"}
            </h3>

            <div style={resultsGridStyle}>
              {results.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PROFILE CARD
// ============================================================
function ProfileCard({ profile }) {
  return (
    <div style={cardStyle}>
      <div style={cardPhotoWrapperStyle}>
        {profile.photo_url ? (
          <img
            src={profile.photo_url}
            alt={profile.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              fontSize: "48px",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            👤
          </div>
        )}
      </div>

      <h3 style={cardNameStyle}>{profile.name || "Anonymous"}</h3>

      <p style={cardMetaStyle}>
        {profile.age ? `${profile.age} yrs` : "Age not set"}
        {profile.location ? ` • ${profile.location}` : ""}
      </p>

      <div style={cardDetailsStyle}>
        {profile.gender && (
          <span style={tagStyle}>👤 {capitalize(profile.gender)}</span>
        )}
        {profile.religion && (
          <span style={tagStyle}>🕉️ {profile.religion}</span>
        )}
        {profile.education && (
          <span style={tagStyle}>🎓 {profile.education}</span>
        )}
        {profile.occupation && (
          <span style={tagStyle}>💼 {profile.occupation}</span>
        )}
      </div>

      {profile.bio && (
        <p style={bioStyle}>
          "{profile.bio.length > 100 ? profile.bio.slice(0, 100) + "..." : profile.bio}"
        </p>
      )}

      <Link to={`/profile/${profile.id}`} style={viewButtonStyle}>
        View Profile
      </Link>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "24px 16px",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "24px",
};

const titleStyle = {
  color: "#1e3a8a",
  fontSize: "32px",
  margin: "0 0 8px 0",
};

const subtitleStyle = {
  color: "#666",
  fontSize: "15px",
  margin: 0,
};

const filterCardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  marginBottom: "32px",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "16px",
  marginBottom: "16px",
};

const fieldWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#555",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const buttonRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const searchButtonStyle = {
  flex: 1,
  minWidth: "140px",
  background: "#1e3a8a",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};

const clearButtonStyle = {
  background: "#e5e7eb",
  color: "#1e3a8a",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};

const resultsSectionStyle = {
  marginTop: "16px",
};

const resultsHeaderStyle = {
  color: "#333",
  fontSize: "18px",
  marginBottom: "16px",
};

const resultsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "20px",
};

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "18px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const cardPhotoWrapperStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  background: "#f3f4f6",
  margin: "0 auto",
  overflow: "hidden",
  border: "2px solid #e5e7eb",
};

const cardNameStyle = {
  margin: 0,
  textAlign: "center",
  color: "#1e3a8a",
  fontSize: "18px",
};

const cardMetaStyle = {
  margin: 0,
  textAlign: "center",
  color: "#666",
  fontSize: "14px",
};

const cardDetailsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  justifyContent: "center",
};

const tagStyle = {
  background: "#eff6ff",
  color: "#1e40af",
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "12px",
};

const bioStyle = {
  fontSize: "13px",
  color: "#555",
  fontStyle: "italic",
  margin: "4px 0 0 0",
  lineHeight: "1.5",
  textAlign: "center",
};

const viewButtonStyle = {
  display: "block",
  textAlign: "center",
  padding: "10px",
  background: "#1e3a8a",
  color: "white",
  textDecoration: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  marginTop: "auto",
};

export default ProfileSearch;
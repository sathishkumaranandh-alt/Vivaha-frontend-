import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ProfileSearch() {
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myGender, setMyGender] = useState(null);
  const [community, setCommunity] = useState("");
  const [shortlistedIds, setShortlistedIds] = useState(new Set());
  const [sentInterestIds, setSentInterestIds] = useState(new Set());

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setSearched(true);
          runSearch({}, null, "");
          return;
        }

        setCurrentUserId(user.id);

        // Load my profile
        const res = await fetch(`${BACKEND_URL}/profile/${user.id}`);
        let myProfile = null;
        if (res.ok) {
          const data = await res.json();
          myProfile = data.profile;
        }

        const gender = myProfile?.gender || null;
        const myCommunity = myProfile?.community || localStorage.getItem("community") || "";

        setMyGender(gender);
        setCommunity(myCommunity);

        // Load shortlists + sent interests (for heart/interest buttons)
        await Promise.all([
          loadShortlists(user.id),
          loadSentInterests(user.id),
        ]);

        const oppositeGender =
          gender === "male" ? "female" : gender === "female" ? "male" : "";

        const initialFilters = {
          age_min: "",
          age_max: "",
          gender: oppositeGender,
          religion: "",
          location: "",
        };
        setFilters(initialFilters);
        await runSearch(initialFilters, user.id, myCommunity);
      } catch (err) {
        console.error("Init error:", err);
        setError("Could not load search page.");
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // LOAD SHORTLISTS
  // ============================================================
  const loadShortlists = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlisted/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const ids = new Set((data.shortlisted || []).map((s) => s.shortlisted_user_id));
        setShortlistedIds(ids);
      }
    } catch (err) {
      console.error("Load shortlists error:", err);
    }
  };

  // ============================================================
  // LOAD SENT INTERESTS
  // ============================================================
  const loadSentInterests = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/sent/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const ids = new Set((data.interests || []).map((i) => i.receiver_id));
        setSentInterestIds(ids);
      }
    } catch (err) {
      console.error("Load sent interests error:", err);
    }
  };

  // ============================================================
  // TOGGLE SHORTLIST
  // ============================================================
  const toggleShortlist = async (targetUserId, targetName) => {
    if (!currentUserId) {
      toast.error("Please log in first");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          shortlisted_user_id: targetUserId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newSet = new Set(shortlistedIds);
        if (data.action === "added") {
          newSet.add(targetUserId);
          toast.success(`Shortlisted ${targetName || "profile"}`);
        } else {
          newSet.delete(targetUserId);
          toast.info("Removed from shortlist");
        }
        setShortlistedIds(newSet);
      }
    } catch (err) {
      console.error("Shortlist error:", err);
      toast.error("Failed to update shortlist");
    }
  };

  // ============================================================
  // SEND INTEREST
  // ============================================================
  const sendInterest = async (targetUserId, targetName) => {
    if (!currentUserId) {
      toast.error("Please log in first");
      return;
    }

    if (sentInterestIds.has(targetUserId)) {
      toast.info("Interest already sent to " + (targetName || "this user"));
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/interests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          receiver_id: targetUserId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const newSet = new Set(sentInterestIds);
        newSet.add(targetUserId);
        setSentInterestIds(newSet);
        toast.success(`❤️ Interest sent to ${targetName || "user"}!`);
      } else {
        toast.error(data.error || "Could not send interest");
      }
    } catch (err) {
      console.error("Send interest error:", err);
      toast.error("Network error");
    }
  };

  // ============================================================
  // RUN SEARCH
  // ============================================================
  const runSearch = async (customFilters = null, excludeId = null, customCommunity = null) => {
    try {
      setLoading(true);
      setError(null);

      const f = customFilters || filters;
      const communityToUse = customCommunity !== null ? customCommunity : community;
      const userIdToExclude = excludeId || currentUserId;

      const params = new URLSearchParams();
      if (f.age_min) params.append("age_min", f.age_min);
      if (f.age_max) params.append("age_max", f.age_max);
      if (f.gender) params.append("gender", f.gender);
      if (f.religion) params.append("religion", f.religion);
      if (f.location) params.append("location", f.location);
      if (communityToUse) params.append("community", communityToUse);

      const url = `${BACKEND_URL}/profile/search${
        params.toString() ? "?" + params.toString() : ""
      }`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      const filtered = (data.results || []).filter((p) => {
        if (userIdToExclude && p.id === userIdToExclude) return false;
        if (myGender && p.gender && p.gender === myGender) return false;
        return true;
      });

      setResults(filtered);
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setError("Could not load results. Try again in 30 seconds.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  const handleClear = () => {
    const oppositeGender =
      myGender === "male" ? "female" : myGender === "female" ? "male" : "";
    const cleared = {
      age_min: "",
      age_max: "",
      gender: oppositeGender,
      religion: "",
      location: "",
    };
    setFilters(cleared);
    runSearch(cleared);
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🔍 Find Your Match</h1>
        <p style={subtitleStyle}>
          {myGender
            ? `Showing ${myGender === "male" ? "female" : "male"} profiles${community ? ` from ${community} community` : ""}`
            : "Use the filters below to discover compatible partners"}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={filterCardStyle}>
        <div style={filterGridStyle}>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Min Age</label>
            <input type="number" name="age_min" placeholder="18" value={filters.age_min} onChange={handleChange} style={inputStyle} min="18" max="80" />
          </div>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Max Age</label>
            <input type="number" name="age_max" placeholder="60" value={filters.age_max} onChange={handleChange} style={inputStyle} min="18" max="80" />
          </div>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>
              Gender {myGender && <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "500" }}>(auto)</span>}
            </label>
            <select name="gender" value={filters.gender} onChange={handleChange} style={inputStyle} disabled={!!myGender}>
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Religion</label>
            <input type="text" name="religion" placeholder="e.g. Hindu" value={filters.religion} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Location</label>
            <input type="text" name="location" placeholder="e.g. Chennai" value={filters.location} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={buttonRowStyle}>
          <button type="submit" disabled={loading} style={searchButtonStyle}>
            {loading ? "Searching... ⏳" : "🔍 Search"}
          </button>
          <button type="button" onClick={handleClear} disabled={loading} style={clearButtonStyle}>
            Clear Filters
          </button>
        </div>
      </form>

      <div style={resultsSectionStyle}>
        {loading && !searched && (
          <p style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>Loading profiles... ⏳</p>
        )}
        {error && (
          <p style={{ textAlign: "center", color: "#b91c1c", marginTop: "40px" }}>{error}</p>
        )}
        {!loading && searched && results.length === 0 && !error && (
          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>🔎</div>
            <p style={{ color: "#666", fontSize: "17px" }}>No profiles found</p>
            <p style={{ color: "#999", fontSize: "14px" }}>Try adjusting your filters</p>
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
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isShortlisted={shortlistedIds.has(profile.id)}
                  interestSent={sentInterestIds.has(profile.id)}
                  onToggleShortlist={() => toggleShortlist(profile.id, profile.name)}
                  onSendInterest={() => sendInterest(profile.id, profile.name)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PROFILE CARD WITH FUNCTIONAL BUTTONS
// ============================================================
function ProfileCard({ profile, isShortlisted, interestSent, onToggleShortlist, onSendInterest }) {
  const communityLabel = profile.community
    ? profile.community.charAt(0).toUpperCase() + profile.community.slice(1)
    : null;

  return (
    <div style={cardStyle}>
      {/* PHOTO */}
      <div style={photoWrapperStyle}>
        {profile.photo_url ? (
          <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={photoPlaceholderStyle}>👤</div>
        )}
        {profile.is_verified && (
          <div style={verifiedBadgeStyle} title="Verified Profile">✓</div>
        )}
        <div style={onlineDotStyle} title="Recently active" />
      </div>

      {/* NAME + BADGES */}
      <div style={{ textAlign: "center", marginTop: "12px" }}>
        <h3 style={cardNameStyle}>
          {profile.name || "Anonymous"}
          {profile.is_verified && <span style={{ color: "#2563eb", marginLeft: "4px" }}>✔️</span>}
        </h3>

        <div style={metaRowStyle}>
          {communityLabel && <span style={communityTagStyle}>🏷️ {communityLabel}</span>}
          {profile.age && <span style={metaTextStyle}>{profile.age} yrs</span>}
        </div>

        {profile.location && <p style={locationTextStyle}>📍 {profile.location}</p>}
      </div>

      {/* DETAIL PILLS */}
      <div style={pillsRowStyle}>
        {profile.religion && <span style={pillStyle}>🕉️ {profile.religion}</span>}
        {profile.education && <span style={pillStyle}>🎓 {profile.education}</span>}
        {profile.occupation && <span style={pillStyle}>💼 {profile.occupation}</span>}
      </div>

      {/* BIO */}
      {profile.bio && (
        <p style={bioStyle}>
          "{profile.bio.length > 70 ? profile.bio.slice(0, 70) + "..." : profile.bio}"
        </p>
      )}

      {/* ACTIONS */}
      <div style={actionsRowStyle}>
        <Link to={`/profile/${profile.id}`} style={viewBtnStyle}>View</Link>
        <button
          onClick={onToggleShortlist}
          style={{
            ...iconBtnStyle,
            background: isShortlisted ? "#fee2e2" : "#f3f4f6",
            color: isShortlisted ? "#dc2626" : "#666",
          }}
          title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
        >
          {isShortlisted ? "❤️" : "🤍"}
        </button>
        <button
          onClick={onSendInterest}
          disabled={interestSent}
          style={{
            ...iconBtnStyle,
            background: interestSent ? "#fef3c7" : "#dbeafe",
            color: interestSent ? "#92400e" : "#1e40af",
            cursor: interestSent ? "not-allowed" : "pointer",
          }}
          title={interestSent ? "Interest sent" : "Send interest"}
        >
          {interestSent ? "✔️" : "💌"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" };
const headerStyle = { textAlign: "center", marginBottom: "24px" };
const titleStyle = { color: "#1e3a8a", fontSize: "28px", margin: "0 0 8px 0" };
const subtitleStyle = { color: "#666", fontSize: "14px", margin: 0 };
const filterCardStyle = { background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "32px" };
const filterGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "16px" };
const fieldWrapperStyle = { display: "flex", flexDirection: "column", gap: "4px" };
const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#555" };
const inputStyle = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box", background: "white" };
const buttonRowStyle = { display: "flex", gap: "12px", flexWrap: "wrap" };
const searchButtonStyle = { flex: 1, minWidth: "140px", background: "#1e3a8a", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" };
const clearButtonStyle = { background: "#e5e7eb", color: "#1e3a8a", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" };
const resultsSectionStyle = { marginTop: "16px" };
const resultsHeaderStyle = { color: "#333", fontSize: "18px", marginBottom: "16px" };
const resultsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" };
const cardStyle = { background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "10px", border: "1px solid #f0f0f0" };
const photoWrapperStyle = { width: "110px", height: "110px", borderRadius: "50%", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", margin: "0 auto", position: "relative", border: "3px solid #1e3a8a", overflow: "hidden", boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)" };
const photoPlaceholderStyle = { fontSize: "52px", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" };
const verifiedBadgeStyle = { position: "absolute", bottom: "4px", right: "4px", background: "#2563eb", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" };
const onlineDotStyle = { position: "absolute", top: "6px", right: "6px", background: "#22c55e", width: "12px", height: "12px", borderRadius: "50%", border: "2px solid white" };
const cardNameStyle = { margin: 0, color: "#1e3a8a", fontSize: "19px", fontWeight: "700", textAlign: "center" };
const metaRowStyle = { display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" };
const communityTagStyle = { background: "#eff6ff", color: "#1e40af", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" };
const metaTextStyle = { color: "#666", fontSize: "13px", fontWeight: "500" };
const locationTextStyle = { margin: "4px 0 0 0", color: "#888", fontSize: "13px" };
const pillsRowStyle = { display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginTop: "4px" };
const pillStyle = { background: "#f3f4f6", color: "#4b5563", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "500" };
const bioStyle = { fontSize: "12px", color: "#666", fontStyle: "italic", margin: "6px 0 0 0", lineHeight: "1.5", textAlign: "center", padding: "8px 6px", background: "#fafafa", borderRadius: "8px" };
const actionsRowStyle = { display: "flex", gap: "6px", marginTop: "auto", paddingTop: "8px" };
const viewBtnStyle = { flex: 1, textAlign: "center", padding: "10px", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", textDecoration: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", boxShadow: "0 2px 8px rgba(30, 58, 138, 0.3)" };
const iconBtnStyle = { background: "#f3f4f6", color: "#666", border: "none", width: "42px", height: "42px", borderRadius: "8px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 };

export default ProfileSearch;
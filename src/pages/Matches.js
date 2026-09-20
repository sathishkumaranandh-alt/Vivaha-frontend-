import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);

        // 1. Get the currently logged-in user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Please log in to see your matches.");
          setLoading(false);
          return;
        }

        // 2. Fetch my own profile from the backend
        const myProfileRes = await fetch(`${BACKEND_URL}/profile/${user.id}`);
        if (myProfileRes.ok) {
          const myProfileData = await myProfileRes.json();
          setMyProfile(myProfileData.profile);
        }

        // 3. Fetch matches from the backend
        const res = await fetch(`${BACKEND_URL}/profile/matches/${user.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch matches");
        }

        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Matches error:", err);
        setError("Could not load matches. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  // =====================
  // RENDERING
  // =====================

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Your Matches</h2>
        <p>Loading your matches... ⏳</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Your Matches</h2>
        <p style={{ color: "red" }}>{error}</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  if (!myProfile) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Your Matches</h2>
        <p>
          Please complete your profile first to see matches.{" "}
          <Link to="/profile">Complete Profile</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Matches</h2>
      <p style={{ color: "#666" }}>
        Hi <strong>{myProfile.name || "there"}</strong>! We found{" "}
        <strong>{matches.length}</strong> potential{" "}
        {matches.length === 1 ? "match" : "matches"} for you.
      </p>

      {matches.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <p>No matches yet. 😔</p>
          <p>Check back later, or update your profile to improve your chances.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

// =====================
// MATCH CARD COMPONENT
// =====================
function MatchCard({ match }) {
  // Color for the score badge
  const scoreColor =
    match.matchScore >= 80
      ? "#22c55e" // green
      : match.matchScore >= 60
      ? "#eab308" // yellow
      : "#ef4444"; // red

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header with photo and score */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {match.photo_url ? (
            <img
              src={match.photo_url}
              alt={match.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "18px" }}>
            {match.name || "Anonymous"}
          </h3>
          <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
            {match.age ? `${match.age} yrs` : "Age not set"}
            {match.location ? ` • ${match.location}` : ""}
          </p>
        </div>
        <div
          style={{
            background: scoreColor,
            color: "white",
            padding: "6px 10px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          {match.matchScore}
        </div>
      </div>

      {/* Details */}
      <div style={{ fontSize: "14px", color: "#444" }}>
        {match.religion && (
          <p style={{ margin: "4px 0" }}>
            🕉️ <strong>{match.religion}</strong>
            {match.caste ? ` • ${match.caste}` : ""}
          </p>
        )}
        {match.education && (
          <p style={{ margin: "4px 0" }}>🎓 {match.education}</p>
        )}
        {match.occupation && (
          <p style={{ margin: "4px 0" }}>💼 {match.occupation}</p>
        )}
      </div>

      {/* Match Reasons */}
      {match.matchReasons && match.matchReasons.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {match.matchReasons.map((reason, idx) => (
            <span
              key={idx}
              style={{
                background: "#eff6ff",
                color: "#1e40af",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            >
              ✓ {reason}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {match.bio && (
        <p
          style={{
            fontSize: "14px",
            color: "#555",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          "{match.bio}"
        </p>
      )}

      {/* Action Button */}
      <Link
        to={`/profile/${match.id}`}
        style={{
          display: "block",
          textAlign: "center",
          padding: "10px",
          background: "#1e3a8a",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          marginTop: "auto",
        }}
      >
        View Profile
      </Link>
    </div>
  );
}

export default Matches;
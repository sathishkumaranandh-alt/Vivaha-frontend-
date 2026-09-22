import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Matches() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in to see your matches.");
          setLoading(false);
          return;
        }

        // Fetch accepted interests (both directions)
        const [r1, r2] = await Promise.all([
          fetch(`${BACKEND_URL}/interests/received/${user.id}?status=accepted`),
          fetch(`${BACKEND_URL}/interests/sent/${user.id}?status=accepted`),
        ]);

        let received = [];
        let sent = [];
        if (r1.ok) received = (await r1.json()).interests || [];
        if (r2.ok) sent = (await r2.json()).interests || [];

        const list = [];

        received.forEach((i) => {
          if (i.sender) {
            list.push({
              id: i.id,
              otherUserId: i.sender_id,
              profile: i.sender,
              connectedAt: i.responded_at || i.created_at,
              source: "received",
            });
          }
        });

        sent.forEach((i) => {
          if (i.receiver) {
            list.push({
              id: i.id,
              otherUserId: i.receiver_id,
              profile: i.receiver,
              connectedAt: i.responded_at || i.created_at,
              source: "sent",
            });
          }
        });

        list.sort((a, b) => new Date(b.connectedAt) - new Date(a.connectedAt));
        setConnections(list);
      } catch (err) {
        console.error("Matches load error:", err);
        setError("Could not load your matches.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#666", marginTop: "16px" }}>Loading your matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "#1e3a8a", fontSize: isMobile ? "22px" : "28px", margin: "0 0 8px 0" }}>
          💕 Your Matches
        </h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
          {connections.length > 0
            ? `You have ${connections.length} connection${connections.length === 1 ? "" : "s"}`
            : "Your confirmed connections appear here"}
        </p>
      </div>

      {connections.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {connections.map((c) => (
            <MatchCard key={c.id} connection={c} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MATCH CARD
// ============================================================
function MatchCard({ connection, isMobile }) {
  const { profile, connectedAt } = connection;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
        <div style={avatarStyle}>
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            "👤"
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <h3
              style={{
                margin: 0,
                color: "#1e3a8a",
                fontSize: "17px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {profile.name || "Anonymous"}
            </h3>
            {profile.is_verified && (
              <span style={{ color: "#2563eb", fontSize: "13px" }} title="Verified">
                ✔️
              </span>
            )}
          </div>

          <p style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}>
            {profile.age ? `${profile.age} yrs` : ""}
            {profile.age && profile.location ? " • " : ""}
            {profile.location || ""}
          </p>

          {profile.community && (
            <span style={communityTagStyle}>
              🏷️ {profile.community.charAt(0).toUpperCase() + profile.community.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Connected badge */}
      <div style={connectedBadgeStyle}>
        💚 Connected {formatConnected(connectedAt)}
      </div>

      {profile.bio && (
        <p style={bioStyle}>
          "{profile.bio.length > 80 ? profile.bio.slice(0, 80) + "..." : profile.bio}"
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Link to={`/messages?to=${profile.id}`} style={messageBtn}>
          💬 Message
        </Link>
        <Link to={`/profile/${profile.id}`} style={viewBtn}>
          👁️ View Profile
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <div style={{ fontSize: "70px", marginBottom: "16px" }}>💕</div>
      <h2 style={{ color: "#1e3a8a", margin: "0 0 12px 0", fontSize: "20px" }}>
        No matches yet
      </h2>
      <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
        When you and another member accept each other's interest, they'll appear here as a match.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/search" style={primaryBtnStyle}>
          🔍 Find Matches
        </Link>
        <Link to="/interests" style={secondaryBtnStyle}>
          💌 View Interests
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function formatConnected(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMins = Math.floor((now - d) / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" };

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #1e3a8a",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid #f0f0f0",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const avatarStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "32px",
  overflow: "hidden",
  flexShrink: 0,
  border: "3px solid #1e3a8a",
};

const communityTagStyle = {
  display: "inline-block",
  background: "#eff6ff",
  color: "#1e40af",
  padding: "3px 10px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "600",
  marginTop: "4px",
};

const connectedBadgeStyle = {
  background: "#dcfce7",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "#166534",
  fontWeight: "600",
};

const bioStyle = {
  fontSize: "12px",
  color: "#666",
  fontStyle: "italic",
  margin: 0,
  lineHeight: "1.5",
  padding: "8px 10px",
  background: "#fafafa",
  borderRadius: "8px",
};

const messageBtn = {
  flex: 1,
  textAlign: "center",
  padding: "10px",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "white",
  textDecoration: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "13px",
  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
};

const viewBtn = {
  flex: 1,
  textAlign: "center",
  padding: "10px",
  background: "#f3f4f6",
  color: "#1e3a8a",
  textDecoration: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "13px",
};

const primaryBtnStyle = {
  background: "#1e3a8a",
  color: "white",
  padding: "10px 22px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
  display: "inline-block",
};

const secondaryBtnStyle = {
  background: "#f3f4f6",
  color: "#1e3a8a",
  padding: "10px 22px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
  display: "inline-block",
};

export default Matches
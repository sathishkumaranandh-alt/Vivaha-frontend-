import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Interests() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setUserId(user.id);
        await loadAll(user.id);
      } catch (err) {
        console.error(err);
        setError("Failed to load interests.");
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async (uid) => {
    const [r1, r2, r3] = await Promise.all([
      fetch(`${BACKEND_URL}/interests/received/${uid}`),
      fetch(`${BACKEND_URL}/interests/sent/${uid}`),
      fetch(`${BACKEND_URL}/interests/shortlisted/${uid}`),
    ]);
    if (r1.ok) setReceived((await r1.json()).interests || []);
    if (r2.ok) setSent((await r2.json()).interests || []);
    if (r3.ok) setShortlisted((await r3.json()).shortlisted || []);
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const respond = async (interestId, status, senderName) => {
    let reason = null;
    if (status === "declined") {
      reason = window.prompt(
        `Decline interest from ${senderName || "this user"}?\n\nOptional: Give a reason (e.g., "Not matching my preferences")`,
        ""
      );
      // If user cancels prompt, reason === null and we still proceed (silent decline)
    }

    setBusy(interestId);
    try {
      const res = await fetch(`${BACKEND_URL}/interests/respond/${interestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      if (res.ok) {
        toast.success(status === "accepted" ? "Interest accepted! 💕" : "Interest declined");
        await loadAll(userId);
      } else {
        toast.error("Failed to respond");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setBusy(null);
    }
  };

  const removeShortlist = async (targetId, name) => {
    if (!window.confirm(`Remove ${name || "this user"} from shortlist?`)) return;
    setBusy(targetId);
    try {
      await fetch(`${BACKEND_URL}/interests/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, shortlisted_user_id: targetId }),
      });
      toast.info("Removed from shortlist");
      await loadAll(userId);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#666", marginTop: "16px" }}>Loading interests...</p>
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

  const pendingReceived = received.filter((i) => i.status === "pending");

  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "#1e3a8a", fontSize: isMobile ? "22px" : "28px", margin: "0 0 8px 0" }}>
          💌 Interests
        </h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
          Manage interests and shortlisted profiles
        </p>
      </div>

      {/* TABS */}
      <div style={tabsBarStyle}>
        <TabButton
          label={`📥 Received`}
          count={pendingReceived.length}
          active={tab === "received"}
          activeColor="#1e3a8a"
          onClick={() => setTab("received")}
        />
        <TabButton
          label={`📤 Sent`}
          count={sent.length}
          active={tab === "sent"}
          activeColor="#7c3aed"
          onClick={() => setTab("sent")}
        />
        <TabButton
          label={`❤️ Shortlisted`}
          count={shortlisted.length}
          active={tab === "shortlisted"}
          activeColor="#dc2626"
          onClick={() => setTab("shortlisted")}
        />
      </div>

      {/* CONTENT */}
      <div style={{ marginTop: "16px" }}>
        {tab === "received" && (
          <ReceivedTab
            items={received}
            isMobile={isMobile}
            busy={busy}
            onAccept={(i) => respond(i.id, "accepted", i.sender?.name)}
            onDecline={(i) => respond(i.id, "declined", i.sender?.name)}
          />
        )}
        {tab === "sent" && (
          <SentTab items={sent} isMobile={isMobile} />
        )}
        {tab === "shortlisted" && (
          <ShortlistedTab
            items={shortlisted}
            isMobile={isMobile}
            busy={busy}
            onRemove={removeShortlist}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB BUTTON
// ============================================================
function TabButton({ label, count, active, activeColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? activeColor : "white",
        color: active ? "white" : "#374151",
        border: active ? `2px solid ${activeColor}` : "2px solid #e5e7eb",
        padding: "10px 16px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {count > 0 && (
        <span
          style={{
            background: active ? "rgba(255,255,255,0.3)" : "#dc2626",
            color: "white",
            fontSize: "11px",
            fontWeight: "bold",
            borderRadius: "10px",
            padding: "2px 7px",
            minWidth: "18px",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================
// RECEIVED TAB
// ============================================================
function ReceivedTab({ items, isMobile, busy, onAccept, onDecline }) {
  const pending = items.filter((i) => i.status === "pending");
  const accepted = items.filter((i) => i.status === "accepted");
  const declined = items.filter((i) => i.status === "declined");

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="📭"
        title="No interests yet"
        subtitle="When someone sends you an interest, it'll appear here."
      />
    );
  }

  return (
    <div>
      {pending.length > 0 && (
        <Section title={`🚨 New Interests (${pending.length})`}>
          {pending.map((i) => (
            <InterestCard
              key={i.id}
              profile={i.sender}
              status="pending"
              timestamp={i.created_at}
              isMobile={isMobile}
              busy={busy === i.id}
              actions={
                <>
                  <button
                    onClick={onAccept}
                    disabled={busy === i.id}
                    style={acceptBtn}
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={onDecline}
                    disabled={busy === i.id}
                    style={declineBtn}
                  >
                    ❌ Decline
                  </button>
                </>
              }
            />
          ))}
        </Section>
      )}

      {accepted.length > 0 && (
        <Section title={`💕 Accepted (${accepted.length})`}>
          {accepted.map((i) => (
            <InterestCard
              key={i.id}
              profile={i.sender}
              status="accepted"
              timestamp={i.responded_at || i.created_at}
              isMobile={isMobile}
              actions={
                <Link to={`/messages?to=${i.sender_id}`} style={messageBtn}>
                  💬 Message
                </Link>
              }
            />
          ))}
        </Section>
      )}

      {declined.length > 0 && (
        <Section title={`✖️ Declined (${declined.length})`}>
          {declined.map((i) => (
            <InterestCard
              key={i.id}
              profile={i.sender}
              status="declined"
              timestamp={i.responded_at || i.created_at}
              isMobile={isMobile}
              actions={null}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

// ============================================================
// SENT TAB
// ============================================================
function SentTab({ items, isMobile }) {
  if (items.length === 0) {
    return (
      <EmptyState
        emoji="📤"
        title="No interests sent"
        subtitle="Browse profiles and send interests from the Search page."
        buttonLabel="Find Matches"
        buttonLink="/search"
      />
    );
  }

  return (
    <div>
      {items.map((i) => (
        <InterestCard
          key={i.id}
          profile={i.receiver}
          status={i.status}
          timestamp={i.created_at}
          isMobile={isMobile}
          actions={
            i.status === "accepted" ? (
              <Link to={`/messages?to=${i.receiver_id}`} style={messageBtn}>
                💬 Message
              </Link>
            ) : null
          }
        />
      ))}
    </div>
  );
}

// ============================================================
// SHORTLISTED TAB
// ============================================================
function ShortlistedTab({ items, isMobile, busy, onRemove }) {
  if (items.length === 0) {
    return (
      <EmptyState
        emoji="🤍"
        title="No shortlisted profiles"
        subtitle="Tap the heart icon on any profile to save it here."
        buttonLabel="Browse Profiles"
        buttonLink="/search"
      />
    );
  }

  return (
    <div>
      {items.map((s) => (
        <InterestCard
          key={s.id}
          profile={s.user}
          status="shortlisted"
          timestamp={s.created_at}
          isMobile={isMobile}
          busy={busy === s.shortlisted_user_id}
          actions={
            <>
              <Link to={`/profile/${s.shortlisted_user_id}`} style={viewBtn}>
                👁️ View
              </Link>
              <button
                onClick={() => onRemove(s.shortlisted_user_id, s.user?.name)}
                disabled={busy === s.shortlisted_user_id}
                style={declineBtn}
              >
                ❌ Remove
              </button>
            </>
          }
        />
      ))}
    </div>
  );
}

// ============================================================
// INTEREST CARD
// ============================================================
function InterestCard({ profile, status, timestamp, isMobile, actions, busy }) {
  if (!profile) {
    return (
      <div style={{ ...cardStyle, opacity: 0.6 }}>
        <p style={{ margin: 0, color: "#888" }}>User deleted</p>
      </div>
    );
  }

  const statusBadges = {
    pending: { bg: "#fef3c7", color: "#92400e", text: "⏳ Pending" },
    accepted: { bg: "#dcfce7", color: "#166534", text: "✅ Accepted" },
    declined: { bg: "#fee2e2", color: "#991b1b", text: "✖️ Declined" },
    shortlisted: { bg: "#fce7f3", color: "#9f1239", text: "❤️ Shortlisted" },
  };
  const statusStyle = statusBadges[status] || statusBadges.pending;

  return (
    <div style={{ ...cardStyle, opacity: busy ? 0.5 : 1 }}>
      <div
        style={{
          display: "flex",
          gap: "14px",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "flex-start",
          textAlign: isMobile ? "center" : "left",
        }}
      >
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, color: "#1e3a8a", fontSize: "17px" }}>
              {profile.name || "Anonymous"}
            </h3>
            {profile.is_verified && (
              <span style={{ color: "#2563eb", fontSize: "14px" }} title="Verified">✔️</span>
            )}
            <span style={{ ...statusBadge, background: statusStyle.bg, color: statusStyle.color }}>
              {statusStyle.text}
            </span>
          </div>

          <p style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}>
            {profile.age ? `${profile.age} yrs` : ""}
            {profile.age && profile.location ? " • " : ""}
            {profile.location || ""}
          </p>

          {profile.community && (
            <p style={{ margin: "2px 0", color: "#888", fontSize: "12px" }}>
              🏷️ {profile.community.charAt(0).toUpperCase() + profile.community.slice(1)}
            </p>
          )}

          {profile.bio && (
            <p style={{ margin: "6px 0 0 0", fontStyle: "italic", color: "#555", fontSize: "12px" }}>
              "{profile.bio.length > 80 ? profile.bio.slice(0, 80) + "..." : profile.bio}"
            </p>
          )}

          {timestamp && (
            <p style={{ margin: "6px 0 0 0", color: "#aaa", fontSize: "11px" }}>
              {formatTime(timestamp)}
            </p>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px", justifyContent: isMobile ? "center" : "flex-start" }}>
        {actions}
        <Link to={`/profile/${profile.id}`} style={viewBtn}>
          👁️ View Profile
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS / SUB-COMPONENTS
// ============================================================
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ color: "#1e3a8a", fontSize: "15px", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
    </div>
  );
}

function EmptyState({ emoji, title, subtitle, buttonLabel, buttonLink }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: "60px", marginBottom: "12px" }}>{emoji}</div>
      <h3 style={{ color: "#1e3a8a", margin: "0 0 8px 0", fontSize: "18px" }}>{title}</h3>
      <p style={{ color: "#666", fontSize: "14px", margin: "0 0 20px 0", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
        {subtitle}
      </p>
      {buttonLabel && buttonLink && (
        <Link
          to={buttonLink}
          style={{
            background: "#1e3a8a",
            color: "white",
            padding: "10px 24px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "14px",
            display: "inline-block",
          }}
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMins = Math.floor((now - d) / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ============================================================
// STYLES
// ============================================================
const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #1e3a8a",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

const pageStyle = { maxWidth: "800px", margin: "0 auto", padding: "24px 16px" };

const tabsBarStyle = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "4px",
  WebkitOverflowScrolling: "touch",
};

const cardStyle = {
  background: "white",
  borderRadius: "14px",
  padding: "16px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid #f0f0f0",
  transition: "opacity 0.2s",
};

const avatarStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "32px",
  overflow: "hidden",
  flexShrink: 0,
  border: "3px solid #e5e7eb",
};

const statusBadge = {
  fontSize: "11px",
  fontWeight: "600",
  padding: "3px 8px",
  borderRadius: "10px",
};

const acceptBtn = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const declineBtn = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const messageBtn = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const viewBtn = {
  background: "#f3f4f6",
  color: "#1e3a8a",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

export default Interests;
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import BackButton from "../components/BackButton";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Interests() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState(() => {
    const t = searchParams.get("tab");
    return ["received", "sent", "shortlisted"].includes(t) ? t : "received";
  });
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
    const current = searchParams.get("tab");
    if (current !== tab) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", tab);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
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

  const respond = async (interestId, status, senderName) => {
    let reason = null;
    if (status === "declined") {
      reason = window.prompt(
        `Decline interest from ${senderName || "this user"}?\n\nOptional: Give a reason (e.g., "Not matching my preferences")`,
        ""
      );
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
        window.dispatchEvent(new Event("badge-refresh"));
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

  const fromPath = location.pathname + location.search;

  const pendingReceived = received.filter((i) => i.status === "pending");

  if (loading) {
    return (
      <div style={pageBgStyle}>
        <div style={containerStyle}>
          <BackButton />
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageBgStyle}>
        <div style={containerStyle}>
          <BackButton />
          <div style={errorCardStyle}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>⚠️</div>
            <p style={{ color: "#b91c1c", fontWeight: 600 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      key: "received",
      label: "Received",
      icon: "📥",
      count: pendingReceived.length,
      color: "#8B0A2E",
    },
    {
      key: "sent",
      label: "Sent",
      icon: "📤",
      count: sent.length,
      color: "#7c3aed",
    },
    {
      key: "shortlisted",
      label: "Shortlisted",
      icon: "❤️",
      count: shortlisted.length,
      color: "#dc2626",
    },
  ];

  const currentTab = tabs.find((t) => t.key === tab);

  return (
    <div style={pageBgStyle}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .interest-card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .interest-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(139,10,46,0.12) !important;
        }
        .interest-tab-btn {
          transition: all 0.25s ease;
        }
        .interest-tab-btn:hover {
          transform: translateY(-1px);
        }
      `}</style>

      <div style={containerStyle}>
        <BackButton />

        {/* ============================================ */}
        {/* ELEGANT HEADER */}
        {/* ============================================ */}
        <div style={headerCardStyle}>
          <div style={headerPatternStyle} />
          <div style={headerContentStyle}>
            <div style={headerIconWrapStyle}>💌</div>
            <h1 style={headerTitleStyle}>Your Interests</h1>
            <p style={headerSubStyle}>
              Manage connections and shortlisted profiles
            </p>

            {/* Stats Row */}
            <div style={statsRowStyle}>
              <StatPill
                icon="📥"
                label="Pending"
                value={pendingReceived.length}
                color="#fef3c7"
                textColor="#92400e"
              />
              <StatPill
                icon="💕"
                label="Accepted"
                value={received.filter((i) => i.status === "accepted").length}
                color="#dcfce7"
                textColor="#166534"
              />
              <StatPill
                icon="❤️"
                label="Shortlisted"
                value={shortlisted.length}
                color="#fee2e2"
                textColor="#991b1b"
              />
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* ELEGANT TAB PILLS */}
        {/* ============================================ */}
        <div style={tabsWrapStyle}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="interest-tab-btn"
              style={{
                ...tabPillStyle,
                background:
                  tab === t.key
                    ? `linear-gradient(135deg, ${t.color}, ${shadeColor(t.color)})`
                    : "white",
                color: tab === t.key ? "white" : "#374151",
                border: tab === t.key ? "none" : "1.5px solid #f0e0e0",
                boxShadow:
                  tab === t.key
                    ? `0 6px 20px ${t.color}40`
                    : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: "16px" }}>{t.icon}</span>
              <span>{t.label}</span>
              {t.count > 0 && (
                <span
                  style={{
                    background:
                      tab === t.key ? "rgba(255,255,255,0.25)" : t.color,
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 800,
                    borderRadius: "10px",
                    padding: "2px 7px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ============================================ */}
        {/* TAB CONTENT */}
        {/* ============================================ */}
        <div style={{ marginTop: "20px" }}>
          {tab === "received" && (
            <ReceivedTab
              items={received}
              isMobile={isMobile}
              busy={busy}
              fromPath={fromPath}
              onAccept={(i) => respond(i.id, "accepted", i.sender?.name)}
              onDecline={(i) => respond(i.id, "declined", i.sender?.name)}
            />
          )}
          {tab === "sent" && (
            <SentTab items={sent} isMobile={isMobile} fromPath={fromPath} />
          )}
          {tab === "shortlisted" && (
            <ShortlistedTab
              items={shortlisted}
              isMobile={isMobile}
              busy={busy}
              fromPath={fromPath}
              onRemove={removeShortlist}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT PILL
// ============================================================
function StatPill({ icon, label, value, color, textColor }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: "100px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: color,
          color: textColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#8B0A2E",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "10px", color: "#8a6b6b", fontWeight: 600 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RECEIVED TAB
// ============================================================
function ReceivedTab({ items, isMobile, busy, fromPath, onAccept, onDecline }) {
  const pending = items.filter((i) => i.status === "pending");
  const accepted = items.filter((i) => i.status === "accepted");
  const declined = items.filter((i) => i.status === "declined");

  if (items.length === 0) {
    return (
      <ElegantEmpty
        emoji="📭"
        title="No interests yet"
        subtitle="When someone sends you an interest, it'll appear here."
      />
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      {pending.length > 0 && (
        <Section title="🚨 New" count={pending.length}>
          {pending.map((i) => (
            <InterestCard
              key={i.id}
              profile={i.sender}
              status="pending"
              timestamp={i.created_at}
              isMobile={isMobile}
              busy={busy === i.id}
              fromPath={fromPath}
              actions={
                <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                  <button
                    onClick={() => onAccept(i)}
                    disabled={busy === i.id}
                    style={acceptBtnStyle}
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => onDecline(i)}
                    disabled={busy === i.id}
                    style={declineBtnStyle}
                  >
                    ❌ Decline
                  </button>
                </div>
              }
            />
          ))}
        </Section>
      )}

      {accepted.length > 0 && (
        <Section title="💕 Accepted" count={accepted.length}>
          {accepted.map((i) => (
            <InterestCard
              key={i.id}
              profile={i.sender}
              status="accepted"
              timestamp={i.responded_at || i.created_at}
              isMobile={isMobile}
              fromPath={fromPath}
              actions={
                <Link
                  to={`/messages?to=${i.sender_id}`}
                  style={messageBtnStyle}
                >
                  💬 Message
                </Link>
              }
            />
          ))}
        </Section>
      )}

      {declined.length > 0 && (
        <Section title="✖️ Declined" count={declined.length} collapsed>
          {declined.map((i) => (
            <InterestCard
              key={i.id}
              profile={i.sender}
              status="declined"
              timestamp={i.responded_at || i.created_at}
              isMobile={isMobile}
              fromPath={fromPath}
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
function SentTab({ items, isMobile, fromPath }) {
  if (items.length === 0) {
    return (
      <ElegantEmpty
        emoji="📤"
        title="No interests sent"
        subtitle="Browse profiles and send interests from the Search page."
        buttonLabel="Find Matches"
        buttonLink="/search"
      />
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      {items.map((i) => (
        <InterestCard
          key={i.id}
          profile={i.receiver}
          status={i.status}
          timestamp={i.created_at}
          isMobile={isMobile}
          fromPath={fromPath}
          actions={
            i.status === "accepted" ? (
              <Link
                to={`/messages?to=${i.receiver_id}`}
                style={messageBtnStyle}
              >
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
function ShortlistedTab({ items, isMobile, busy, fromPath, onRemove }) {
  if (items.length === 0) {
    return (
      <ElegantEmpty
        emoji="🤍"
        title="No shortlisted profiles"
        subtitle="Tap the heart icon on any profile to save it here."
        buttonLabel="Browse Profiles"
        buttonLink="/search"
      />
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      {items.map((s) => (
        <InterestCard
          key={s.id}
          profile={s.user}
          status="shortlisted"
          timestamp={s.created_at}
          isMobile={isMobile}
          busy={busy === s.shortlisted_user_id}
          fromPath={fromPath}
          actions={
            <>
              <Link
                to={`/profile/${s.shortlisted_user_id}`}
                state={{ from: fromPath }}
                style={viewBtnStyle}
              >
                👁️ View
              </Link>
              <button
                onClick={() => onRemove(s.shortlisted_user_id, s.user?.name)}
                disabled={busy === s.shortlisted_user_id}
                style={removeBtnStyle}
              >
                🗑️ Remove
              </button>
            </>
          }
        />
      ))}
    </div>
  );
}

// ============================================================
// SECTION WRAPPER
// ============================================================
function Section({ title, count, collapsed = false, children }) {
  const [open, setOpen] = useState(!collapsed);

  return (
    <div style={{ marginBottom: "24px" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "0 0 12px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <h3
          style={{
            color: "#8B0A2E",
            fontSize: "14px",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            fontWeight: 800,
          }}
        >
          {title} <span style={{ color: "#8a6b6b" }}>({count})</span>
        </h3>
        <span style={{ fontSize: "12px", color: "#8a6b6b" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// INTEREST CARD — ELEGANT
// ============================================================
function InterestCard({
  profile,
  status,
  timestamp,
  isMobile,
  actions,
  busy,
  fromPath,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!profile) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, color: "#888" }}>User deleted</p>
      </div>
    );
  }

  const statusBadges = {
    pending: {
      bg: "linear-gradient(135deg, #fef3c7, #fde68a)",
      color: "#92400e",
      text: "⏳ Pending",
    },
    accepted: {
      bg: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
      color: "#166534",
      text: "✅ Accepted",
    },
    declined: {
      bg: "linear-gradient(135deg, #fee2e2, #fecaca)",
      color: "#991b1b",
      text: "✖️ Declined",
    },
    shortlisted: {
      bg: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
      color: "#9f1239",
      text: "❤️ Shortlisted",
    },
  };
  const statusStyle = statusBadges[status] || statusBadges.pending;

  // Online status (if provided by backend)
  const isOnline = profile.is_online === true;

  return (
    <div
      className="interest-card-hover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        opacity: busy ? 0.5 : 1,
        boxShadow: hovered
          ? "0 12px 30px rgba(139,10,46,0.12)"
          : "0 4px 14px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "14px",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "flex-start",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        {/* AVATAR */}
        <Link
          to={`/profile/${profile.id}`}
          state={{ from: fromPath }}
          style={{ position: "relative", flexShrink: 0 }}
        >
          <div
            style={{
              width: isMobile ? "88px" : "80px",
              height: isMobile ? "88px" : "80px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              overflow: "hidden",
              border: "3px solid white",
              boxShadow: "0 6px 20px rgba(139,10,46,0.12)",
            }}
          >
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name}
                onLoad={() => setImgLoaded(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: imgLoaded ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}
              />
            ) : (
              "👤"
            )}
          </div>
          {isOnline && (
            <span
              style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#16a34a",
                border: "3px solid white",
                boxShadow: "0 0 0 1px rgba(22,163,74,0.3)",
              }}
            />
          )}
        </Link>

        {/* INFO */}
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? "100%" : "auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: isMobile ? "center" : "flex-start",
              flexWrap: "wrap",
              marginBottom: "6px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#2D1B1B",
                fontSize: "17px",
                fontWeight: 800,
              }}
            >
              {profile.name || "Anonymous"}
            </h3>
            {profile.is_verified && (
              <span
                style={{
                  background: "#dbeafe",
                  color: "#1e40af",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                ✓ Verified
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#8a6b6b",
              marginBottom: "8px",
              display: "flex",
              gap: "10px",
              justifyContent: isMobile ? "center" : "flex-start",
              flexWrap: "wrap",
            }}
          >
            {profile.age && <span>🎂 {profile.age} yrs</span>}
            {profile.location && <span>📍 {profile.location}</span>}
          </div>

          {profile.community && (
            <div
              style={{
                display: "inline-block",
                background: "#FDF2F6",
                color: "#8B0A2E",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "20px",
                marginBottom: "10px",
                textTransform: "capitalize",
              }}
            >
              🏷️ {profile.community}
            </div>
          )}

          {profile.bio && (
            <p
              style={{
                margin: "6px 0 0 0",
                fontStyle: "italic",
                color: "#6b7280",
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              "{profile.bio.length > 90 ? profile.bio.slice(0, 90) + "..." : profile.bio}"
            </p>
          )}

          {timestamp && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "11px",
                color: "#aaa",
                fontWeight: 500,
              }}
            >
              🕐 {formatTime(timestamp)}
            </div>
          )}

          {/* Status Badge */}
          <div
            style={{
              marginTop: "10px",
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: 800,
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {statusStyle.text}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "14px",
          justifyContent: isMobile ? "center" : "flex-start",
        }}
      >
        {actions}
        <Link
          to={`/profile/${profile.id}`}
          state={{ from: fromPath }}
          style={viewBtnStyle}
        >
          👁️ View Profile
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// ELEGANT EMPTY STATE
// ============================================================
function ElegantEmpty({ emoji, title, subtitle, buttonLabel, buttonLink }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 24px",
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 8px 30px rgba(139,10,46,0.06)",
        border: "1px solid #f0e0e0",
        animation: "fadeUp 0.4s ease-out",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 20px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
        }}
      >
        {emoji}
      </div>
      <h3
        style={{
          color: "#8B0A2E",
          margin: "0 0 10px 0",
          fontSize: "18px",
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "#8a6b6b",
          fontSize: "13px",
          margin: "0 0 24px 0",
          maxWidth: "360px",
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
      {buttonLabel && buttonLink && (
        <Link
          to={buttonLink}
          style={{
            background: "linear-gradient(135deg, #8B0A2E, #a01438)",
            color: "white",
            padding: "12px 28px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "14px",
            display: "inline-block",
            boxShadow: "0 8px 24px rgba(139,10,46,0.3)",
          }}
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}

// ============================================================
// SKELETON LOADER
// ============================================================
function SkeletonLoader() {
  return (
    <div style={{ marginTop: "20px" }}>
      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%);
          background-size: 400px 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "18px",
            marginBottom: "14px",
            display: "flex",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <div
            className="skeleton-shimmer"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="skeleton-shimmer"
              style={{
                height: "16px",
                borderRadius: "8px",
                width: "60%",
                marginBottom: "10px",
              }}
            />
            <div
              className="skeleton-shimmer"
              style={{
                height: "12px",
                borderRadius: "8px",
                width: "40%",
                marginBottom: "8px",
              }}
            />
            <div
              className="skeleton-shimmer"
              style={{ height: "12px", borderRadius: "8px", width: "30%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
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

function shadeColor(hex) {
  // Darken a hex color by 15% for gradient
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = Math.max(0, (num >> 16) - 30);
  const g = Math.max(0, ((num >> 8) & 0xff) - 30);
  const b = Math.max(0, (num & 0xff) - 30);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ============================================================
// STYLES
// ============================================================
const pageBgStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #FFF9F5 0%, #FDF2F6 100%)",
  paddingBottom: "40px",
};

const containerStyle = {
  maxWidth: "840px",
  margin: "0 auto",
  padding: "20px 16px",
};

const headerCardStyle = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, #8B0A2E 0%, #a01438 50%, #6B0722 100%)",
  padding: "28px 24px",
  marginBottom: "20px",
  boxShadow: "0 20px 50px rgba(139,10,46,0.25)",
};

const headerPatternStyle = {
  position: "absolute",
  top: "-60px",
  right: "-60px",
  width: "220px",
  height: "220px",
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(212,160,23,0.35), transparent 70%)",
  pointerEvents: "none",
};

const headerContentStyle = {
  position: "relative",
  zIndex: 1,
  textAlign: "center",
};

const headerIconWrapStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  margin: "0 auto 12px",
  border: "1px solid rgba(255,255,255,0.25)",
};

const headerTitleStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "26px",
  fontWeight: 900,
  color: "white",
  margin: "0 0 4px 0",
  letterSpacing: "-0.5px",
};

const headerSubStyle = {
  color: "rgba(255,255,255,0.85)",
  fontSize: "13px",
  margin: "0 0 20px 0",
  fontWeight: 500,
};

const statsRowStyle = {
  display: "flex",
  gap: "10px",
  justifyContent: "center",
  flexWrap: "wrap",
};

const tabsWrapStyle = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "6px",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
};

const tabPillStyle = {
  border: "none",
  padding: "12px 18px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const cardStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "18px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
  border: "1px solid #f0e0e0",
  transition: "opacity 0.2s",
};

const acceptBtnStyle = {
  background: "linear-gradient(135deg, #16a34a, #15803d)",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
  flex: 1,
};

const declineBtnStyle = {
  background: "white",
  color: "#991b1b",
  border: "1.5px solid #fecaca",
  padding: "10px 18px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  flex: 1,
};

const removeBtnStyle = {
  background: "white",
  color: "#991b1b",
  border: "1.5px solid #fecaca",
  padding: "8px 16px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const messageBtnStyle = {
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "0 4px 14px rgba(139,10,46,0.25)",
};

const viewBtnStyle = {
  background: "white",
  color: "#1e3a8a",
  border: "1.5px solid #e5e7eb",
  padding: "8px 16px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

const errorCardStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "60px 20px",
  textAlign: "center",
  border: "1px solid #f0e0e0",
};

export default Interests;
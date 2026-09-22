import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState(null);
  const wrapperRef = useRef(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id || null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Load notifications + poll every 30s
  useEffect(() => {
    if (!userId) {
      setNotifs([]);
      setUnread(0);
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${BACKEND_URL}/notifications/${userId}?limit=30`),
          fetch(`${BACKEND_URL}/notifications/count/${userId}`),
        ]);
        if (r1.ok && !cancelled) {
          const d = await r1.json();
          setNotifs(d.notifications || []);
        }
        if (r2.ok && !cancelled) {
          const d = await r2.json();
          setUnread(d.unreadCount || 0);
        }
      } catch (e) {}
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClickNotif = async (n) => {
    if (!n.is_read) {
      try {
        await fetch(`${BACKEND_URL}/notifications/read/${n.id}`, {
          method: "PATCH",
        });
        setNotifs((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
        setUnread((u) => Math.max(0, u - 1));
      } catch (e) {}
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await fetch(`${BACKEND_URL}/notifications/read-all/${userId}`, {
        method: "PATCH",
      });
      setNotifs((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
    } catch (e) {}
  };

  if (!userId) return null;

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={bellBtnStyle}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={badgeStyle}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={dropdownStyle}>
          <div style={headerStyle}>
            <span style={{ fontWeight: "700", color: "#1e3a8a" }}>
              Notifications
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} style={markAllBtnStyle}>
                Mark all read
              </button>
            )}
          </div>

          <div style={listStyle}>
            {notifs.length === 0 ? (
              <div style={emptyStyle}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>🔔</div>
                <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  style={{
                    ...itemStyle,
                    background: n.is_read ? "white" : "#eff6ff",
                  }}
                >
                  <div style={{ fontSize: "22px", flexShrink: 0 }}>
                    {iconFor(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "13px",
                        color: "#1e3a8a",
                      }}
                    >
                      {n.title}
                    </div>
                    {n.body && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#aaa",
                        marginTop: "4px",
                      }}
                    >
                      {formatTime(n.created_at)}
                    </div>
                  </div>
                  {!n.is_read && <div style={unreadDotStyle} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function iconFor(type) {
  if (type === "interest_received") return "💌";
  if (type === "interest_accepted") return "💕";
  if (type === "interest_declined") return "💔";
  if (type === "message_received") return "💬";
  return "🔔";
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const m = Math.floor((now - d) / 60000);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const bellBtnStyle = {
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.3)",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  fontSize: "18px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  flexShrink: 0,
};

const badgeStyle = {
  position: "absolute",
  top: "-4px",
  right: "-4px",
  background: "#dc2626",
  color: "white",
  fontSize: "10px",
  fontWeight: "bold",
  borderRadius: "10px",
  padding: "2px 5px",
  minWidth: "16px",
};

const dropdownStyle = {
  position: "absolute",
  top: "48px",
  right: "0",
  width: "min(360px, 90vw)",
  maxHeight: "480px",
  background: "white",
  borderRadius: "14px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  overflow: "hidden",
  zIndex: 999,
  border: "1px solid #e5e7eb",
};

const headerStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fafafa",
};

const markAllBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
};

const listStyle = {
  maxHeight: "400px",
  overflowY: "auto",
};

const itemStyle = {
  display: "flex",
  gap: "12px",
  padding: "12px 16px",
  borderBottom: "1px solid #f3f4f6",
  cursor: "pointer",
  position: "relative",
};

const unreadDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#2563eb",
  flexShrink: 0,
  alignSelf: "center",
};

const emptyStyle = {
  padding: "40px 20px",
  textAlign: "center",
};

export default NotificationBell;
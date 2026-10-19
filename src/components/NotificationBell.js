import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { apiFetch } from "../utils/api"; // 🛡️ Added apiFetch for JWT

function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // 🛡️ Switched to apiFetch
      const res = await apiFetch(`/notifications/${user.id}?limit=15`);
      
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // 🛡️ Switched to apiFetch
      await apiFetch(`/notifications/read-all/${user.id}`, {
        method: "PATCH",
      });
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      // 🛡️ Switched to apiFetch
      await apiFetch(`/notifications/read/${id}`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  // 🔑 Icon for each notification type
  const getIcon = (type) => {
    const icons = {
      interest_received: "💌",
      interest_accepted: "💕",
      interest_declined: "💔",
      photo_request: "📩",
      photo_request_accepted: "✅",
      photo_request_declined: "❌",
      contact_request: "📞",
      contact_request_accepted: "✅",
      contact_request_declined: "❌",
      profile_view: "👀",
      boost_expiring: "🚀",
      match: "💕",
    };
    return icons[type] || "🔔";
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) markOneRead(n.id);
    setIsOpen(false);
    if (n.link) {
      // Use SPA navigation for internal links
      if (n.link.startsWith("/")) {
        navigate(n.link);
      } else {
        window.location.href = n.link;
      }
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "transparent",
          border: "none",
          position: "relative",
          cursor: "pointer",
          padding: "6px",
          fontSize: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-4px",
              background: "#dc2626",
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
              minWidth: "18px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: isMobile ? "60px" : "70px",
            right: isMobile ? "8px" : "16px",
            left: isMobile ? "8px" : "auto",
            width: isMobile ? "auto" : "360px",
            maxWidth: isMobile ? "calc(100vw - 16px)" : "90vw",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
            border: "1px solid #f0e0e0",
            zIndex: 999999,
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid #f0e0e0",
              background: "#FFF9F5",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#8B0A2E",
                fontWeight: 700,
              }}
            >
              Notifications{" "}
              {unreadCount > 0 && `(${unreadCount})`}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8B0A2E",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* LIST */}
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#8a6b6b",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f9f9f9",
                    background: n.is_read ? "white" : "#FDF2F6",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* ICON */}
                  <div
                    style={{
                      fontSize: "20px",
                      flexShrink: 0,
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: n.is_read
                        ? "#f9f9f9"
                        : "rgba(139,10,46,0.08)",
                      borderRadius: "50%",
                    }}
                  >
                    {getIcon(n.type)}
                  </div>

                  {/* CONTENT */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#2D1B1B",
                        marginBottom: "2px",
                        paddingRight: n.is_read ? 0 : "16px",
                      }}
                    >
                      {n.title || "New Notification"}
                    </div>
                    {n.body && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#8a6b6b",
                          marginBottom: "4px",
                          lineHeight: 1.4,
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: "10px", color: "#aaa" }}>
                      {n.created_at
                        ? formatTime(n.created_at)
                        : ""}
                    </div>
                  </div>

                  {/* UNREAD DOT */}
                  {!n.is_read && (
                    <span
                      style={{
                        position: "absolute",
                        top: "18px",
                        right: "12px",
                        width: "8px",
                        height: "8px",
                        background: "#dc2626",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: time ago
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
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default NotificationBell;

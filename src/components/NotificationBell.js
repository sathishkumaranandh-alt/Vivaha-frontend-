import React, { useState, useEffect, useRef } from "react";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch(`${BACKEND_URL}/notifications/${user.id}?limit=10`);
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await fetch(`${BACKEND_URL}/notifications/read-all/${user.id}`, { method: "PATCH" });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const markOneRead = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/notifications/read/${id}`, { method: "PATCH" });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
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
          <span style={{
            position: "absolute",
            top: "0",
            right: "0",
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
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "120%",
          right: "-10px",
          width: "320px",
          maxWidth: "90vw",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          border: "1px solid #f0e0e0",
          zIndex: 9999,
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f0e0e0", background: "#FFF9F5" }}>
            <h4 style={{ margin: 0, fontSize: "14px", color: "#8B0A2E", fontWeight: 700 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#8B0A2E", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#8a6b6b", fontSize: "13px" }}>
                🔔 No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markOneRead(n.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f9f9f9",
                    background: n.is_read ? "white" : "#FDF2F6",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#2D1B1B", marginBottom: "2px" }}>
                    {n.title || "New Notification"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8a6b6b", marginBottom: "4px" }}>
                    {n.message || ""}
                  </div>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString("en-IN") : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

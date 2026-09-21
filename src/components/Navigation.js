import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Navigation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // ============================================================
  // AUTH STATE
  // ============================================================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (!session?.user) setUnreadCount(0);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ============================================================
  // UNREAD MESSAGE COUNT — fetch + auto-refresh every 30s
  // ============================================================
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function fetchUnread() {
      try {
        const res = await fetch(`${BACKEND_URL}/messages/unread/${user.id}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        // silent fail — network may be slow
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // every 30 seconds

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUnreadCount(0);
    toast.info("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <nav style={navStyle}>
        <h2 style={{ margin: 0 }}>Vivaha Matrimony</h2>
      </nav>
    );
  }

  return (
    <nav style={navStyle}>
      <div style={topRowStyle}>
        <h2 style={{ margin: 0 }}>Vivaha Matrimony</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user ? (
            <>
              <span style={{ fontSize: "14px", opacity: 0.9 }}>
                👤 {user.email?.split("@")[0]}
              </span>
              <button onClick={handleLogout} style={logoutButtonStyle}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={authLinkStyle}>
                Login
              </Link>
              <Link to="/register" style={registerButtonStyle}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={linksRowStyle}>
        <Link to="/" style={navLinkStyle}>Home</Link>
        <span style={dividerStyle}>|</span>
        <Link to="/profile" style={navLinkStyle}>Profile</Link>
        <span style={dividerStyle}>|</span>
        <Link to="/search" style={navLinkStyle}>Search</Link>
        <span style={dividerStyle}>|</span>
        <Link to="/matches" style={navLinkStyle}>Matches</Link>
        <span style={dividerStyle}>|</span>
        <Link to="/recommendations" style={navLinkStyle}>Recommendations</Link>
        <span style={dividerStyle}>|</span>

        {/* Messages with badge */}
        <Link to="/messages" style={{ ...navLinkStyle, position: "relative" }}>
          Messages
          {unreadCount > 0 && (
            <span style={badgeStyle}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <span style={dividerStyle}>|</span>
        <Link to="/subscription" style={navLinkStyle}>Subscription</Link>

        {user?.email === "sathishkumaranandh@gmail.com" && (
          <>
            <span style={dividerStyle}>|</span>
            <Link to="/admin" style={{ ...navLinkStyle, color: "#fbbf24" }}>
              👑 Admin
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ============================================================
// STYLES
// ============================================================
const navStyle = {
  padding: "16px 20px",
  background: "#1e3a8a",
  color: "white",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
  flexWrap: "wrap",
  gap: "10px",
};

const linksRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  alignItems: "center",
  fontSize: "15px",
};

const navLinkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "4px 8px",
  fontWeight: "600",
  display: "inline-block",
};

const dividerStyle = {
  color: "rgba(255,255,255,0.4)",
  margin: "0 2px",
};

const authLinkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "6px 14px",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.5)",
  fontWeight: "600",
  fontSize: "14px",
};

const registerButtonStyle = {
  color: "#1e3a8a",
  background: "white",
  textDecoration: "none",
  padding: "6px 14px",
  borderRadius: "6px",
  fontWeight: "700",
  fontSize: "14px",
};

const logoutButtonStyle = {
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.5)",
  padding: "6px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};

const badgeStyle = {
  display: "inline-block",
  background: "#dc2626",
  color: "white",
  fontSize: "11px",
  fontWeight: "bold",
  borderRadius: "10px",
  padding: "2px 6px",
  marginLeft: "6px",
  minWidth: "18px",
  textAlign: "center",
  lineHeight: "14px",
  verticalAlign: "middle",
};

export default Navigation;
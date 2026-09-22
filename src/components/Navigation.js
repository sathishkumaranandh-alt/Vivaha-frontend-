import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const COMMUNITIES = [
  { value: "", label: "🌐 All Communities" },
  { value: "vanniyar", label: "🔥 Vanniyar" },
  { value: "naidu", label: "💫 Naidu" },
  { value: "kallar", label: "⚡ Kallar" },
  { value: "thevar", label: "🌟 Thevar" },
];

function Navigation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [community, setCommunity] = useState(
    localStorage.getItem("community") || ""
  );
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [navigate]);

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
      } catch (err) {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUnreadCount(0);
    setMenuOpen(false);
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const handleCommunityChange = (value) => {
    setCommunity(value);
    localStorage.setItem("community", value);
    toast.info(value ? `Switched to ${value} community` : "Showing all communities");
    // Force reload to refetch all filtered data
    setTimeout(() => window.location.reload(), 500);
  };

  const closeMenu = () => setMenuOpen(false);

  if (loading) {
    return (
      <nav style={navStyle}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>Vivaha Matrimony</h2>
      </nav>
    );
  }

  const links = [
    { to: "/", label: "Home" },
    { to: "/profile", label: "Profile" },
    { to: "/search", label: "Search" },
    { to: "/matches", label: "Matches" },
    { to: "/recommendations", label: "Recommendations" },
    { to: "/messages", label: "Messages", badge: unreadCount },
    { to: "/subscription", label: "Subscription" },
    ...(user?.email === "sathishkumaranandh@gmail.com"
      ? [{ to: "/admin", label: "👑 Admin", color: "#fbbf24" }]
      : []),
  ];

  return (
    <nav style={navStyle}>
      <div style={topRowStyle}>
        <h2 style={{ margin: 0, fontSize: "20px", whiteSpace: "nowrap" }}>
          Vivaha Matrimony
        </h2>

        {/* Community selector */}
        <select
          value={community}
          onChange={(e) => handleCommunityChange(e.target.value)}
          style={communitySelectStyle}
        >
          {COMMUNITIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {!isMobile && (
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
        )}

        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={hamburgerStyle}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
            {unreadCount > 0 && !menuOpen && (
              <span style={hamburgerBadgeStyle}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {!isMobile && (
        <div style={linksRowStyle}>
          {links.map((link, i) => (
            <React.Fragment key={link.to}>
              {i > 0 && <span style={dividerStyle}>|</span>}
              <Link
                to={link.to}
                style={{
                  ...navLinkStyle,
                  position: "relative",
                  color: link.color || "white",
                }}
              >
                {link.label}
                {link.badge > 0 && (
                  <span style={badgeStyle}>
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </Link>
            </React.Fragment>
          ))}
        </div>
      )}

      {isMobile && menuOpen && (
        <div style={mobileMenuStyle}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              style={{
                ...mobileLinkStyle,
                color: link.color || "white",
              }}
            >
              {link.label}
              {link.badge > 0 && (
                <span style={{ ...badgeStyle, marginLeft: "auto" }}>
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
              )}
            </Link>
          ))}

          <div style={mobileDividerStyle} />

          {user ? (
            <>
              <div style={mobileUserStyle}>
                👤 {user.email?.split("@")[0]}
              </div>
              <button onClick={handleLogout} style={mobileLogoutButtonStyle}>
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "10px", padding: "8px 0" }}>
              <Link to="/login" onClick={closeMenu} style={mobileAuthButtonStyle}>
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                style={{
                  ...mobileAuthButtonStyle,
                  background: "white",
                  color: "#1e3a8a",
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

const navStyle = {
  padding: "14px 16px",
  background: "#1e3a8a",
  color: "white",
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};
const linksRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  alignItems: "center",
  fontSize: "15px",
  marginTop: "12px",
};
const navLinkStyle = {
  textDecoration: "none",
  padding: "4px 8px",
  fontWeight: "600",
  display: "inline-block",
};
const dividerStyle = { color: "rgba(255,255,255,0.4)", margin: "0 2px" };
const communitySelectStyle = {
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.4)",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "inherit",
  outline: "none",
  flex: 1,
  maxWidth: "220px",
  minWidth: "160px",
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
const hamburgerStyle = {
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.3)",
  width: "44px",
  height: "44px",
  borderRadius: "8px",
  fontSize: "20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  flexShrink: 0,
};
const hamburgerBadgeStyle = {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  background: "#dc2626",
  color: "white",
  fontSize: "10px",
  fontWeight: "bold",
  borderRadius: "10px",
  padding: "2px 5px",
  minWidth: "16px",
};
const mobileMenuStyle = {
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: "1px solid rgba(255,255,255,0.2)",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};
const mobileLinkStyle = {
  textDecoration: "none",
  padding: "14px 12px",
  borderRadius: "8px",
  fontWeight: "600",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  background: "rgba(255,255,255,0.05)",
};
const mobileDividerStyle = {
  height: "1px",
  background: "rgba(255,255,255,0.2)",
  margin: "10px 0",
};
const mobileUserStyle = {
  padding: "10px 12px",
  fontSize: "14px",
  opacity: 0.9,
};
const mobileLogoutButtonStyle = {
  background: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.4)",
  padding: "12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
  width: "100%",
};
const mobileAuthButtonStyle = {
  flex: 1,
  padding: "12px",
  textAlign: "center",
  borderRadius: "8px",
  border: "1px solid white",
  color: "white",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "15px",
};

export default Navigation;
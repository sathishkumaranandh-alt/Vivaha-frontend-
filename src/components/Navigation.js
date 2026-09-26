import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import NotificationBell from "./NotificationBell";
import { useCommunities } from "../utils/communities";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const DEFAULT_SETTINGS = {
  site_name: "Vivaha Matrimony",
};

function Navigation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [community, setCommunity] = useState(
    localStorage.getItem("community") || ""
  );
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const { communities: dbCommunities } = useCommunities();
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
    fetch(`${BACKEND_URL}/settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (!session?.user) {
          setUnreadCount(0);
          setInterestCount(0);
        }
      }
    );
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
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
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  useEffect(() => {
    if (!user) { setInterestCount(0); return; }
    let cancelled = false;
    async function fetchInterests() {
      try {
        const res = await fetch(`${BACKEND_URL}/interests/count/${user.id}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setInterestCount(data.pendingCount || 0);
        }
      } catch (err) {}
    }
    fetchInterests();
    const interval = setInterval(fetchInterests, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  useEffect(() => {
    function refreshAll() {
      if (!user) return;
      fetch(`${BACKEND_URL}/messages/unread/${user.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setUnreadCount(d.unreadCount || 0); })
        .catch(() => {});
      fetch(`${BACKEND_URL}/interests/count/${user.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setInterestCount(d.pendingCount || 0); })
        .catch(() => {});
      window.dispatchEvent(new Event("notification-refresh"));
    }
    window.addEventListener("badge-refresh", refreshAll);
    return () => window.removeEventListener("badge-refresh", refreshAll);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUnreadCount(0);
    setInterestCount(0);
    setMenuOpen(false);
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const handleCommunityChange = (value) => {
    setCommunity(value);
    localStorage.setItem("community", value);
    toast.info(value ? `Switched to ${value} community` : "Showing all communities");
    setTimeout(() => window.location.reload(), 500);
  };

  const closeMenu = () => setMenuOpen(false);

  if (loading) {
    return (
      <nav style={navStyle}>
        <h2 style={{ margin: 0, fontSize: "20px", color: "#8B0A2E", fontFamily: "'Playfair Display', serif" }}>
          {settings.site_name}
        </h2>
      </nav>
    );
  }

  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/search", label: "Search" },
    { to: "/matches", label: "Matches" },
    { to: "/success-stories", label: "Success Stories" },
    { to: "/interests", label: "Interests", badge: interestCount },
    { to: "/messages", label: "Messages", badge: unreadCount },
    { to: "/subscription", label: "Pricing" },
    ...(user?.email === "sathishkumaranandh@gmail.com"
      ? [{ to: "/admin", label: "👑 Admin", color: "#D4A017" }]
      : []),
  ];

  return (
    <nav style={navStyle}>
      <div style={topRowStyle}>
        {/* LOGO */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={logoCircleStyle}>♥</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={logoTextStyle}>{settings.site_name}</div>
            <div style={logoSubStyle}>FIND YOUR SOULMATE</div>
          </div>
        </Link>

        {/* NAV LINKS — desktop */}
        {!isMobile && (
          <div style={desktopLinksStyle}>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  ...navLinkStyle,
                  color: link.color || "#2D1B1B",
                }}
              >
                {link.label}
                {link.badge > 0 && (
                  <span style={badgeStyle}>
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* RIGHT SIDE */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {user ? (
              <>
                <NotificationBell />
                <div style={userChipStyle}>
                  <div style={userAvatarStyle}>
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span style={userNameStyle}>
                    {user.email?.split("@")[0]}
                  </span>
                  <span style={{ fontSize: "10px", color: "#8a6b6b" }}>▾</span>
                </div>
                <button onClick={handleLogout} style={logoutBtnStyle}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={loginBtnStyle}>
                  Login
                </Link>
                <Link to="/register" style={registerBtnStyle}>
                  Register Free
                </Link>
              </>
            )}
          </div>
        )}

        {/* MOBILE */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {user && <NotificationBell />}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={hamburgerStyle}
              aria-label="Menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        )}
      </div>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={mobileMenuStyle}>
          {/* Community selector */}
          <select
            value={community}
            onChange={(e) => handleCommunityChange(e.target.value)}
            style={mobileCommunitySelectStyle}
          >
            <option value="">🌐 All Communities</option>
            {dbCommunities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji || "👥"} {c.name}
              </option>
            ))}
          </select>

          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              style={{
                ...mobileLinkStyle,
                color: link.color || "#2D1B1B",
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
              <button onClick={handleLogout} style={mobileLogoutBtnStyle}>
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "10px", padding: "8px 0" }}>
              <Link to="/login" onClick={closeMenu} style={mobileLoginBtnStyle}>
                Login
              </Link>
              <Link to="/register" onClick={closeMenu} style={mobileRegisterBtnStyle}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

// ============================================================
// STYLES
// ============================================================
const navStyle = {
  background: "white",
  borderBottom: "1px solid #f0e0e0",
  padding: "14px 24px",
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow: "0 2px 12px rgba(139,10,46,0.04)",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
  maxWidth: "1300px",
  margin: "0 auto",
};

const logoCircleStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  background: "#8B0A2E",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#D4A017",
  fontSize: "18px",
  fontWeight: "bold",
};

const logoTextStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "18px",
  fontWeight: 900,
  color: "#8B0A2E",
  letterSpacing: "-0.3px",
};

const logoSubStyle = {
  fontSize: "8px",
  color: "#D4A017",
  fontWeight: 700,
  letterSpacing: "2px",
  textTransform: "uppercase",
  marginTop: "2px",
};

const desktopLinksStyle = {
  display: "flex",
  gap: "24px",
  alignItems: "center",
  fontSize: "13px",
  fontWeight: 500,
};

const navLinkStyle = {
  textDecoration: "none",
  position: "relative",
  padding: "4px 0",
  transition: "color 0.2s",
};

const badgeStyle = {
  display: "inline-block",
  background: "#8B0A2E",
  color: "white",
  fontSize: "10px",
  fontWeight: "bold",
  borderRadius: "10px",
  padding: "2px 6px",
  marginLeft: "6px",
  minWidth: "18px",
  textAlign: "center",
  lineHeight: "14px",
  verticalAlign: "middle",
};

const userChipStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "#FFF9F5",
  border: "1px solid #f0e0e0",
  padding: "6px 14px",
  borderRadius: "24px",
  cursor: "pointer",
};

const userAvatarStyle = {
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "bold",
};

const userNameStyle = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#2D1B1B",
};

const loginBtnStyle = {
  color: "#8B0A2E",
  textDecoration: "none",
  padding: "9px 20px",
  borderRadius: "8px",
  border: "1.5px solid #8B0A2E",
  fontWeight: 600,
  fontSize: "13px",
  background: "white",
};

const registerBtnStyle = {
  color: "white",
  background: "#8B0A2E",
  textDecoration: "none",
  padding: "9px 22px",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(139,10,46,0.25)",
};

const logoutBtnStyle = {
  background: "transparent",
  color: "#8a6b6b",
  border: "1px solid #f0e0e0",
  padding: "7px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "12px",
};

const hamburgerStyle = {
  background: "#FFF9F5",
  color: "#8B0A2E",
  border: "1px solid #f0e0e0",
  width: "42px",
  height: "42px",
  borderRadius: "10px",
  fontSize: "20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  flexShrink: 0,
};

const mobileMenuStyle = {
  marginTop: "14px",
  paddingTop: "14px",
  borderTop: "1px solid #f0e0e0",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const mobileCommunitySelectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #f0e0e0",
  background: "#FFF9F5",
  color: "#2D1B1B",
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: "10px",
  fontFamily: "inherit",
};

const mobileLinkStyle = {
  textDecoration: "none",
  padding: "14px 12px",
  borderRadius: "10px",
  fontWeight: 600,
  fontSize: "15px",
  display: "flex",
  alignItems: "center",
  background: "#FFF9F5",
};

const mobileDividerStyle = {
  height: "1px",
  background: "#f0e0e0",
  margin: "10px 0",
};

const mobileUserStyle = {
  padding: "10px 12px",
  fontSize: "14px",
  color: "#2D1B1B",
  fontWeight: 600,
};

const mobileLogoutBtnStyle = {
  background: "#8B0A2E",
  color: "white",
  border: "none",
  padding: "14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  width: "100%",
  fontFamily: "inherit",
};

const mobileLoginBtnStyle = {
  flex: 1,
  padding: "14px",
  textAlign: "center",
  borderRadius: "10px",
  border: "1.5px solid #8B0A2E",
  color: "#8B0A2E",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
  background: "white",
};

const mobileRegisterBtnStyle = {
  flex: 1,
  padding: "14px",
  textAlign: "center",
  borderRadius: "10px",
  background: "#8B0A2E",
  color: "white",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
};

export default Navigation;

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import NotificationBell from "./NotificationBell";
import { useCommunities } from "../utils/communities";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const DEFAULT_SETTINGS = {
  site_name: "Vivaha Matrimony",
  global_navbar_bg: "#ffffff",
  global_navbar_text: "#2D1B1B",
  global_navbar_size: "13",
  mobile_menu_text_color: "#8B0A2E",
};

function Navigation() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [community, setCommunity] = useState(
    localStorage.getItem("community") || ""
  );
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const { communities: dbCommunities } = useCommunities();
  const navigate = useNavigate();
  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
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
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data?.user || null);

      if (data?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (profile) setRole(profile.role);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();
          if (profile) setRole(profile.role);
        } else {
          setUnreadCount(0);
          setInterestCount(0);
          setRole(null);
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
    setRole(null);
    setUnreadCount(0);
    setInterestCount(0);
    setMenuOpen(false);
    setOpenDropdown(null);
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const handleCommunityChange = (value) => {
    setCommunity(value);
    localStorage.setItem("community", value);
    toast.info(value ? `Switched to ${value} community` : "Showing all communities");
    setTimeout(() => window.location.reload(), 500);
  };

  const closeMenu = () => { setMenuOpen(false); setOpenDropdown(null); };

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  if (loading) {
    return (
      <nav style={{ ...navStyle, background: settings.global_navbar_bg || "white" }}>
        <h2 style={{ margin: 0, fontSize: "20px", color: settings.global_navbar_text || "#8B0A2E", fontFamily: "'Playfair Display', serif" }}>
          {settings.site_name}
        </h2>
      </nav>
    );
  }

  const mainLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/messages", label: "Messages", badge: unreadCount },
  ];

  const matchesDropdown = [
    { to: "/matches", label: "💕 My Matches" },
    { to: "/interests", label: "💌 Interests", badge: interestCount },
    { to: "/interests?tab=shortlisted", label: "♡ Shortlisted" },
    { to: "/visitors", label: "👀 Who Viewed Me" },
    { to: "/photo-requests", label: "📩 Photo Requests" },
    { to: "/contact-requests", label: "📞 Contact Requests" },
  ];

  const searchDropdown = [
    { to: "/search", label: "🔍 Search Profiles" },
    { to: "/advanced-search", label: "⚙️ Advanced Search" },
    { to: "/success-stories", label: "✨ Success Stories" },
    { to: "/pricing", label: "⭐ Pricing Plans" },
    { to: "/boost", label: "🚀 Boost Profile" },
  ];

  const userDropdown = [
    { to: "/dashboard", label: "📊 Dashboard" },
    { to: "/profile", label: "👤 My Profile" },
    { to: "/settings", label: "⚙️ Settings" },
    { to: "/subscription", label: "⭐ Subscription" },
    ...(role === "admin" ? [{ to: "/admin", label: "👑 Admin Panel", color: "#D4A017" }] : []),
  ];

  const dynamicMobileLinkStyle = {
    textDecoration: "none",
    padding: "14px 12px",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    background: "#FFF9F5",
    color: settings.mobile_menu_text_color || "#8B0A2E",
    border: "1px solid #f8e8ed",
  };

  return (
    <nav ref={navRef} style={{ ...navStyle, background: settings.global_navbar_bg || "white", zIndex: 9999 }}>
      <div style={topRowStyle}>
        {/* LOGO */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={logoCircleStyle}>♥</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ ...logoTextStyle, color: settings.global_navbar_text || "#8B0A2E" }}>{settings.site_name}</div>
            <div style={logoSubStyle}>FIND YOUR SOULMATE</div>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        {!isMobile && (
          <div style={{ ...desktopLinksStyle, fontSize: `${settings.global_navbar_size || 13}px` }}>
            {mainLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{ ...navLinkStyle, color: settings.global_navbar_text || "#2D1B1B" }}
              >
                {link.label}
                {link.badge > 0 && (
                  <span style={badgeStyle}>{link.badge > 99 ? "99+" : link.badge}</span>
                )}
              </Link>
            ))}

            <div style={dropdownWrapperStyle}>
              <button
                onClick={() => toggleDropdown("matches")}
                style={{
                  ...navLinkStyle,
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  fontSize: `${settings.global_navbar_size || 13}px`,
                  color: settings.global_navbar_text || "#2D1B1B",
                  display: "flex", alignItems: "center", gap: "4px"
                }}
              >
                Matches
                {interestCount > 0 && (
                  <span style={badgeStyle}>{interestCount > 99 ? "99+" : interestCount}</span>
                )}
                <span style={{ fontSize: "9px", transform: openDropdown === "matches" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
              </button>
              {openDropdown === "matches" && (
                <div style={{ ...dropdownMenuStyle, right: 0, left: "auto" }}>
                  {matchesDropdown.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpenDropdown(null)}
                      style={dropdownItemStyle}
                    >
                      <span>{item.label}</span>
                      {item.badge > 0 && (
                        <span style={{ ...badgeStyle, marginLeft: "8px" }}>{item.badge > 99 ? "99+" : item.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div style={dropdownWrapperStyle}>
              <button
                onClick={() => toggleDropdown("search")}
                style={{
                  ...navLinkStyle,
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  fontSize: `${settings.global_navbar_size || 13}px`,
                  color: settings.global_navbar_text || "#2D1B1B",
                  display: "flex", alignItems: "center", gap: "4px"
                }}
              >
                Explore
                <span style={{ fontSize: "9px", transform: openDropdown === "search" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
              </button>
              {openDropdown === "search" && (
                <div style={{ ...dropdownMenuStyle, right: 0, left: "auto" }}>
                  {searchDropdown.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpenDropdown(null)}
                      style={dropdownItemStyle}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT SIDE — DESKTOP */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user ? (
              <>
                <NotificationBell />

                <div style={dropdownWrapperStyle}>
                  <button
                    onClick={() => toggleDropdown("user")}
                    style={userChipStyle}
                  >
                    <div style={userAvatarStyle}>
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span style={{ ...userNameStyle, color: settings.global_navbar_text || "#2D1B1B" }}>
                      {user.email?.split("@")[0]}
                    </span>
                    <span style={{ fontSize: "9px", color: settings.global_navbar_text || "#8a6b6b", transform: openDropdown === "user" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
                  </button>
                  {openDropdown === "user" && (
                    <div style={{ ...dropdownMenuStyle, right: 0, left: "auto" }}>
                      <div style={dropdownHeaderStyle}>
                        {user.email}
                      </div>
                      {userDropdown.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpenDropdown(null)}
                          style={{ ...dropdownItemStyle, color: item.color || "#2D1B1B" }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div style={{ height: "1px", background: "#f0e0e0", margin: "6px 0" }} />
                      <button onClick={handleLogout} style={dropdownLogoutStyle}>
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" style={loginBtnStyle}>Login</Link>
                <Link to="/register" style={registerBtnStyle}>Register Free</Link>
              </>
            )}
          </div>
        )}

        {/* MOBILE — Hamburger */}
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

          <div style={mobileSectionLabelStyle}>MAIN</div>
          {mainLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              style={dynamicMobileLinkStyle}
            >
              {link.label}
              {link.badge > 0 && (
                <span style={{ ...badgeStyle, marginLeft: "auto" }}>{link.badge > 99 ? "99+" : link.badge}</span>
              )}
            </Link>
          ))}

          <div style={mobileSectionLabelStyle}>MATCHES</div>
          {matchesDropdown.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              style={dynamicMobileLinkStyle}
            >
              {link.label}
              {link.badge > 0 && (
                <span style={{ ...badgeStyle, marginLeft: "auto" }}>{link.badge > 99 ? "99+" : link.badge}</span>
              )}
            </Link>
          ))}

          <div style={mobileSectionLabelStyle}>EXPLORE</div>
          {searchDropdown.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              style={dynamicMobileLinkStyle}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <>
              <div style={mobileSectionLabelStyle}>ACCOUNT</div>
              {userDropdown.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  style={{ ...dynamicMobileLinkStyle, color: link.color || settings.mobile_menu_text_color || "#8B0A2E" }}
                >
                  {link.label}
                </Link>
              ))}
              <button onClick={handleLogout} style={mobileLogoutBtnStyle}>
                🚪 Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <div style={mobileDividerStyle} />
              <div style={{ display: "flex", gap: "10px", padding: "8px 0" }}>
                <Link to="/login" onClick={closeMenu} style={mobileLoginBtnStyle}>Login</Link>
                <Link to="/register" onClick={closeMenu} style={mobileRegisterBtnStyle}>Register</Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ============================================
// STYLES
// ============================================
const navStyle = { background: "white", borderBottom: "1px solid #f0e0e0", padding: "14px 24px", position: "sticky", top: 0, zIndex: 9999, boxShadow: "0 2px 12px rgba(139,10,46,0.04)", width: "100%", boxSizing: "border-box" };
const topRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap", maxWidth: "1300px", margin: "0 auto", width: "100%" };
const logoCircleStyle = { width: "38px", height: "38px", borderRadius: "50%", background: "#8B0A2E", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4A017", fontSize: "18px", fontWeight: "bold", flexShrink: 0 };
const logoTextStyle = { fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 900, color: "#8B0A2E", letterSpacing: "-0.3px" };
const logoSubStyle = { fontSize: "8px", color: "#D4A017", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginTop: "2px" };
const desktopLinksStyle = { display: "flex", gap: "22px", alignItems: "center", fontSize: "13px", fontWeight: 600, flexWrap: "nowrap" };
const navLinkStyle = { textDecoration: "none", position: "relative", padding: "4px 0", transition: "color 0.2s", whiteSpace: "nowrap" };
const badgeStyle = { display: "inline-block", background: "#8B0A2E", color: "white", fontSize: "10px", fontWeight: "bold", borderRadius: "10px", padding: "2px 6px", marginLeft: "6px", minWidth: "18px", textAlign: "center", lineHeight: "14px", verticalAlign: "middle" };
const userChipStyle = { display: "flex", alignItems: "center", gap: "8px", background: "#FFF9F5", border: "1px solid #f0e0e0", padding: "6px 14px", borderRadius: "24px", cursor: "pointer", fontFamily: "inherit" };
const userAvatarStyle = { width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 };
const userNameStyle = { fontSize: "13px", fontWeight: 600, color: "#2D1B1B", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const loginBtnStyle = { color: "#8B0A2E", textDecoration: "none", padding: "9px 20px", borderRadius: "8px", border: "1.5px solid #8B0A2E", fontWeight: 600, fontSize: "13px", background: "white", whiteSpace: "nowrap" };
const registerBtnStyle = { color: "white", background: "#8B0A2E", textDecoration: "none", padding: "9px 22px", borderRadius: "8px", fontWeight: 600, fontSize: "13px", boxShadow: "0 4px 12px rgba(139,10,46,0.25)", whiteSpace: "nowrap" };
const hamburgerStyle = { background: "#FFF9F5", color: "#8B0A2E", border: "1px solid #f0e0e0", width: "42px", height: "42px", borderRadius: "10px", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 };

const dropdownWrapperStyle = { position: "relative", display: "inline-block" };
const dropdownMenuStyle = {
  position: "absolute", top: "calc(100% + 10px)",
  background: "white", border: "1px solid #f0e0e0", borderRadius: "12px",
  padding: "8px", minWidth: "220px", boxShadow: "0 10px 30px rgba(139,10,46,0.15)",
  zIndex: 10000, display: "flex", flexDirection: "column", gap: "2px",
};
const dropdownItemStyle = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "10px 14px", borderRadius: "8px", textDecoration: "none",
  color: "#2D1B1B", fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
  transition: "background 0.15s",
};
const dropdownHeaderStyle = {
  padding: "10px 14px", fontSize: "11px", color: "#8a6b6b",
  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
  borderBottom: "1px solid #f0e0e0", marginBottom: "4px",
};
const dropdownLogoutStyle = {
  padding: "10px 14px", borderRadius: "8px", background: "none",
  border: "none", color: "#dc2626", fontSize: "13px", fontWeight: 700,
  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
};

const mobileMenuStyle = { marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0e0e0", display: "flex", flexDirection: "column", gap: "2px" };
const mobileCommunitySelectStyle = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0e0e0", background: "#FFF9F5", color: "#2D1B1B", fontSize: "14px", fontWeight: 600, marginBottom: "10px", fontFamily: "inherit" };
const mobileSectionLabelStyle = { fontSize: "11px", fontWeight: 800, color: "#8a6b6b", letterSpacing: "1px", textTransform: "uppercase", padding: "14px 12px 8px 12px", marginTop: "4px" };
const mobileDividerStyle = { height: "1px", background: "#f0e0e0", margin: "10px 0" };
const mobileLogoutBtnStyle = { background: "#8B0A2E", color: "white", border: "none", padding: "14px", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "14px", width: "100%", fontFamily: "inherit", marginTop: "10px" };
const mobileLoginBtnStyle = { flex: 1, padding: "14px", textAlign: "center", borderRadius: "10px", border: "1.5px solid #8B0A2E", color: "#8B0A2E", textDecoration: "none", fontWeight: 600, fontSize: "14px", background: "white" };
const mobileRegisterBtnStyle = { flex: 1, padding: "14px", textAlign: "center", borderRadius: "10px", background: "#8B0A2E", color: "white", textDecoration: "none", fontWeight: 600, fontSize: "14px" };

export default Navigation;
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabaseClient";
import NotificationBell from "./NotificationBell";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [settings, setSettings] = useState({});

  const navbarBg = settings.global_navbar_bg || "#ffffff";
  const navbarText = settings.global_navbar_text || "#2D1B1B";
  const navbarFontSize = parseInt(settings.global_navbar_size || "13", 10);
  const mobileMenuText = settings.mobile_menu_text_color || "#8B0A2E";

  // ============================================
  // Resize
  // ============================================
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ============================================
  // Close menu on route change
  // ============================================
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ============================================
  // Load settings
  // ============================================
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${BACKEND_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || {});
        }
      } catch (err) {
        console.error("Settings load error:", err);
      }
    }
    loadSettings();

    const handler = () => loadSettings();
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
  }, []);

  // ============================================
  // Auth state
  // ============================================
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUser(user || null);
      if (user) {
        checkAdmin(user.id);
        fetchUnreadCount(user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const u = session?.user || null;
        setUser(u);
        if (u) {
          checkAdmin(u.id);
          fetchUnreadCount(u.id);
        } else {
          setIsAdmin(false);
          setUnreadCount(0);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // Fetch unread count (messages)
  // ============================================
  const fetchUnreadCount = async (uid) => {
    try {
      const res = await fetch(`${BACKEND_URL}/messages/unread/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  // Listen for badge refresh events
  useEffect(() => {
    const handler = () => {
      if (user) fetchUnreadCount(user.id);
    };
    window.addEventListener("badge-refresh", handler);
    return () => window.removeEventListener("badge-refresh", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ============================================
  // Check if user is admin
  // ============================================
  const checkAdmin = async (uid) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", uid)
        .single();
      setIsAdmin(data?.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  };

  // ============================================
  // Logout
  // ============================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate("/login");
  };

  // ============================================
  // Nav items
  // ============================================
  const publicLinks = [
    { to: "/", label: "Home", icon: "🏠" },
    { to: "/success-stories", label: "Stories", icon: "💑" },
  ];

  const userLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/search", label: "Search", icon: "🔍" },
    { to: "/discover", label: "Discover", icon: "🔥" },
    { to: "/matches", label: "Matches", icon: "💕" },
    { to: "/interests", label: "Interests", icon: "💌" },
    { to: "/messages", label: "Messages", icon: "💬", badge: unreadCount },
    { to: "/visitors", label: "Visitors", icon: "👀" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Admin", icon: "👑" },
  ];

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  // ============================================
  // STYLES
  // ============================================
  const S = {
    nav: {
      position: "sticky",
      top: 0,
      zIndex: 500,
      background: navbarBg,
      borderBottom: "1px solid #f0e0e0",
      boxShadow: "0 2px 10px rgba(139,10,46,0.04)",
    },
    navInner: {
      maxWidth: "1300px",
      margin: "0 auto",
      padding: isMobile ? "10px 16px" : "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      textDecoration: "none",
      flexShrink: 0,
    },
    logoCircle: {
      width: "38px",
      height: "38px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "18px",
      boxShadow: "0 4px 12px rgba(139,10,46,0.3)",
    },
    logoText: {
      display: "flex",
      flexDirection: "column",
      lineHeight: 1.1,
    },
    logoTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "15px" : "17px",
      fontWeight: 800,
      color: "#8B0A2E",
    },
    logoSub: {
      fontSize: "9px",
      color: "#D4A017",
      fontWeight: 700,
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
    desktopNav: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      flex: 1,
      marginLeft: "20px",
      overflowX: "auto",
      scrollbarWidth: "none",
    },
    navLink: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "8px 12px",
      borderRadius: "10px",
      textDecoration: "none",
      fontSize: `${navbarFontSize}px`,
      fontWeight: 700,
      color: active ? "white" : navbarText,
      background: active ? "linear-gradient(135deg, #8B0A2E, #a01438)" : "transparent",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
      position: "relative",
    }),
    badgeDot: {
      background: "#dc2626",
      color: "white",
      fontSize: "9px",
      fontWeight: 800,
      padding: "2px 6px",
      borderRadius: "10px",
      minWidth: "16px",
      textAlign: "center",
      marginLeft: "2px",
    },
    rightSide: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexShrink: 0,
    },
    authBtn: (primary) => ({
      background: primary
        ? "linear-gradient(135deg, #8B0A2E, #a01438)"
        : "white",
      color: primary ? "white" : "#8B0A2E",
      border: primary ? "none" : "1.5px solid #8B0A2E",
      padding: "8px 16px",
      borderRadius: "10px",
      fontSize: "12px",
      fontWeight: 800,
      textDecoration: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
      boxShadow: primary ? "0 4px 12px rgba(139,10,46,0.25)" : "none",
    }),
    hamburger: {
      background: "transparent",
      border: "1.5px solid #f0e0e0",
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      color: mobileMenuText,
      fontFamily: "inherit",
      flexShrink: 0,
    },
    // Mobile drawer
    drawer: {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "min(85vw, 340px)",
      background: "white",
      boxShadow: "-10px 0 40px rgba(0,0,0,0.2)",
      zIndex: 999,
      display: "flex",
      flexDirection: "column",
      animation: "slideInRight 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      overflowY: "auto",
    },
    drawerHeader: {
      padding: "16px 20px",
      borderBottom: "1px solid #f0e0e0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    drawerTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "16px",
      fontWeight: 800,
      color: "#8B0A2E",
      margin: 0,
    },
    drawerClose: {
      background: "#f3f4f6",
      border: "none",
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      fontSize: "16px",
      cursor: "pointer",
      color: "#666",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    drawerSection: {
      padding: "12px 8px",
    },
    drawerSectionTitle: {
      padding: "4px 12px 8px",
      fontSize: "10px",
      fontWeight: 800,
      color: "#8a6b6b",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    drawerLink: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      borderRadius: "10px",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 700,
      color: active ? "white" : mobileMenuText,
      background: active ? "linear-gradient(135deg, #8B0A2E, #a01438)" : "transparent",
      marginBottom: "2px",
      transition: "background 0.2s ease",
    }),
    drawerFooter: {
      marginTop: "auto",
      padding: "16px 20px",
      borderTop: "1px solid #f0e0e0",
      background: "#FAFAFA",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 998,
      animation: "fadeIn 0.25s ease",
    },
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .nav-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <nav style={S.nav}>
        <div style={S.navInner}>
          {/* LOGO */}
          <Link to="/" style={S.logo}>
            <div style={S.logoCircle}>💛</div>
            <div style={S.logoText}>
              <span style={S.logoTitle}>Vivaha matrimony</span>
              <span style={S.logoSub}>Find Your Soulmate</span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          {!isMobile && (
            <div style={S.desktopNav} className="nav-scroll">
              {publicLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={S.navLink(isActive(l.to))}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              ))}

              {user &&
                userLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    style={S.navLink(isActive(l.to))}
                  >
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                    {l.badge > 0 && (
                      <span style={S.badgeDot}>
                        {l.badge > 99 ? "99+" : l.badge}
                      </span>
                    )}
                  </Link>
                ))}

              {user &&
                isAdmin &&
                adminLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    style={S.navLink(isActive(l.to))}
                  >
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                  </Link>
                ))}
            </div>
          )}

          {/* RIGHT SIDE */}
          <div style={S.rightSide}>
            {!isMobile && user && <NotificationBell />}

            {!isMobile && !user && (
              <>
                <Link to="/login" style={S.authBtn(false)}>
                  Login
                </Link>
                <Link to="/register" style={S.authBtn(true)}>
                  Register
                </Link>
              </>
            )}

            {!isMobile && user && (
              <button onClick={handleLogout} style={S.authBtn(false)}>
                Logout
              </button>
            )}

            {isMobile && user && <NotificationBell />}

            {isMobile && (
              <button
                onClick={() => setMenuOpen(true)}
                style={S.hamburger}
                aria-label="Menu"
              >
                ☰
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {isMobile && menuOpen && (
        <>
          <div style={S.backdrop} onClick={() => setMenuOpen(false)} />
          <aside style={S.drawer}>
            <div style={S.drawerHeader}>
              <h3 style={S.drawerTitle}>Menu</h3>
              <button
                onClick={() => setMenuOpen(false)}
                style={S.drawerClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div style={S.drawerSection}>
              <div style={S.drawerSectionTitle}>Explore</div>
              {publicLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  style={S.drawerLink(isActive(l.to))}
                >
                  <span style={{ fontSize: "18px" }}>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              ))}
            </div>

            {user && (
              <div style={S.drawerSection}>
                <div style={S.drawerSectionTitle}>My Account</div>
                {userLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    style={S.drawerLink(isActive(l.to))}
                  >
                    <span style={{ fontSize: "18px" }}>{l.icon}</span>
                    <span style={{ flex: 1 }}>{l.label}</span>
                    {l.badge > 0 && (
                      <span style={S.badgeDot}>
                        {l.badge > 99 ? "99+" : l.badge}
                      </span>
                    )}
                  </Link>
                ))}

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={S.drawerLink(isActive("/profile"))}
                >
                  <span style={{ fontSize: "18px" }}>👤</span>
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  style={S.drawerLink(isActive("/settings"))}
                >
                  <span style={{ fontSize: "18px" }}>⚙️</span>
                  <span>Settings</span>
                </Link>

                <Link
                  to="/subscription"
                  onClick={() => setMenuOpen(false)}
                  style={S.drawerLink(isActive("/subscription"))}
                >
                  <span style={{ fontSize: "18px" }}>💎</span>
                  <span>Premium Plans</span>
                </Link>
              </div>
            )}

            {user && isAdmin && (
              <div style={S.drawerSection}>
                <div style={S.drawerSectionTitle}>Admin</div>
                {adminLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    style={S.drawerLink(isActive(l.to))}
                  >
                    <span style={{ fontSize: "18px" }}>{l.icon}</span>
                    <span>{l.label}</span>
                  </Link>
                ))}
              </div>
            )}

            <div style={S.drawerFooter}>
              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    style={{ ...S.authBtn(false), textAlign: "center" }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    style={{ ...S.authBtn(true), textAlign: "center" }}
                  >
                    Register Free
                  </Link>
                </>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  style={{ ...S.authBtn(false), textAlign: "center" }}
                >
                  Logout
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export default Navigation;

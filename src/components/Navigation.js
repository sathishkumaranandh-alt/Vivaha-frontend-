import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

function Navigation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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

const navStyle = { padding: "16px 20px", background: "#1e3a8a", color: "white" };
const topRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" };
const linksRowStyle = { display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center", fontSize: "15px" };
const navLinkStyle = { color: "white", textDecoration: "none", padding: "4px 8px", fontWeight: "600" };
const dividerStyle = { color: "rgba(255,255,255,0.4)", margin: "0 2px" };
const authLinkStyle = { color: "white", textDecoration: "none", padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.5)", fontWeight: "600", fontSize: "14px" };
const registerButtonStyle = { color: "#1e3a8a", background: "white", textDecoration: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: "700", fontSize: "14px" };
const logoutButtonStyle = { background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.5)", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "14px" };

export default Navigation;
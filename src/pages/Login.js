import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate("/dashboard");
    });
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error("Please enter email and password");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      toast.success("Welcome back! 💕");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background with rich gradient for glass effect */}
      <div style={styles.bgGradient} />
      
      {/* Floating Orbs for background texture */}
      <div style={{...styles.orb, top: '10%', left: '15%', background: '#D4A017'}} />
      <div style={{...styles.orb, bottom: '20%', right: '10%', background: '#8B0A2E'}} />

      <div style={styles.glassCard}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "52px", marginBottom: "12px", filter: "drop-shadow(0px 8px 16px rgba(139,10,46,0.2))" }}>♥</div>
          <h1 style={{ color: "#8B0A2E", margin: "0 0 6px 0", fontSize: isMobile ? "26px" : "30px", fontWeight: "800", fontFamily: "'Playfair Display', serif" }}>Welcome Back</h1>
          <p style={{ color: "#5c3030", margin: 0, fontSize: "14px", fontWeight: "500" }}>Login to find your perfect match</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={styles.input} 
              required
            />
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{...styles.label, marginBottom: 0}}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: "12px", color: "#8B0A2E", fontWeight: "bold", textDecoration: "none" }}>Forgot?</Link>
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input} 
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "12px", top: "38px", background: "none", border: "none", cursor: "pointer", fontSize: "16px", opacity: 0.7 }}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          <button type="submit" disabled={loading} style={styles.btnLogin}>
            {loading ? "Logging in..." : "Login Securely →"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "14px", color: "#5c3030", margin: "24px 0 0 0", fontWeight: "500" }}>
          Don't have an account? <Link to="/register" style={{ color: "#8B0A2E", fontWeight: "bold", textDecoration: "none" }}>Register Free</Link>
        </p>
        
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span style={{ fontSize: "11px", color: "#8a6b6b", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: "600" }}>
            🔒 Secure 256-bit SSL Encrypted Connection
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { 
    minHeight: "100vh", 
    position: "relative", 
    padding: "20px 16px", 
    fontFamily: "'Inter', sans-serif", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    overflow: "hidden" 
  },
  bgGradient: { 
    position: "absolute", 
    inset: 0, 
    background: "linear-gradient(135deg, #FFF0F5 0%, #FDF2F6 50%, #FFF9F5 100%)", 
    zIndex: -2 
  },
  orb: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    filter: "blur(80px)",
    opacity: 0.3,
    zIndex: -1,
    animation: "float 10s infinite alternate ease-in-out"
  },
  glassCard: { 
    maxWidth: "440px", 
    width: "100%", 
    background: "rgba(255, 255, 255, 0.55)", 
    backdropFilter: "blur(20px)", 
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "28px", 
    padding: "36px 28px", 
    boxShadow: "0 10px 40px rgba(139,10,46,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)", 
    border: "1px solid rgba(255,255,255,0.5)" 
  },
  label: { 
    display: "block", 
    fontSize: "11px", 
    fontWeight: "800", 
    color: "#8B0A2E", 
    letterSpacing: "0.5px", 
    textTransform: "uppercase", 
    marginBottom: "6px" 
  },
  input: { 
    width: "100%", 
    padding: "14px 16px", 
    border: "1px solid rgba(255,255,255,0.8)", 
    borderRadius: "12px", 
    fontSize: "14px", 
    fontFamily: "inherit", 
    outline: "none", 
    background: "rgba(255, 255, 255, 0.6)", 
    boxSizing: "border-box", 
    transition: "all 0.3s", 
    color: "#2D1B1B",
    backdropFilter: "blur(5px)"
  },
  btnLogin: { 
    width: "100%", 
    padding: "16px", 
    borderRadius: "12px", 
    background: "linear-gradient(135deg, #8B0A2E, #a01438)", 
    color: "white", 
    border: "none", 
    fontWeight: "800", 
    fontSize: "16px", 
    cursor: "pointer", 
    fontFamily: "inherit", 
    boxShadow: "0 8px 24px rgba(139,10,46,0.3)", 
    marginTop: "8px" 
  },
};

export default Login;

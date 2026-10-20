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
    if (!email.trim() || !password) return toast.error("Email and password are required");

    setLoading(true);
    try {
      // 🛡️ FIX: Removed 'data' to fix Vercel build error
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast.success("Welcome back! 💕");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background Gradient */}
      <div style={styles.bgGradient} />
      
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "52px", marginBottom: "12px", filter: "drop-shadow(0px 8px 16px rgba(139,10,46,0.2))" }}>♥</div>
          <h1 style={{ color: "#8B0A2E", margin: "0 0 6px 0", fontSize: isMobile ? "26px" : "30px", fontWeight: "800", fontFamily: "'Playfair Display', serif" }}>Welcome Back</h1>
          <p style={{ color: "#8a6b6b", margin: 0, fontSize: "14px" }}>Login to find your perfect match</p>
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
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "#555", marginTop: "-8px" }}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#8B0A2E" }} />
            <span>Show Password</span>
          </label>

          <button type="submit" disabled={loading} style={styles.btnLogin}>
            {loading ? "Logging in..." : "Login Securely →"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#f0e0e0" }} />
          <span style={{ padding: "0 10px", color: "#aaa", fontSize: "12px", fontWeight: "600" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#f0e0e0" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: "14px", color: "#666", margin: 0 }}>
          Don't have an account? <Link to="/register" style={{ color: "#8B0A2E", fontWeight: "bold", textDecoration: "none" }}>Register Free</Link>
        </p>
        
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span style={{ fontSize: "11px", color: "#aaa", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            🔒 Secure 256-bit SSL Encrypted Connection
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", position: "relative", padding: "40px 16px", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  bgGradient: { position: "absolute", inset: 0, background: "linear-gradient(135deg, #FDF2F6 0%, #FFF9F5 100%)", zIndex: -1 },
  card: { maxWidth: "420px", width: "100%", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "36px 28px", boxShadow: "0 20px 60px rgba(139,10,46,0.1)", border: "1px solid rgba(255,255,255,0.5)" },
  label: { display: "block", fontSize: "11px", fontWeight: "800", color: "#8a6b6b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" },
  input: { width: "100%", padding: "14px 16px", border: "1.5px solid #f0e0e0", borderRadius: "12px", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box", transition: "all 0.3s", color: "#2D1B1B" },
  btnLogin: { width: "100%", padding: "16px", borderRadius: "12px", background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", border: "none", fontWeight: "800", fontSize: "16px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(139,10,46,0.3)", marginTop: "8px" },
};

export default Login;

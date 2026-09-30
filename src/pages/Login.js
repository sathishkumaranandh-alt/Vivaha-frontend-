import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate("/dashboard");
    });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error("Email and password required");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.user) {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const S = {
    page: { minHeight: "90vh", padding: "24px 16px", background: "#FFF9F5", display: "flex", alignItems: "flex-start", justifyContent: "center" },
    card: { background: "white", borderRadius: "20px", padding: isMobile ? "28px 20px" : "40px 32px", maxWidth: "440px", width: "100%", boxShadow: "0 12px 40px rgba(139,10,46,0.08)", border: "1px solid #f0e0e0" },
    header: { textAlign: "center", marginBottom: "24px" },
    icon: { fontSize: "48px", marginBottom: "8px" },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "26px", fontWeight: 800, color: "#8B0A2E", margin: "0 0 6px 0" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    label: { display: "block", fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "6px", marginTop: "14px", textTransform: "uppercase", letterSpacing: "0.3px" },
    input: { width: "100%", padding: "13px 14px", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box" },
    btn: { width: "100%", background: "#8B0A2E", color: "white", border: "none", padding: "15px", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", fontFamily: "inherit", marginTop: "24px", boxShadow: "0 4px 14px rgba(139,10,46,0.3)" },
    footer: { textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#666" },
    link: { color: "#8B0A2E", fontWeight: 700, textDecoration: "none" },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.icon}>💑</div>
          <h1 style={S.h1}>Welcome Back</h1>
          <p style={S.sub}>Login to continue your search</p>
        </div>
        <form onSubmit={handleLogin}>
          <label style={S.label}>Email Address</label>
          <input type="email" style={S.input} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <label style={S.label}>Password</label>
          <input type="password" style={S.input} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Logging in..." : "🔐 Login"}
          </button>
        </form>
        <p style={S.footer}>
          New here? <Link to="/register" style={S.link}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

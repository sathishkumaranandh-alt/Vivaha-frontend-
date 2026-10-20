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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate("/dashboard");
    });
    const handleResize = () => setIsMobile(window.innerWidth < 900);
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
    <div style={styles.container}>
      {/* LEFT SIDE: Romantic Image (Hidden on Mobile) */}
      {!isMobile && (
        <div style={styles.leftPanel}>
          <img 
            src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2000&auto=format&fit=crop" 
            alt="Wedding" 
            style={styles.bgImage} 
          />
          <div style={styles.overlay} />
          <div style={styles.quoteContainer}>
            <h2 style={styles.quoteTitle}>"Two souls, one heart."</h2>
            <p style={styles.quoteText}>Begin your forever with Vivaha Matrimony.</p>
          </div>
        </div>
      )}

      {/* RIGHT SIDE: Login Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formWrapper}>
          
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px" }}>
            <div style={styles.logoCircle}>♥</div>
            <div>
              <div style={styles.logoText}>Vivaha</div>
              <div style={styles.logoSub}>MATRIMONY</div>
            </div>
          </Link>

          <h1 style={styles.h1}>Welcome Back</h1>
          <p style={styles.subtitle}>Please sign in to continue your journey.</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>✉️</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{...styles.label, marginBottom: 0}}>Password</label>
                <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>🔒</span>
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
                  style={styles.eyeBtn}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={styles.footerText}>
            New to Vivaha? <Link to="/register" style={styles.footerLink}>Create an account</Link>
          </p>

          <div style={styles.securityBadge}>
            <span>🛡️</span> 256-bit SSL Secure Connection
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#FFF" },
  leftPanel: { flex: 1, position: "relative", display: "flex", alignItems: "flex-end", padding: "60px" },
  bgImage: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  overlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(107, 7, 34, 0.9), rgba(107, 7, 34, 0.2))" },
  quoteContainer: { position: "relative", zIndex: 2, color: "#FFF" },
  quoteTitle: { fontFamily: "'Playfair Display', serif", fontSize: "36px", fontWeight: "700", margin: "0 0 10px 0", fontStyle: "italic" },
  quoteText: { fontSize: "16px", opacity: 0.9, margin: 0 },
  rightPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#FFFDFB" },
  formWrapper: { width: "100%", maxWidth: "420px" },
  logoCircle: { width: "42px", height: "42px", borderRadius: "50%", background: "#8B0A2E", color: "#D4A017", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  logoText: { fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "900", color: "#8B0A2E", lineHeight: 1 },
  logoSub: { fontSize: "9px", color: "#D4A017", fontWeight: "700", letterSpacing: "2px" },
  h1: { fontFamily: "'Playfair Display', serif", fontSize: "32px", color: "#2D1B1B", margin: "0 0 8px 0" },
  subtitle: { color: "#8a6b6b", fontSize: "15px", marginBottom: "32px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column" },
  label: { fontSize: "12px", fontWeight: "800", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" },
  inputWrapper: { display: "flex", alignItems: "center", background: "#FFF", border: "1.5px solid #EAE3D9", borderRadius: "12px", padding: "0 16px", transition: "border 0.3s", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" },
  icon: { fontSize: "16px", opacity: 0.6, marginRight: "12px" },
  input: { flex: 1, padding: "16px 0", border: "none", outline: "none", fontSize: "15px", color: "#2D1B1B", background: "transparent", fontFamily: "inherit" },
  eyeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "16px", opacity: 0.6 },
  forgotLink: { fontSize: "12px", color: "#8B0A2E", fontWeight: "700", textDecoration: "none" },
  submitBtn: { background: "linear-gradient(135deg, #8B0A2E, #6B0722)", color: "#FFF", border: "none", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: "pointer", marginTop: "10px", boxShadow: "0 8px 20px rgba(139,10,46,0.25)", transition: "transform 0.2s" },
  footerText: { textAlign: "center", marginTop: "32px", color: "#666", fontSize: "14px" },
  footerLink: { color: "#8B0A2E", fontWeight: "800", textDecoration: "none" },
  securityBadge: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "40px", fontSize: "11px", color: "#aaa", fontWeight: "600" }
};

export default Login;

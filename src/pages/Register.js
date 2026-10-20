import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { useCommunities } from "../utils/communities";
import { apiFetch } from "../utils/api";

function getAge(dobString) {
  if (!dobString) return 0;
  const diff = Date.now() - new Date(dobString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { communities } = useCommunities();
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "", gender: "", dob: "", community: "", mobile: "", email: "",
    password: "", confirmPassword: "", terms: false, profile_for: "Myself",
    marital_status: "Never Married", religion: "Hindu", mother_tongue: "Tamil",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data?.user) navigate("/dashboard"); });
  }, [navigate]);

  useEffect(() => {
    apiFetch(`/settings`).then(res => res.json()).then(data => {
        if (data.settings && data.settings.allow_registration === "false") setRegistrationAllowed(false);
      }).catch(console.error).finally(() => setCheckingSettings(false));
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const c = searchParams.get("community");
    if (c) setForm((f) => ({ ...f, community: c }));
  }, [searchParams]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Full Name is required");
    if (!form.gender) return toast.error("Gender is required");
    if (!form.dob) return toast.error("Date of Birth is required");
    if (getAge(form.dob) < 21) return toast.error("You must be at least 21 years old.");
    if (!form.community) return toast.error("Community is required");
    if (!form.mobile || form.mobile.length !== 10) return toast.error("Valid 10-digit mobile number is required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return toast.error("Please enter a valid email address.");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    if (!form.terms) return toast.error("You must agree to the Terms & Privacy Policy");

    setSaving(true);
    try {
      const res = await apiFetch(`/auth/signup`, {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(), password: form.password, community: form.community, caste: form.community, name: form.name.trim(), gender: form.gender, dob: form.dob, mobile: form.mobile, profile_for: form.profile_for, marital_status: form.marital_status, religion: form.religion, mother_tongue: form.mother_tongue, custom_fields: {}
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("🎉 Account Created! Let's complete your profile.");
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (loginError) { navigate("/login"); } else { navigate("/onboarding"); }
    } catch (err) {
      toast.error(err.message || "Network error. Please try again.");
    } finally { setSaving(false); }
  };

  if (checkingSettings) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;
  if (!registrationAllowed) {
    return (
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          <div style={{ fontSize: 64, textAlign: "center", marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: "#8B0A2E", textAlign: "center" }}>Registration Closed</h2>
          <p style={{ color: "#666", textAlign: "center" }}>New registrations are currently paused.</p>
          <Link to="/login" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#8B0A2E", fontWeight: "bold" }}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {!isMobile && (
        <div style={styles.leftPanel}>
          <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000&auto=format&fit=crop" alt="Wedding" style={styles.bgImage} />
          <div style={styles.overlay} />
          <div style={styles.quoteContainer}>
            <h2 style={styles.quoteTitle}>"A journey of a lifetime starts with a single step."</h2>
            <p style={styles.quoteText}>Join thousands of happy couples finding their match.</p>
          </div>
        </div>
      )}

      <div style={styles.rightPanel}>
        <div style={styles.formWrapper}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
            <div style={styles.logoCircle}>♥</div>
            <div><div style={styles.logoText}>Vivaha</div><div style={styles.logoSub}>MATRIMONY</div></div>
          </Link>

          <h1 style={styles.h1}>Create Your Profile</h1>
          <p style={styles.subtitle}>Find your perfect life partner.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={styles.label}>Full Name *</label>
                <div style={styles.inputWrapper}><span style={styles.icon}>👤</span><input type="text" placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} style={styles.input} /></div>
              </div>
              <div>
                <label style={styles.label}>Mobile Number *</label>
                <div style={styles.inputWrapper}><span style={styles.icon}>📱</span><input type="tel" maxLength="10" placeholder="10 digit" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} style={styles.input} /></div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={styles.label}>Gender *</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.icon}>⚥</span>
                  <select value={form.gender} onChange={(e) => update("gender", e.target.value)} style={styles.input}>
                    <option value="">Select</option><option value="male">Male</option><option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Date of Birth *</label>
                <div style={styles.inputWrapper}><span style={styles.icon}>🎂</span><input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} style={styles.input} /></div>
              </div>
            </div>

            <div>
              <label style={styles.label}>Community *</label>
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>🏷️</span>
                <select value={form.community} onChange={(e) => update("community", e.target.value)} style={styles.input}>
                  <option value="">Select Community</option>
                  {communities.map((c) => <option key={c.slug} value={c.slug}>{c.emoji || "👥"} {c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>Email Address *</label>
              <div style={styles.inputWrapper}><span style={styles.icon}>✉️</span><input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} style={styles.input} /></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={styles.label}>Password *</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.icon}>🔒</span>
                  <input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={form.password} onChange={(e) => update("password", e.target.value)} style={styles.input} />
                </div>
              </div>
              <div>
                <label style={styles.label}>Confirm Password *</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.icon}>🔒</span>
                  <input type={showPassword ? "text" : "password"} placeholder="Re-enter" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} style={styles.input} />
                </div>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "#555", marginTop: "8px" }}>
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#8B0A2E" }} />
              <span>Show Passwords</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "#4b5563", marginTop: "8px" }}>
              <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8B0A2E" }} />
              <span>I agree to the <span style={{ color: "#8B0A2E", fontWeight: "bold" }}>Terms & Privacy Policy</span></span>
            </label>

            <button type="submit" disabled={saving} style={styles.submitBtn}>
              {saving ? "Creating..." : "Create Account 💍"}
            </button>
          </form>

          <p style={styles.footerText}>
            Already have an account? <Link to="/login" style={styles.footerLink}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#FFF" },
  leftPanel: { flex: 1, position: "relative", display: "flex", alignItems: "flex-end", padding: "60px", background: "#8B0A2E" },
  bgImage: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  overlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(107, 7, 34, 0.95), rgba(107, 7, 34, 0.4))" },
  quoteContainer: { position: "relative", zIndex: 2, color: "#FFF" },
  quoteTitle: { fontFamily: "'Playfair Display', serif", fontSize: "32px", fontWeight: "700", margin: "0 0 10px 0", fontStyle: "italic" },
  quoteText: { fontSize: "15px", opacity: 0.9, margin: 0 },
  rightPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#FFFDFB", overflowY: "auto", maxHeight: "100vh" },
  formWrapper: { width: "100%", maxWidth: "500px", padding: "20px 0" },
  logoCircle: { width: "42px", height: "42px", borderRadius: "50%", background: "#8B0A2E", color: "#D4A017", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  logoText: { fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "900", color: "#8B0A2E", lineHeight: 1 },
  logoSub: { fontSize: "9px", color: "#D4A017", fontWeight: "700", letterSpacing: "2px" },
  h1: { fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "#2D1B1B", margin: "0 0 8px 0" },
  subtitle: { color: "#8a6b6b", fontSize: "14px", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  label: { fontSize: "11px", fontWeight: "800", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" },
  inputWrapper: { display: "flex", alignItems: "center", background: "#FFF", border: "1.5px solid #EAE3D9", borderRadius: "12px", padding: "0 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" },
  icon: { fontSize: "16px", opacity: 0.6, marginRight: "10px" },
  input: { flex: 1, padding: "14px 0", border: "none", outline: "none", fontSize: "14px", color: "#2D1B1B", background: "transparent", fontFamily: "inherit" },
  submitBtn: { background: "linear-gradient(135deg, #8B0A2E, #6B0722)", color: "#FFF", border: "none", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: "pointer", marginTop: "10px", boxShadow: "0 8px 20px rgba(139,10,46,0.25)" },
  footerText: { textAlign: "center", marginTop: "24px", color: "#666", fontSize: "14px" },
  footerLink: { color: "#8B0A2E", fontWeight: "800", textDecoration: "none" }
};

export default Register;

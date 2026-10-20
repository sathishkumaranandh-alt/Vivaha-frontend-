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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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
      <div style={styles.page}>
        <div style={styles.glassCard}>
          <div style={{ fontSize: 64, textAlign: "center", marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: "#8B0A2E", textAlign: "center" }}>Registration Closed</h2>
          <p style={{ color: "#5c3030", textAlign: "center" }}>New registrations are currently paused.</p>
          <Link to="/login" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#8B0A2E", fontWeight: "bold" }}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGradient} />
      <div style={{...styles.orb, top: '5%', right: '10%', background: '#D4A017'}} />
      <div style={{...styles.orb, bottom: '10%', left: '5%', background: '#8B0A2E'}} />

      <div style={styles.glassCard}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px", filter: "drop-shadow(0px 8px 16px rgba(139,10,46,0.2))" }}>💍</div>
          <h1 style={{ color: "#8B0A2E", margin: "0 0 4px 0", fontSize: isMobile ? "24px" : "28px", fontWeight: "800", fontFamily: "'Playfair Display', serif" }}>Create Your Profile</h1>
          <p style={{ color: "#5c3030", margin: 0, fontSize: "14px", fontWeight: "500" }}>Start your journey to find the perfect soulmate</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={styles.label}>Full Name *</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Mobile *</label>
              <input type="tel" maxLength="10" placeholder="10 digit" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={styles.label}>Gender *</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} style={styles.input}>
                <option value="">Select</option><option value="male">Male</option><option value="female">Female</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Date of Birth *</label>
              <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} style={styles.input} />
            </div>
          </div>

          <div>
            <label style={styles.label}>Community *</label>
            <select value={form.community} onChange={(e) => update("community", e.target.value)} style={styles.input}>
              <option value="">Select Community</option>
              {communities.map((c) => <option key={c.slug} value={c.slug}>{c.emoji || "👥"} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={styles.label}>Email Address *</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} style={styles.input} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <label style={styles.label}>Password *</label>
              <input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={form.password} onChange={(e) => update("password", e.target.value)} style={styles.input} />
            </div>
            <div style={{ position: "relative" }}>
              <label style={styles.label}>Confirm Password *</label>
              <input type={showPassword ? "text" : "password"} placeholder="Re-enter" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} style={styles.input} />
            </div>
          </div>
          
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "#5c3030", marginTop: "4px" }}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#8B0A2E" }} />
            <span>Show Passwords</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "#4b5563", marginTop: "8px" }}>
            <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8B0A2E" }} />
            <span>I agree to the <span style={{ color: "#8B0A2E", fontWeight: "bold" }}>Terms & Privacy Policy</span></span>
          </label>

          <button type="submit" disabled={saving} style={styles.btnNext}>
            {saving ? "Creating Account..." : "Create Profile 💍"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#5c3030", fontWeight: "500" }}>
          Already have an account? <Link to="/login" style={{ color: "#8B0A2E", fontWeight: "bold", textDecoration: "none" }}>Login</Link>
        </p>
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
    maxWidth: "500px", 
    width: "100%", 
    background: "rgba(255, 255, 255, 0.55)", 
    backdropFilter: "blur(20px)", 
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "28px", 
    padding: "32px 24px", 
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
  btnNext: { 
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
    marginTop: "12px" 
  },
};

export default Register;

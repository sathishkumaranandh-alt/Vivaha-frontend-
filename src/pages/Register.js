import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { useCommunities } from "../utils/communities";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

// Helper: Calculate age from DOB
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

  const [form, setForm] = useState({
    name: "",
    gender: "",
    dob: "",
    community: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
    profile_for: "Myself",
    marital_status: "Never Married",
    religion: "Hindu",
    mother_tongue: "Tamil",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data?.user) navigate("/dashboard"); });
  }, [navigate]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/settings`)
      .then(res => res.json())
      .then(settingsData => {
        if (settingsData.settings && settingsData.settings.allow_registration === "false") setRegistrationAllowed(false);
      })
      .catch(console.error)
      .finally(() => setCheckingSettings(false));
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

    // AGE VALIDATION (Minimum 21)
    const age = getAge(form.dob);
    if (age < 21) return toast.error("You must be at least 21 years old to register.");
    if (age > 80) return toast.error("Please enter a valid Date of Birth.");

    if (!form.community) return toast.error("Community is required for matching");
    if (!form.mobile || form.mobile.length !== 10) return toast.error("Valid 10-digit mobile number is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    if (!form.terms) return toast.error("You must agree to the Terms & Privacy Policy");

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          community: form.community,
          caste: form.community, // NEW: sync caste with community slug
          name: form.name.trim(),
          gender: form.gender,
          dob: form.dob,
          mobile: form.mobile,
          profile_for: form.profile_for,
          marital_status: form.marital_status,
          religion: form.religion,
          mother_tongue: form.mother_tongue,
          custom_fields: {}
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("🎉 Account Created! Let's complete your profile.");

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(), password: form.password,
      });

      if (loginError) {
        toast.error("Please log in.");
        navigate("/login");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Network error. Please try again.");
    } finally { setSaving(false); }
  };

  if (checkingSettings) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;
  if (!registrationAllowed) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 64, textAlign: "center", marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: "#8B0A2E", marginBottom: 8, textAlign: "center" }}>Registration Closed</h2>
          <p style={{ color: "#666", textAlign: "center" }}>New registrations are currently paused.</p>
          <Link to="/login" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#8B0A2E", fontWeight: "bold" }}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "42px", marginBottom: "4px" }}>💍</div>
          <h1 style={{ color: "#8B0A2E", margin: "0 0 4px 0", fontSize: isMobile ? "22px" : "24px", fontWeight: "800", fontFamily: "'Playfair Display', serif" }}>Create Your Profile</h1>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "13px" }}>It takes less than 30 seconds to start</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={styles.label}>Full Name *</label><input type="text" placeholder="Enter name" value={form.name} onChange={(e) => update("name", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Mobile Number *</label><input type="tel" maxLength="10" placeholder="10 digit number" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} style={styles.input} /></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
            <div>
              <label style={styles.label}>Gender *</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} style={styles.input}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div><label style={styles.label}>Date of Birth *</label><input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} style={styles.input} /></div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={styles.label}>Community *</label>
            <select value={form.community} onChange={(e) => update("community", e.target.value)} style={styles.input}>
              <option value="">Select Community</option>
              {communities.map((c) => <option key={c.slug} value={c.slug}>{c.emoji || "👥"} {c.name}</option>)}
            </select>
          </div>

          <div style={{ marginTop: "16px" }}><label style={styles.label}>Email Address *</label><input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} style={styles.input} /></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
            <div><label style={styles.label}>Password *</label><input type="password" placeholder="Min 6 chars" value={form.password} onChange={(e) => update("password", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Confirm Password *</label><input type="password" placeholder="Re-enter" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} style={styles.input} /></div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px", fontSize: "14px", cursor: "pointer", color: "#4b5563" }}>
            <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8B0A2E" }} />
            <span>I agree to the Terms & Privacy Policy</span>
          </label>

          <button type="submit" disabled={saving} style={styles.btnNext}>
            {saving ? "Creating Account..." : "Create Profile 💍"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Already have an account? <Link to="/login" style={{ color: "#8B0A2E", fontWeight: "bold", textDecoration: "none" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #fdf2f6 0%, #fff9f5 100%)", padding: "40px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", alignItems: "flex-start", justifyContent: "center" },
  card: { maxWidth: "480px", width: "100%", background: "white", borderRadius: "24px", padding: "32px 24px", boxShadow: "0 20px 60px rgba(139,10,46,0.12)", border: "1px solid #f8e8ed" },
  label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "6px" },
  input: { width: "100%", padding: "14px 16px", border: "1.5px solid #e5e7eb", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "all 0.2s", color: "#1f2937" },
  btnNext: { width: "100%", padding: "16px", borderRadius: "12px", background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", border: "none", fontWeight: "700", fontSize: "16px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 20px rgba(139,10,46,0.3)", marginTop: "24px" },
};

export default Register;

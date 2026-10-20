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
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);

  // 🛡️ Old Register Details Only
  const [form, setForm] = useState({
    name: "", gender: "", dob: "", community: "", mobile: "", email: "",
    password: "", confirmPassword: "", terms: false,
    // Default values for backend
    profile_for: "Myself", marital_status: "Never Married", religion: "Hindu", mother_tongue: "Tamil"
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate("/dashboard");
    });
  }, [navigate]);

  useEffect(() => {
    apiFetch(`/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.settings && data.settings.allow_registration === "false") setRegistrationAllowed(false);
      })
      .catch(console.error)
      .finally(() => setCheckingSettings(false));
  }, []);

  useEffect(() => {
    const c = searchParams.get("community");
    if (c) setForm((f) => ({ ...f, community: c }));
  }, [searchParams]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!form.name.trim()) return toast.error("Full Name is required");
    if (!form.gender) return toast.error("Gender is required");
    if (!form.dob) return toast.error("Date of Birth is required");
    if (getAge(form.dob) < 21) return toast.error("You must be at least 21 years old.");
    if (!form.community) return toast.error("Community is required");
    if (!form.mobile || form.mobile.length !== 10) return toast.error("Valid 10-digit mobile is required");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return toast.error("Please enter a valid email address.");
    
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    if (!form.terms) return toast.error("You must agree to the Terms & Privacy Policy");

    setLoading(true);
    try {
      const res = await apiFetch(`/auth/signup`, {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          community: form.community,
          caste: form.community,
          name: form.name.trim(),
          gender: form.gender.toLowerCase(),
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
      
      if (loginError) { navigate("/login"); } else { navigate("/onboarding"); }
    } catch (err) {
      toast.error(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSettings) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;
  
  if (!registrationAllowed) {
    return (
      <div style={{ padding: 60, textAlign: "center", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 64, textAlign: "center", marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: "#8B0A2E", textAlign: "center", marginBottom: 8 }}>Registration Closed</h2>
          <p style={{ color: "#666", textAlign: "center" }}>New registrations are currently paused.</p>
          <Link to="/login" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#8B0A2E", fontWeight: "bold" }}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root {
          --green: #247443; --green-dark: #123f2c; --green-soft: #e4f0df;
          --ink: #193a2d; --muted: #64766d; --white-glass: rgba(255,255,255,.64);
          --glass-border: rgba(255,255,255,.88);
        }
        * { box-sizing: border-box; }
        .auth-body {
          margin: 0; min-height: 100vh; font-family: Inter, sans-serif;
          color: var(--ink); background: radial-gradient(ellipse at 15% 12%, rgba(255,255,255,.9), transparent 32%),
            radial-gradient(ellipse at 82% 18%, rgba(211,232,190,.8), transparent 30%),
            radial-gradient(ellipse at 72% 90%, rgba(245,226,185,.72), transparent 34%),
            linear-gradient(135deg, #eaf3df, #fff8e9 48%, #e4efdc);
          overflow-x: hidden; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .auth-body::before, .auth-body::after {
          content: ""; position: fixed; z-index: -1; width: 360px; height: 360px; border-radius: 50%;
          filter: blur(55px); opacity: .55; pointer-events: none;
        }
        .auth-body::before { background: #b7d6a7; top: -140px; left: -120px; }
        .auth-body::after { background: #f2d9a9; right: -150px; bottom: -140px; }
        button, input, select { font: inherit; }
        .panel {
          width: 100%; max-width: 580px; position: relative; display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 26px; border-radius: 30px; overflow: hidden; isolation: isolate;
          background: linear-gradient(145deg, rgba(255,255,255,.26), rgba(255,255,255,.06)),
            radial-gradient(ellipse at 50% 10%, rgba(255,255,255,.55), transparent 48%);
          border: 1px solid rgba(255,255,255,.65);
        }
        .panel::before {
          content: ""; position: absolute; inset: 0; z-index: -2;
          background: linear-gradient(180deg, rgba(248,251,242,.78), rgba(229,241,220,.76)),
            url("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85") center/cover;
          filter: blur(1px) saturate(.7);
        }
        .brand { text-align: center; margin-bottom: 15px; position: relative; z-index: 1; }
        .brand h1 { margin: 0; font-family: Georgia, serif; font-size: 3rem; letter-spacing: -1.5px; color: var(--green-dark); line-height: 1; }
        .brand p { margin: 7px 0 0; color: #435b4e; font-size: .95rem; }
        .glass-card {
          width: 100%; padding: 26px; border-radius: 25px; background: rgba(255,255,255,.58);
          border: 1px solid var(--glass-border); box-shadow: 0 22px 55px rgba(40,76,48,.16), inset 0 1px 0 rgba(255,255,255,.9);
          backdrop-filter: blur(22px) saturate(135%); -webkit-backdrop-filter: blur(22px) saturate(135%);
        }
        .tabs { display: flex; padding: 5px; margin-bottom: 24px; border-radius: 999px; background: rgba(255,255,255,.45); border: 1px solid rgba(255,255,255,.78); }
        .tab { flex: 1; padding: 11px; border: 0; border-radius: 999px; background: transparent; color: #50655a; font-weight: 650; text-align: center; text-decoration: none; }
        .tab.active { color: white; background: linear-gradient(135deg, #438a4d, #155b38); box-shadow: 0 7px 18px rgba(31,105,57,.25); }
        
        h2 { margin: 0 0 8px; font: 700 2rem/1.15 Georgia, serif; color: var(--green-dark); text-align: center; }
        .intro { margin: 0 0 20px; color: #5b6d63; text-align: center; font-size: 0.95rem; }
        
        .row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; margin-bottom: 15px; }
        .field { margin-bottom: 15px; }
        .field:last-child { margin-bottom: 0; }
        
        label { display: block; margin: 0 0 7px; font-size: .87rem; font-weight: 700; color: #294638; }
        .required { color: #287943; }
        .input-wrap { position: relative; }
        .symbol { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #385b48; font-size: 1.05rem; pointer-events: none; }
        
        input, select { width: 100%; height: 51px; padding: 0 15px 0 43px; color: #203d2f; background: rgba(255,255,255,.49); border: 1px solid rgba(255,255,255,.98); outline: 1px solid rgba(92,130,99,.13); border-radius: 13px; }
        input:focus, select:focus { border-color: #6eaa7b; outline: 0; background: rgba(255,255,255,.82); box-shadow: 0 0 0 4px rgba(56,132,76,.12); }
        select { padding-left: 15px; }
        
        .password-input { padding-right: 48px; }
        .toggle-password { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: #42624e; padding: 8px; border-radius: 8px; cursor: pointer; }
        
        .terms { display: flex; gap: 9px; align-items: flex-start; margin: 16px 0; color: #5c7062; font-size: .83rem; line-height: 1.45; }
        .terms input { width: 16px; height: 16px; margin: 2px 0 0; accent-color: #287747; flex-shrink: 0; padding: 0; }
        
        .primary-btn { width: 100%; min-height: 51px; border: 1px solid rgba(255,255,255,.92); border-radius: 999px; color: #fff; font-weight: 750; background: linear-gradient(110deg, #5b9b50, #17633c); box-shadow: 0 9px 20px rgba(32,103,55,.22); cursor: pointer; margin-top: 10px; }
        
        .switch-copy { margin: 20px 0 0; text-align: center; color: #586c60; font-size: .88rem; }
        .switch-copy a { color: #226d40; font-weight: 700; text-decoration: none; }
        
        @media (max-width: 520px) {
          .row-fields { grid-template-columns: 1fr; gap: 0; }
          .row-fields .field { margin-bottom: 15px; }
        }
      `}</style>

      <div className="auth-body">
        <section className="panel">
          <header className="brand">
            <h1>Vivaha</h1>
            <p>Find Your Life Partner</p>
          </header>

          <div className="glass-card">
            <div className="tabs">
              <Link to="/login" className="tab">Login</Link>
              <button className="tab active" type="button">Register</button>
            </div>
            
            <h2>Create Your Account</h2>
            <p className="intro">Join thousands of people looking for their life partner.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="row-fields">
                <div className="field">
                  <label>Full Name <span className="required">*</span></label>
                  <div className="input-wrap"><span className="symbol">♙</span><input type="text" placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
                </div>
                <div className="field">
                  <label>Mobile <span className="required">*</span></label>
                  <div className="input-wrap"><span className="symbol">☎</span><input type="tel" maxLength="10" placeholder="10 digit number" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} required /></div>
                </div>
              </div>

              <div className="row-fields">
                <div className="field">
                  <label>Gender <span className="required">*</span></label>
                  <select value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="field">
                  <label>Date of Birth <span className="required">*</span></label>
                  <div className="input-wrap"><span className="symbol">▦</span><input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} required /></div>
                </div>
              </div>

              <div className="field">
                <label>Community <span className="required">*</span></label>
                <select value={form.community} onChange={(e) => update("community", e.target.value)} required>
                  <option value="">Select Community</option>
                  {communities.map((c) => <option key={c.slug} value={c.slug}>{c.emoji || "👥"} {c.name}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Email Address <span className="required">*</span></label>
                <div className="input-wrap"><span className="symbol">✉</span><input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required /></div>
              </div>

              <div className="row-fields">
                <div className="field">
                  <label>Password <span className="required">*</span></label>
                  <div className="input-wrap">
                    <span className="symbol">♙</span>
                    <input className="password-input" type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength="6" />
                  </div>
                </div>
                <div className="field">
                  <label>Confirm Password <span className="required">*</span></label>
                  <div className="input-wrap">
                    <span className="symbol">♙</span>
                    <input className="password-input" type={showPassword ? "text" : "password"} placeholder="Re-enter" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required minLength="6" />
                  </div>
                </div>
              </div>
              
              <label className="terms" style={{ marginTop: "-5px", marginBottom: "10px" }}>
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span>Show Passwords</span>
              </label>

              <label className="terms">
                <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} required />
                <span>I agree to the Terms of Use and Privacy Policy. I confirm that the details provided are accurate.</span>
              </label>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Profile 💍"}
              </button>
            </form>
            
            <p className="switch-copy">Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </section>
      </div>
    </>
  );
}

export default Register;

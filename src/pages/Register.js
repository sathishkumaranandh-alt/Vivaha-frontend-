import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { apiFetch } from "../utils/api";

function getAge(dobString) {
  if (!dobString) return 0;
  const diff = Date.now() - new Date(dobString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "", gender: "", dob: "", email: "", mobile: "", password: "",
    city: "", community: "", education: "", occupation: "",
    pref_age_min: "21", pref_age_max: "35", pref_location: "", terms: false
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.name || !form.gender || !form.dob || !form.email || !form.mobile || !form.password) return toast.error("Please fill all required fields");
      if (getAge(form.dob) < 21) return toast.error("You must be at least 21 years old.");
      if (form.mobile.length < 10) return toast.error("Valid 10-digit mobile is required");
    }
    if (step === 2) {
      if (!form.city) return toast.error("Current city is required");
    }
    if (step === 3) {
      if (!form.terms) return toast.error("Please agree to Terms & Privacy Policy");
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(step + 1); };
  const prevStep = () => { setStep(step - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/auth/signup`, {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(), password: form.password, name: form.name.trim(), gender: form.gender.toLowerCase(), dob: form.dob, mobile: form.mobile, community: form.community || "any", location: form.city, education: form.education, occupation: form.occupation, pref_age_min: parseInt(form.pref_age_min), pref_age_max: parseInt(form.pref_age_max), pref_location: form.pref_location, custom_fields: {}
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("🎉 Account Created! Let's complete your profile.");
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (loginError) { navigate("/login"); } else { navigate("/onboarding"); }
    } catch (err) {
      toast.error(err.message || "Network error. Please try again.");
    } finally { setLoading(false); }
  };

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
          width: 100%; max-width: 600px; position: relative; display: flex; flex-direction: column; align-items: center;
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
          width: 100%; padding: 24px; border-radius: 25px; background: rgba(255,255,255,.58);
          border: 1px solid var(--glass-border); box-shadow: 0 22px 55px rgba(40,76,48,.16), inset 0 1px 0 rgba(255,255,255,.9);
          backdrop-filter: blur(22px) saturate(135%); -webkit-backdrop-filter: blur(22px) saturate(135%);
        }
        h2 { margin: 0 0 8px; font: 700 2rem/1.15 Georgia, serif; color: var(--green-dark); text-align: center; }
        .intro { margin: 0 0 20px; color: #5b6d63; text-align: center; font-size: 0.95rem; }
        .steps { display: grid; grid-template-columns: repeat(3,1fr); margin-bottom: 21px; border-bottom: 1px solid rgba(65,110,75,.2); }
        .step { position: relative; padding: 0 4px 14px; text-align: center; font-size: .78rem; color: #7b8b80; font-weight: 600; }
        .step.active { color: #1f6d3d; font-weight: 750; }
        .step.active::after { content: ""; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; border-radius: 5px; background: #287747; }
        .field { margin-bottom: 15px; }
        label { display: block; margin: 0 0 7px; font-size: .87rem; font-weight: 700; color: #294638; }
        .required { color: #287943; }
        .input-wrap { position: relative; }
        .symbol { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #385b48; font-size: 1.05rem; pointer-events: none; }
        input, select { width: 100%; height: 51px; padding: 0 15px 0 43px; color: #203d2f; background: rgba(255,255,255,.49); border: 1px solid rgba(255,255,255,.98); outline: 1px solid rgba(92,130,99,.13); border-radius: 13px; }
        input:focus, select:focus { border-color: #6eaa7b; outline: 0; background: rgba(255,255,255,.82); box-shadow: 0 0 0 4px rgba(56,132,76,.12); }
        select { padding-left: 15px; }
        .password-input { padding-right: 48px; }
        .toggle-password { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: #42624e; padding: 8px; border-radius: 8px; cursor: pointer; }
        .row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
        .phone-row { display: grid; grid-template-columns: 83px 1fr; gap: 8px; }
        .phone-row select, .phone-row input { padding-left: 12px; }
        .primary-btn { width: 100%; min-height: 51px; border: 1px solid rgba(255,255,255,.92); border-radius: 999px; color: #fff; font-weight: 750; background: linear-gradient(110deg, #5b9b50, #17633c); box-shadow: 0 9px 20px rgba(32,103,55,.22); margin-top: 10px; cursor: pointer; }
        .step-actions { display: flex; gap: 10px; margin-top: 8px; }
        .secondary-btn { min-height: 49px; padding: 0 20px; border: 1px solid #7ba889; border-radius: 999px; background: rgba(255,255,255,.45); color: #2b6540; font-weight: 700; cursor: pointer; }
        .terms { display: flex; gap: 9px; align-items: flex-start; margin: 15px 0; color: #5c7062; font-size: .83rem; line-height: 1.45; }
        .terms input { width: 16px; height: 16px; margin: 2px 0 0; accent-color: #287747; flex-shrink: 0; padding: 0; }
        .switch-copy { margin: 20px 0 0; text-align: center; color: #586c60; font-size: .88rem; }
        .switch-copy a { color: #226d40; font-weight: 700; text-decoration: none; }
        @media (max-width: 520px) {
          .row-fields { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>

      <div className="auth-body">
        <section className="panel">
          <header className="brand">
            <h1>Vivaha</h1>
            <p>Find Your Life Partner</p>
          </header>
          
          <h2>Create Your Account</h2>
          <p className="intro">Join thousands of people looking for their life partner.</p>
          
          <div className="glass-card">
            <div className="steps">
              <div className={`step ${step === 1 ? "active" : ""}`}>1. Basic</div>
              <div className={`step ${step === 2 ? "active" : ""}`}>2. Personal</div>
              <div className={`step ${step === 3 ? "active" : ""}`}>3. Prefs</div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div>
                  <div className="field">
                    <label>Full Name <span className="required">*</span></label>
                    <div className="input-wrap"><span className="symbol">♙</span><input type="text" placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
                  </div>
                  <div className="row-fields">
                    <div className="field">
                      <label>Gender <span className="required">*</span></label>
                      <select value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
                        <option value="">Select</option><option value="male">Male</option><option value="female">Female</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Date of Birth <span className="required">*</span></label>
                      <div className="input-wrap"><span className="symbol">▦</span><input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} required /></div>
                    </div>
                  </div>
                  <div className="field">
                    <label>Email <span className="required">*</span></label>
                    <div className="input-wrap"><span className="symbol">✉</span><input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required /></div>
                  </div>
                  <div className="field">
                    <label>Mobile <span className="required">*</span></label>
                    <div className="phone-row">
                      <select><option value="+91">+91</option></select>
                      <input type="tel" placeholder="10 digit" maxLength="10" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <label>Password <span className="required">*</span></label>
                    <div className="input-wrap">
                      <span className="symbol">♙</span>
                      <input className="password-input" type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength="6" />
                      <button className="toggle-password" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "◎" : "◉"}</button>
                    </div>
                  </div>
                  <div className="step-actions"><button className="primary-btn" type="button" onClick={nextStep}>Continue →</button></div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="field">
                    <label>Current City <span className="required">*</span></label>
                    <div className="input-wrap"><span className="symbol">⌖</span><input type="text" placeholder="e.g. Chennai" value={form.city} onChange={(e) => update("city", e.target.value)} required /></div>
                  </div>
                  <div className="row-fields">
                    <div className="field">
                      <label>Community</label>
                      <select value={form.community} onChange={(e) => update("community", e.target.value)}>
                        <option value="">Select</option>
                        <option value="Vanniyar">Vanniyar</option>
                        <option value="Pillai">Pillai</option>
                        <option value="Chettiar">Chettiar</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Education</label>
                      <input type="text" placeholder="Your education" value={form.education} onChange={(e) => update("education", e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Occupation</label>
                    <input type="text" placeholder="Your occupation" value={form.occupation} onChange={(e) => update("occupation", e.target.value)} />
                  </div>
                  <div className="step-actions">
                    <button className="secondary-btn" type="button" onClick={prevStep}>Back</button>
                    <button className="primary-btn" type="button" onClick={nextStep}>Continue →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="row-fields">
                    <div className="field">
                      <label>Partner age from</label>
                      <select value={form.pref_age_min} onChange={(e) => update("pref_age_min", e.target.value)}>
                        <option value="21">21</option><option value="23">23</option><option value="25">25</option><option value="28">28</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Partner age up to</label>
                      <select value={form.pref_age_max} onChange={(e) => update("pref_age_max", e.target.value)}>
                        <option value="30">30</option><option value="35">35</option><option value="40">40</option><option value="45">45</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Preferred location</label>
                    <input type="text" placeholder="Any city or state" value={form.pref_location} onChange={(e) => update("pref_location", e.target.value)} />
                  </div>
                  <label className="terms">
                    <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} required />
                    <span>I agree to the Terms of Use and Privacy Policy. I confirm that the details provided are accurate.</span>
                  </label>
                  <div className="step-actions">
                    <button className="secondary-btn" type="button" onClick={prevStep}>Back</button>
                    <button className="primary-btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account ♡"}</button>
                  </div>
                </div>
              )}
            </form>
            
            <p className="switch-copy">Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </section>
      </div>
    </>
  );
}

export default Register;

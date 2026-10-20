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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate("/dashboard");
    });
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
        
        /* 🛡️ FIX: Increased max-width from 500px to 650px */
        .panel {
          width: 100%; max-width: 650px; position: relative; display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 30px; border-radius: 30px; overflow: hidden; isolation: isolate;
          background: linear-gradient(145deg, rgba(255,255,255,.26), rgba(255,255,255,.06)),
            radial-gradient(ellipse at 50% 10%, rgba(255,255,255,.55), transparent 48%);
          border: 1px solid rgba(255,255,255,.65);
        }
        .panel::before {
          content: ""; position: absolute; inset: 0; z-index: -2;
          background: linear-gradient(180deg, rgba(245,249,238,.22), rgba(24,73,43,.12)),
            url("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85") center/cover;
          filter: saturate(.82);
        }
        .brand { text-align: center; margin-bottom: 20px; position: relative; z-index: 1; }
        .brand h1 { margin: 0; font-family: Georgia, serif; font-size: 3rem; letter-spacing: -1.5px; color: var(--green-dark); line-height: 1; }
        .brand p { margin: 7px 0 0; color: #435b4e; font-size: .95rem; }
        
        .glass-card {
          width: 100%; padding: 30px 40px; border-radius: 25px; background: rgba(255,255,255,.58);
          border: 1px solid var(--glass-border); box-shadow: 0 22px 55px rgba(40,76,48,.16), inset 0 1px 0 rgba(255,255,255,.9);
          backdrop-filter: blur(22px) saturate(135%); -webkit-backdrop-filter: blur(22px) saturate(135%);
        }
        .tabs { display: flex; padding: 5px; margin-bottom: 24px; border-radius: 999px; background: rgba(255,255,255,.45); border: 1px solid rgba(255,255,255,.78); }
        .tab { flex: 1; padding: 11px; border: 0; border-radius: 999px; background: transparent; color: #50655a; font-weight: 650; text-align: center; text-decoration: none; }
        .tab.active { color: white; background: linear-gradient(135deg, #438a4d, #155b38); box-shadow: 0 7px 18px rgba(31,105,57,.25); }
        h2 { margin: 0 0 8px; font: 700 2rem/1.15 Georgia, serif; color: var(--green-dark); }
        .intro { margin: 0 0 24px; color: #5b6d63; font-size: 0.95rem; }
        .field { margin-bottom: 15px; }
        label { display: block; margin: 0 0 7px; font-size: .87rem; font-weight: 700; color: #294638; }
        .input-wrap { position: relative; }
        .symbol { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #385b48; font-size: 1.05rem; pointer-events: none; }
        input { width: 100%; height: 51px; padding: 0 15px 0 43px; color: #203d2f; background: rgba(255,255,255,.49); border: 1px solid rgba(255,255,255,.98); outline: 1px solid rgba(92,130,99,.13); border-radius: 13px; }
        input:focus { border-color: #6eaa7b; outline: 0; background: rgba(255,255,255,.82); box-shadow: 0 0 0 4px rgba(56,132,76,.12); }
        .password-input { padding-right: 48px; }
        .toggle-password { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: #42624e; padding: 8px; border-radius: 8px; cursor: pointer; }
        .options-row { display: flex; justify-content: space-between; margin: 2px 0 20px; font-size: .86rem; align-items: center; }
        .remember { display: flex; align-items: center; gap: 8px; color: #52675a; cursor: pointer; }
        .remember input { width: 17px; height: 17px; accent-color: #287846; padding: 0; margin: 0; cursor: pointer; }
        a { color: #226d40; font-weight: 700; text-decoration: none; }
        .primary-btn { width: 100%; min-height: 51px; border: 1px solid rgba(255,255,255,.92); border-radius: 999px; color: #fff; font-weight: 750; background: linear-gradient(110deg, #5b9b50, #17633c); box-shadow: 0 9px 20px rgba(32,103,55,.22); cursor: pointer; }
        .divider { display: flex; align-items: center; gap: 12px; margin: 19px 0; color: #66796d; font-size: .83rem; }
        .divider::before, .divider::after { content: ""; height: 1px; flex: 1; background: rgba(74,111,83,.25); }
        .switch-copy { margin: 20px 0 0; text-align: center; color: #586c60; font-size: .88rem; }
        .forgot-btn { background: none; border: none; padding: 0; color: #226d40; font-weight: 700; cursor: pointer; font-family: inherit; font-size: .86rem; }
        .forgot-btn:hover { text-decoration: underline; }
        
        @media (max-width: 768px) {
          .glass-card { padding: 24px 20px; }
          .panel { padding: 20px; }
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
              <button className="tab active" type="button">Login</button>
              <Link to="/register" className="tab">Register</Link>
            </div>
            
            <h2>Welcome Back</h2>
            <p className="intro">Login to continue your journey.</p>
            
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Email Address</label>
                <div className="input-wrap">
                  <span className="symbol">✉</span>
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Password</label>
                <div className="input-wrap">
                  <span className="symbol">♙</span>
                  <input className="password-input" type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button className="toggle-password" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "◎" : "◉"}</button>
                </div>
              </div>
              <div className="options-row">
                <label className="remember"><input type="checkbox" /> Remember me</label>
                <button type="button" className="forgot-btn" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </button>
              </div>
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login →"}
              </button>
            </form>
            
            <div className="divider">OR</div>
            <p className="switch-copy">Don't have an account? <Link to="/register">Register Now</Link></p>
          </div>
        </section>
      </div>
    </>
  );
}

export default Login;

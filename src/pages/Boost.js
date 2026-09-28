import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import usePlan from "../utils/usePlan";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Boost() {
  const navigate = useNavigate();
  const { permissions, loading: planLoading } = usePlan();
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  // Check admin plan permission: does this plan include free boost?
  const hasFreeBoost = permissions.profile_boost === true;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);

      try {
        const res = await fetch(`${BACKEND_URL}/boost/status/${user.id}`);
        if (res.ok) {
          setStatus(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const handleActivate = async () => {
    if (!userId) return;

    // If plan includes free boost, use the admin grant endpoint
    if (hasFreeBoost) {
      if (!window.confirm("Activate free boost with your plan?")) return;
      setActivating(true);
      try {
        const res = await fetch(`${BACKEND_URL}/boost/admin/grant/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: 7 }),
        });
        if (res.ok) {
          toast.success("🚀 Free boost activated!");
          const refresh = await fetch(`${BACKEND_URL}/boost/status/${userId}`);
          if (refresh.ok) setStatus(await refresh.json());
        } else {
          toast.error("Failed to activate boost");
        }
      } catch { toast.error("Network error"); } finally { setActivating(false); }
      return;
    }

    // Otherwise, paid boost
    if (!window.confirm(`Activate Profile Boost for ₹${status?.price || 199}?`)) return;

    setActivating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/boost/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("🚀 Boost activated! Your profile is now at the top.");
        const refresh = await fetch(`${BACKEND_URL}/boost/status/${userId}`);
        if (refresh.ok) setStatus(await refresh.json());
      } else {
        toast.error(data.error || "Failed to activate boost");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setActivating(false);
    }
  };

  if (loading || planLoading) return <div style={{ padding: "80px 20px", textAlign: "center" }}>Loading...</div>;

  const S = {
    page: { maxWidth: "700px", margin: "0 auto", padding: isMobile ? "16px" : "32px" },
    header: { marginBottom: "24px" },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "24px" : "32px", color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "14px", margin: 0 },
    heroCard: { background: "linear-gradient(135deg, #8B0A2E, #a01438)", borderRadius: "20px", padding: isMobile ? "28px 20px" : "40px 32px", color: "white", textAlign: "center", marginBottom: "24px", boxShadow: "0 12px 40px rgba(139,10,46,0.25)" },
    heroIcon: { fontSize: "64px", marginBottom: "16px" },
    heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "24px" : "30px", fontWeight: 900, marginBottom: "10px" },
    heroSub: { fontSize: "14px", opacity: 0.9, lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 20px auto" },
    priceBox: { display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "10px 24px", borderRadius: "20px", fontSize: "13px", fontWeight: 700, marginBottom: "24px" },
    heroBtn: { background: "#D4A017", color: "#8B0A2E", border: "none", padding: "16px 40px", borderRadius: "12px", fontWeight: 700, fontSize: "16px", cursor: "pointer", boxShadow: "0 6px 20px rgba(212,160,23,0.4)", fontFamily: "inherit" },
    featureCard: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0", marginBottom: "14px", display: "flex", alignItems: "flex-start", gap: "14px" },
    featureIcon: { fontSize: "24px", flexShrink: 0 },
    featureTitle: { fontSize: "15px", fontWeight: 700, color: "#8B0A2E", marginBottom: "4px" },
    featureDesc: { fontSize: "13px", color: "#8a6b6b", margin: 0, lineHeight: 1.5 },
    activeCard: { background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "16px", padding: "24px", color: "white", textAlign: "center", marginBottom: "24px" },
    activeTitle: { fontSize: "20px", fontWeight: 900, marginBottom: "6px" },
    activeSub: { fontSize: "13px", opacity: 0.9, margin: 0 },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>🚀 Profile Boost</h1>
        <p style={S.sub}>Get up to 10x more profile views by appearing at the top of search results</p>
      </div>

      {status?.isActive ? (
        <>
          <div style={S.activeCard}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>✅</div>
            <div style={S.activeTitle}>Boost is Active!</div>
            <p style={S.activeSub}>
              {status.daysLeft} day{status.daysLeft !== 1 ? "s" : ""} remaining
            </p>
            <p style={{ fontSize: "12px", opacity: 0.85, marginTop: "8px", margin: "8px 0 0 0" }}>
              Expires: {new Date(status.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <button
            onClick={handleActivate}
            disabled={activating}
            style={{ ...S.heroBtn, width: "100%", opacity: activating ? 0.6 : 1 }}
          >
            {activating
              ? "Extending..."
              : hasFreeBoost
              ? `➕ Extend Free Boost (7 more days)`
              : `➕ Extend for ₹${status.price} (add ${status.duration} more days)`}
          </button>
        </>
      ) : (
        <>
          <div style={S.heroCard}>
            <div style={S.heroIcon}>🚀</div>
            <h2 style={S.heroTitle}>Boost Your Profile</h2>
            <p style={S.heroSub}>
              Appear at the top of every search result and Featured Profiles section for {status?.duration || 7} days.
            </p>
            <div style={S.priceBox}>
              {hasFreeBoost
                ? "✅ Free with your current plan!"
                : `Only ₹${status?.price || 199} for ${status?.duration || 7} days`}
            </div>
            <br />
            <button onClick={handleActivate} disabled={activating} style={{ ...S.heroBtn, opacity: activating ? 0.6 : 1 }}>
              {activating
                ? "Activating..."
                : hasFreeBoost
                ? "🚀 Activate Free Boost"
                : "🚀 Activate Boost Now"}
            </button>
          </div>

          <div style={S.featureCard}>
            <div style={S.featureIcon}>⬆️</div>
            <div>
              <div style={S.featureTitle}>Top of Search Results</div>
              <p style={S.featureDesc}>Your profile appears first when anyone searches for matches.</p>
            </div>
          </div>

          <div style={S.featureCard}>
            <div style={S.featureIcon}>⭐</div>
            <div>
              <div style={S.featureTitle}>Featured Profile Badge</div>
              <p style={S.featureDesc}>A golden "Boosted" badge appears next to your name.</p>
            </div>
          </div>

          <div style={S.featureCard}>
            <div style={S.featureIcon}>👀</div>
            <div>
              <div style={S.featureTitle}>Up to 10x More Views</div>
              <p style={S.featureDesc}>Boosted profiles get significantly more views and interests.</p>
            </div>
          </div>

          <div style={S.featureCard}>
            <div style={S.featureIcon}>💰</div>
            <div>
              <div style={S.featureTitle}>{hasFreeBoost ? "Included with your plan" : "Best Value"}</div>
              <p style={S.featureDesc}>
                {hasFreeBoost
                  ? "Your plan includes free profile boosts."
                  : `Just ₹${status?.price || 199} for a week of premium visibility.`}
              </p>
            </div>
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <Link to="/dashboard" style={{ color: "#8B0A2E", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Boost;

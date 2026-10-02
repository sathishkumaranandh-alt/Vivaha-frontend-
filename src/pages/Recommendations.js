import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import BackButton from "../components/BackButton";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Recommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      try {
        const res = await fetch(`${BACKEND_URL}/profile/recommendations/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
        const planRes = await fetch(`${BACKEND_URL}/plans/user-plan/${user.id}`);
        if (planRes.ok) {
          const data = await planRes.json();
          setPlan((data.plan || "Free").toLowerCase());
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [navigate]);

  if (loading) return <div style={{ padding: "80px 20px", textAlign: "center" }}>Loading recommendations... ⏳</div>;

  const isFree = plan === "free";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px" : "32px" }}>
      <BackButton />

      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" }}>
            💕 Recommended for You
          </h1>
          <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>Personalized matches based on your profile</p>
        </div>
        <div style={{ background: plan === "platinum" ? "linear-gradient(135deg, #fce7f3, #fbcfe8)" : plan === "gold" ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "#f3f4f6", color: plan === "platinum" ? "#9f1239" : plan === "gold" ? "#92400e" : "#4b5563", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, textTransform: "capitalize" }}>
          {plan === "platinum" ? "💎" : plan === "gold" ? "🥇" : "👤"} {plan} Plan
        </div>
      </div>

      {isFree && recommendations.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)", border: "1px solid #f0e0e0", borderRadius: "14px", padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ fontSize: "13px", color: "#8a6b6b" }}>🔒 Free plan shows <strong>5 recommendations</strong>. Upgrade for more!</div>
          <Link to="/subscription" style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "10px 20px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "13px" }}>⭐ Upgrade</Link>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div style={{ background: "white", borderRadius: "14px", padding: "60px 20px", textAlign: "center", border: "1px solid #f0e0e0" }}>
          <div style={{ fontSize: "50px", marginBottom: "12px" }}>💕</div>
          <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>No recommendations yet</h3>
          <p style={{ color: "#8a6b6b", fontSize: "13px", marginBottom: "20px" }}>Complete your profile to get better matches.</p>
          <Link to="/profile" style={{ background: "#8B0A2E", color: "white", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>Complete Profile →</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: isMobile ? "14px" : "20px" }}>
          {recommendations.map((u) => (
            <div key={u.id} style={{ background: "white", borderRadius: "20px", overflow: "hidden", border: "1px solid #f0e0e0", boxShadow: "0 8px 24px rgba(139,10,46,0.08)" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "4/5", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", overflow: "hidden" }}>
                {u.photo_url ? (
                  <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: u.should_blur_photo ? "blur(22px)" : "none", transform: u.should_blur_photo ? "scale(1.15)" : "scale(1)" }} />
                ) : ("👤")}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 3 }}>
                  {u.is_boosted && <div style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", fontSize: "9px", fontWeight: 800, padding: "4px 10px", borderRadius: "20px", width: "fit-content" }}>🚀 BOOSTED</div>}
                  {u.is_verified && <div style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "white", fontSize: "9px", fontWeight: 800, padding: "4px 10px", borderRadius: "20px", width: "fit-content" }}>✓ VERIFIED</div>}
                </div>
                {u.should_blur_photo && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", zIndex: 2 }}>
                    <div style={{ background: "rgba(255,255,255,0.98)", padding: "10px 18px", borderRadius: "24px", fontSize: "11px", fontWeight: 800, color: "#8B0A2E", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <span style={{ fontSize: "20px" }}>🔒</span><span>Protected</span>
                    </div>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px", zIndex: 3 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 700, color: "white", textShadow: "0 2px 6px rgba(0,0,0,0.55)", marginBottom: "3px" }}>{u.name || "Anonymous"}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.95)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {u.age ? <span>🎂 {u.age} yrs</span> : null}
                    {u.location ? <span>📍 {u.location}</span> : null}
                  </div>
                </div>
              </div>
              <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {u.education && <div style={{ fontSize: "11px", color: "#8a6b6b", display: "flex", alignItems: "center", gap: "6px" }}><span>🎓</span><span>{u.education}</span></div>}
                {u.occupation && <div style={{ fontSize: "11px", color: "#8a6b6b", display: "flex", alignItems: "center", gap: "6px" }}><span>💼</span><span>{u.occupation}</span></div>}
                {u.community && (
                  <span style={{ background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", color: "#8B0A2E", padding: "4px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, textTransform: "capitalize", display: "inline-block", width: "fit-content", marginTop: "4px" }}>
                    🏷️ {u.community}
                  </span>
                )}
                <Link to={`/profile/${u.id}`} style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", padding: "10px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "12px", marginTop: "10px" }}>
                  {u.should_blur_photo ? "🔒 View Profile" : "View Profile →"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recommendations;

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

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
        const res = await fetch(`${BACKEND_URL}/premium/recommendations/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
          setPlan(data.plan || "free");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  if (loading) return <div style={{ padding: "80px 20px", textAlign: "center" }}>Loading recommendations... ⏳</div>;

  const isFree = plan === "free";
  const isPlatinum = plan === "platinum";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px" : "32px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" }}>
            💕 Recommended for You
          </h1>
          <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
            Personalized matches based on your profile
          </p>
        </div>
        <div style={{
          background: plan === "platinum" ? "linear-gradient(135deg, #fce7f3, #fbcfe8)" : plan === "gold" ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "#f3f4f6",
          color: plan === "platinum" ? "#9f1239" : plan === "gold" ? "#92400e" : "#4b5563",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 800,
          textTransform: "capitalize",
        }}>
          {plan === "platinum" ? "💎" : plan === "gold" ? "🥇" : "👤"} {plan} Plan
        </div>
      </div>

      {isFree && recommendations.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)", border: "1px solid #f0e0e0", borderRadius: "14px", padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ fontSize: "13px", color: "#8a6b6b", lineHeight: 1.5 }}>
            🔒 Free plan shows <strong>5 recommendations</strong>. Upgrade to Gold for 20, or Platinum for unlimited.
          </div>
          <Link to="/subscription" style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "10px 20px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "13px" }}>
            ⭐ Upgrade
          </Link>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div style={{ background: "white", borderRadius: "14px", padding: "60px 20px", textAlign: "center", border: "1px solid #f0e0e0" }}>
          <div style={{ fontSize: "50px", marginBottom: "12px" }}>💕</div>
          <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>No recommendations yet</h3>
          <p style={{ color: "#8a6b6b", fontSize: "13px", marginBottom: "20px" }}>
            Complete your profile with photos, bio, and partner preferences to get better matches.
          </p>
          <Link to="/profile" style={{ background: "#8B0A2E", color: "white", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
            Complete Profile →
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? "12px" : "16px" }}>
          {recommendations.map((u) => (
            <div key={u.id} style={{ background: "white", borderRadius: "14px", overflow: "hidden", border: "1px solid #f0e0e0", boxShadow: "0 4px 20px rgba(139,10,46,0.06)" }}>
              <div style={{ height: isMobile ? "140px" : "180px", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px", position: "relative" }}>
                {u.photo_url ? (
                  <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : ("👤")}
                {u.is_boosted && <div style={{ position: "absolute", top: "8px", left: "8px", background: "#D4A017", color: "white", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px" }}>🚀 Boosted</div>}
                {!u.is_boosted && u.is_verified && <div style={{ position: "absolute", top: "8px", left: "8px", background: "#10B981", color: "white", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px" }}>✓ Verified</div>}
                <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(139,10,46,0.9)", color: "white", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px" }}>
                  {u.match_score}% match
                </div>
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: "#8B0A2E", marginBottom: "3px" }}>{u.name || "Anonymous"}</div>
                <div style={{ fontSize: "11px", color: "#8a6b6b", marginBottom: "4px", lineHeight: 1.4 }}>
                  {u.age ? `${u.age} yrs` : ""}{u.age && u.location ? " • " : ""}{u.location || ""}
                </div>
                <div style={{ fontSize: "11px", color: "#8a6b6b", marginBottom: "10px" }}>{u.education || u.occupation || ""}</div>
                <Link to={`/profile/${u.id}`} style={{ display: "block", textAlign: "center", background: "#8B0A2E", color: "white", padding: "8px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "11px" }}>
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPlatinum && (
        <div style={{ marginTop: "32px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#8B0A2E", marginBottom: "16px" }}>
            💎 Premium Matches
          </h2>
          <p style={{ color: "#8a6b6b", fontSize: "13px", marginBottom: "16px" }}>
            Handpicked verified profiles with complete bios and photos.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? "12px" : "16px" }}>
            {recommendations.filter(u => u.is_verified && u.photo_url).slice(0, 6).map((u) => (
              <Link key={u.id} to={`/profile/${u.id}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", border: "2px solid #D4A017", boxShadow: "0 4px 20px rgba(212,160,23,0.15)" }}>
                  <div style={{ height: "180px", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px" }}>
                    {u.photo_url ? <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                  </div>
                  <div style={{ padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontWeight: 700, color: "#8B0A2E", fontSize: "14px" }}>{u.name}</div>
                    <div style={{ fontSize: "11px", color: "#8a6b6b" }}>{u.age} yrs • {u.location}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Recommendations;

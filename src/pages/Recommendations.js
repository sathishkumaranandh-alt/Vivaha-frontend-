import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import BackButton from "../components/BackButton";
import ProfileCard from "../components/ProfileCard";
import { apiFetch } from "../utils/api"; // 🛡️ Added for JWT Security

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
        // 🛡️ SECURITY FIX: Switched to apiFetch
        const res = await apiFetch(`/profile/recommendations/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
        
        // 🛡️ SECURITY FIX: Switched to apiFetch
        const planRes = await apiFetch(`/plans/user-plan/${user.id}`);
        if (planRes.ok) {
          const data = await planRes.json();
          setPlan((data.plan || "Free").toLowerCase());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  if (loading)
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        Loading recommendations... ⏳
      </div>
    );

  const isFree = plan === "free";

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: isMobile ? "16px" : "32px",
      }}
    >
      <BackButton />

      {/* HEADER */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "22px" : "28px",
              color: "#8B0A2E",
              marginBottom: "4px",
            }}
          >
            💕 Recommended for You
          </h1>
          <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
            Personalized matches based on your profile
          </p>
        </div>
        <div
          style={{
            background:
              plan === "platinum"
                ? "linear-gradient(135deg, #fce7f3, #fbcfe8)"
                : plan === "gold"
                ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                : "#f3f4f6",
            color:
              plan === "platinum"
                ? "#9f1239"
                : plan === "gold"
                ? "#92400e"
                : "#4b5563",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 800,
            textTransform: "capitalize",
          }}
        >
          {plan === "platinum" ? "💎" : plan === "gold" ? "🥇" : "👤"} {plan} Plan
        </div>
      </div>

      {/* UPGRADE BANNER */}
      {isFree && recommendations.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)",
            border: "1px solid #f0e0e0",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "13px", color: "#8a6b6b" }}>
            🔒 Free plan shows <strong>5 recommendations</strong>. Upgrade for
            more!
          </div>
          <Link
            to="/subscription"
            style={{
              background: "linear-gradient(135deg, #D4A017, #b8860b)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            ⭐ Upgrade
          </Link>
        </div>
      )}

      {/* RECOMMENDATIONS GRID — Using standard ProfileCard */}
      {recommendations.length === 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            padding: "60px 20px",
            textAlign: "center",
            border: "1px solid #f0e0e0",
          }}
        >
          <div style={{ fontSize: "50px", marginBottom: "12px" }}>💕</div>
          <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>
            No recommendations yet
          </h3>
          <p
            style={{
              color: "#8a6b6b",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            Complete your profile to get better matches.
          </p>
          <Link
            to="/profile"
            style={{
              background: "#8B0A2E",
              color: "white",
              padding: "12px 24px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Complete Profile →
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr 1fr"
              : "repeat(auto-fill, minmax(185px, 1fr))",
            gap: isMobile ? "10px" : "14px",
          }}
        >
          {recommendations.map((u) => (
            <ProfileCard key={u.id} user={u} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Recommendations; 

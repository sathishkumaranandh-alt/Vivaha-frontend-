import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Visitors() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [isPremium, setIsPremium] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const res = await fetch(`${BACKEND_URL}/visitors/list/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setVisitors(data.visitors || []);
          setIsPremium(data.isPremium);
          setMessage(data.message || "");
        }
      } catch (err) {
        console.error("Failed to load visitors:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  if (loading) return <div style={{ padding: "80px 20px", textAlign: "center" }}>Loading visitors... ⏳</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "16px" : "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" }}>
          👀 Who Viewed My Profile
        </h1>
        <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
          See who recently visited your profile.
        </p>
      </div>

      {!isPremium ? (
        <div style={{ background: "white", borderRadius: "20px", padding: "40px 24px", textAlign: "center", border: "1px solid #f0e0e0", boxShadow: "0 8px 24px rgba(139,10,46,0.08)" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#8B0A2E", fontFamily: "'Playfair Display', serif", marginBottom: "12px" }}>Premium Feature</h2>
          <p style={{ color: "#666", maxWidth: "400px", margin: "0 auto 24px auto", lineHeight: 1.6, fontSize: "14px" }}>
            {message || "Upgrade to Gold or Platinum to see who viewed your profile."}
          </p>
          <Link to="/subscription" style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "#8B0A2E", padding: "14px 32px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "15px", display: "inline-block", boxShadow: "0 4px 14px rgba(212,160,23,0.4)" }}>
            ⭐ Upgrade Now
          </Link>
        </div>
      ) : visitors.length === 0 ? (
        <div style={{ background: "white", borderRadius: "14px", padding: "60px 20px", textAlign: "center", border: "1px solid #f0e0e0" }}>
          <div style={{ fontSize: "50px", marginBottom: "12px" }}>👀</div>
          <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>No visitors yet</h3>
          <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
            Complete your profile and add photos to get more views!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "16px" }}>
          {visitors.map((v) => (
            <div key={v.id} style={{ background: "white", borderRadius: "14px", padding: "16px", border: "1px solid #f0e0e0", display: "flex", gap: "14px", alignItems: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0, overflow: "hidden" }}>
                {v.photo_url ? (
                  <img src={v.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : ("👤")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#8B0A2E" }}>{v.name || "Anonymous"}</div>
                  {v.is_verified && <span style={{ background: "#10B981", color: "white", fontSize: "9px", padding: "2px 6px", borderRadius: "8px", fontWeight: 700 }}>✓ Verified</span>}
                </div>
                <div style={{ fontSize: "12px", color: "#8a6b6b", marginBottom: "8px" }}>
                  {v.age ? `${v.age} yrs` : ""}
                  {v.age && v.location ? " • " : ""}
                  {v.location || ""}
                </div>
                <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "8px" }}>
                  Viewed {new Date(v.viewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
                <Link to={`/profile/${v.id}`} style={{ background: "#8B0A2E", color: "white", padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Visitors;

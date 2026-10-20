import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import usePlan from "../utils/usePlan";
import BackButton from "../components/BackButton";
import { apiFetch } from "../utils/api";

function Boost() {
  const navigate = useNavigate();
  const { permissions, loading: planLoading } = usePlan();
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

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
        const res = await apiFetch(`/boost/status/${user.id}`);
        if (res.ok) setStatus(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [navigate]);

  const handleActivate = async () => {
    if (!userId) return;
    
    // ============================================
    // FREE BOOST (Plan based)
    // ============================================
    if (hasFreeBoost) {
      if (!window.confirm("Activate free boost with your plan?")) return;
      setActivating(true);
      try {
        const res = await apiFetch(`/boost/claim-free`, { method: "POST" });
        if (res.ok) {
          toast.success("🚀 Free boost activated!");
          const refresh = await apiFetch(`/boost/status/${userId}`);
          if (refresh.ok) setStatus(await refresh.json());
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to activate boost");
        }
      } catch { toast.error("Network error"); } finally { setActivating(false); }
      return;
    }

    // ============================================
    // PAID BOOST (Cashfree Payment)
    // ============================================
    const price = status?.price || 199;
    if (!window.confirm(`Activate Profile Boost for ₹${price}?`)) return;
    
    setActivating(true);
    try {
      // 1. Create Order
      const orderRes = await apiFetch('/payments/create-boost-order', {
        method: "POST",
        body: JSON.stringify({ amount: price }),
      });
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        alert("Cashfree Error: " + (orderData.error || "Unknown error"));
        throw new Error(orderData.error);
      }

      // 2. Open Checkout
      const cashfree = window.Cashfree({
        mode: orderData.cashfree_env === 'PRODUCTION' ? 'production' : 'sandbox',
      });

      const checkoutResult = await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: '_modal',
      });

      if (checkoutResult.error) {
        alert('Payment cancelled or failed: ' + checkoutResult.error.message);
        return;
      }

      // 3. Verify Payment
      const verifyRes = await apiFetch('/payments/verify-boost-payment', {
        method: "POST",
        body: JSON.stringify({ order_id: orderData.order_id }),
      });
      const verifyData = await verifyRes.json();

      if (verifyRes.ok) {
        toast.success("🚀 Boost activated!");
        const refresh = await apiFetch(`/boost/status/${userId}`);
        if (refresh.ok) setStatus(await refresh.json());
      } else {
        alert('Verification failed: ' + verifyData.error);
      }
    } catch (err) {
      console.error("Boost error:", err);
    } finally { setActivating(false); }
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
    heroBtn: { background: "#D4A017", color: "#8B0A2E", border: "none", padding: "16px 40px", borderRadius: "12px", fontWeight: 700, fontSize: "16px", cursor: "pointer", fontFamily: "inherit" },
    activeCard: { background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "16px", padding: "24px", color: "white", textAlign: "center", marginBottom: "24px" },
    featureCard: { background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #f0e0e0", marginBottom: "14px", display: "flex", alignItems: "flex-start", gap: "14px" },
  };

  return (
    <div style={S.page}>
      <BackButton />

      <div style={S.header}>
        <h1 style={S.h1}>🚀 Profile Boost</h1>
        <p style={S.sub}>Get up to 10x more profile views</p>
      </div>

      {status?.isActive ? (
        <>
          <div style={S.activeCard}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: 900, marginBottom: "6px" }}>Boost is Active!</div>
            <p style={{ fontSize: "13px", opacity: 0.9, margin: 0 }}>{status.daysLeft} day{status.daysLeft !== 1 ? "s" : ""} remaining</p>
          </div>
          <button onClick={handleActivate} disabled={activating} style={{ ...S.heroBtn, width: "100%", opacity: activating ? 0.6 : 1 }}>
            {activating ? "Extending..." : hasFreeBoost ? "➕ Extend Free Boost" : `➕ Extend for ₹${status.price}`}
          </button>
        </>
      ) : (
        <>
          <div style={S.heroCard}>
            <div style={S.heroIcon}>🚀</div>
            <h2 style={S.heroTitle}>Boost Your Profile</h2>
            <p style={S.heroSub}>Appear at the top of every search result for {status?.duration || 7} days.</p>
            <div style={S.priceBox}>
              {hasFreeBoost ? "✅ Free with your current plan!" : `Only ₹${status?.price || 199} for ${status?.duration || 7} days`}
            </div>
            <br />
            <button onClick={handleActivate} disabled={activating} style={{ ...S.heroBtn, opacity: activating ? 0.6 : 1 }}>
              {activating ? "Activating..." : hasFreeBoost ? "🚀 Activate Free Boost" : "🚀 Activate Boost Now"}
            </button>
          </div>

          <div style={S.featureCard}><div style={{ fontSize: "24px" }}>⬆️</div><div><div style={{ fontSize: "15px", fontWeight: 700, color: "#8B0A2E" }}>Top of Search Results</div><p style={{ fontSize: "13px", color: "#8a6b6b", margin: 0 }}>Your profile appears first when anyone searches for matches.</p></div></div>
          <div style={S.featureCard}><div style={{ fontSize: "24px" }}>⭐</div><div><div style={{ fontSize: "15px", fontWeight: 700, color: "#8B0A2E" }}>Featured Profile Badge</div><p style={{ fontSize: "13px", color: "#8a6b6b", margin: 0 }}>A golden "Boosted" badge appears next to your name.</p></div></div>
          <div style={S.featureCard}><div style={{ fontSize: "24px" }}>👀</div><div><div style={{ fontSize: "15px", fontWeight: 700, color: "#8B0A2E" }}>Up to 10x More Views</div><p style={{ fontSize: "13px", color: "#8a6b6b", margin: 0 }}>Boosted profiles get significantly more views.</p></div></div>
        </>
      )}
    </div>
  );
}

export default Boost;

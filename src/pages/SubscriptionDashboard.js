import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Subscription() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setUserId(user.id);

        // Fetch plans
        const plansRes = await fetch(`${BACKEND_URL}/subscriptions/plans`);
        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans || []);
        }

        // Fetch current subscription
        const subRes = await fetch(
          `${BACKEND_URL}/subscriptions/user/${user.id}`
        );
        if (subRes.ok) {
          const data = await subRes.json();
          setCurrentSub(data.subscription);
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const handleSubscribe = async (planId) => {
    if (planId === "free") {
      alert("You're already on the free plan.");
      return;
    }

    if (
      !window.confirm(
        `Subscribe to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan?\n\n(Simulated payment for testing)`
      )
    ) {
      return;
    }

    try {
      setSubscribing(planId);

      const res = await fetch(`${BACKEND_URL}/subscriptions/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, plan: planId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("🎉 " + data.message);
        setCurrentSub(data.subscription);
      } else {
        const err = await res.json();
        alert("Failed: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>
          Loading plans... ⏳
        </p>
      </div>
    );
  }

  const currentPlan = currentSub?.plan || "free";

  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>⭐ Choose Your Plan</h1>
        <p style={subtitleStyle}>
          Unlock premium features and find your perfect match faster
        </p>
      </div>

      {/* CURRENT SUBSCRIPTION BANNER */}
      {currentSub && currentPlan !== "free" && (
        <div style={currentPlanBannerStyle}>
          <div>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
              You're on the
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "bold" }}>
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
            </p>
            {currentSub.expires_at && (
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                Expires on{" "}
                {new Date(currentSub.expires_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <Link to="/subscription-dashboard" style={managePlanBtnStyle}>
            Manage Plan →
          </Link>
        </div>
      )}

      {/* PLANS GRID */}
      <div style={plansGridStyle}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === currentPlan}
            onSubscribe={() => handleSubscribe(plan.id)}
            loading={subscribing === plan.id}
          />
        ))}
      </div>

      {/* COMPARISON NOTE */}
      <div style={noteStyle}>
        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
          💡 <strong>Note:</strong> This is a simulated payment system for
          testing. Real payment integration (Razorpay) will be added in Phase 5.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// PLAN CARD COMPONENT
// ============================================================
function PlanCard({ plan, isCurrent, onSubscribe, loading }) {
  const isPopular = plan.popular;

  return (
    <div
      style={{
        ...planCardStyle,
        border: isPopular ? "3px solid #fbbf24" : "1px solid #e5e7eb",
        position: "relative",
        transform: isPopular ? "scale(1.03)" : "scale(1)",
      }}
    >
      {isPopular && <div style={popularBadgeStyle}>⭐ MOST POPULAR</div>}

      <h2 style={planNameStyle}>{plan.name}</h2>
      <p style={planDurationStyle}>{plan.duration}</p>

      <div style={priceRowStyle}>
        <span style={priceStyle}>₹{plan.price}</span>
        {plan.price > 0 && (
          <span style={priceSubStyle}>
            /{plan.duration.replace(" days", "d")}
          </span>
        )}
      </div>

      <ul style={featuresListStyle}>
        {plan.features.map((f, i) => (
          <li key={i} style={featureItemStyle}>
            <span style={checkIconStyle}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSubscribe}
        disabled={isCurrent || loading || plan.id === "free"}
        style={{
          ...subscribeBtnStyle,
          background: isCurrent
            ? "#94a3b8"
            : plan.id === "free"
            ? "#e5e7eb"
            : isPopular
            ? "#fbbf24"
            : "#1e3a8a",
          color:
            plan.id === "free" && !isCurrent
              ? "#666"
              : isPopular && !isCurrent
              ? "#1e3a8a"
              : "white",
          cursor:
            isCurrent || plan.id === "free" ? "not-allowed" : "pointer",
        }}
      >
        {isCurrent
          ? "✓ Current Plan"
          : plan.id === "free"
          ? "Free Plan"
          : loading
          ? "Processing..."
          : `Subscribe to ${plan.name}`}
      </button>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "24px 16px",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "30px",
};

const titleStyle = {
  color: "#1e3a8a",
  fontSize: "32px",
  margin: "0 0 8px 0",
};

const subtitleStyle = {
  color: "#666",
  fontSize: "15px",
  margin: 0,
};

const currentPlanBannerStyle = {
  background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
  color: "white",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
};

const managePlanBtnStyle = {
  background: "white",
  color: "#16a34a",
  padding: "10px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
};

const plansGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
  marginBottom: "30px",
  alignItems: "start",
};

const planCardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "28px 20px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const popularBadgeStyle = {
  position: "absolute",
  top: "-12px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#fbbf24",
  color: "#1e3a8a",
  padding: "4px 14px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "bold",
  whiteSpace: "nowrap",
};

const planNameStyle = {
  color: "#1e3a8a",
  fontSize: "24px",
  margin: "0 0 4px 0",
};

const planDurationStyle = {
  color: "#888",
  fontSize: "13px",
  margin: "0 0 16px 0",
};

const priceRowStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "baseline",
  gap: "4px",
  marginBottom: "20px",
};

const priceStyle = {
  fontSize: "40px",
  fontWeight: "bold",
  color: "#1e3a8a",
};

const priceSubStyle = {
  fontSize: "14px",
  color: "#888",
};

const featuresListStyle = {
  listStyle: "none",
  padding: 0,
  margin: "0 0 24px 0",
  textAlign: "left",
  flex: 1,
};

const featureItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "6px 0",
  fontSize: "14px",
  color: "#444",
};

const checkIconStyle = {
  color: "#16a34a",
  fontWeight: "bold",
  flexShrink: 0,
};

const subscribeBtnStyle = {
  width: "100%",
  padding: "14px",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s",
};

const noteStyle = {
  background: "#fef3c7",
  padding: "16px",
  borderRadius: "10px",
  textAlign: "center",
};

export default Subscription;
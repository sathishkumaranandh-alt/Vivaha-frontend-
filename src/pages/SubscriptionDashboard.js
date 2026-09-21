import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function SubscriptionDashboard() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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

        const res = await fetch(
          `${BACKEND_URL}/subscriptions/user/${user.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const handleCancel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel your subscription?\nYou'll lose premium features at the end of the current period."
      )
    ) {
      return;
    }

    try {
      setCancelling(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await fetch(`${BACKEND_URL}/subscriptions/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("Subscription cancelled");
        setSubscription({
          ...subscription,
          status: "cancelled",
        });
      } else {
        alert("Failed to cancel");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Network error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>Loading... ⏳</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>
          No subscription found.
        </p>
        <Link to="/subscription" style={primaryBtnStyle}>
          View Plans
        </Link>
      </div>
    );
  }

  const planName =
    subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);

  const isActive = subscription.status === "active";
  const isFree = subscription.plan === "free";
  const isExpired = subscription.status === "expired";
  const isCancelled = subscription.status === "cancelled";

  // Calculate days remaining
  let daysRemaining = null;
  if (subscription.expires_at) {
    const exp = new Date(subscription.expires_at);
    const now = new Date();
    daysRemaining = Math.max(
      0,
      Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>⭐ My Subscription</h1>
        <p style={subtitleStyle}>Manage your Vivaha premium plan</p>
      </div>

      {/* MAIN CARD */}
      <div style={cardStyle}>
        {/* STATUS HEADER */}
        <div
          style={{
            ...statusHeaderStyle,
            background: isFree
              ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
              : isExpired || isCancelled
              ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
              : "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
              Current Plan
            </p>
            <h2
              style={{
                margin: "4px 0 0 0",
                fontSize: "32px",
                fontWeight: "bold",
              }}
            >
              {planName}
            </h2>
          </div>
          <div style={statusBadgeStyle}>
            {isFree && "FREE"}
            {isActive && !isFree && "✓ ACTIVE"}
            {isExpired && "⏰ EXPIRED"}
            {isCancelled && "✖ CANCELLED"}
          </div>
        </div>

        {/* DETAILS */}
        <div style={detailsSectionStyle}>
          <DetailRow label="Plan" value={planName} />
          <DetailRow
            label="Status"
            value={
              <span
                style={{
                  color: isActive && !isFree ? "#16a34a" : "#666",
                  fontWeight: "bold",
                }}
              >
                {subscription.status}
              </span>
            }
          />
          {subscription.amount > 0 && (
            <DetailRow
              label="Amount Paid"
              value={`₹${subscription.amount}`}
            />
          )}
          {subscription.started_at && (
            <DetailRow
              label="Started On"
              value={new Date(subscription.started_at).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "long", year: "numeric" }
              )}
            />
          )}
          {subscription.expires_at && (
            <DetailRow
              label="Expires On"
              value={new Date(subscription.expires_at).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "long", year: "numeric" }
              )}
            />
          )}
          {daysRemaining !== null && daysRemaining > 0 && !isFree && (
            <DetailRow
              label="Days Remaining"
              value={
                <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                  {daysRemaining} days
                </span>
              }
            />
          )}
        </div>

        {/* FEATURES */}
        {!isFree && (
          <div style={featuresSectionStyle}>
            <h3 style={featuresTitleStyle}>✨ Your Premium Features</h3>
            <ul style={featuresListStyle}>
              {subscription.plan === "gold" && (
                <>
                  <FeatureItem>Unlimited profile views</FeatureItem>
                  <FeatureItem>Unlimited messages</FeatureItem>
                  <FeatureItem>See who viewed your profile</FeatureItem>
                  <FeatureItem>Advanced search filters</FeatureItem>
                  <FeatureItem>Priority customer support</FeatureItem>
                </>
              )}
              {subscription.plan === "platinum" && (
                <>
                  <FeatureItem>Everything in Gold</FeatureItem>
                  <FeatureItem>Featured profile (top of search)</FeatureItem>
                  <FeatureItem>Verified badge</FeatureItem>
                  <FeatureItem>Profile boost weekly</FeatureItem>
                  <FeatureItem>Direct contact details access</FeatureItem>
                  <FeatureItem>Dedicated relationship manager</FeatureItem>
                </>
              )}
            </ul>
          </div>
        )}

        {/* ACTIONS */}
        <div style={actionsStyle}>
          <Link to="/subscription" style={primaryBtnStyle}>
            {isFree ? "⭐ Upgrade Plan" : "🔄 Change Plan"}
          </Link>
          {!isFree && isActive && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                ...dangerBtnStyle,
                opacity: cancelling ? 0.6 : 1,
                cursor: cancelling ? "not-allowed" : "pointer",
              }}
            >
              {cancelling ? "Cancelling..." : "✖ Cancel Subscription"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function DetailRow({ label, value }) {
  return (
    <div style={detailRowStyle}>
      <span style={{ color: "#666", fontSize: "14px" }}>{label}</span>
      <span style={{ color: "#1e3a8a", fontWeight: "600", fontSize: "14px" }}>
        {value}
      </span>
    </div>
  );
}

function FeatureItem({ children }) {
  return (
    <li style={featureItemStyle}>
      <span style={checkIconStyle}>✓</span>
      <span>{children}</span>
    </li>
  );
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = {
  maxWidth: "700px",
  margin: "0 auto",
  padding: "24px 16px",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "24px",
};

const titleStyle = {
  color: "#1e3a8a",
  fontSize: "28px",
  margin: "0 0 4px 0",
};

const subtitleStyle = {
  color: "#666",
  fontSize: "14px",
  margin: 0,
};

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

const statusHeaderStyle = {
  padding: "24px",
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
};

const statusBadgeStyle = {
  background: "rgba(255,255,255,0.2)",
  padding: "6px 14px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "0.5px",
};

const detailsSectionStyle = {
  padding: "20px 24px",
};

const detailRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid #f3f4f6",
};

const featuresSectionStyle = {
  padding: "20px 24px",
  background: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
};

const featuresTitleStyle = {
  margin: "0 0 12px 0",
  color: "#1e3a8a",
  fontSize: "16px",
};

const featuresListStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const featureItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "6px 0",
  fontSize: "14px",
  color: "#444",
};

const checkIconStyle = {
  color: "#16a34a",
  fontWeight: "bold",
};

const actionsStyle = {
  padding: "20px 24px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const primaryBtnStyle = {
  flex: 1,
  minWidth: "150px",
  background: "#1e3a8a",
  color: "white",
  padding: "12px 20px",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "15px",
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "center",
};

const dangerBtnStyle = {
  flex: 1,
  minWidth: "150px",
  background: "white",
  color: "#dc2626",
  padding: "12px 20px",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "15px",
  border: "1px solid #dc2626",
};

export default SubscriptionDashboard;
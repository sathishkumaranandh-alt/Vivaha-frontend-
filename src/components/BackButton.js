import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function BackButton({ fallback = "/dashboard", label = "← Back" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // ============================================
    // 1. If we have a "from" state (passed by Profile links)
    //    → go to that exact page
    // ============================================
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }

    // ============================================
    // 2. Check if browser history has a previous
    //    page from the SAME origin (same website)
    //    → safe to go back
    // ============================================
    if (
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin)
    ) {
      navigate(-1);
      return;
    }

    // ============================================
    // 3. Otherwise, use fallback (safe route)
    //    Example: direct link open panna, aprom Back click
    // ============================================
    navigate(fallback);
  };

  return (
    <button
      onClick={handleBack}
      style={{
        background: "white",
        color: "#8B0A2E",
        border: "1.5px solid #8B0A2E",
        padding: "8px 16px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 2px 8px rgba(139,10,46,0.08)",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "16px",
      }}
    >
      {label}
    </button>
  );
}

export default BackButton;

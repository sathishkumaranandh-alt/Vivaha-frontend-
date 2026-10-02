import React from "react";
import { useNavigate } from "react-router-dom";

function BackButton({ fallback = "/dashboard", label = "← Back" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
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

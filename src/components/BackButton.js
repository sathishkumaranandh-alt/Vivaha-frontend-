import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function BackButton({ fallback = "/dashboard", label = "← Back" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // React Router stores the position in this site's history as "idx".
    // idx > 0 means the previous page is inside the app, so going back is safe.
    // (document.referrer is NOT reliable in a single-page app.)
    const idx = window.history.state && window.history.state.idx;
    const hasAppHistory =
      typeof idx === "number" ? idx > 0 : location.key !== "default";

    if (hasAppHistory) {
      navigate(-1);
      return;
    }

    // Opened directly (link / refresh): go to the page it came from, or fallback
    const from = location.state && location.state.from;
    navigate(typeof from === "string" ? from : fallback, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      style={{
        background: "rgba(255, 255, 255, 0.55)",
        color: "var(--vg-accent)",
        border: "1.5px solid var(--vg-accent)",
        padding: "0 16px",
        minHeight: "40px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 2px 8px rgba(var(--vg-accent-rgb), 0.12)",
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

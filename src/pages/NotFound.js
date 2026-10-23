import React from "react";
import { Link } from "react-router-dom";

const card = {
  textAlign: "center",
  maxWidth: 440,
  width: "100%",
  boxSizing: "border-box",
  padding: "40px 28px",
  background: "rgba(255, 255, 255, 0.45)",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  backdropFilter: "blur(14px) saturate(160%)",
  border: "1px solid rgba(255, 255, 255, 0.75)",
  borderRadius: 20,
  boxShadow: "0 8px 32px rgba(190, 24, 93, 0.12)",
};

const btn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 20px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  boxSizing: "border-box",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={card}>
        <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: "var(--vg-accent)" }}>404</div>
        <h1 style={{ margin: "12px 0 8px", fontSize: 22, color: "var(--vg-text)" }}>Page not found</h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.6, color: "var(--vg-muted)" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" style={{ ...btn, background: "var(--vg-brand)", color: "var(--vg-on-brand)" }}>
            Go Home
          </Link>
          <Link
            to="/dashboard"
            style={{ ...btn, background: "rgba(255,255,255,0.55)", color: "var(--vg-accent)", border: "1.5px solid var(--vg-accent)" }}
          >
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

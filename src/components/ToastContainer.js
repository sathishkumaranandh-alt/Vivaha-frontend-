import React, { useState, useEffect } from "react";
import { subscribe } from "../utils/toast";

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    });
    return unsubscribe;
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div style={containerStyle}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          style={{ ...toastStyle, ...stylesFor(t.type) }}
        >
          <span style={iconStyle}>{iconFor(t.type)}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <span style={closeStyle}>✕</span>
        </div>
      ))}
    </div>
  );
}

function iconFor(type) {
  if (type === "success") return "✅";
  if (type === "error") return "❌";
  if (type === "warning") return "⚠️";
  return "ℹ️";
}

function stylesFor(type) {
  const colors = {
    success: { background: "#dcfce7", color: "#166534", borderLeft: "4px solid #16a34a" },
    error: { background: "#fee2e2", color: "#991b1b", borderLeft: "4px solid #dc2626" },
    warning: { background: "#fef3c7", color: "#92400e", borderLeft: "4px solid #f59e0b" },
    info: { background: "#dbeafe", color: "#1e40af", borderLeft: "4px solid #2563eb" },
  };
  return colors[type] || colors.info;
}

const containerStyle = {
  position: "fixed",
  top: "80px",
  right: "16px",
  left: "16px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  pointerEvents: "none",
  maxWidth: "400px",
  marginLeft: "auto",
};

const toastStyle = {
  padding: "14px 16px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  cursor: "pointer",
  pointerEvents: "auto",
  animation: "slideIn 0.3s ease-out",
  fontFamily: "inherit",
};

const iconStyle = {
  fontSize: "18px",
  flexShrink: 0,
};

const closeStyle = {
  fontSize: "14px",
  opacity: 0.5,
  flexShrink: 0,
};

export default ToastContainer;
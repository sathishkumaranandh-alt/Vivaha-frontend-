import React, { useState, useEffect } from "react";

function InstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    if (window.navigator.standalone) {
      setInstalled(true);
      return;
    }

    // Dismissed recently?
    const dismissed = localStorage.getItem("install-pill-dismissed");
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed, 10)) / 86400000;
      if (daysSince < 7) return;
    }

    // Only show on mobile
    const isMobile = window.innerWidth < 900;
    if (!isMobile) return;

    // iOS detection
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOSDevice) {
      setIsIOS(true);
      setTimeout(() => setShowPill(true), 3000);
      return;
    }

    // Android — capture install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPill(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setShowPill(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setExpanded(!expanded);
      return;
    }
    if (!deferredPrompt) {
      setExpanded(!expanded);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowPill(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPill(false);
    localStorage.setItem("install-pill-dismissed", Date.now().toString());
  };

  if (installed || !showPill) return null;

  return (
    <div style={wrapperStyle}>
      {/* Expanded tooltip / instructions */}
      {expanded && (
        <div style={tooltipStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <strong style={{ fontSize: "13px", color: "#8B0A2E" }}>
              📱 Install Vivaha
            </strong>
            <button onClick={() => setExpanded(false)} style={tooltipCloseStyle} aria-label="Close">
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#555", lineHeight: 1.5 }}>
            {isIOS
              ? "Tap the Share icon at the bottom of Safari, then choose 'Add to Home Screen'."
              : deferredPrompt
              ? "Tap the button below to add Vivaha to your home screen."
              : "Open your browser menu → 'Install app' or 'Add to Home Screen'."}
          </p>
        </div>
      )}

      {/* The floating pill */}
      <div style={pillContainerStyle}>
        <button onClick={handleDismiss} style={pillCloseStyle} aria-label="Dismiss">
          ✕
        </button>
        <button onClick={handleInstall} style={pillBtnStyle}>
          <span style={{ fontSize: "16px" }}>📱</span>
          <span>Install App</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const wrapperStyle = {
  position: "fixed",
  bottom: "20px",
  right: "16px",
  zIndex: 9998,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "10px",
  pointerEvents: "none",
};

const tooltipStyle = {
  background: "white",
  border: "1px solid #f0e0e0",
  borderRadius: "12px",
  padding: "12px 14px",
  maxWidth: "260px",
  boxShadow: "0 12px 32px rgba(139,10,46,0.2)",
  pointerEvents: "auto",
  animation: "slideUp 0.3s ease-out",
};

const tooltipCloseStyle = {
  background: "transparent",
  border: "none",
  color: "#8a6b6b",
  fontSize: "12px",
  cursor: "pointer",
  padding: 0,
  fontFamily: "inherit",
  lineHeight: 1,
};

const pillContainerStyle = {
  position: "relative",
  pointerEvents: "auto",
  animation: "slideUp 0.4s ease-out",
};

const pillBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "#D4A017",
  border: "none",
  padding: "12px 18px",
  borderRadius: "30px",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 8px 24px rgba(139,10,46,0.4)",
  letterSpacing: "0.3px",
};

const pillCloseStyle = {
  position: "absolute",
  top: "-6px",
  left: "-6px",
  background: "white",
  border: "1px solid #f0e0e0",
  color: "#8a6b6b",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  fontFamily: "inherit",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

export default InstallCard;
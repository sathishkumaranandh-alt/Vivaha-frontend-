import React, { useState, useEffect } from "react";

function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem("pwa-dismissed");
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / 86400000;
      if (daysSince < 7) {
        setDismissed(true);
        return;
      }
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOSDevice) {
      // Show iOS instructions if not already in standalone
      if (!window.navigator.standalone) {
        setIsIOS(true);
        setShowInstall(true);
      }
      return;
    }

    // Android/Chrome — catch beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also detect appinstalled event
    const installedHandler = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Can't auto-install on iOS — instructions already shown
      return;
    }
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    setDismissed(true);
    localStorage.setItem("pwa-dismissed", Date.now().toString());
  };

  if (!showInstall || dismissed) return null;

  return (
    <div style={bannerStyle}>
      <div style={contentStyle}>
        <div style={iconWrapStyle}>📱</div>
        <div style={textWrapStyle}>
          <div style={titleStyle}>Install Vivaha App</div>
          <div style={subtitleStyle}>
            {isIOS
              ? "Tap Share → Add to Home Screen"
              : "Add to home screen for quick access"}
          </div>
        </div>
      </div>

      <div style={actionsStyle}>
        {!isIOS && deferredPrompt && (
          <button onClick={handleInstallClick} style={installBtnStyle}>
            Install
          </button>
        )}
        {isIOS && (
          <button onClick={() => setShowInstall(false)} style={installBtnStyle}>
            Got it
          </button>
        )}
        <button onClick={handleDismiss} style={closeBtnStyle} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const bannerStyle = {
  position: "fixed",
  bottom: "20px",
  left: "16px",
  right: "16px",
  maxWidth: "440px",
  margin: "0 auto",
  background: "white",
  border: "1px solid #f0e0e0",
  borderRadius: "14px",
  padding: "14px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  boxShadow: "0 12px 32px rgba(139,10,46,0.2)",
  zIndex: 9999,
  animation: "slideUp 0.3s ease-out",
  flexWrap: "wrap",
};

const contentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flex: 1,
  minWidth: 0,
};

const iconWrapStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  flexShrink: 0,
};

const textWrapStyle = { flex: 1, minWidth: 0 };

const titleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#8B0A2E",
  marginBottom: "2px",
};

const subtitleStyle = {
  fontSize: "11px",
  color: "#8a6b6b",
  lineHeight: 1.4,
};

const actionsStyle = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
  flexShrink: 0,
};

const installBtnStyle = {
  background: "#8B0A2E",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#8a6b6b",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
};

export default InstallAppButton;
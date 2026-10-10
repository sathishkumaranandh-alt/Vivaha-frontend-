import React, { useState, useEffect } from "react";

const DISMISS_KEY = "vivaha_pwa_dismissed_at";
const DISMISS_DAYS = 7;

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const mobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    setIsIOS(iosDevice);
    setIsMobile(mobileDevice);

    // Already installed? Skip
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Dismissed recently? Skip
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSince =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // Android / Chrome — beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 6000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS — no event, manually show after delay
    if (iosDevice && mobileDevice) {
      setTimeout(() => setShow(true), 6000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert(
        "To install Vivaha app:\n\n1. Tap the Share button (⬆️)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add'"
      );
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShow(false);
  };

  if (!show || !isMobile) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "16px",
        right: "16px",
        zIndex: 99999,
        background: "linear-gradient(135deg, #8B0A2E, #6B0722)",
        color: "white",
        borderRadius: "20px",
        padding: "16px 18px",
        boxShadow: "0 20px 50px rgba(139,10,46,0.5)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        animation: "pwaSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <style>{`
        @keyframes pwaSlideUp {
          0% { transform: translateY(120%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pwaPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>

      {/* App Icon */}
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          animation: "pwaPulse 2s ease-in-out infinite",
        }}
      >
        💍
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            marginBottom: "2px",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Install Vivaha App
        </div>
        <div style={{ fontSize: "11px", opacity: 0.9, lineHeight: 1.4 }}>
          {isIOS
            ? "Tap Share → Add to Home Screen"
            : "Fast · Free · No Play Store"}
        </div>
      </div>

      {/* Install Button */}
      <button
        onClick={handleInstall}
        style={{
          background: "linear-gradient(135deg, #D4A017, #b8860b)",
          color: "#8B0A2E",
          border: "none",
          padding: "10px 16px",
          borderRadius: "10px",
          fontSize: "12px",
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(212,160,23,0.5)",
        }}
      >
        Install
      </button>

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        aria-label="Close"
        style={{
          background: "rgba(255,255,255,0.15)",
          color: "white",
          border: "none",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: "inherit",
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default PWAInstallPrompt;

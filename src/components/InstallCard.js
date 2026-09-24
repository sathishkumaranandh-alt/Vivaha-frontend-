import React, { useState, useEffect } from "react";

function InstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    if (window.navigator.standalone) {
      setInstalled(true);
      return;
    }

    // Check if dismissed
    const dismissed = localStorage.getItem("install-card-dismissed");
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed, 10)) / 86400000;
      if (daysSince < 7) return;
    }

    // iOS detection
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOSDevice) {
      setIsIOS(true);
      setShowCard(true);
      return;
    }

    // Android/Chrome — wait for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowCard(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setShowCard(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    // Fallback — show card on mobile even without prompt
    const isMobile = window.innerWidth < 900;
    if (isMobile) {
      setTimeout(() => setShowCard(true), 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // Can't auto-install on iOS — instructions shown
      return;
    }
    if (!deferredPrompt) {
      // No prompt available — show manual instructions
      alert(
        "To install Vivaha:\n\n1. Tap the ⋮ menu in Chrome\n2. Tap 'Install app' or 'Add to Home Screen'\n3. Confirm"
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowCard(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowCard(false);
    localStorage.setItem("install-card-dismissed", Date.now().toString());
  };

  if (installed || !showCard) return null;

  return (
    <section style={sectionStyle}>
      <div style={cardStyle}>
        {/* Left: Icon + Text */}
        <div style={leftStyle}>
          <div style={iconCircleStyle}>
            <span style={{ fontSize: "38px" }}>📱</span>
          </div>
          <div>
            <div style={badgeStyle}>✨ New</div>
            <h3 style={titleStyle}>
              Install Vivaha App on Your Phone
            </h3>
            <p style={subtitleStyle}>
              {isIOS
                ? "Tap the Share icon below → Add to Home Screen. Get quick access with full-screen experience."
                : "Get the full app experience — home screen icon, faster loading, and push notifications."}
            </p>

            <div style={featuresStyle}>
              <span style={featureChipStyle}>⚡ Faster</span>
              <span style={featureChipStyle}>🔔 Notifications</span>
              <span style={featureChipStyle}>📲 Full Screen</span>
            </div>
          </div>
        </div>

        {/* Right: Buttons */}
        <div style={rightStyle}>
          <button onClick={handleInstall} style={installBtnStyle}>
            📥 {isIOS ? "How to Install" : "Install Now"}
          </button>
          <button onClick={handleDismiss} style={dismissBtnStyle}>
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STYLES
// ============================================================
const sectionStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "40px 16px",
};

const cardStyle = {
  background: "linear-gradient(135deg, #8B0A2E 0%, #6B0722 100%)",
  borderRadius: "20px",
  padding: "32px 28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  flexWrap: "wrap",
  boxShadow: "0 20px 60px rgba(139,10,46,0.25)",
  position: "relative",
  overflow: "hidden",
  color: "white",
};

const leftStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "20px",
  flex: 1,
  minWidth: "260px",
};

const iconCircleStyle = {
  width: "72px",
  height: "72px",
  borderRadius: "20px",
  background: "rgba(212, 160, 23, 0.2)",
  border: "2px solid rgba(212, 160, 23, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const badgeStyle = {
  display: "inline-block",
  background: "#D4A017",
  color: "#8B0A2E",
  fontSize: "10px",
  fontWeight: 800,
  padding: "3px 10px",
  borderRadius: "10px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  marginBottom: "10px",
};

const titleStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 8px 0",
  color: "white",
  letterSpacing: "-0.3px",
};

const subtitleStyle = {
  fontSize: "14px",
  lineHeight: 1.6,
  margin: "0 0 14px 0",
  opacity: 0.9,
  color: "white",
};

const featuresStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const featureChipStyle = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(212, 160, 23, 0.3)",
  color: "#D4A017",
  fontSize: "11px",
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: "20px",
};

const rightStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: "180px",
};

const installBtnStyle = {
  background: "linear-gradient(135deg, #D4A017, #b8860b)",
  color: "#8B0A2E",
  border: "none",
  padding: "14px 24px",
  borderRadius: "10px",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 6px 20px rgba(212,160,23,0.4)",
  whiteSpace: "nowrap",
};

const dismissBtnStyle = {
  background: "transparent",
  color: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  padding: "10px 20px",
  borderRadius: "10px",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default InstallCard;
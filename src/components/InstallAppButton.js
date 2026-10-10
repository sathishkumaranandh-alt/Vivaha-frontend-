import React, { useState, useEffect } from "react";

function InstallAppButton({ variant = "card" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iosDevice);

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Listen for install prompt (Android)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect install completion
    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    // Android — trigger native prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }

    // iOS — show manual instructions
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Fallback — generic instructions
    alert(
      "To install Vivaha:\n\n1. Open this site in Chrome (Android) or Safari (iOS)\n2. Tap browser menu (⋮ or Share)\n3. Select 'Install app' or 'Add to Home Screen'"
    );
  };

  // Hide if already installed
  if (isInstalled) return null;

  return (
    <>
      {/* ============================================ */}
      {/* CARD VARIANT — for Dashboard */}
      {/* ============================================ */}
      {variant === "card" && (
        <div
          style={{
            background:
              "linear-gradient(135deg, #8B0A2E 0%, #6B0722 50%, #8B0A2E 100%)",
            borderRadius: "18px",
            padding: "20px",
            color: "white",
            boxShadow: "0 12px 32px rgba(139,10,46,0.35)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative glow */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(212,160,23,0.4), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* App Icon */}
          <div
            style={{
              width: "62px",
              height: "62px",
              borderRadius: "16px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              flexShrink: 0,
              boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              animation: "installPulse 2s ease-in-out infinite",
              position: "relative",
              zIndex: 2,
            }}
          >
            💍
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: "180px", position: "relative", zIndex: 2 }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                marginBottom: "4px",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              📱 Install Vivaha App
            </div>
            <div
              style={{
                fontSize: "12px",
                opacity: 0.9,
                lineHeight: 1.5,
              }}
            >
              {isIOS
                ? "Tap Share → Add to Home Screen"
                : "Fast · Free · Works offline"}
            </div>
          </div>

          {/* Install Button */}
          <button
            onClick={handleInstall}
            style={{
              background: "linear-gradient(135deg, #D4A017, #b8860b)",
              color: "#8B0A2E",
              border: "none",
              padding: "12px 22px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              boxShadow: "0 6px 18px rgba(212,160,23,0.5)",
              transition: "transform 0.2s",
              position: "relative",
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
            }}
          >
            ⬇️ Install
          </button>

          <style>{`
            @keyframes installPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.08); }
            }
          `}</style>
        </div>
      )}

      {/* ============================================ */}
      {/* INLINE VARIANT — for Navbar / Small spaces */}
      {/* ============================================ */}
      {variant === "inline" && (
        <button
          onClick={handleInstall}
          style={{
            background: "linear-gradient(135deg, #8B0A2E, #a01438)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
          }}
        >
          📱 Install App
        </button>
      )}

      {/* ============================================ */}
      {/* iOS INSTRUCTIONS MODAL */}
      {/* ============================================ */}
      {showIOSModal && (
        <div
          onClick={() => setShowIOSModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "380px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                background: "#8B0A2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                margin: "0 auto 14px",
              }}
            >
              💍
            </div>
            <h3
              style={{
                color: "#8B0A2E",
                fontFamily: "'Playfair Display', serif",
                fontSize: "18px",
                marginBottom: "6px",
                marginTop: 0,
              }}
            >
              Install Vivaha on iPhone
            </h3>
            <p
              style={{
                color: "#666",
                fontSize: "13px",
                marginBottom: "20px",
                lineHeight: 1.5,
              }}
            >
              Add Vivaha to your home screen for the app experience
            </p>

            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              {[
                { n: 1, text: "Tap the Share button at the bottom", icon: "⬆️" },
                { n: 2, text: "Scroll down and tap 'Add to Home Screen'", icon: "➕" },
                { n: 3, text: "Tap 'Add' at the top right", icon: "✓" },
              ].map((step) => (
                <div
                  key={step.n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 0",
                    borderBottom: step.n < 3 ? "1px solid #f0e0e0" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: "#FDF2F6",
                      color: "#8B0A2E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {step.n}
                  </div>
                  <div style={{ fontSize: "13px", color: "#333", lineHeight: 1.4 }}>
                    {step.text} <span style={{ fontSize: "16px" }}>{step.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #8B0A2E, #a01438)",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallAppButton;

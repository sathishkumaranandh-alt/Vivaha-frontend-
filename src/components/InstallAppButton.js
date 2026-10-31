import React, { useState, useEffect } from "react";

import { useBrand } from "../utils/brand";
function InstallAppButton({ variant = "card" }) {
  const brand = useBrand();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iosDevice);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

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
    // Android — native prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }

    // iOS — show detailed modal
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Fallback
    alert(
      "To install " + brand.short + ":\n\n1. Open in Chrome (Android) or Safari (iOS)\n2. Tap browser menu (⋮ or Share ⬆️)\n3. Select 'Install app' or 'Add to Home Screen'"
    );
  };

  if (isInstalled) return null;

  return (
    <>
      {/* CARD VARIANT */}
      {variant === "card" && (
        <div
          style={{
            background: "linear-gradient(135deg, #8B0A2E 0%, #6B0722 50%, #8B0A2E 100%)",
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
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,160,23,0.4), transparent 70%)",
              pointerEvents: "none",
            }}
          />
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
          <div style={{ flex: 1, minWidth: "180px", position: "relative", zIndex: 2 }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                marginBottom: "4px",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              📱 Install {brand.short} App
            </div>
            <div style={{ fontSize: "12px", opacity: 0.9, lineHeight: 1.5 }}>
              {isIOS ? "Tap Share → Add to Home Screen" : "Fast · Free · Works offline"}
            </div>
          </div>
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

      {/* INLINE VARIANT */}
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
      {/* iOS DETAILED INSTRUCTIONS MODAL */}
      {/* ============================================ */}
      {showIOSModal && (
        <div
          onClick={() => setShowIOSModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px 24px 24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              textAlign: "center",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #8B0A2E, #6B0722)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "38px",
                margin: "0 auto 16px",
                boxShadow: "0 10px 24px rgba(139,10,46,0.35)",
              }}
            >
              💍
            </div>

            <h3
              style={{
                color: "#8B0A2E",
                fontFamily: "'Playfair Display', serif",
                fontSize: "22px",
                marginBottom: "6px",
                marginTop: 0,
                fontWeight: 800,
              }}
            >
              Install {brand.short} on iPhone
            </h3>
            <p
              style={{
                color: "#666",
                fontSize: "13px",
                marginBottom: "24px",
                lineHeight: 1.5,
              }}
            >
              iOS la automatic prompt illa. Apple allow pannala.
              <br />
              Follow these 3 simple steps:
            </p>

            {/* Steps */}
            <div style={{ textAlign: "left", marginBottom: "24px" }}>
              {/* Step 1 */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "14px",
                  background: "#FDF2F6",
                  borderRadius: "14px",
                  marginBottom: "10px",
                  border: "1.5px solid #f0d0da",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#8B0A2E",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#8B0A2E", marginBottom: "4px" }}>
                    Tap the Share button
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                    Safari bottom la{" "}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "22px",
                        height: "22px",
                        background: "#007AFF",
                        color: "white",
                        borderRadius: "6px",
                        fontSize: "13px",
                        verticalAlign: "middle",
                        margin: "0 2px",
                      }}
                    >
                      ⬆
                    </span>{" "}
                    icon click pannunga
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "14px",
                  background: "#FDF2F6",
                  borderRadius: "14px",
                  marginBottom: "10px",
                  border: "1.5px solid #f0d0da",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#8B0A2E",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#8B0A2E", marginBottom: "4px" }}>
                    Scroll & tap "Add to Home Screen"
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                    Menu la keezha scroll pannunga,{" "}
                    <strong style={{ color: "#8B0A2E" }}>Add to Home Screen</strong> nu option irukkum
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "14px",
                  background: "#FDF2F6",
                  borderRadius: "14px",
                  border: "1.5px solid #f0d0da",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#8B0A2E",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#8B0A2E", marginBottom: "4px" }}>
                    Tap "Add"
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                    Top-right corner la{" "}
                    <strong style={{ color: "#8B0A2E" }}>Add</strong> button click pannunga
                  </div>
                </div>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #8B0A2E, #a01438)",
                color: "white",
                border: "none",
                padding: "14px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 6px 18px rgba(139,10,46,0.4)",
              }}
            >
              Got it! ✓
            </button>

            <p
              style={{
                marginTop: "14px",
                marginBottom: 0,
                fontSize: "11px",
                color: "#999",
                lineHeight: 1.4,
              }}
            >
              💡 Safari la mattum idhu work aagum. Chrome iOS la illa.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallAppButton;
              

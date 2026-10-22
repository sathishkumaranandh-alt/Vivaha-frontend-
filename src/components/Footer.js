import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const DEFAULT_SETTINGS = {
  site_name: "Vivaha Matrimony",
  contact_email: "support@vivahamatrimony.com",
  contact_phone: "+91 90000 00000",
  support_hours: "Mon-Sat: 9 AM - 6 PM",
  contact_address: "Chennai, Tamil Nadu, India",
  global_footer_bg: "#1a0510",
};

function Footer() {
  const year = new Date().getFullYear();
  const isHomePage = window.location.pathname === "/";
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch(`${BACKEND_URL}/settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
        }
      })
      .catch(() => {});
  }, []);

  const handleComingSoon = (e) => {
    e.preventDefault();
  };

  return (
    <>
      {/* ===== STRIP ABOVE FOOTER ===== */}
      <div style={isHomePage ? { ...stripStyle, background: "rgba(255, 228, 238, 0.72)", borderTop: "1px solid rgba(244,114,182,0.25)", borderBottom: "1px solid rgba(255,255,255,0.8)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" } : stripStyle}>
        <div style={stripInnerStyle}>
          <span style={isHomePage ? { ...stripItemStyle, color: "#9D174D" } : stripItemStyle}>Traditional Values</span>
          <span style={isHomePage ? { ...stripDividerStyle, color: "rgba(190,24,93,0.35)" } : stripDividerStyle}>|</span>
          <span style={isHomePage ? { ...stripItemStyle, color: "#9D174D" } : stripItemStyle}>Modern Matching</span>
          <span style={isHomePage ? { ...stripDividerStyle, color: "rgba(190,24,93,0.35)" } : stripDividerStyle}>|</span>
          <span style={isHomePage ? { ...stripItemStyle, color: "#9D174D" } : stripItemStyle}>A Better Tomorrow</span>
        </div>
      </div>

      {/* ===== MAIN FOOTER ===== */}
      <footer className={isHomePage ? "vivaha-home-glass-footer" : undefined} style={isHomePage ? { ...footerStyle, background: "linear-gradient(135deg, rgba(255,241,246,0.86), rgba(255,255,255,0.76))", color: "#5B1734", borderTop: "1px solid rgba(255,255,255,0.9)", backdropFilter: "blur(24px) saturate(155%)", WebkitBackdropFilter: "blur(24px) saturate(155%)", boxShadow: "0 -14px 44px rgba(190,24,93,0.08)" } : { ...footerStyle, background: settings.global_footer_bg || "#1a0510" }}>
        <div style={footerInnerStyle}>
          <div style={columnsStyle}>
            {/* BRAND */}
            <div>
              <div style={brandRowStyle}>
                <div style={isHomePage ? { ...brandCircleStyle, background: "linear-gradient(135deg, #E91663, #F472B6)", color: "white" } : brandCircleStyle}>♥</div>
                <div>
                  <div style={isHomePage ? { ...brandNameStyle, color: "#831843" } : brandNameStyle}>{settings.site_name}</div>
                  <div style={isHomePage ? { ...brandTagStyle, color: "#BE185D" } : brandTagStyle}>FIND YOUR SOULMATE</div>
                </div>
              </div>
              <p style={isHomePage ? { ...brandDescStyle, color: "#795064" } : brandDescStyle}>
                India's most trusted matrimony platform for finding meaningful,
                lifelong relationships within your community.
              </p>

              <div style={miniBadgesStyle}>
                <span style={isHomePage ? { ...miniBadgeStyle, background: "rgba(244,114,182,0.12)", border: "1px solid rgba(190,24,93,0.2)", color: "#9D174D" } : miniBadgeStyle}>🔒 100% Secure</span>
                <span style={isHomePage ? { ...miniBadgeStyle, background: "rgba(244,114,182,0.12)", border: "1px solid rgba(190,24,93,0.2)", color: "#9D174D" } : miniBadgeStyle}>✅ Verified Profiles</span>
              </div>

              <div style={socialRowStyle}>
                <button style={isHomePage ? { ...socialBtnStyle, background: "rgba(244,114,182,0.12)", border: "1px solid rgba(190,24,93,0.18)", color: "#9D174D" } : socialBtnStyle} aria-label="Facebook" onClick={handleComingSoon} type="button">f</button>
                <button style={isHomePage ? { ...socialBtnStyle, background: "rgba(244,114,182,0.12)", border: "1px solid rgba(190,24,93,0.18)", color: "#9D174D" } : socialBtnStyle} aria-label="Instagram" onClick={handleComingSoon} type="button">📷</button>
                <button style={isHomePage ? { ...socialBtnStyle, background: "rgba(244,114,182,0.12)", border: "1px solid rgba(190,24,93,0.18)", color: "#9D174D" } : socialBtnStyle} aria-label="YouTube" onClick={handleComingSoon} type="button">▶</button>
                <button style={isHomePage ? { ...socialBtnStyle, background: "rgba(244,114,182,0.12)", border: "1px solid rgba(190,24,93,0.18)", color: "#9D174D" } : socialBtnStyle} aria-label="WhatsApp" onClick={handleComingSoon} type="button">💬</button>
              </div>
            </div>

            {/* DISCOVER */}
            <div>
              <h4 style={isHomePage ? { ...colTitleStyle, color: "#BE185D" } : colTitleStyle}>Discover</h4>
              <Link to="/search" style={isHomePage ? { ...colLinkStyle, color: "#795064" } : colLinkStyle}>Browse Profiles</Link>
              <Link to="/search" style={isHomePage ? { ...colLinkStyle, color: "#795064" } : colLinkStyle}>Search</Link>
              <Link to="/matches" style={isHomePage ? { ...colLinkStyle, color: "#795064" } : colLinkStyle}>Matches</Link>
              <Link to="/interests" style={isHomePage ? { ...colLinkStyle, color: "#795064" } : colLinkStyle}>Interests</Link>
              <Link to="/register" style={isHomePage ? { ...colLinkStyle, color: "#795064" } : colLinkStyle}>Register Free</Link>
            </div>

            {/* COMPANY */}
            <div>
              <h4 style={isHomePage ? { ...colTitleStyle, color: "#BE185D" } : colTitleStyle}>Company</h4>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>About Us</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Contact Us</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Careers</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Blog</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Help Center</button>
            </div>

            {/* LEGAL */}
            <div>
              <h4 style={isHomePage ? { ...colTitleStyle, color: "#BE185D" } : colTitleStyle}>Legal</h4>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Terms of Service</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Privacy Policy</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Cookie Policy</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Refund Policy</button>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...colButtonStyle, color: "#795064" } : colButtonStyle}>Report Abuse</button>
            </div>

            {/* CONTACT */}
            <div>
              <h4 style={isHomePage ? { ...colTitleStyle, color: "#BE185D" } : colTitleStyle}>Get in Touch</h4>
              <p style={isHomePage ? { ...contactLineStyle, color: "#795064" } : contactLineStyle}>
                <span style={contactIconStyle}>📧</span>
                {settings.contact_email}
              </p>
              <p style={isHomePage ? { ...contactLineStyle, color: "#795064" } : contactLineStyle}>
                <span style={contactIconStyle}>📞</span>
                {settings.contact_phone}
              </p>
              <p style={isHomePage ? { ...contactLineStyle, color: "#795064" } : contactLineStyle}>
                <span style={contactIconStyle}>📍</span>
                {settings.contact_address}
              </p>
              <p style={{ ...contactLineStyle, marginTop: "12px", fontSize: "11px", color: isHomePage ? "#9D7186" : "rgba(255,255,255,0.5)" }}>
                <span style={contactIconStyle}>🕐</span>
                {settings.support_hours}
              </p>
            </div>
          </div>

          {/* BOTTOM STRIP */}
          <div style={isHomePage ? { ...bottomStripStyle, borderTop: "1px solid rgba(190,24,93,0.14)" } : bottomStripStyle}>
            <p style={isHomePage ? { ...copyrightStyle, color: "#9D7186" } : copyrightStyle}>
              © {year} {settings.site_name}. All rights reserved. Made with{" "}
              <span style={{ color: isHomePage ? "#E91663" : "#D4A017" }}>❤</span> for finding lifelong partners.
            </p>
            <div style={bottomLinksStyle}>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...bottomLinkBtnStyle, color: "#9D7186" } : bottomLinkBtnStyle}>Terms</button>
              <span style={bottomDividerStyle}>•</span>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...bottomLinkBtnStyle, color: "#9D7186" } : bottomLinkBtnStyle}>Privacy</button>
              <span style={bottomDividerStyle}>•</span>
              <button type="button" onClick={handleComingSoon} style={isHomePage ? { ...bottomLinkBtnStyle, color: "#9D7186" } : bottomLinkBtnStyle}>Sitemap</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

const stripStyle = { background: "linear-gradient(135deg, #8B0A2E 0%, #6B0722 100%)", padding: "16px 24px", textAlign: "center", borderTop: "1px solid rgba(212, 160, 23, 0.2)", width: "100%", boxSizing: "border-box" };
const stripInnerStyle = { maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap" };
const stripItemStyle = { fontFamily: "'Playfair Display', serif", fontSize: "14px", color: "#D4A017", fontWeight: 700, letterSpacing: "0.5px", fontStyle: "italic" };
const stripDividerStyle = { color: "rgba(212, 160, 23, 0.4)", fontSize: "14px" };
const footerStyle = { background: "#1a0510", color: "white", padding: "60px 24px 24px", width: "100%", boxSizing: "border-box" };
const footerInnerStyle = { maxWidth: "1200px", margin: "0 auto", width: "100%" };
const columnsStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "40px", marginBottom: "48px" };
const brandRowStyle = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" };
const brandCircleStyle = { width: "40px", height: "40px", borderRadius: "50%", background: "#8B0A2E", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4A017", fontSize: "18px", fontWeight: "bold", flexShrink: 0 };
const brandNameStyle = { fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 900, color: "white", letterSpacing: "-0.3px", lineHeight: 1.1 };
const brandTagStyle = { fontSize: "8px", color: "#D4A017", fontWeight: 700, letterSpacing: "2px", marginTop: "2px" };
const brandDescStyle = { color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.7, margin: "0 0 16px 0", maxWidth: "320px" };
const miniBadgesStyle = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" };
const miniBadgeStyle = { background: "rgba(212, 160, 23, 0.1)", border: "1px solid rgba(212, 160, 23, 0.3)", color: "#D4A017", fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" };
const socialRowStyle = { display: "flex", gap: "10px" };
const socialBtnStyle = { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" };
const colTitleStyle = { color: "#D4A017", fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 18px 0" };
const colLinkStyle = { display: "block", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "13px", marginBottom: "10px" };
const colButtonStyle = { display: "block", background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "10px", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" };
const contactLineStyle = { display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.65)", fontSize: "12px", margin: "0 0 10px 0", lineHeight: 1.5 };
const contactIconStyle = { fontSize: "14px", flexShrink: 0 };
const bottomStripStyle = { borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" };
const copyrightStyle = { color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0, letterSpacing: "0.3px" };
const bottomLinksStyle = { display: "flex", alignItems: "center", gap: "10px" };
const bottomLinkBtnStyle = { background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", padding: 0 };
const bottomDividerStyle = { color: "rgba(255,255,255,0.2)", fontSize: "10px" };

export default Footer;
         

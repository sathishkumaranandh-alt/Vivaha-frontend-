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
      <div style={stripStyle}>
        <div style={stripInnerStyle}>
          <span style={stripItemStyle}>Traditional Values</span>
          <span style={stripDividerStyle}>|</span>
          <span style={stripItemStyle}>Modern Matching</span>
          <span style={stripDividerStyle}>|</span>
          <span style={stripItemStyle}>A Better Tomorrow</span>
        </div>
      </div>

      {/* ===== MAIN FOOTER ===== */}
      <footer style={footerStyle}>
        <div style={footerInnerStyle}>
          <div style={columnsStyle}>
            {/* BRAND */}
            <div style={{ gridColumn: "span 2" }}>
              <div style={brandRowStyle}>
                <div style={brandCircleStyle}>♥</div>
                <div>
                  <div style={brandNameStyle}>{settings.site_name}</div>
                  <div style={brandTagStyle}>FIND YOUR SOULMATE</div>
                </div>
              </div>
              <p style={brandDescStyle}>
                India's most trusted matrimony platform for finding meaningful,
                lifelong relationships within your community.
              </p>

              <div style={miniBadgesStyle}>
                <span style={miniBadgeStyle}>🔒 100% Secure</span>
                <span style={miniBadgeStyle}>✅ Verified Profiles</span>
              </div>

              <div style={socialRowStyle}>
                <button style={socialBtnStyle} aria-label="Facebook" onClick={handleComingSoon} type="button">f</button>
                <button style={socialBtnStyle} aria-label="Instagram" onClick={handleComingSoon} type="button">📷</button>
                <button style={socialBtnStyle} aria-label="YouTube" onClick={handleComingSoon} type="button">▶</button>
                <button style={socialBtnStyle} aria-label="WhatsApp" onClick={handleComingSoon} type="button">💬</button>
              </div>
            </div>

            {/* DISCOVER */}
            <div>
              <h4 style={colTitleStyle}>Discover</h4>
              <Link to="/search" style={colLinkStyle}>Browse Profiles</Link>
              <Link to="/search" style={colLinkStyle}>Search</Link>
              <Link to="/matches" style={colLinkStyle}>Matches</Link>
              <Link to="/interests" style={colLinkStyle}>Interests</Link>
              <Link to="/register" style={colLinkStyle}>Register Free</Link>
            </div>

            {/* COMPANY */}
            <div>
              <h4 style={colTitleStyle}>Company</h4>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>About Us</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Contact Us</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Careers</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Blog</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Help Center</button>
            </div>

            {/* LEGAL */}
            <div>
              <h4 style={colTitleStyle}>Legal</h4>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Terms of Service</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Privacy Policy</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Cookie Policy</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Refund Policy</button>
              <button type="button" onClick={handleComingSoon} style={colButtonStyle}>Report Abuse</button>
            </div>

            {/* CONTACT */}
            <div>
              <h4 style={colTitleStyle}>Get in Touch</h4>
              <p style={contactLineStyle}>
                <span style={contactIconStyle}>📧</span>
                {settings.contact_email}
              </p>
              <p style={contactLineStyle}>
                <span style={contactIconStyle}>📞</span>
                {settings.contact_phone}
              </p>
              <p style={contactLineStyle}>
                <span style={contactIconStyle}>📍</span>
                {settings.contact_address}
              </p>
              <p style={{ ...contactLineStyle, marginTop: "12px", fontSize: "11px", color: "#8a6b6b" }}>
                <span style={contactIconStyle}>🕐</span>
                {settings.support_hours}
              </p>
            </div>
          </div>

          {/* BOTTOM STRIP */}
          <div style={bottomStripStyle}>
            <p style={copyrightStyle}>
              © {year} {settings.site_name}. All rights reserved. Made with{" "}
              <span style={{ color: "#D4A017" }}>❤</span> for finding lifelong partners.
            </p>
            <div style={bottomLinksStyle}>
              <button type="button" onClick={handleComingSoon} style={bottomLinkBtnStyle}>Terms</button>
              <span style={bottomDividerStyle}>•</span>
              <button type="button" onClick={handleComingSoon} style={bottomLinkBtnStyle}>Privacy</button>
              <span style={bottomDividerStyle}>•</span>
              <button type="button" onClick={handleComingSoon} style={bottomLinkBtnStyle}>Sitemap</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

const stripStyle = { background: "rgba(255,255,255,0.4)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", padding: "8px 16px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.7)", width: "100%", boxSizing: "border-box" };
const stripInnerStyle = { maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap" };
const stripItemStyle = { fontFamily: "'Playfair Display', serif", fontSize: "12px", color: "#8B0A2E", fontWeight: 700, letterSpacing: "0.3px", fontStyle: "italic" };
const stripDividerStyle = { color: "rgba(139, 10, 46, 0.35)", fontSize: "12px" };
const footerStyle = { background: "rgba(255,255,255,0.35)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid rgba(255,255,255,0.7)", color: "#2D1B1B", padding: "20px 16px 10px", width: "100%", boxSizing: "border-box" };
const footerInnerStyle = { maxWidth: "1200px", margin: "0 auto", width: "100%" };
const columnsStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px 20px", marginBottom: "14px" };
const brandRowStyle = { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" };
const brandCircleStyle = { width: "32px", height: "32px", borderRadius: "50%", background: "#8B0A2E", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4A017", fontSize: "15px", fontWeight: "bold", flexShrink: 0 };
const brandNameStyle = { fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 900, color: "#8B0A2E", letterSpacing: "-0.3px", lineHeight: 1.1 };
const brandTagStyle = { fontSize: "8px", color: "#b8860b", fontWeight: 700, letterSpacing: "2px", marginTop: "2px" };
const brandDescStyle = { color: "#6f5560", fontSize: "12px", lineHeight: 1.5, margin: "0 0 8px 0", maxWidth: "320px" };
const miniBadgesStyle = { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" };
const miniBadgeStyle = { background: "rgba(212, 160, 23, 0.15)", border: "1px solid rgba(212, 160, 23, 0.4)", color: "#92400e", fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px" };
const socialRowStyle = { display: "flex", gap: "8px" };
const socialBtnStyle = { width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.9)", color: "#8B0A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" };
const colTitleStyle = { color: "#a16207", fontSize: "10px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" };
const colLinkStyle = { display: "block", color: "#5c3a42", textDecoration: "none", fontSize: "12px", marginBottom: "5px" };
const colButtonStyle = { display: "block", background: "transparent", border: "none", color: "#5c3a42", fontSize: "12px", marginBottom: "5px", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" };
const contactLineStyle = { display: "flex", alignItems: "center", gap: "6px", color: "#5c3a42", fontSize: "12px", margin: "0 0 5px 0", lineHeight: 1.4 };
const contactIconStyle = { fontSize: "13px", flexShrink: 0 };
const bottomStripStyle = { borderTop: "1px solid rgba(139,10,46,0.12)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" };
const copyrightStyle = { color: "#8a6b6b", fontSize: "11px", margin: 0, letterSpacing: "0.2px" };
const bottomLinksStyle = { display: "flex", alignItems: "center", gap: "10px" };
const bottomLinkBtnStyle = { background: "transparent", border: "none", color: "#8a6b6b", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", padding: 0 };
const bottomDividerStyle = { color: "rgba(139,10,46,0.3)", fontSize: "10px" };

export default Footer;

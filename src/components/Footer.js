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
            <div>
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
              <p style={{ ...contactLineStyle, marginTop: "12px", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
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

const stripStyle = { background: "linear-gradient(135deg, #8B0A2E 0%, #6B0722 100%)", padding: "16px 24px", textAlign: "center", borderTop: "1px solid rgba(212, 160, 23, 0.2)" };
const stripInnerStyle = { maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap" };
const stripItemStyle = { fontFamily: "'Playfair Display', serif", fontSize: "14px", color: "#D4A017", fontWeight: 700, letterSpacing: "0.5px", fontStyle: "italic" };
const stripDividerStyle = { color: "rgba(212, 160, 23, 0.4)", fontSize: "14px" };
const footerStyle = { background: "#1a0510", color: "white", padding: "60px 24px 24px" };
const footerInnerStyle = { maxWidth: "1200px", margin: "0 auto" };
const columnsStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px", marginBottom: "48px" };
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

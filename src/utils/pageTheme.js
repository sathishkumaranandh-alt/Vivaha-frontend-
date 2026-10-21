const DEFAULT_THEMES = {
  home: { bg: "#FFF9F5", heading: "#8B0A2E", body: "#2D1B1B", muted: "#8a6b6b", link: "#8B0A2E", baseSize: 14, headingSize: 26, cardBg: "#ffffff", cardBorder: "#f0e0e0", cardRadius: 14, cardShadow: 40 },
  search: { bg: "#FFF9F5", heading: "#8B0A2E", body: "#2D1B1B", muted: "#8a6b6b", link: "#8B0A2E", baseSize: 14, headingSize: 26, cardBg: "#ffffff", cardBorder: "#f0e0e0", cardRadius: 14, cardShadow: 40 },
  dashboard: { bg: "#FFF9F5", heading: "#8B0A2E", body: "#2D1B1B", muted: "#8a6b6b", link: "#8B0A2E", baseSize: 14, headingSize: 26, cardBg: "#ffffff", cardBorder: "#f0e0e0", cardRadius: 14, cardShadow: 40 },
  profile: { bg: "#FFF9F5", heading: "#8B0A2E", body: "#2D1B1B", muted: "#8a6b6b", link: "#8B0A2E", baseSize: 14, headingSize: 26, cardBg: "#ffffff", cardBorder: "#f0e0e0", cardRadius: 14, cardShadow: 40 },
};

// 🛡️ Helper: Convert Hex color to RGBA for transparency
const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  // If it's already rgb or rgba, just return a safe fallback
  if (hex.includes('rgb')) return `rgba(255, 255, 255, ${alpha})`; 
  
  let c = hex.substring(1);      
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r || 255}, ${g || 255}, ${b || 255}, ${alpha})`;
};

export function getPageTheme(pageKey = "home") {
  const defaultTheme = DEFAULT_THEMES[pageKey] || DEFAULT_THEMES.home;
  
  try {
    const raw = localStorage.getItem("vivaha_home_settings_v1");
    const settings = raw ? JSON.parse(raw) : {};

    // Read base theme settings
    const bg = settings[`page_${pageKey}_bg`] || settings.global_page_bg || defaultTheme.bg;
    const heading = settings[`page_${pageKey}_heading_color`] || defaultTheme.heading;
    const body = settings[`page_${pageKey}_body_color`] || defaultTheme.body;
    const muted = settings[`page_${pageKey}_muted_color`] || defaultTheme.muted;
    const link = settings[`page_${pageKey}_link_color`] || defaultTheme.link;
    
    const baseSize = parseInt(settings[`page_${pageKey}_base_size`] || defaultTheme.baseSize);
    const headingSize = parseInt(settings[`page_${pageKey}_heading_size`] || defaultTheme.headingSize);

    const cardBg = settings[`page_${pageKey}_card_bg`] || defaultTheme.cardBg;
    const cardBorder = settings[`page_${pageKey}_card_border`] || defaultTheme.cardBorder;
    const cardRadius = parseInt(settings[`page_${pageKey}_card_radius`] || defaultTheme.cardRadius);
    const cardShadow = parseInt(settings[`page_${pageKey}_card_shadow`] || defaultTheme.cardShadow);

    // 🛡️ GLASS EFFECT SETTINGS (Dynamic)
    const isGlassEnabled = settings[`page_${pageKey}_glass_enabled`] === "true";
    const glassBlur = parseInt(settings[`page_${pageKey}_glass_blur`] || "15");
    const glassOpacity = parseInt(settings[`page_${pageKey}_glass_opacity`] || "50") / 100;
    
    // Convert the Admin-selected Card Background into transparent glass
    const dynamicGlassBg = hexToRgba(cardBg, glassOpacity);

    return {
      bg, heading, body, muted, link, baseSize, headingSize, cardBg, cardBorder, cardRadius, cardShadow,
      isGlass: isGlassEnabled,
      glassStyles: {
        background: dynamicGlassBg,
        backdropFilter: `blur(${glassBlur}px) saturate(130%)`,
        WebkitBackdropFilter: `blur(${glassBlur}px) saturate(130%)`,
        border: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.05)"
      }
    };
  } catch (err) {
    return { ...defaultTheme, isGlass: false, glassStyles: {} };
  }
}

export function getCardStyle(theme) {
  return {
    background: theme.isGlass ? theme.glassStyles.background : theme.cardBg,
    borderRadius: `${theme.cardRadius}px`,
    border: theme.isGlass ? theme.glassStyles.border : `1px solid ${theme.cardBorder}`,
    boxShadow: theme.isGlass ? theme.glassStyles.boxShadow : `0 ${theme.cardShadow / 8}px ${theme.cardShadow / 3}px rgba(139,10,46,0.1)`,
    backdropFilter: theme.isGlass ? theme.glassStyles.backdropFilter : "none",
    WebkitBackdropFilter: theme.isGlass ? theme.glassStyles.WebkitBackdropFilter : "none",
    padding: "24px",
  };
}

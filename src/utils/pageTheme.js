const CACHE_KEY = "vivaha_home_settings_v1";

const DEFAULT_THEME = {
  bg: "#FFF9F5",
  heading: "#8B0A2E",
  body: "#2D1B1B",
  muted: "#8a6b6b",
  link: "#8B0A2E",
  baseSize: "14",
  headingSize: "26",
  // Box theme defaults
  cardBg: "#ffffff",
  cardBorder: "#f0e0e0",
  cardBorderWidth: "1",
  cardRadius: "14",
  cardPadding: "20",
  cardShadow: "40",
  // Label / Value
  labelColor: "#8a6b6b",
  labelSize: "12",
  labelWeight: "500",
  valueColor: "#2D1B1B",
  valueSize: "12",
  valueWeight: "600",
};

export function getPageTheme(pageName) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const s = raw ? JSON.parse(raw) : {};
    const p = `page_${pageName}_`;
    return {
      bg: s[p + "bg"] || DEFAULT_THEME.bg,
      heading: s[p + "heading_color"] || DEFAULT_THEME.heading,
      body: s[p + "body_color"] || DEFAULT_THEME.body,
      muted: s[p + "muted_color"] || DEFAULT_THEME.muted,
      link: s[p + "link_color"] || DEFAULT_THEME.link,
      baseSize: parseInt(s[p + "base_size"] || DEFAULT_THEME.baseSize) || 14,
      headingSize: parseInt(s[p + "heading_size"] || DEFAULT_THEME.headingSize) || 26,
      // Box theme
      cardBg: s[p + "card_bg"] || DEFAULT_THEME.cardBg,
      cardBorder: s[p + "card_border"] || DEFAULT_THEME.cardBorder,
      cardBorderWidth: parseInt(s[p + "card_border_width"] || DEFAULT_THEME.cardBorderWidth) || 0,
      cardRadius: parseInt(s[p + "card_radius"] || DEFAULT_THEME.cardRadius) || 0,
      cardPadding: parseInt(s[p + "card_padding"] || DEFAULT_THEME.cardPadding) || 0,
      cardShadow: parseInt(s[p + "card_shadow"] || DEFAULT_THEME.cardShadow) || 0,
      // Label / Value
      labelColor: s[p + "label_color"] || DEFAULT_THEME.labelColor,
      labelSize: parseInt(s[p + "label_size"] || DEFAULT_THEME.labelSize) || 12,
      labelWeight: s[p + "label_weight"] || DEFAULT_THEME.labelWeight,
      valueColor: s[p + "value_color"] || DEFAULT_THEME.valueColor,
      valueSize: parseInt(s[p + "value_size"] || DEFAULT_THEME.valueSize) || 12,
      valueWeight: s[p + "value_weight"] || DEFAULT_THEME.valueWeight,
    };
    
  } catch {
    return DEFAULT_THEME;
  }
}

// Helper to build card style object from theme
export function getCardStyle(theme) {
  const shadowValue = theme.cardShadow || 0;
  let boxShadow = "none";
  if (shadowValue > 0) {
    const blur = Math.round(shadowValue / 3);
    const yOffset = Math.round(shadowValue / 8);
    const spread = Math.round(shadowValue / 15);
    boxShadow = `0 ${yOffset}px ${blur}px -${spread}px rgba(139,10,46,0.12)`;
  }
  return {
    background: theme.cardBg,
    border: `${theme.cardBorderWidth}px solid ${theme.cardBorder}`,
    borderRadius: `${theme.cardRadius}px`,
    padding: `${theme.cardPadding}px`,
    boxShadow,
  };
}

export const CONFIGURABLE_PAGES = [
  { key: "home", label: "🏠 Home" },
  { key: "search", label: "🔍 Search" },
  { key: "advanced_search", label: "⚙️ Advanced Search" },
  { key: "dashboard", label: "📊 Dashboard" },
  { key: "matches", label: "💕 Matches" },
  { key: "interests", label: "💌 Interests" },
  { key: "messages", label: "💬 Messages" },
  { key: "visitors", label: "👀 Visitors" },
  { key: "photo_requests", label: "📩 Photo Requests" },
  { key: "contact_requests", label: "📞 Contact Requests" },
  { key: "profile", label: "👤 Profile" },
  { key: "user_settings", label: "⚙️ Settings" },
  { key: "recommendations", label: "✨ Recommendations" },
  { key: "success_stories", label: "💑 Success Stories" },
  { key: "boost", label: "🚀 Boost" },
  { key: "pricing", label: "⭐ Pricing" },
  { key: "admin", label: "👑 Admin Dashboard" },
];

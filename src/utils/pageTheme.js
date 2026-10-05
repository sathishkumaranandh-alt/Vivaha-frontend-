// Per-page theme helper
// Each page can have its own background, heading color, body color,
// muted color, link color, base font size, heading font size.

const CACHE_KEY = "vivaha_home_settings_v1";

const DEFAULT_THEME = {
  bg: "#FFF9F5",
  heading: "#8B0A2E",
  body: "#2D1B1B",
  muted: "#8a6b6b",
  link: "#8B0A2E",
  baseSize: "14",
  headingSize: "26",
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
    };
  } catch {
    return DEFAULT_THEME;
  }
}

// List of all configurable pages
export const CONFIGURABLE_PAGES = [
  { key: "home", label: "🏠 Home" },
  { key: "search", label: "🔍 Search" },
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

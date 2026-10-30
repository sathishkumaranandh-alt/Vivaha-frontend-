// ============================================================
// SITE THEMES — the admin picks one in Admin Settings → Site → Site Theme.
// Colours of each theme live in styles/glass-theme.css (html[data-vg-theme="..."]).
// ============================================================
export const VG_THEMES = [
  { id: "sunset",   label: "Sunset Candy",  hint: "Pink + purple (default)", swatch: ["#be185d", "#7c3aed", "#ffe4e6"] },
  { id: "golden",   label: "Golden Sunset", hint: "Warm gold + green, serif headings", swatch: ["#2f7d4f", "#fbbf24", "#ffe9c9"] },
  { id: "royal",    label: "Royal Maroon",  hint: "Maroon + gold, traditional", swatch: ["#8b0a2e", "#b8860b", "#fff1e6"] },
  { id: "emerald",  label: "Emerald",       hint: "Fresh green + teal",       swatch: ["#15803d", "#0d9488", "#dcfce7"] },
  { id: "ocean",    label: "Ocean",         hint: "Blue + indigo",            swatch: ["#0369a1", "#6366f1", "#e0f2fe"] },
  { id: "lavender", label: "Lavender",      hint: "Violet + rose",            swatch: ["#7c3aed", "#db2777", "#f3e8ff"] },
];

const KEY = "vg_theme_v1";
const IDS = VG_THEMES.map((t) => t.id);

export function applyVgTheme(id) {
  const theme = IDS.includes(id) ? id : "sunset";
  try { document.documentElement.setAttribute("data-vg-theme", theme); } catch {}
  try { localStorage.setItem(KEY, theme); } catch {}
  return theme;
}

// Called once at startup: re-use the last theme instantly (no colour flash)
export function applyCachedVgTheme() {
  let id = "sunset";
  try { id = localStorage.getItem(KEY) || "sunset"; } catch {}
  return applyVgTheme(id);
}

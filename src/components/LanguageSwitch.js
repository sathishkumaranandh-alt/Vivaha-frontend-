import React from "react";
import { getLang, setLang } from "../utils/i18n";

// Small "EN | தமிழ்" toggle. Choice is saved; the page reloads once to apply it.
export default function LanguageSwitch({ style }) {
  const lang = getLang();
  const base = {
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.55)",
    color: "inherit",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
    ...style,
  };
  return (
    <button
      type="button"
      data-no-translate
      style={base}
      aria-label="Language"
      onClick={() => setLang(lang === "ta" ? "en" : "ta")}
    >
      🌐 {lang === "ta" ? "English" : "தமிழ்"}
    </button>
  );
}

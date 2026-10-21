// src/utils/usePageTheme.js
import { useState, useEffect } from "react";
import { getPageTheme } from "./pageTheme";

export function usePageTheme(pageKey) {
  const [theme, setTheme] = useState(getPageTheme(pageKey));

  useEffect(() => {
    // Admin panel la "Save" click pannina, indha event trigger aagum
    const handler = () => setTheme(getPageTheme(pageKey));
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
  }, [pageKey]);

  // 🛡️ Glass Panel (Card) Styles
  const glassPanel = {
    background: theme.isGlass ? theme.glassStyles.background : theme.cardBg,
    backdropFilter: theme.isGlass ? theme.glassStyles.backdropFilter : "none",
    WebkitBackdropFilter: theme.isGlass ? theme.glassStyles.WebkitBackdropFilter : "none",
    border: theme.isGlass ? theme.glassStyles.border : `1px solid ${theme.cardBorder}`,
    borderRadius: `${theme.cardRadius}px`,
    boxShadow: theme.isGlass ? theme.glassStyles.boxShadow : "0 4px 14px rgba(0,0,0,0.05)",
    padding: "24px", 
  };

  // 🛡️ Glass Input Styles
  const glassInput = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: theme.isGlass ? "1px solid rgba(255, 255, 255, 0.9)" : `1.5px solid ${theme.cardBorder}`,
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    background: theme.isGlass ? "rgba(255, 255, 255, 0.4)" : theme.cardBg,
    boxSizing: "border-box",
    color: theme.body,
    backdropFilter: theme.isGlass ? "blur(5px)" : "none",
  };

  return { pageTheme: theme, glassPanel, glassInput };
}

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls to the top on every page change BEFORE the new page paints,
// so a page never opens at the old scroll position (near the footer).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  // We control scroll position ourselves (browser restore caused footer landings)
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    // "instant" ignores the smooth-scroll CSS, so the new page opens at the top
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (e) {
      window.scrollTo(0, 0); // very old browsers
    }
  }, [pathname, hash]);

  return null;
}

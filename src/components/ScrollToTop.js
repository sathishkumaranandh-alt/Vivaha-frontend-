import { useLayoutEffect, useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// New page (link click)  → opens at the top, before it paints.
// Back / forward button  → returns to the exact scroll position you left
//                          (e.g. search results list after viewing a profile).
const KEY = "vg_scroll_v1";

function readAll() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function savePos(locKey, y) {
  try {
    const all = readAll();
    all[locKey] = Math.round(y);
    const keys = Object.keys(all);
    if (keys.length > 60) delete all[keys[0]]; // keep it small
    sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const navType = useNavigationType();
  const keyRef = useRef(key);
  const lastPath = useRef(null);
  keyRef.current = key;

  // We control scroll position ourselves (browser restore caused footer landings)
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Remember where the user is on the current page
  useEffect(() => {
    let t = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => { t = null; savePos(keyRef.current, window.scrollY); }, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (t) clearTimeout(t);
    };
  }, []);

  useLayoutEffect(() => {
    // Filter changes only rewrite the URL query (replace) — never jump to top for those
    const samePage = lastPath.current === pathname;
    lastPath.current = pathname;
    if (samePage && navType === "REPLACE") return;

    if (navType === "POP") {
      const y = readAll()[key];
      if (typeof y === "number" && y > 0) {
        // The list may still be loading: keep trying until the page is tall enough (max ~3s)
        let tries = 0;
        const tick = () => {
          tries += 1;
          const max = document.documentElement.scrollHeight - window.innerHeight;
          if (max >= y - 2 || tries > 30) {
            try { window.scrollTo({ top: y, left: 0, behavior: "instant" }); } catch { window.scrollTo(0, y); }
            return;
          }
          setTimeout(tick, 100);
        };
        tick();
        return;
      }
    }
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
  }, [pathname, hash, key, navType]);

  return null;
        }
        

// ============================================================
// VIVAHA GLASS THEME runtime (theme colours live in styles/glass-theme.css)
// Scans rendered elements and tags them with data-vg-* attributes.
// styles/glass-theme.css turns those tags into glass surfaces and
// new text/link/border colours. Inline-styled + <style>-block pages
// are all covered without editing every page file.
// ============================================================

const BLUR_BUDGET = 60; // max blurred surfaces on screen (mobile performance)

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "IMG", "VIDEO", "CANVAS", "HTML", "BODY", "HEAD", "META",
  "LINK", "NOSCRIPT", "OPTION", "BR", "IFRAME", "PICTURE", "SOURCE",
]);
const CONTROL_TAGS = new Set(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"]);
const FLAT_TAGS = new Set(["TR", "TD", "TH", "LI"]);
const ATTRS = ["data-vg-bg", "data-vg-fg", "data-vg-bd", "data-vg-fixed"];

function parse(str) {
  if (!str) return null;
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v)));
  if (p.length < 3 || p.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !Number.isNaN(p[3]) ? p[3] : 1 };
}
const lum = (c) => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
const isMaroon = (c) => c.r >= 90 && c.r <= 190 && c.g <= 55 && c.b <= 100 && c.b - c.g >= 15 && c.r >= c.g * 2.2;
const isNavyBlue = (c) => c.b >= 100 && c.r <= 70 && c.g <= 110 && c.b >= c.r * 2 && c.b >= c.g * 1.4;
const isGold = (c) => c.r >= 190 && c.g >= 130 && c.g <= 185 && c.b <= 70 && c.r > c.g;
const isPale = (c) => c.a >= 0.5 && Math.min(c.r, c.g, c.b) >= 225;

function readStyle(el, vw, vh) {
  const cs = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const out = { bg: null, fg: null, bd: null, fixed: false, overlay: false, popup: false };

  out.fixed = cs.position === "fixed";
  const z = parseInt(cs.zIndex, 10);
  out.popup = (cs.position === "absolute" || cs.position === "fixed") && !Number.isNaN(z) && z >= 100;

  // ----- background -----
  const bg = parse(cs.backgroundColor);
  const img = cs.backgroundImage || "";
  const w = rect.width;
  const h = rect.height;
  const big = w >= vw * 0.9 && h >= vh * 0.6;

  if (out.fixed && bg && bg.a > 0 && bg.a < 0.95 && lum(bg) < 0.25) out.overlay = true;

  if (img.includes("gradient")) {
    const colors = img.match(/rgba?\([^)]+\)/g) || [];
    const parsed = colors.map(parse).filter(Boolean);
    if (parsed.some((c) => c.a >= 0.9 && (isMaroon(c) || isNavyBlue(c)))) {
      out.bg = big ? "clear" : "brand";
    }
  } else if (!img.includes("url(") && bg && bg.a >= 0.5) {
    if (isMaroon(bg) || isNavyBlue(bg)) {
      out.bg = big ? "clear" : bg.a >= 0.9 ? "brand" : "brand-soft";
    } else if (isPale(bg)) {
      if (big) out.bg = "clear";
      else if (CONTROL_TAGS.has(el.tagName)) out.bg = "soft";
      else if (FLAT_TAGS.has(el.tagName)) out.bg = "soft";
      else if (w >= 100 && h >= 40) out.bg = "card"; // resolved in write phase
    }
  }

  // ----- text colour -----
  const fg = parse(cs.color);
  if (fg && fg.a > 0.5) {
    if (isMaroon(fg) || isNavyBlue(fg)) out.fg = "accent";
    else if (isGold(fg)) out.fg = "gold";
    else if (Math.max(fg.r, fg.g, fg.b) <= 100 && Math.max(fg.r, fg.g, fg.b) - Math.min(fg.r, fg.g, fg.b) <= 45) out.fg = "text";
    else if (Math.min(fg.r, fg.g, fg.b) >= 100 && Math.max(fg.r, fg.g, fg.b) <= 175 && Math.max(fg.r, fg.g, fg.b) - Math.min(fg.r, fg.g, fg.b) <= 45) out.fg = "muted";
  }

  // ----- border -----
  if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") {
    const bc = parse(cs.borderTopColor);
    if (bc && bc.a > 0.3) {
      if (isMaroon(bc) || isNavyBlue(bc)) out.bd = "accent";
      else if (Math.min(bc.r, bc.g, bc.b) >= 215) out.bd = "light";
    }
  }
  return out;
}

function processBatch(nodes) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const list = nodes.filter(
    (el) => el.nodeType === 1 && el.isConnected && !SKIP_TAGS.has(el.tagName) && !(el instanceof SVGElement)
  );
  if (!list.length) return;

  // phase 0: clear old tags so computed styles are read untouched
  list.forEach((el) => ATTRS.forEach((a) => el.hasAttribute(a) && el.removeAttribute(a)));

  // phase 1: reads only
  const decisions = list.map((el) => readStyle(el, vw, vh));

  // phase 2: writes only
  let blurCount = document.querySelectorAll('[data-vg-bg="glass"],[data-vg-bg="pop"]').length;
  list.forEach((el, i) => {
    const d = decisions[i];
    if (d.fixed) {
      el.setAttribute("data-vg-fixed", "1");
      let p = el.parentElement;
      while (p && p !== document.body) {
        p.setAttribute("data-vg-nb", "1");
        p = p.parentElement;
      }
    }
    let bg = d.bg;
    if (bg === "card") {
      const parent = el.parentElement;
      const inFixed = parent && parent.closest("[data-vg-fixed]");
      const inGlass = parent && parent.closest('[data-vg-bg="glass"],[data-vg-bg="pop"]');
      if (d.popup || d.fixed || inFixed) bg = "pop";
      else if (inGlass || blurCount >= BLUR_BUDGET) bg = "glass-in";
      else bg = "glass";
      if (bg === "glass" || bg === "pop") blurCount += 1;
    }
    let fg = d.fg;
    if (fg) {
      const selfBrand = bg === "brand" || bg === "brand-soft";
      const onBrand = selfBrand || (el.parentElement && el.parentElement.closest('[data-vg-bg="brand"],[data-vg-bg="brand-soft"]'));
      if (onBrand) fg = "onbrand";
    }
    if (bg) el.setAttribute("data-vg-bg", bg);
    if (fg) el.setAttribute("data-vg-fg", fg);
    if (d.bd) el.setAttribute("data-vg-bd", d.bd);
  });
}

// ---------- observer ----------
const pending = new Set();
const sigs = new WeakMap();
let timer = null;

const sigOf = (el) =>
  [el.className && el.className.toString(), el.style && el.style.background, el.style && el.style.backgroundColor,
   el.style && el.style.backgroundImage, el.style && el.style.color, el.style && el.style.border,
   el.style && el.style.borderColor, el.style && el.style.display].join("|");

function addTree(root, withChildren) {
  if (!root || root.nodeType !== 1) return;
  pending.add(root);
  if (withChildren) {
    const all = root.querySelectorAll("*");
    if (all.length < 3000) all.forEach((n) => pending.add(n));
  }
}

function schedule() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const batch = Array.from(pending);
    pending.clear();
    processBatch(batch);
    batch.forEach((el) => el.nodeType === 1 && sigs.set(el, sigOf(el)));
  }, 40);
}

export function initGlassTheme() {
  if (typeof window === "undefined" || window.__vgGlassInit) return;
  window.__vgGlassInit = true;

  const observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => addTree(n, true));
      } else if (m.type === "attributes") {
        const el = m.target;
        const sig = sigOf(el);
        if (sigs.get(el) !== sig) {
          const oldDisplay = sigs.get(el) ? sigs.get(el).split("|")[7] : null;
          const newDisplay = el.style ? el.style.display : "";
          addTree(el, oldDisplay !== null && oldDisplay !== newDisplay && el.querySelectorAll("*").length < 400);
        }
      }
    }
    if (pending.size) schedule();
  });

  const start = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    addTree(document.body, true);
    schedule();
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);

  window.addEventListener("resize", () => {
    clearTimeout(window.__vgResize);
    window.__vgResize = setTimeout(() => {
      addTree(document.body, true);
      schedule();
    }, 300);
  });
}

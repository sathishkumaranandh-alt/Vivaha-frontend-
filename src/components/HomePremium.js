import React, { useEffect } from "react";
import { Link } from "react-router-dom";

// 🌅 Home page sections (sunset photo hero): hero, search dock, feature strip, Porutham band,
// browse chips, steps and final banner. The featured profiles / success stories row stays in
// Home.js (HomeGlassDuo) so it keeps using real data.
// Colours come from the site theme (Admin Settings → Site → Site Theme) through the --vg-* CSS
// variables, so changing the theme recolours these sections too. Surfaces use background-IMAGE
// (not colour) so the site's auto-glass script leaves them alone.
// Pure presentation: all data / handlers are passed in from Home.js.

const ACC = "var(--vg-accent, #15803d)";
const ACC_DARK = "var(--vg-accent-dark, #14532d)";
const GOLD = "var(--vg-gold, #8a5a12)";
const INK = "var(--vg-text, #12332a)";
const MUTED = "var(--vg-muted, #3d6354)";
const BRAND = "var(--vg-brand, linear-gradient(135deg, #15803d 0%, #0d9488 100%))";
const LINE = "var(--vg-border, rgba(255,255,255,.8))";
const RGB = "var(--vg-accent-rgb, 21,128,61)";

const SURF = `background-color: transparent; background-image: linear-gradient(rgba(255,252,246,.66), rgba(255,252,246,.5)); border: 1px solid ${LINE}; -webkit-backdrop-filter: blur(20px) saturate(165%); backdrop-filter: blur(20px) saturate(165%); box-shadow: 0 26px 60px -22px rgba(${RGB}, .28), inset 0 1px 0 rgba(255,255,255,.9);`;
const SURF_S = `background-color: transparent; background-image: linear-gradient(rgba(255,252,247,.86), rgba(255,252,247,.78)); border: 1px solid ${LINE}; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);`;

const CSS = `
.hp-sec { max-width: 1180px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; margin-top: 30px; }
.hp-h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; color: ${ACC_DARK}; margin: 0;
  font-size: clamp(26px, 3.6vw, 38px); line-height: 1.1; letter-spacing: -.3px; }
.hp-h2 em { font-style: italic; font-weight: 500; color: ${GOLD}; }
.hp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 0 26px; border-radius: 999px;
  font-weight: 700; font-size: 15px; cursor: pointer; border: 0; text-decoration: none; box-sizing: border-box; font-family: inherit;
  transition: transform .25s ease, box-shadow .25s ease; }
.hp-btn:hover { transform: translateY(-2px); }
.hp-btn-brand { background-color: transparent; background-image: ${BRAND}; color: #fff; box-shadow: 0 16px 32px -12px rgba(${RGB}, .75); }
.hp-btn-ghost { background-color: transparent; background-image: linear-gradient(rgba(255,255,255,.8), rgba(255,255,255,.8)); color: ${ACC_DARK}; border: 1px solid ${LINE}; }

/* hero */
.hp-hero { position: relative; overflow: hidden; isolation: isolate; }
.hp-hero-bg { position: absolute; inset: 0; z-index: 0; background-size: cover; background-position: 70% center; background-repeat: no-repeat; }
.hp-hero-veil { position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(90deg, rgba(255,246,232,.96) 0%, rgba(255,246,232,.74) 36%, rgba(255,246,232,0) 64%),
              linear-gradient(180deg, rgba(255,246,232,0) 68%, var(--vg-bg-base, #fff3df) 100%); }
.hp-hero-in { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; box-sizing: border-box; padding: 40px 20px 110px; min-height: 560px; display: flex; align-items: center; }
.hp-panel { ${SURF} border-radius: 32px; padding: 36px 36px 32px; max-width: 600px; width: 100%; box-sizing: border-box; }
.hp-pill { display: inline-flex; align-items: center; gap: 9px; border-radius: 999px; padding: 7px 15px; font-size: 12.5px; font-weight: 700; color: ${ACC_DARK};
  background-color: transparent; background-image: linear-gradient(rgba(255,255,255,.8), rgba(255,255,255,.8)); }
.hp-h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; color: ${INK}; margin: 18px 0 12px;
  font-size: clamp(34px, 5.2vw, 60px); line-height: 1.06; letter-spacing: -1px; }
.hp-h1 em { font-style: italic; font-weight: 500; color: ${ACC_DARK}; }
.hp-tamil { font-family: 'Playfair Display', Georgia, serif; font-size: 18px; line-height: 1.6; color: ${GOLD}; font-weight: 600; margin: 0 0 6px; }
.hp-sub { font-size: 16px; line-height: 1.7; color: ${MUTED}; margin: 0; max-width: 480px; }
.hp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.hp-ticks { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 22px; font-size: 13.5px; font-weight: 600; color: ${INK}; }
.hp-ticks span { display: inline-flex; align-items: center; gap: 7px; }
.hp-script { position: absolute; z-index: 3; right: 5%; top: 90px; max-width: 360px; transform: rotate(-7deg);
  font-family: 'Caveat', 'Segoe Script', 'Brush Script MT', cursive; font-size: 34px; line-height: 1.05; color: #7a4b10; pointer-events: none; }

/* dock */
.hp-dock-wrap { max-width: 1100px; margin: -78px auto 0; padding: 0 20px; box-sizing: border-box; position: relative; z-index: 5; }
.hp-dock { ${SURF} border-radius: 30px; padding: 18px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1fr) auto; gap: 12px; align-items: center; }
.hp-field { position: relative; }
.hp-field label { position: absolute; top: 10px; left: 50px; font-size: 10.5px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: ${GOLD}; pointer-events: none; }
.hp-field svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: ${ACC}; }
.hp-field select, .hp-field input { width: 100%; box-sizing: border-box; min-height: 62px; padding: 26px 14px 8px 50px; border-radius: 18px; border: 1px solid ${LINE};
  background-color: rgba(255,255,255,.82); font-family: inherit; font-size: 15px; font-weight: 600; color: #1d2b22; }
.hp-field select:focus, .hp-field input:focus { outline: 3px solid rgba(${RGB}, .28); }
.hp-dock .hp-btn { min-height: 62px; border-radius: 20px; padding: 0 28px; }

/* feature strip */
.hp-strip { ${SURF} border-radius: 28px; padding: 24px 14px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.hp-strip div.it { text-align: center; padding: 6px 12px; }
.hp-strip .ic { width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: ${ACC_DARK};
  background-color: transparent; background-image: linear-gradient(var(--vg-accent-soft, #ffe3bf), var(--vg-accent-soft, #ffe3bf)); }
.hp-strip b { display: block; font-family: 'Playfair Display', Georgia, serif; font-size: 17px; margin-top: 10px; color: ${ACC_DARK}; }
.hp-strip small { display: block; font-size: 12.5px; line-height: 1.5; color: ${MUTED}; margin-top: 3px; }

/* porutham */
.hp-por { border-radius: 32px; padding: 40px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 36px; align-items: center;
  background-color: transparent; background-image: ${BRAND}; color: #fff; box-shadow: 0 36px 70px -34px rgba(${RGB}, .8); }
.hp-por .k { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,.85); }
.hp-por h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; font-size: clamp(28px, 4vw, 42px); line-height: 1.1; margin: 10px 0 12px; color: #fff; }
.hp-por p { color: rgba(255,255,255,.92); line-height: 1.7; margin: 0 0 12px; font-size: 15px; max-width: 470px; }
.hp-por-card { background-color: #fffaf1; border-radius: 22px; padding: 22px; color: #1b1b1b; }
.hp-pchips { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-top: 14px; }
.hp-pchips div { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; font-size: 13px; font-weight: 500; }

/* chips */
.hp-kicker { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${GOLD}; }
.hp-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.hp-chip { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 999px; ${SURF_S}
  font-size: 14px; font-weight: 600; color: ${INK}; text-decoration: none; transition: transform .2s ease; }
.hp-chip:hover { transform: translateY(-2px); color: ${ACC_DARK}; }

/* steps */
.hp-steps-box { ${SURF} border-radius: 30px; padding: 30px 28px; }
.hp-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 22px; }
.hp-step { ${SURF_S} border-radius: 22px; padding: 22px; }
.hp-step .n { width: 42px; height: 42px; border-radius: 50%; background-color: transparent; background-image: ${BRAND}; color: #fff; display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 19px; }
.hp-step h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; margin: 14px 0 6px; color: ${ACC_DARK}; }
.hp-step p { font-size: 14px; line-height: 1.6; color: ${MUTED}; margin: 0; }

/* cta */
.hp-cta { position: relative; overflow: hidden; border-radius: 32px; background-size: cover; background-position: 70% center; background-repeat: no-repeat;
  box-shadow: 0 36px 70px -34px rgba(${RGB}, .7); }
.hp-cta::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,246,232,.97) 0%, rgba(255,246,232,.86) 46%, rgba(255,246,232,.05) 82%); }
.hp-cta-in { position: relative; padding: 46px 40px; max-width: 560px; }
.hp-cta h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; font-size: clamp(28px, 4vw, 44px); line-height: 1.08; margin: 0 0 10px; color: ${INK}; }
.hp-cta h2 em { font-style: italic; color: ${ACC_DARK}; }
.hp-cta p { font-size: 16px; line-height: 1.65; color: ${MUTED}; margin: 0 0 22px; }

@media (max-width: 900px) {
  .hp-hero-bg, .hp-hero-veil { bottom: auto; height: 330px; }
  .hp-hero-veil { background: linear-gradient(180deg, rgba(255,246,232,0) 55%, var(--vg-bg-base, #fff3df) 100%); }
  .hp-hero-in { padding-top: 210px; padding-bottom: 96px; min-height: 0; }
  .hp-script { display: none; }
  .hp-dock { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hp-dock .hp-btn { grid-column: 1 / -1; }
  .hp-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hp-por { grid-template-columns: minmax(0, 1fr); padding: 28px 22px; }
  .hp-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px) {
  .hp-panel { padding: 26px 22px; border-radius: 26px; }
  .hp-dock { grid-template-columns: minmax(0, 1fr); }
  .hp-strip { grid-template-columns: minmax(0, 1fr); }
  .hp-steps { grid-template-columns: minmax(0, 1fr); }
  .hp-cta-in { padding: 34px 22px; }
}
`;

const Tick = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l4 4 10-10" />
  </svg>
);

const TITLE_FALLBACK = "Find Your Perfect Life Partner";

// Last two words of the title get the italic accent colour.
function renderTitle(title) {
  const text = String(title || TITLE_FALLBACK).trim();
  const words = text.split(/\s+/);
  if (words.length < 3) return text;
  return (
    <>
      {words.slice(0, -2).join(" ")} <em>{words.slice(-2).join(" ")}</em>
    </>
  );
}

/* ---------------- HERO (site hero photo) ---------------- */
export function PremiumHero({ settings, currentUser, heroImage, showTrust, ready }) {
  // Handwriting font for the photo tagline (loaded once)
  useEffect(() => {
    if (document.getElementById("hp-caveat-font")) return;
    const l = document.createElement("link");
    l.id = "hp-caveat-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap";
    document.head.appendChild(l);
  }, []);

  const ticks = [1, 2, 3].map((i) => settings[`home_trust_${i}_title`]).filter(Boolean);

  return (
    <header className="hp-hero">
      <style>{CSS}</style>
      <div className="hp-hero-bg" style={{ backgroundImage: heroImage ? `url(${heroImage})` : "none" }} aria-hidden="true" />
      <div className="hp-hero-veil" aria-hidden="true" />
      <div className="hp-hero-in">
        <div className="hp-panel" style={{ opacity: ready ? 1 : 0, transition: "opacity .25s ease" }}>
          {settings.home_show_eyebrow !== "false" && settings.home_eyebrow && (
            <span className="hp-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" />
              </svg>
              {settings.home_eyebrow}
            </span>
          )}
          <h1 className="hp-h1">{renderTitle(settings.home_title)}</h1>
          {settings.home_show_tamil !== "false" && settings.home_tamil_subtitle && (
            <p className="hp-tamil">{settings.home_tamil_subtitle}</p>
          )}
          {settings.home_show_subtitle !== "false" && settings.home_subtitle && (
            <p className="hp-sub">{settings.home_subtitle}</p>
          )}
          <div className="hp-actions">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="hp-btn hp-btn-brand">Go to my dashboard</Link>
                <Link to="/matches" className="hp-btn hp-btn-ghost">My matches</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="hp-btn hp-btn-brand">Create your profile →</Link>
                <Link to="/login" className="hp-btn hp-btn-ghost">Login</Link>
              </>
            )}
          </div>
          {showTrust && ticks.length > 0 && (
            <div className="hp-ticks">
              {ticks.map((t) => (
                <span key={t}><Tick />{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="hp-script" aria-hidden="true">
        Real people…<br />Real connections…<br />Lasting relationships
      </div>
    </header>
  );
}

/* ---------------- SEARCH DOCK ---------------- */
const IconStyle = { width: 22, height: 22 };

export function PremiumDock({ heroSearch, setHeroSearch, onSearch, communities }) {
  const set = (patch) => setHeroSearch({ ...heroSearch, ...patch });
  return (
    <div className="hp-dock-wrap">
      <form className="hp-dock" onSubmit={onSearch}>
        <div className="hp-field">
          <svg {...IconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
          <label htmlFor="hd-for">Looking for</label>
          <select id="hd-for" value={heroSearch.lookingFor} onChange={(e) => set({ lookingFor: e.target.value })}>
            <option value="female">Bride</option>
            <option value="male">Groom</option>
          </select>
        </div>
        <div className="hp-field">
          <svg {...IconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>
          <label htmlFor="hd-age">Age</label>
          <select id="hd-age" value={heroSearch.age} onChange={(e) => set({ age: e.target.value })}>
            <option value="21-30">21 - 30</option>
            <option value="25-35">25 - 35</option>
            <option value="30-40">30 - 40</option>
          </select>
        </div>
        <div className="hp-field">
          <svg {...IconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
          <label htmlFor="hd-loc">Location</label>
          <input id="hd-loc" type="text" placeholder="Any location" value={heroSearch.location} onChange={(e) => set({ location: e.target.value })} />
        </div>
        <div className="hp-field">
          <svg {...IconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.2c3 .2 5 2.3 5 5.3" /></svg>
          <label htmlFor="hd-com">Community</label>
          <select id="hd-com" value={heroSearch.community} onChange={(e) => set({ community: e.target.value })}>
            <option value="">Any community</option>
            {(communities || []).map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="hp-btn hp-btn-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          Search profiles
        </button>
      </form>
    </div>
  );
}

/* ---------------- FEATURE STRIP ---------------- */
const FEATURES = [
  { t: "Verified profiles", d: "Checked by our team", p: <><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></> },
  { t: "Privacy first", d: "You choose who sees what", p: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></> },
  { t: "10 Porutham", d: "Jathagam match on every profile", p: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" /></> },
  { t: "All communities", d: "Open to every Tamil community", p: <><circle cx="9" cy="8" r="3.2" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.2c3 .2 5 2.3 5 5.3" /></> },
  { t: "Mobile friendly", d: "Find your match anywhere", p: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></> },
];

export function PremiumFeatureStrip() {
  return (
    <section className="hp-sec" style={{ marginTop: 28 }}>
      <div className="hp-strip">
        {FEATURES.map((f) => (
          <div className="it" key={f.t}>
            <span className="ic">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{f.p}</svg>
            </span>
            <b>{f.t}</b>
            <small>{f.d}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- PORUTHAM ---------------- */
const SAMPLE_PORUTHAM = [
  ["Dina", true], ["Gana", true], ["Mahendra", true], ["Stree Deergha", true], ["Yoni", false],
  ["Rasi", true], ["Rasi Adhipathi", true], ["Vasya", false], ["Rajju", true], ["Vedha", true],
];

export function PremiumPorutham({ isLoggedIn }) {
  return (
    <section className="hp-sec">
      <div className="hp-por">
        <div>
          <div className="k">Jathagam match</div>
          <h2>Know your 10 Porutham before you say yes</h2>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17 }}>திருமணப் பொருத்தம் உடனுக்குடன்</p>
          <p>
            Add your Rasi and Nakshatra once. Open any profile and see how your horoscopes match, each Porutham explained.
            Dosham, birth time and place are shown only to members your plan allows.
          </p>
          <Link to={isLoggedIn ? "/profile" : "/register"} className="hp-btn" style={{ background: "#fff", color: "#14301f", marginTop: 8 }}>
            {isLoggedIn ? "Add my horoscope →" : "Create my profile →"}
          </Link>
        </div>
        <div className="hp-por-card" role="img" aria-label="Sample Porutham result, 8 out of 10">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 15 }}>Porutham match</strong>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: "#1E7A46", lineHeight: 1 }}>
              8<span style={{ fontSize: 18, color: "#6b6b6b" }}> / 10</span>
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1E7A46", marginTop: 4 }}>Excellent match</div>
          <div className="hp-pchips">
            {SAMPLE_PORUTHAM.map(([name, ok]) => (
              <div key={name} style={{ background: ok ? "#E7F4EC" : "#FBE9E9", border: `1px solid ${ok ? "#B6DCC5" : "#EBBABA"}` }}>
                <span style={{ color: ok ? "#1E7A46" : "#B42323", fontWeight: 700 }}>{ok ? "✓" : "✗"}</span>
                {name}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 12 }}>Sample result.</div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- BROWSE ---------------- */
const DEFAULT_CITIES = ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"];

export function PremiumBrowse({ communities, settings }) {
  const cities = (settings.home_cities || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const cityList = cities.length > 0 ? cities.slice(0, 10) : DEFAULT_CITIES;
  const comms = (communities || []).slice(0, 10);

  return (
    <section className="hp-sec">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 26 }}>
        {comms.length > 0 && (
          <div>
            <div className="hp-kicker">Browse by community</div>
            <div className="hp-chips">
              {comms.map((c) => (
                <Link key={c.slug} className="hp-chip" to={`/search?community=${encodeURIComponent(c.slug)}`}>{c.name}</Link>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="hp-kicker">Browse by city</div>
          <div className="hp-chips">
            {cityList.map((c) => (
              <Link key={c} className="hp-chip" to={`/search?location=${encodeURIComponent(c)}`}>{c}</Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
const STEPS = [
  { t: "Register free", d: "Create your profile in 2 minutes." },
  { t: "Complete profile", d: "Add photos and details for better matches." },
  { t: "Send interest", d: "Connect with profiles you like." },
  { t: "Get married", d: "Find your perfect life partner." },
];

export function PremiumSteps() {
  return (
    <section className="hp-sec">
      <div className="hp-steps-box">
        <h2 className="hp-h2">From hello to <em>forever</em> in four steps</h2>
        <div className="hp-steps">
          {STEPS.map((s, i) => (
            <div className="hp-step" key={s.t}>
              <div className="n">{i + 1}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FINAL BANNER ---------------- */
export function PremiumCta({ isLoggedIn, heroImage }) {
  return (
    <section className="hp-sec" style={{ marginBottom: 30 }}>
      <div className="hp-cta" style={{ backgroundImage: heroImage ? `url(${heroImage})` : "none" }}>
        <div className="hp-cta-in">
          <h2>Find your match <em>with confidence</em></h2>
          <p>Simple. Secure. Trusted.</p>
          <Link to={isLoggedIn ? "/search" : "/register"} className="hp-btn hp-btn-brand">
            {isLoggedIn ? "Browse profiles →" : "Create your profile →"}
          </Link>
        </div>
      </div>
    </section>
  );
}

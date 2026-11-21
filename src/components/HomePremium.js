import React from "react";
import { Link } from "react-router-dom";

// 🏛️ Home page sections: hero with photo spotlight, search dock, ticker, feature tiles,
// browse chips, steps and final banner.
// Colours come from the site theme (Admin Settings → Site → Site Theme) through the --vg-* CSS
// variables, so changing the theme recolours these sections too. Surfaces use background-IMAGE
// (not colour) so the site's auto-glass script leaves them alone.
// Pure presentation: all data / handlers are passed in from Home.js.

const ACC = "var(--vg-accent, #be185d)";
const ACC_DARK = "var(--vg-accent-dark, #831843)";
const GOLD = "var(--vg-gold, #9a3412)";
const INK = "var(--vg-text, #3b1d3f)";
const MUTED = "var(--vg-muted, #6b3f6e)";
const BRAND = "var(--vg-brand, linear-gradient(135deg, #be185d 0%, #7c3aed 100%))";
const LINE = "var(--vg-border, rgba(255,255,255,.75))";

const SURF = `background-color: transparent; background-image: linear-gradient(rgba(255,255,255,.62), rgba(255,255,255,.48)); border: 1px solid ${LINE}; -webkit-backdrop-filter: blur(18px) saturate(160%); backdrop-filter: blur(18px) saturate(160%); box-shadow: 0 24px 60px rgba(var(--vg-accent-rgb, 190,24,93), .14), inset 0 1px 0 rgba(255,255,255,.85);`;
const SURF_STRONG = `background-color: transparent; background-image: linear-gradient(rgba(255,255,255,.86), rgba(255,255,255,.76)); border: 1px solid ${LINE}; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);`;

const CSS = `
.hp-sec { max-width: 1180px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; margin-top: 84px; }
.hp-kicker { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${ACC_DARK}; }
.hp-h2 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; color: ${ACC_DARK}; margin: 10px 0 0;
  font-size: clamp(28px, 4.4vw, 46px); line-height: 1.08; letter-spacing: -.4px; }
.hp-h2 em { font-style: italic; font-weight: 500; color: ${GOLD}; }
.hp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 0 28px; border-radius: 999px;
  font-weight: 700; font-size: 15px; cursor: pointer; border: 0; text-decoration: none; box-sizing: border-box; font-family: inherit;
  transition: transform .3s ease, box-shadow .3s ease; }
.hp-btn:hover { transform: translateY(-2px); }
.hp-btn:active { transform: scale(.98); }
.hp-btn-brand { background-color: transparent; background-image: ${BRAND}; color: #fff; box-shadow: 0 16px 34px rgba(var(--vg-accent-rgb, 190,24,93), .34); }
.hp-btn-ghost { background-color: transparent; background-image: linear-gradient(rgba(255,255,255,.6), rgba(255,255,255,.6)); color: ${INK}; border: 1px solid ${LINE}; }
.hp-link { color: ${ACC_DARK}; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; min-height: 44px; }

/* hero */
.hp-hero { max-width: 1180px; margin: 0 auto; padding: 56px 20px 26px; box-sizing: border-box;
  display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(0, .98fr); gap: 48px; align-items: center; }
.hp-pill { display: inline-flex; align-items: center; gap: 10px; ${SURF_STRONG} border-radius: 999px; padding: 8px 16px; font-size: 12.5px; font-weight: 700; color: ${ACC_DARK}; }
.hp-pill i { width: 8px; height: 8px; border-radius: 50%; background: #3fb984; display: inline-block; }
.hp-h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; color: ${ACC_DARK}; margin: 22px 0 14px;
  font-size: clamp(38px, 6.4vw, 76px); line-height: 1.03; letter-spacing: -1.2px; }
.hp-h1 em { font-style: italic; font-weight: 500; color: ${GOLD}; }
.hp-tamil { font-family: 'Playfair Display', Georgia, serif; font-size: 18px; line-height: 1.6; color: ${ACC}; font-weight: 600; margin: 0 0 8px; }
.hp-sub { font-size: 16.5px; line-height: 1.7; color: ${MUTED}; margin: 0; max-width: 520px; }
.hp-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 30px; }
.hp-ticks { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 30px; font-size: 14px; font-weight: 600; color: ${INK}; }
.hp-ticks span { display: inline-flex; align-items: center; gap: 8px; }

/* spotlight (hero photo) */
.hp-spot { position: relative; height: 560px; }
.hp-spot-back { position: absolute; top: 0; left: 0; width: 210px; height: 190px; border-radius: 26px; transform: rotate(-8deg); opacity: .9;
  background-color: transparent; background-image: ${BRAND}; box-shadow: 0 20px 44px rgba(var(--vg-accent-rgb, 190,24,93), .25); }
.hp-spot-main { position: absolute; inset: 36px 0 0 36px; padding: 12px; border-radius: 34px; ${SURF}; }
.hp-spot-photo { position: relative; height: 100%; border-radius: 24px; overflow: hidden; background-size: cover; background-position: 62% center; background-repeat: no-repeat;
  background-color: transparent; }
.hp-spot-photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(40,10,30,.55) 0%, rgba(40,10,30,0) 50%); }
.hp-spot-cap { position: absolute; left: 22px; right: 22px; bottom: 20px; z-index: 1; color: #fff; }
.hp-spot-cap b { display: block; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; line-height: 1.15; }
.hp-spot-cap span { display: block; margin-top: 4px; font-size: 13.5px; opacity: .92; }
.hp-float { position: absolute; z-index: 3; ${SURF_STRONG} border-radius: 18px; padding: 11px 16px; font-size: 13.5px; font-weight: 700; color: ${INK};
  display: flex; align-items: center; gap: 10px; box-shadow: 0 16px 34px rgba(0,0,0,.14); animation: hp-bob 7s ease-in-out infinite; }
.hp-float i { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-style: normal; color: #fff; font-size: 13px;
  background-color: transparent; background-image: ${BRAND}; }
.hp-float.f1 { left: 0; bottom: 84px; }
.hp-float.f2 { right: -4px; top: 92px; animation-duration: 8s; animation-direction: reverse; }
@keyframes hp-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }

/* search dock */
.hp-dock { ${SURF} border-radius: 30px; padding: 22px; position: relative; z-index: 5; }
.hp-dock-top { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; padding: 0 4px; }
.hp-dock-top h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; margin: 0; color: ${ACC_DARK}; }
.hp-seg { display: inline-flex; padding: 5px; border-radius: 999px; ${SURF_STRONG} }
.hp-seg button { font: inherit; font-size: 14px; font-weight: 700; min-height: 40px; padding: 0 20px; border-radius: 999px; border: 0; background: transparent; color: ${MUTED}; cursor: pointer; transition: all .25s ease; }
.hp-seg button[aria-pressed="true"] { background-color: transparent; background-image: ${BRAND}; color: #fff; box-shadow: 0 8px 18px rgba(var(--vg-accent-rgb, 190,24,93), .3); }
.hp-dock form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: 10px; }
.hp-field { position: relative; }
.hp-field label { position: absolute; top: 9px; left: 18px; font-size: 10.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: ${ACC}; pointer-events: none; }
.hp-field select, .hp-field input { width: 100%; box-sizing: border-box; min-height: 60px; padding: 24px 16px 8px 18px; border-radius: 18px; border: 1px solid ${LINE};
  background-color: rgba(255,255,255,.82); color: #2b1a2e; font-family: inherit; font-size: 15px; font-weight: 600; }
.hp-field select:focus, .hp-field input:focus { outline: 3px solid rgba(var(--vg-accent-rgb, 190,24,93), .25); }
.hp-dock .hp-btn { border-radius: 18px; padding: 0 34px; min-height: 60px; }

/* ticker */
.hp-ticker { margin-top: 64px; overflow: hidden; padding: 16px 0; border-top: 1px solid rgba(var(--vg-accent-rgb, 190,24,93), .16); border-bottom: 1px solid rgba(var(--vg-accent-rgb, 190,24,93), .16); }
.hp-ticker-track { display: flex; width: max-content; animation: hp-tick 42s linear infinite; font-family: 'Playfair Display', Georgia, serif; font-size: 21px; font-style: italic; color: ${ACC_DARK}; }
.hp-ticker-track span { padding-right: 48px; white-space: nowrap; }
.hp-ticker-track span::after { content: "✦"; margin-left: 48px; font-style: normal; font-size: 14px; color: ${ACC}; }
@keyframes hp-tick { to { transform: translateX(-50%); } }

/* features */
.hp-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 36px; }
.hp-head p { color: ${MUTED}; max-width: 460px; line-height: 1.7; margin: 12px 0 0; font-size: 15px; }
.hp-feats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.hp-feat { ${SURF} border-radius: 28px; padding: 34px 30px; display: flex; flex-direction: column; min-height: 300px; transition: transform .4s ease; }
.hp-feat:hover { transform: translateY(-6px); }
.hp-feat .ic { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; ${SURF_STRONG} color: ${ACC_DARK}; }
.hp-feat h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 25px; font-weight: 700; margin: 24px 0 10px; color: ${ACC_DARK}; }
.hp-feat p { font-size: 14.5px; line-height: 1.7; color: ${MUTED}; margin: 0; }
.hp-feat .hp-link { margin-top: auto; padding-top: 18px; }
.hp-feat.dark { background-image: ${BRAND}; border-color: transparent; }
.hp-feat.dark h3, .hp-feat.dark p, .hp-feat.dark .hp-link { color: #fff; }
.hp-feat.dark .ic { background-image: linear-gradient(rgba(255,255,255,.2), rgba(255,255,255,.2)); color: #fff; border-color: rgba(255,255,255,.3); }

/* browse chips */
.hp-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.hp-chip { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 999px; ${SURF_STRONG}
  font-size: 14px; font-weight: 600; color: ${INK}; text-decoration: none; transition: transform .2s ease; }
.hp-chip:hover { transform: translateY(-2px); color: ${ACC_DARK}; }

/* steps */
.hp-steps { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.hp-steps::before { content: ""; position: absolute; top: 42px; left: 12%; right: 12%; height: 2px; background-image: ${BRAND}; opacity: .35; }
.hp-step { ${SURF} border-radius: 26px; padding: 30px 22px; text-align: center; position: relative; }
.hp-step .n { width: 84px; height: 84px; margin: -4px auto 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${SURF_STRONG}
  font-family: 'Playfair Display', Georgia, serif; font-size: 30px; font-weight: 700; color: ${ACC_DARK}; box-shadow: 0 14px 30px rgba(var(--vg-accent-rgb, 190,24,93), .16); }
.hp-step h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 21px; font-weight: 700; margin: 0 0 8px; color: ${ACC_DARK}; }
.hp-step p { font-size: 14px; line-height: 1.65; color: ${MUTED}; margin: 0; }

/* banner */
.hp-banner { position: relative; overflow: hidden; border-radius: 38px; padding: 64px 32px; text-align: center; color: #fff;
  background-color: transparent; background-image: ${BRAND}; box-shadow: 0 40px 90px rgba(var(--vg-accent-rgb, 190,24,93), .3); }
.hp-banner::before { content: ""; position: absolute; width: 380px; height: 380px; border-radius: 50%; background: rgba(255,255,255,.12); top: -170px; right: -110px; }
.hp-banner h2 { position: relative; font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: clamp(30px, 5vw, 54px); line-height: 1.06; margin: 0; color: #fff; }
.hp-banner p { position: relative; margin: 14px auto 28px; max-width: 520px; color: rgba(255,255,255,.92); font-size: 16px; line-height: 1.7; }
.hp-banner .hp-btn { position: relative; background-image: linear-gradient(#fff, #fff); color: ${ACC_DARK}; box-shadow: 0 18px 40px rgba(0,0,0,.2); }

@media (prefers-reduced-motion: reduce) {
  .hp-ticker-track, .hp-float { animation: none; }
}
@media (max-width: 900px) {
  .hp-hero { grid-template-columns: minmax(0, 1fr); gap: 30px; padding-top: 30px; }
  .hp-spot { height: 440px; }
  .hp-spot-back { width: 150px; height: 140px; }
  .hp-spot-main { inset: 28px 0 0 14px; }
  .hp-float.f1 { left: -4px; bottom: 74px; }
  .hp-float.f2 { right: 0; top: 70px; }
  .hp-dock form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hp-dock form .hp-btn { grid-column: 1 / -1; }
  .hp-feats { grid-template-columns: minmax(0, 1fr); }
  .hp-feat { min-height: 0; }
  .hp-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hp-steps::before { display: none; }
  .hp-sec { margin-top: 60px; }
}
@media (max-width: 520px) {
  .hp-dock { padding: 16px; }
  .hp-dock form { grid-template-columns: minmax(0, 1fr); }
  .hp-steps { grid-template-columns: minmax(0, 1fr); }
  .hp-banner { padding: 48px 20px; border-radius: 30px; }
}
`;

const Tick = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

/* ---------------- HERO (with the site hero photo) ---------------- */
export function PremiumHero({ settings, currentUser, heroImage, showTrust, brandName, ready }) {
  const ticks = [1, 2, 3].map((i) => settings[`home_trust_${i}_title`]).filter(Boolean);

  return (
    <header className="hp-hero">
      <style>{CSS}</style>
      <div style={{ opacity: ready ? 1 : 0, transition: "opacity .25s ease" }}>
        {settings.home_show_eyebrow !== "false" && settings.home_eyebrow && (
          <span className="hp-pill"><i />{settings.home_eyebrow}</span>
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

      <div className="hp-spot" aria-hidden="true">
        <div className="hp-spot-back" />
        <div className="hp-spot-main">
          <div
            className="hp-spot-photo"
            style={{
              backgroundImage: `url(${heroImage || ""}), var(--vg-brand, linear-gradient(135deg, #be185d 0%, #7c3aed 100%))`,
            }}
          >
            {brandName && (
              <div className="hp-spot-cap">
                <b>{brandName}</b>
                <span>Where families find forever</span>
              </div>
            )}
          </div>
        </div>
        <div className="hp-float f1"><i>✓</i>Verified profiles</div>
        <div className="hp-float f2"><i>★</i>10 Porutham match</div>
      </div>
    </header>
  );
}

/* ---------------- SEARCH DOCK ---------------- */
export function PremiumDock({ heroSearch, setHeroSearch, onSearch, communities }) {
  return (
    <section className="hp-sec" style={{ marginTop: 10 }}>
      <div className="hp-dock">
        <div className="hp-dock-top">
          <h2>Start your search</h2>
          <div className="hp-seg" role="group" aria-label="Looking for">
            <button type="button" aria-pressed={heroSearch.lookingFor === "female"}
              onClick={() => setHeroSearch({ ...heroSearch, lookingFor: "female" })}>Bride</button>
            <button type="button" aria-pressed={heroSearch.lookingFor === "male"}
              onClick={() => setHeroSearch({ ...heroSearch, lookingFor: "male" })}>Groom</button>
          </div>
        </div>
        <form onSubmit={onSearch}>
          <div className="hp-field">
            <label htmlFor="hd-age">Age</label>
            <select id="hd-age" value={heroSearch.age} onChange={(e) => setHeroSearch({ ...heroSearch, age: e.target.value })}>
              <option value="21-30">21 - 30</option>
              <option value="25-35">25 - 35</option>
              <option value="30-40">30 - 40</option>
            </select>
          </div>
          <div className="hp-field">
            <label htmlFor="hd-loc">Location</label>
            <input id="hd-loc" type="text" placeholder="Any location" value={heroSearch.location}
              onChange={(e) => setHeroSearch({ ...heroSearch, location: e.target.value })} />
          </div>
          <div className="hp-field">
            <label htmlFor="hd-com">Community</label>
            <select id="hd-com" value={heroSearch.community} onChange={(e) => setHeroSearch({ ...heroSearch, community: e.target.value })}>
              <option value="">Any community</option>
              {(communities || []).map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="hp-btn hp-btn-brand">Search</button>
        </form>
      </div>
    </section>
  );
}

/* ---------------- TICKER ---------------- */
export function PremiumTicker({ settings }) {
  const fromAdmin = [1, 2, 3, 4].map((i) => settings[`home_trust_${i}_title`]).filter(Boolean);
  const base = fromAdmin.length > 0 ? fromAdmin : ["Verified profiles", "Privacy you control", "10 Porutham match", "Family friendly"];
  const list = [...base, "Tradition · Trust · Together forever"];
  return (
    <div className="hp-ticker" aria-hidden="true">
      <div className="hp-ticker-track">
        {[...list, ...list].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- FEATURES ---------------- */
export function PremiumFeatures({ isLoggedIn }) {
  return (
    <section className="hp-sec">
      <div className="hp-head">
        <div>
          <div className="hp-kicker">Why us</div>
          <h2 className="hp-h2">Built for families who <em>care</em></h2>
        </div>
        <p>A private, family-friendly matrimony platform for the Tamil community.</p>
      </div>
      <div className="hp-feats">
        <div className="hp-feat">
          <span className="ic">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
          </span>
          <h3>Verified profiles</h3>
          <p>Profiles carry a verified badge after a check by our team.</p>
          <Link to="/search" className="hp-link">Browse profiles →</Link>
        </div>
        <div className="hp-feat">
          <span className="ic">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
          </span>
          <h3>Privacy you control</h3>
          <p>Choose who sees your photo, contact and profile: everyone, verified members, paid members or only your matches.</p>
          <Link to="/privacy" className="hp-link">Read our privacy policy →</Link>
        </div>
        <div className="hp-feat dark">
          <span className="ic">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" /></svg>
          </span>
          <h3>10 Porutham match</h3>
          <p>Add your Rasi and Nakshatra and see how your horoscopes match on any profile. திருமணப் பொருத்தம் உடனுக்குடன்.</p>
          <Link to={isLoggedIn ? "/profile" : "/register"} className="hp-link">{isLoggedIn ? "Add my horoscope →" : "Create my profile →"}</Link>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
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
      <div className="hp-head">
        <div>
          <div className="hp-kicker">How it works</div>
          <h2 className="hp-h2">From hello to <em>forever</em> in four steps</h2>
        </div>
      </div>
      <div className="hp-steps">
        {STEPS.map((s, i) => (
          <div className="hp-step" key={s.t}>
            <div className="n">{i + 1}</div>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FINAL BANNER ---------------- */
export function PremiumCta({ isLoggedIn, brandName }) {
  return (
    <section className="hp-sec" style={{ marginBottom: 40 }}>
      <div className="hp-banner">
        <h2>Your story begins with one profile</h2>
        <p>Simple. Safe. Trusted.{brandName ? ` ${brandName} helps you meet families like yours.` : ""}</p>
        <Link to={isLoggedIn ? "/search" : "/register"} className="hp-btn">
          {isLoggedIn ? "Browse profiles →" : "Create your profile →"}
        </Link>
      </div>
    </section>
  );
}

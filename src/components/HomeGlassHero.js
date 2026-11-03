import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

// 🌿 Transparent "glass" landing sections for the Home page.
// Colours come from the site theme (Admin Settings → Site → Site Theme), e.g. "Emerald",
// through the --vg-* CSS variables, so changing the theme recolours these sections too.
// Pure presentation: all data / handlers are passed in from Home.js.

const ACC = "var(--vg-accent, #15803d)";
const ACC_DARK = "var(--vg-accent-dark, #14532d)";
const INK = "var(--vg-text, #12332a)";
const MUTED = "var(--vg-muted, #3d6354)";
const BRAND = "var(--vg-brand, linear-gradient(135deg, #15803d 0%, #0d9488 100%))";

// Glass surface: text-friendly frosted white. Uses background-IMAGE (not colour) so it stays
// untouched by the site's auto-glass script, and keeps real blur so the photo shows through.
const GLASS = "background-color: transparent; background-image: linear-gradient(rgba(255,255,255,var(--hg-g1, 0.58)), rgba(255,255,255,var(--hg-g2, 0.4))); border: 1px solid rgba(255,255,255,0.75); backdrop-filter: blur(18px) saturate(150%); -webkit-backdrop-filter: blur(18px) saturate(150%);";
const GLASS_STRONG = "background-color: transparent; background-image: linear-gradient(rgba(255,255,255,var(--hg-s1, 0.78)), rgba(255,255,255,var(--hg-s2, 0.66))); border: 1px solid rgba(255,255,255,0.85); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%);";

const CSS = `
.hg-hero { position: relative; width: 100%; box-sizing: border-box; overflow: hidden; isolation: isolate; }
.hg-hero-bg { position: absolute; inset: 0; z-index: 0; background-size: cover; background-position: 70% center; background-repeat: no-repeat; }
.hg-hero-tint { position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background:
    radial-gradient(circle at 12% 28%, var(--vg-orb-1, rgba(74,222,128,.45)) 0 7%, transparent 7.5%),
    radial-gradient(circle at 46% 86%, var(--vg-orb-2, rgba(190,242,100,.45)) 0 5%, transparent 5.5%),
    radial-gradient(circle at 90% 18%, var(--vg-orb-3, rgba(45,212,191,.45)) 0 6%, transparent 6.5%),
    linear-gradient(135deg, var(--vg-grad-a, #ecfdf5), var(--vg-grad-b, #e0f2fe));
  opacity: .30; mix-blend-mode: normal; }
.hg-hero-fade { position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,0) 72%, var(--vg-bg-base, #dcfce7) 100%); }
.hg-wrap { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding: 46px 20px 64px; box-sizing: border-box;
  display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 30px; align-items: center; }
.hg-card { ${GLASS} border-radius: 30px; padding: 30px 30px 24px; box-shadow: 0 22px 60px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,.8); box-sizing: border-box; }
.hg-badge { display: inline-flex; align-items: center; gap: 8px; ${GLASS_STRONG} color: ${ACC_DARK};
  border-radius: 999px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; margin-bottom: 14px; }
.hg-h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; color: ${ACC_DARK}; margin: 0 0 10px;
  font-size: 46px; line-height: 1.1; letter-spacing: -0.5px; }
.hg-sub { color: ${INK}; font-size: 16px; line-height: 1.55; margin: 0 0 4px; }
.hg-tamil { font-family: 'Playfair Display', Georgia, serif; color: ${ACC}; font-size: 15px; margin: 0 0 4px; font-weight: 600; }
.hg-search { margin-top: 20px; ${GLASS} border-radius: 20px; padding: 12px; display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; box-sizing: border-box; }
.hg-field { display: flex; flex-direction: column; border-radius: 14px; padding: 8px 12px; min-width: 0;
  background-color: transparent; background-image: linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)); border: 1px solid rgba(255,255,255,0.9); }
.hg-field label { font-size: 10.5px; color: ${MUTED}; margin-bottom: 2px; letter-spacing: .3px; }
.hg-field select, .hg-field input { border: 0; outline: 0; background: transparent; font-size: 14px; font-weight: 600;
  color: ${INK}; width: 100%; padding: 2px 0; font-family: inherit; min-width: 0; }
.hg-btn { grid-column: 1 / -1; background: ${BRAND}; color: #fff; border: 0; border-radius: 16px;
  padding: 0 28px; height: 52px; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap;
  box-shadow: 0 10px 24px rgba(0,0,0,0.22); font-family: inherit; letter-spacing: .3px; }
.hg-btn:active { transform: translateY(1px); }
.hg-trust { margin-top: 14px; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; }
.hg-trust-item { display: flex; align-items: center; gap: 8px; min-width: 0; }
.hg-trust-ic { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0; ${GLASS_STRONG} }
.hg-trust-t { font-size: 12.5px; font-weight: 700; color: ${ACC_DARK}; line-height: 1.15; }
.hg-trust-d { font-size: 10.5px; color: ${MUTED}; line-height: 1.2; }

/* floating profile cards (right side) */
.hg-float { position: relative; height: 420px; }
@keyframes hgFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.hg-pc { position: absolute; width: 230px; ${GLASS} border-radius: 24px; padding: 12px; box-sizing: border-box;
  box-shadow: 0 18px 44px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,.8); text-decoration: none; color: ${INK}; display: block; }
.hg-pc:nth-child(1) { left: 0; top: 0; }
.hg-pc:nth-child(2) { left: 70px; top: 190px; }
.hg-pc-ph { height: 150px; border-radius: 16px; background-size: cover; background-position: center top; background-color: rgba(255,255,255,.4); margin-bottom: 8px; }
.hg-pc b { display: block; font-size: 15px; color: ${ACC_DARK}; }
.hg-pc small { display: block; font-size: 12px; color: ${MUTED}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hg-pc span { display: block; margin-top: 8px; text-align: center; border-radius: 20px; padding: 7px; font-size: 12.5px; font-weight: 700;
  ${GLASS_STRONG} color: ${ACC_DARK}; }
.hg-quote { color: ${ACC_DARK}; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 26px; line-height: 1.4;
  text-align: right; text-shadow: 0 2px 14px rgba(255,255,255,0.7); }

.hg-features { max-width: 1180px; margin: -30px auto 8px; padding: 0 20px; position: relative; z-index: 3; box-sizing: border-box; }
.hg-features-in { ${GLASS_STRONG} border-radius: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.1);
  display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); padding: 18px 8px; box-sizing: border-box; }
.hg-feat { text-align: center; padding: 4px 10px; border-right: 1px solid rgba(0,0,0,0.07); min-width: 0; }
.hg-feat:last-child { border-right: 0; }
.hg-feat-ic { width: 46px; height: 46px; border-radius: 14px; margin: 0 auto 8px; display: flex; align-items: center;
  justify-content: center; font-size: 22px; ${GLASS_STRONG} }
.hg-feat-t { font-weight: 700; font-size: 14px; color: ${ACC_DARK}; margin-bottom: 2px; }
.hg-feat-d { font-size: 11.5px; color: ${MUTED}; line-height: 1.35; }

@media (max-width: 900px) {
  .hg-wrap { grid-template-columns: minmax(0,1fr); padding: 0 14px 40px; }
  .hg-hero-bg { position: relative; inset: auto; height: 240px; background-position: 70% center; }
  .hg-hero-tint { height: 240px; bottom: auto; }
  .hg-hero-fade { inset: 0 0 auto 0; height: 240px; background: linear-gradient(180deg, rgba(255,255,255,0) 60%, var(--vg-bg-base, #dcfce7) 100%); }
  .hg-wrap { margin-top: -44px; }
  .hg-float { height: auto; display: flex; gap: 10px; }
  .hg-pc, .hg-pc:nth-child(1), .hg-pc:nth-child(2) { position: relative; left: auto; top: auto; flex: 1 1 0; width: auto; min-width: 0; }
  .hg-pc-ph { height: 130px; }
  .hg-quote { display: none; }
  .hg-search { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hg-features-in { grid-template-columns: repeat(3, minmax(0,1fr)); row-gap: 14px; }
  .hg-feat:nth-child(3n) { border-right: 0; }
}
@media (max-width: 560px) {
  .hg-card { padding: 20px 16px 16px; border-radius: 24px; }
  .hg-h1 { font-size: 31px; }
  .hg-sub { font-size: 14px; }
  .hg-trust { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hg-features { padding: 0 12px; margin-top: -18px; }
  .hg-features-in { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hg-feat:nth-child(3n) { border-right: 1px solid rgba(0,0,0,0.07); }
  .hg-feat:nth-child(2n) { border-right: 0; }
  .hg-feat-t { font-size: 13px; }
}
`;

const FEATURES = [
  { icon: "🛡️", title: "Verified Profiles", desc: "Real people, genuine profiles for your peace of mind" },
  { icon: "💞", title: "Smart Matching", desc: "Match score for better compatibility" },
  { icon: "🔒", title: "Privacy First", desc: "You decide who sees your photo and contact" },
  { icon: "👥", title: "All Communities", desc: "Open to all Tamil communities" },
  { icon: "🕑", title: "Dedicated Support", desc: "We are here to help you" },
  { icon: "📱", title: "Mobile Friendly", desc: "Find your match anytime, anywhere" },
];

export function HomeGlassHero({
  settings,
  brandName,
  heroImage,
  heroSearch,
  setHeroSearch,
  onSearch,
  communities,
  showSearch,
  showTrust,
  ready,
  profiles,
}) {
  const trust = [
    { icon: "🛡️", t: settings.home_trust_1_title, d: settings.home_trust_1_desc },
    { icon: "🔍", t: settings.home_trust_2_title, d: settings.home_trust_2_desc },
    { icon: "🔒", t: settings.home_trust_3_title, d: settings.home_trust_3_desc },
    { icon: "❤️", t: settings.home_trust_4_title, d: settings.home_trust_4_desc },
  ].filter((x) => x.t);

  // Two profile cards that keep changing: a random order (fixed per visit), moving ahead every few seconds.
  const withPhoto = (profiles || []).filter((p) => p && p.id && p.photo_url);
  const idsKey = withPhoto.map((p) => p.id).join(",");
  const shuffled = useMemo(() => {
    const a = withPhoto.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);
  const [rot, setRot] = useState(0);
  useEffect(() => {
    if (shuffled.length < 3) return undefined;
    const t = setInterval(() => setRot((n) => n + 2), 5000);
    return () => clearInterval(t);
  }, [shuffled.length]);
  const n = shuffled.length;
  const floating = n === 0 ? [] : n === 1 ? [shuffled[0]] : [shuffled[rot % n], shuffled[(rot + 1) % n]];

  return (
    <section className="hg-hero" data-ready={ready ? "1" : "0"}>
      <style>{CSS}</style>
      <div className="hg-hero-bg" style={{ backgroundImage: `url('${heroImage}')` }} />
      <div className="hg-hero-tint" />
      <div className="hg-hero-fade" />

      <div className="hg-wrap">
        <div className="hg-card">
          <div className="hg-badge">🌿 Trusted Matrimony Platform</div>
          <h1 className="hg-h1">{settings.home_title}</h1>
          {settings.home_show_tamil !== "false" && settings.home_tamil_subtitle && (
            <p className="hg-tamil">{settings.home_tamil_subtitle}</p>
          )}
          {settings.home_show_subtitle !== "false" && (
            <p className="hg-sub">
              {settings.home_subtitle}
              {brandName ? ` Find your special someone with ${brandName}.` : ""}
            </p>
          )}

          {showSearch && (
            <form className="hg-search" onSubmit={onSearch}>
              <div className="hg-field">
                <label htmlFor="hg-for">Looking for</label>
                <select
                  id="hg-for"
                  value={heroSearch.lookingFor}
                  onChange={(e) => setHeroSearch({ ...heroSearch, lookingFor: e.target.value })}
                >
                  <option value="female">Bride</option>
                  <option value="male">Groom</option>
                </select>
              </div>
              <div className="hg-field">
                <label htmlFor="hg-age">Age</label>
                <select
                  id="hg-age"
                  value={heroSearch.age}
                  onChange={(e) => setHeroSearch({ ...heroSearch, age: e.target.value })}
                >
                  <option value="21-30">21 - 30</option>
                  <option value="25-35">25 - 35</option>
                  <option value="30-40">30 - 40</option>
                </select>
              </div>
              <div className="hg-field">
                <label htmlFor="hg-loc">Location</label>
                <input
                  id="hg-loc"
                  type="text"
                  placeholder="Any Location"
                  value={heroSearch.location}
                  onChange={(e) => setHeroSearch({ ...heroSearch, location: e.target.value })}
                />
              </div>
              <div className="hg-field">
                <label htmlFor="hg-com">Community</label>
                <select
                  id="hg-com"
                  value={heroSearch.community}
                  onChange={(e) => setHeroSearch({ ...heroSearch, community: e.target.value })}
                >
                  <option value="">Any Community</option>
                  {(communities || []).map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="hg-btn">
                🔍 Search Profiles
              </button>
            </form>
          )}

          {showTrust && trust.length > 0 && (
            <div className="hg-trust">
              {trust.map((x, i) => (
                <div className="hg-trust-item" key={i}>
                  <div className="hg-trust-ic">{x.icon}</div>
                  <div>
                    <div className="hg-trust-t">{x.t}</div>
                    {x.d && <div className="hg-trust-d">{x.d}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hg-float" aria-hidden={floating.length === 0}>
          {floating.length > 0 ? (
            floating.map((p, i) => (
              <Link key={`${p.id}-${i}`} to={`/profile/${p.id}`} className="hg-pc" style={{ animation: "hgFade .6s ease" }}>
                <div className="hg-pc-ph" style={{ backgroundImage: `url('${p.photo_url}')` }} />
                <b>
                  {p.name || "Member"}
                  {p.age ? `, ${p.age}` : ""}
                </b>
                <small>{[p.occupation, p.location].filter(Boolean).join(" · ") || " "}</small>
                <span>View Profile</span>
              </Link>
            ))
          ) : (
            <div className="hg-quote">
              Real People…
              <br />
              Real Connections…
              <br />
              Lasting Relationships…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function HomeGlassFeatures() {
  return (
    <div className="hg-features">
      <div className="hg-features-in">
        {FEATURES.map((f) => (
          <div className="hg-feat" key={f.title}>
            <div className="hg-feat-ic">{f.icon}</div>
            <div className="hg-feat-t">{f.title}</div>
            <div className="hg-feat-d">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DUO_CSS = `
.hg-duo { max-width: 1180px; margin: 22px auto 0; padding: 0 20px; display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr); gap: 18px; box-sizing: border-box; align-items: start; }
.hg-panel { ${GLASS_STRONG} border-radius: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.1);
  padding: 8px; min-width: 0; box-sizing: border-box; overflow: hidden; }
.hg-panel > div { padding: 12px 10px !important; max-width: none !important; }
@media (max-width: 900px) { .hg-duo { grid-template-columns: minmax(0,1fr); padding: 0 12px; } }
`;

// Featured profiles (left) + Success stories (right), side by side on wide screens, stacked on phones
export function HomeGlassDuo({ main, side }) {
  return (
    <div className="hg-duo">
      <style>{DUO_CSS}</style>
      <div className="hg-panel">{main}</div>
      {side && <div className="hg-panel">{side}</div>}
    </div>
  );
}

export function HomeGlassCta({ isLoggedIn, brandName }) {
  return (
    <section style={{ maxWidth: 1180, margin: "22px auto 0", padding: "0 20px", boxSizing: "border-box" }}>
      <style>{`.hg-cta { ${GLASS_STRONG} border-radius: 24px; padding: 22px 26px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.1); }`}</style>
      <div className="hg-cta">
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--vg-accent-dark, #14532d)",
              lineHeight: 1.2,
            }}
          >
            Find Your Match With Confidence
          </div>
          <div style={{ color: "var(--vg-muted, #3d6354)", fontSize: 13.5, marginTop: 4 }}>
            Simple. Secure. Trusted.{brandName ? ` — ${brandName}` : ""}
          </div>
        </div>
        <Link
          to={isLoggedIn ? "/search" : "/register"}
          style={{
            background: "var(--vg-brand, linear-gradient(135deg, #15803d 0%, #0d9488 100%))",
            color: "#fff",
            textDecoration: "none",
            padding: "14px 26px",
            borderRadius: 16,
            fontWeight: 700,
            fontSize: 15,
            boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
          }}
        >
          {isLoggedIn ? "Browse Profiles →" : "Create Your Profile →"}
        </Link>
      </div>
    </section>
  );
}

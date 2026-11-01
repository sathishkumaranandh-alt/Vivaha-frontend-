import React from "react";
import { Link } from "react-router-dom";

// 🌿 Glass-style landing hero + feature strip (matches the "Ennoda Vivaha" mock).
// Pure presentation: all data / handlers come from Home.js, so nothing else changes.

const GREEN = "#2f7d4f";
const GREEN_DARK = "#1c4d33";
const INK = "#24362c";
const MUTED = "#5d6f63";

const CSS = `
.hg-hero { position: relative; width: 100%; box-sizing: border-box; overflow: hidden; }
.hg-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: 70% center; background-repeat: no-repeat; }
.hg-hero-fade { position: absolute; inset: 0;
  background:
    linear-gradient(90deg, rgba(255,246,230,0.88) 0%, rgba(255,246,230,0.55) 38%, rgba(255,246,230,0) 70%),
    linear-gradient(180deg, rgba(255,246,230,0) 70%, rgba(255,248,238,1) 100%); }
.hg-wrap { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding: 44px 20px 54px; box-sizing: border-box; }
.hg-card { max-width: 640px; background: rgba(255,252,246,0.55); border: 1px solid rgba(255,255,255,0.7);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-radius: 26px; padding: 26px 28px 22px;
  box-shadow: 0 14px 40px rgba(120,80,20,0.14); box-sizing: border-box; }
.hg-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.75); color: ${GREEN_DARK};
  border-radius: 999px; padding: 6px 14px; font-size: 12.5px; font-weight: 600; margin-bottom: 14px; }
.hg-h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; color: ${GREEN_DARK}; margin: 0 0 12px;
  font-size: 46px; line-height: 1.12; letter-spacing: -0.5px; }
.hg-sub { color: ${INK}; font-size: 16px; line-height: 1.55; margin: 0 0 6px; max-width: 520px; }
.hg-tamil { font-family: 'Playfair Display', Georgia, serif; color: ${GREEN}; font-size: 15px; margin: 0 0 4px; }
.hg-search { margin-top: 22px; background: rgba(255,252,246,0.7); border: 1px solid rgba(255,255,255,0.8);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-radius: 20px; padding: 12px;
  display: grid; grid-template-columns: repeat(4, minmax(0,1fr)) auto; gap: 10px; align-items: center;
  box-shadow: 0 10px 30px rgba(120,80,20,0.12); max-width: 1020px; box-sizing: border-box; }
.hg-field { display: flex; flex-direction: column; background: #fff; border-radius: 14px; padding: 8px 12px; min-width: 0;
  border: 1px solid rgba(47,125,79,0.12); }
.hg-field label { font-size: 10.5px; color: ${MUTED}; margin-bottom: 2px; letter-spacing: .3px; }
.hg-field select, .hg-field input { border: 0; outline: 0; background: transparent; font-size: 14px; font-weight: 600;
  color: ${INK}; width: 100%; padding: 2px 0; font-family: inherit; min-width: 0; }
.hg-btn { background: linear-gradient(135deg, #3c9461, ${GREEN_DARK}); color: #fff; border: 0; border-radius: 16px;
  padding: 0 28px; height: 54px; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap;
  box-shadow: 0 8px 20px rgba(28,77,51,0.3); font-family: inherit; }
.hg-btn:active { transform: translateY(1px); }
.hg-trust { margin-top: 12px; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px;
  background: rgba(255,252,246,0.6); border: 1px solid rgba(255,255,255,0.8); border-radius: 18px; padding: 10px 12px;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); max-width: 720px; box-sizing: border-box; }
.hg-trust-item { display: flex; align-items: center; gap: 8px; min-width: 0; }
.hg-trust-ic { width: 32px; height: 32px; border-radius: 50%; background: rgba(47,125,79,0.12); display: flex;
  align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.hg-trust-t { font-size: 12.5px; font-weight: 700; color: ${GREEN_DARK}; line-height: 1.15; }
.hg-trust-d { font-size: 10.5px; color: ${MUTED}; line-height: 1.2; }
.hg-quote { position: absolute; right: 4%; top: 36px; z-index: 2; text-align: right; color: ${GREEN_DARK};
  font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 24px; line-height: 1.35;
  text-shadow: 0 2px 12px rgba(255,255,255,0.6); }
.hg-features { max-width: 1180px; margin: -26px auto 8px; padding: 0 20px; position: relative; z-index: 3; box-sizing: border-box; }
.hg-features-in { background: rgba(255,252,246,0.78); border: 1px solid rgba(255,255,255,0.85); border-radius: 22px;
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 12px 34px rgba(120,80,20,0.12);
  display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); padding: 18px 8px; box-sizing: border-box; }
.hg-feat { text-align: center; padding: 4px 10px; border-right: 1px solid rgba(47,125,79,0.12); min-width: 0; }
.hg-feat:last-child { border-right: 0; }
.hg-feat-ic { width: 46px; height: 46px; border-radius: 14px; margin: 0 auto 8px; display: flex; align-items: center;
  justify-content: center; font-size: 22px; background: linear-gradient(135deg, #fff3dc, #ffe2b8); }
.hg-feat-t { font-weight: 700; font-size: 14px; color: ${GREEN_DARK}; margin-bottom: 2px; }
.hg-feat-d { font-size: 11.5px; color: ${MUTED}; line-height: 1.35; }

@media (max-width: 900px) {
  .hg-quote { display: none; }
  .hg-hero-bg { background-position: 78% center; }
  .hg-hero-fade { background: linear-gradient(180deg, rgba(255,246,230,0.55) 0%, rgba(255,246,230,0.25) 40%, rgba(255,248,238,1) 100%); }
  .hg-search { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hg-search .hg-btn { grid-column: 1 / -1; width: 100%; }
  .hg-features-in { grid-template-columns: repeat(3, minmax(0,1fr)); row-gap: 14px; }
  .hg-feat:nth-child(3n) { border-right: 0; }
}
@media (max-width: 560px) {
  .hg-wrap { padding: 22px 14px 40px; }
  .hg-card { padding: 18px 16px 16px; border-radius: 22px; }
  .hg-h1 { font-size: 31px; }
  .hg-sub { font-size: 14px; }
  .hg-trust { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hg-features { padding: 0 12px; margin-top: -18px; }
  .hg-features-in { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .hg-feat:nth-child(3n) { border-right: 1px solid rgba(47,125,79,0.12); }
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
}) {
  const trust = [
    { icon: "🛡️", t: settings.home_trust_1_title, d: settings.home_trust_1_desc },
    { icon: "🔍", t: settings.home_trust_2_title, d: settings.home_trust_2_desc },
    { icon: "🔒", t: settings.home_trust_3_title, d: settings.home_trust_3_desc },
    { icon: "❤️", t: settings.home_trust_4_title, d: settings.home_trust_4_desc },
  ].filter((x) => x.t);

  return (
    <section className="hg-hero" data-ready={ready ? "1" : "0"}>
      <style>{CSS}</style>
      <div className="hg-hero-bg" style={{ backgroundImage: `url('${heroImage}')` }} />
      <div className="hg-hero-fade" />
      <div className="hg-quote" aria-hidden="true">
        Real People…<br />Real Connections…<br />Lasting Relationships…
      </div>

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
        </div>

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

export function HomeGlassCta({ isLoggedIn, brandName }) {
  return (
    <section style={{ maxWidth: 1180, margin: "22px auto 0", padding: "0 20px", boxSizing: "border-box" }}>
      <div
        style={{
          background: "rgba(255,252,246,0.78)",
          border: "1px solid rgba(255,255,255,0.85)",
          borderRadius: 22,
          padding: "22px 26px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          boxShadow: "0 12px 34px rgba(120,80,20,0.1)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26,
              fontWeight: 700,
              color: GREEN_DARK,
              lineHeight: 1.2,
            }}
          >
            Find Your Match With Confidence
          </div>
          <div style={{ color: MUTED, fontSize: 13.5, marginTop: 4 }}>
            Simple. Secure. Trusted.{brandName ? ` — ${brandName}` : ""}
          </div>
        </div>
        <Link
          to={isLoggedIn ? "/search" : "/register"}
          style={{
            background: "linear-gradient(135deg, #3c9461, " + GREEN_DARK + ")",
            color: "#fff",
            textDecoration: "none",
            padding: "14px 26px",
            borderRadius: 16,
            fontWeight: 700,
            fontSize: 15,
            boxShadow: "0 8px 20px rgba(28,77,51,0.28)",
          }}
        >
          {isLoggedIn ? "Browse Profiles →" : "Create Your Profile →"}
        </Link>
      </div>
    </section>
  );
}

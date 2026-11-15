import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";

// 🔯 Porutham (horoscope match) card for another member's profile.
// Needs both members' Rasi + Nakshatra. Shows nothing when the match cannot be calculated
// (same gender, hidden profile, other person has not added rasi / nakshatra).
const card = {
  marginTop: 16, padding: 16, borderRadius: 16,
  background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.85)",
};
const VERDICT = {
  excellent: { text: "Excellent match 🎉", ta: "மிகவும் பொருத்தம்", color: "#16a34a" },
  average: { text: "Average match", ta: "சுமாரான பொருத்தம்", color: "#d97706" },
  low: { text: "Low match", ta: "பொருத்தம் குறைவு", color: "#dc2626" },
};

export default function PoruthamCard({ profileId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/profile/porutham/${profileId}`);
        if (!res.ok) { if (alive) setData({ available: false, reason: "error" }); return; }
        const json = await res.json();
        if (alive) setData(json);
      } catch (e) { if (alive) setData({ available: false, reason: "error" }); }
    })();
    return () => { alive = false; };
  }, [profileId]);

  if (!data) return null;

  if (!data.available) {
    if (data.reason === "locked") {
      return (
        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--vg-text, #2D1B1B)" }}>🔯 Porutham (Jathagam match)</div>
          <Link to="/subscription" style={{ color: "#D4A017", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            🔒 Upgrade to see your 10 Porutham match
          </Link>
        </div>
      );
    }
    if (data.reason === "my_missing") {
      return (
        <div style={card}>
          <div style={{ fontWeight: 700, color: "var(--vg-text, #2D1B1B)" }}>🔯 Porutham (Jathagam match)</div>
          <div style={{ fontSize: 14, color: "var(--vg-muted, #666)", margin: "4px 0 8px" }}>
            Add your Rasi and Nakshatra to see how well your horoscopes match.
          </div>
          <Link to="/profile" style={{ color: "var(--vg-accent, #8B0A2E)", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            Add my Rasi &amp; Nakshatra →
          </Link>
        </div>
      );
    }
    const MSG = {
      their_missing: "This member has not added Rasi / Nakshatra yet, so Porutham cannot be calculated.",
      same_gender: "Porutham is calculated only between a bride and a groom profile.",
      hidden: "Porutham is not available for this profile.",
      error: "Porutham could not be loaded right now. Please try again later.",
    };
    if (!MSG[data.reason]) return null;
    return (
      <div style={card}>
        <div style={{ fontWeight: 700, color: "var(--vg-text, #2D1B1B)" }}>🔯 Porutham (Jathagam match)</div>
        <div style={{ fontSize: 14, color: "var(--vg-muted, #666)", marginTop: 4 }}>{MSG[data.reason]}</div>
      </div>
    );
  }

  const v = VERDICT[data.verdict] || VERDICT.average;
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, color: "var(--vg-text, #2D1B1B)" }}>🔯 Porutham (Jathagam match)</div>
        <div style={{ fontWeight: 800, color: v.color, fontSize: 18 }}>{data.score} / {data.total}</div>
      </div>
      <div style={{ color: v.color, fontWeight: 600, fontSize: 14, marginTop: 2 }}>{v.text} · {v.ta}</div>
      <div style={{ fontSize: 12, color: "var(--vg-muted, #666)", margin: "6px 0 10px" }}>
        Bride: {data.girl.nakshatra} · {data.girl.rasi} &nbsp;|&nbsp; Groom: {data.boy.nakshatra} · {data.boy.rasi}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        {data.items.map((it) => (
          <div key={it.key} title={it.note} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
            background: it.ok ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.08)",
            border: `1px solid ${it.ok ? "rgba(22,163,74,0.35)" : "rgba(220,38,38,0.30)"}`,
          }}>
            <span style={{ fontWeight: 800, color: it.ok ? "#16a34a" : "#dc2626" }}>{it.ok ? "✓" : "✗"}</span>
            <span style={{ fontSize: 13, color: "var(--vg-text, #2D1B1B)" }}>{it.en} <span style={{ color: "var(--vg-muted, #666)" }}>· {it.ta}</span></span>
          </div>
        ))}
      </div>
      {!data.rajjuOk && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
          ⚠️ Rajju porutham does not match. Many families treat this as important, so please check with your astrologer.
        </div>
      )}
      <div style={{ marginTop: 10, fontSize: 11, color: "var(--vg-muted, #777)", lineHeight: 1.5 }}>
        This is an automatic, indicative match from Nakshatra and Rasi only. Please confirm with your family astrologer before deciding.
      </div>
    </div>
  );
        }
  

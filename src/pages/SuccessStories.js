import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "../utils/toast";

const STORIES = [
  {
    id: 1,
    initials: "PK",
    name: "Priya & Karthik",
    location: "Chennai",
    weddingDate: "Married in March 2025",
    quote:
      "We matched on Vivaha within the first week of joining. The algorithm understood exactly what we were looking for. Six months later, we were married. Thank you, Vivaha!",
    badge: "⭐ Most Loved",
    color: "#8B0A2E",
  },
  {
    id: 2,
    initials: "DA",
    name: "Divya & Ashwin",
    location: "Bangalore",
    weddingDate: "Married in July 2024",
    quote:
      "I loved how easy it was to filter profiles by community and location. Ashwin and I clicked instantly during our first chat. Our families are so happy!",
    badge: "💒 2 Years Together",
    color: "#D4A017",
  },
  {
    id: 3,
    initials: "MR",
    name: "Meena & Raj",
    location: "Coimbatore",
    weddingDate: "Married in December 2024",
    quote:
      "The verified badges gave me confidence in the profiles. Raj was the 3rd person I sent an interest to, and now we're happily married. Worth every minute!",
    badge: "🌟 Verified Match",
    color: "#16a34a",
  },
  {
    id: 4,
    initials: "SK",
    name: "Sneha & Karthik",
    location: "Madurai",
    weddingDate: "Married in May 2025",
    quote:
      "We were both hesitant about matrimony sites. But Vivaha felt safe, and the interest-first approach made it respectful. Our engagement was at a temple 4 months later.",
    badge: "🕉️ Traditional Match",
    color: "#7c3aed",
  },
  {
    id: 5,
    initials: "AV",
    name: "Anjali & Vikram",
    location: "Trichy",
    weddingDate: "Married in February 2025",
    quote:
      "My mother found Karthik on Vivaha and showed me his profile. I sent an interest, he accepted, and the rest is history. So grateful to this platform!",
    badge: "👨‍👩‍👧 Family-Approved",
    color: "#ea580c",
  },
  {
    id: 6,
    initials: "LM",
    name: "Lakshmi & Manoj",
    location: "Salem",
    weddingDate: "Married in September 2024",
    quote:
      "Long distance was a concern until we matched. Vivaha's chat made it easy to stay connected during our 8-month courtship. Now we're inseparable!",
    badge: "💌 8-Month Courtship",
    color: "#0891b2",
  },
];

const STATS = [
  { num: "2,500+", label: "Successful Matches" },
  { num: "500+", label: "Weddings in 2025" },
  { num: "4.8★", label: "Average Rating" },
  { num: "98%", label: "Would Recommend" },
];

function SuccessStories() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    brideName: "",
    groomName: "",
    location: "",
    story: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brideName || !form.groomName || !form.story) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    // Simulate submission (replace with backend later)
    setTimeout(() => {
      toast.success("Thank you! We'll review and publish your story soon 💕");
      setShowForm(false);
      setForm({ brideName: "", groomName: "", location: "", story: "" });
      setSubmitting(false);
    }, 1000);
  };

  const S = {
    page: { background: "#FFF9F5", minHeight: "100vh" },

    // HERO
    hero: {
      background:
        "linear-gradient(135deg, rgba(139,10,46,0.95) 0%, rgba(45,10,30,0.9) 100%), url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: isMobile ? "60px 20px" : "100px 32px",
      textAlign: "center",
      color: "white",
      position: "relative",
      overflow: "hidden",
    },
    heroInner: { maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 2 },
    heroEyebrow: {
      color: "#D4A017",
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: "4px",
      textTransform: "uppercase",
      marginBottom: "16px",
    },
    heroTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "32px" : "52px",
      fontWeight: 900,
      letterSpacing: "-1.5px",
      lineHeight: 1.15,
      marginBottom: "20px",
    },
    heroItalic: {
      color: "#D4A017",
      fontStyle: "italic",
      display: "block",
    },
    heroSubtitle: {
      fontSize: isMobile ? "15px" : "18px",
      lineHeight: 1.7,
      opacity: 0.9,
      maxWidth: "600px",
      margin: "0 auto 32px",
      fontWeight: 300,
    },
    heroCTA: {
      background: "linear-gradient(135deg, #D4A017, #b8860b)",
      color: "#8B0A2E",
      padding: "14px 36px",
      borderRadius: "40px",
      textDecoration: "none",
      fontWeight: 800,
      fontSize: "15px",
      display: "inline-block",
      boxShadow: "0 10px 30px rgba(212,160,23,0.4)",
      letterSpacing: "0.5px",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
    },

    // STATS BAR
    statsBar: {
      maxWidth: "1000px",
      margin: "-40px auto 0",
      padding: "0 20px",
      position: "relative",
      zIndex: 5,
    },
    statsCard: {
      background: "white",
      borderRadius: "20px",
      padding: isMobile ? "24px 16px" : "32px",
      boxShadow: "0 20px 60px rgba(139,10,46,0.12)",
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: "20px",
      border: "1px solid #f0e0e0",
      position: "relative",
      overflow: "hidden",
    },
    statNum: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "24px" : "32px",
      fontWeight: 900,
      color: "#8B0A2E",
      letterSpacing: "-0.5px",
      lineHeight: 1,
      marginBottom: "6px",
      textAlign: "center",
    },
    statLabel: {
      fontSize: "11px",
      color: "#8a6b6b",
      textTransform: "uppercase",
      letterSpacing: "1.5px",
      fontWeight: 600,
      textAlign: "center",
    },

    // SECTION
    section: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "50px 16px" : "80px 32px",
    },
    sectionHead: {
      textAlign: "center",
      marginBottom: isMobile ? "36px" : "56px",
    },
    sectionEyebrow: {
      color: "#D4A017",
      fontSize: "11px",
      fontWeight: 800,
      letterSpacing: "4px",
      textTransform: "uppercase",
      marginBottom: "12px",
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "26px" : "38px",
      fontWeight: 900,
      color: "#8B0A2E",
      letterSpacing: "-1px",
      marginBottom: "12px",
      lineHeight: 1.2,
    },
    sectionItalic: { color: "#D4A017", fontStyle: "italic" },
    sectionSub: {
      color: "#8a6b6b",
      fontSize: isMobile ? "14px" : "16px",
      maxWidth: "560px",
      margin: "0 auto",
      lineHeight: 1.7,
    },

    // GRID
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))",
      gap: "24px",
    },

    // CARD
    card: {
      background: "white",
      borderRadius: "20px",
      padding: "28px 24px",
      border: "1px solid #f0e0e0",
      boxShadow: "0 4px 20px rgba(139,10,46,0.06)",
      position: "relative",
      transition: "transform 0.3s, box-shadow 0.3s",
    },
    cardBadge: {
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "#FDF2F6",
      color: "#8B0A2E",
      fontSize: "10px",
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: "12px",
      border: "1px solid #f0e0e0",
    },
    cardQuote: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "60px",
      color: "#D4A017",
      opacity: 0.3,
      lineHeight: 1,
      marginBottom: "8px",
    },
    cardText: {
      fontSize: "14px",
      color: "#2D1B1B",
      lineHeight: 1.75,
      fontStyle: "italic",
      marginBottom: "20px",
      minHeight: "100px",
    },
    cardAuthor: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      paddingTop: "18px",
      borderTop: "1px solid #f0e0e0",
    },
    avatar: {
      width: "52px",
      height: "52px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      color: "#D4A017",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Playfair Display', serif",
      fontWeight: 900,
      fontSize: "18px",
      flexShrink: 0,
    },
    authorName: {
      fontWeight: 700,
      color: "#8B0A2E",
      fontFamily: "'Playfair Display', serif",
      fontSize: "15px",
      marginBottom: "2px",
    },
    authorMeta: {
      fontSize: "11px",
      color: "#8a6b6b",
    },

    // FINAL CTA
    finalCTA: {
      background: "linear-gradient(135deg, #8B0A2E 0%, #4a0620 100%)",
      padding: isMobile ? "60px 20px" : "80px 32px",
      textAlign: "center",
      color: "white",
    },
    ctaTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "26px" : "38px",
      fontWeight: 900,
      letterSpacing: "-1px",
      marginBottom: "14px",
    },
    ctaSub: {
      fontSize: isMobile ? "14px" : "16px",
      opacity: 0.85,
      maxWidth: "520px",
      margin: "0 auto 32px",
      lineHeight: 1.7,
    },

    // FORM
    formCard: {
      background: "white",
      borderRadius: "20px",
      padding: isMobile ? "24px 20px" : "40px 36px",
      maxWidth: "640px",
      margin: "0 auto",
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    },
    formTitle: {
      fontFamily: "'Playfair Display', serif",
      color: "#8B0A2E",
      fontSize: "22px",
      fontWeight: 700,
      marginBottom: "6px",
      textAlign: "center",
    },
    formSub: {
      color: "#8a6b6b",
      fontSize: "13px",
      textAlign: "center",
      marginBottom: "24px",
    },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: 700,
      color: "#555",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "6px",
      marginTop: "14px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      background: "#FFF9F5",
      boxSizing: "border-box",
    },
    formBtns: {
      display: "flex",
      gap: "10px",
      marginTop: "24px",
    },
    submitBtn: {
      flex: 1,
      background: "#8B0A2E",
      color: "white",
      border: "none",
      padding: "14px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    cancelBtn: {
      background: "#f3f4f6",
      color: "#374151",
      border: "none",
      padding: "14px 22px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
    },
  };

  return (
    <div style={S.page}>
      {/* HERO */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.heroEyebrow}>Real Couples · Real Love</div>
          <h1 style={S.heroTitle}>
            Stories That Started
            <span style={S.heroItalic}>With a Single Hello</span>
          </h1>
          <p style={S.heroSubtitle}>
            Thousands of couples have found their perfect life partner on
            Vivaha Matrimony. Here are some of our favourite love stories.
          </p>
          <button
            style={S.heroCTA}
            onClick={() => {
              setShowForm(true);
              setTimeout(() => {
                document.getElementById("share-form")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            💕 Share Your Story
          </button>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={S.statsBar}>
        <div style={S.statsCard}>
          {STATS.map((s) => (
            <div key={s.label}>
              <div style={S.statNum}>{s.num}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STORIES GRID */}
      <section style={S.section}>
        <div style={S.sectionHead}>
          <div style={S.sectionEyebrow}>Success Stories</div>
          <h2 style={S.sectionTitle}>
            Couples Who Found Their
            <span style={S.sectionItalic}> Forever</span>
          </h2>
          <p style={S.sectionSub}>
            Every story here is a family that started right here on Vivaha.
          </p>
        </div>

        <div style={S.grid}>
          {STORIES.map((story) => (
            <div
              key={story.id}
              style={S.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(139,10,46,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,10,46,0.06)";
              }}
            >
              <div style={S.cardBadge}>{story.badge}</div>
              <div style={S.cardQuote}>"</div>
              <p style={S.cardText}>{story.quote}</p>
              <div style={S.cardAuthor}>
                <div
                  style={{
                    ...S.avatar,
                    background: `linear-gradient(135deg, ${story.color}, ${story.color}dd)`,
                  }}
                >
                  {story.initials}
                </div>
                <div>
                  <div style={S.authorName}>{story.name}</div>
                  <div style={S.authorMeta}>
                    📍 {story.location} · {story.weddingDate}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SHARE YOUR STORY FORM */}
      <section
        id="share-form"
        style={{ ...S.finalCTA, background: "linear-gradient(135deg, #FFF9F5, #FDF2F6)" }}
      >
        {!showForm ? (
          <>
            <h2 style={{ ...S.ctaTitle, color: "#8B0A2E" }}>
              Found Your Match on Vivaha?
            </h2>
            <p style={{ ...S.ctaSub, color: "#8a6b6b" }}>
              Share your love story with us and inspire thousands of families
              looking for their perfect partner.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                ...S.heroCTA,
                background: "linear-gradient(135deg, #8B0A2E, #a01438)",
                color: "#D4A017",
                boxShadow: "0 10px 30px rgba(139,10,46,0.4)",
              }}
            >
              💌 Share Your Story
            </button>
          </>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={S.formCard}
          >
            <h3 style={S.formTitle}>Share Your Love Story 💑</h3>
            <p style={S.formSub}>
              We'll review and publish it on this page within 3-5 days.
            </p>

            <label style={S.label}>Bride's Name *</label>
            <input
              style={S.input}
              type="text"
              placeholder="e.g. Priya"
              value={form.brideName}
              onChange={(e) => setForm({ ...form, brideName: e.target.value })}
              required
            />

            <label style={S.label}>Groom's Name *</label>
            <input
              style={S.input}
              type="text"
              placeholder="e.g. Karthik"
              value={form.groomName}
              onChange={(e) => setForm({ ...form, groomName: e.target.value })}
              required
            />

            <label style={S.label}>Location</label>
            <input
              style={S.input}
              type="text"
              placeholder="e.g. Chennai, Tamil Nadu"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <label style={S.label}>Your Story *</label>
            <textarea
              style={{ ...S.input, resize: "vertical", minHeight: "120px" }}
              placeholder="How did you meet? What do you love most about each other? Share your journey..."
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
              rows={5}
              maxLength={800}
              required
            />
            <p style={{ fontSize: "11px", color: "#888", textAlign: "right", margin: "4px 0 0 0" }}>
              {form.story.length}/800
            </p>

            <div style={S.formBtns}>
              <button type="submit" disabled={submitting} style={{ ...S.submitBtn, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Sending..." : "💌 Submit Story"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={S.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* FINAL CTA */}
      <section style={S.finalCTA}>
        <h2 style={S.ctaTitle}>
          Ready to Write Your Own Story?
        </h2>
        <p style={S.ctaSub}>
          Join thousands of families who found their perfect match on Vivaha.
          Your story could be next.
        </p>
        <Link
          to="/register"
          style={{
            ...S.heroCTA,
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          💑 Create Free Account
        </Link>
      </section>
    </div>
  );
}

export default SuccessStories;
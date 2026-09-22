import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const community = localStorage.getItem("community");
        const url = community
          ? `${BACKEND_URL}/profile/search?community=${community}`
          : `${BACKEND_URL}/profile/search`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const shuffled = (data.results || []).sort(() => 0.5 - Math.random());
          setFeatured(shuffled.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to load featured:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div style={{ fontFamily: "inherit" }}>

      {/* ============ HERO ============ */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "white",
          padding: isMobile ? "50px 20px" : "80px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: isMobile ? "28px" : "42px",
              fontWeight: "bold",
              margin: "0 0 14px 0",
              lineHeight: "1.2",
            }}
          >
            Find Your Perfect Life Partner 💑
          </h1>
          <p
            style={{
              fontSize: isMobile ? "15px" : "18px",
              lineHeight: "1.6",
              opacity: 0.95,
              marginBottom: isMobile ? "24px" : "32px",
            }}
          >
            India's most trusted matrimony platform for finding meaningful,
            lifelong relationships.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <Link
              to="/register"
              style={{
                background: "white",
                color: "#1e3a8a",
                padding: isMobile ? "12px 24px" : "14px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: isMobile ? "15px" : "16px",
                display: "inline-block",
              }}
            >
              Register Free
            </Link>
            <Link
              to="/search"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                padding: isMobile ? "12px 24px" : "14px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: isMobile ? "15px" : "16px",
                border: "2px solid white",
                display: "inline-block",
              }}
            >
              Browse Profiles
            </Link>
          </div>
          <p style={{ fontSize: isMobile ? "12px" : "14px", opacity: 0.85 }}>
            🔒 100% Secure • ✅ Verified Profiles • 💯 Free to Start
          </p>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section
        style={{
          background: "white",
          padding: isMobile ? "28px 20px" : "40px 20px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(140px, 1fr))",
            gap: isMobile ? "16px" : "20px",
          }}
        >
          <Stat number="10,000+" label="Happy Members" isMobile={isMobile} />
          <Stat number="2,500+" label="Successful Matches" isMobile={isMobile} />
          <Stat number="500+" label="Weddings This Year" isMobile={isMobile} />
          <Stat number="4.8★" label="User Rating" isMobile={isMobile} />
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section style={sectionStyle(isMobile)}>
        <h2 style={sectionTitleStyle(isMobile)}>How Vivaha Works</h2>
        <p style={sectionSubtitleStyle(isMobile)}>
          Finding your perfect match is simple
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? "16px" : "24px",
          }}
        >
          <StepCard
            number="1"
            title="Create Your Profile"
            description="Sign up for free and share your background, interests, and preferences."
            icon="📝"
            isMobile={isMobile}
          />
          <StepCard
            number="2"
            title="Browse & Match"
            description="Use our smart matching to discover compatible partners from your community."
            icon="🔍"
            isMobile={isMobile}
          />
          <StepCard
            number="3"
            title="Connect & Marry"
            description="Chat with your matches, involve families, and take the beautiful next step."
            icon="💍"
            isMobile={isMobile}
          />
        </div>
      </section>

      {/* ============ FEATURED PROFILES ============ */}
      <section
        style={{
          ...sectionStyle(isMobile),
          background: "#f8fafc",
        }}
      >
        <h2 style={sectionTitleStyle(isMobile)}>Featured Profiles</h2>
        <p style={sectionSubtitleStyle(isMobile)}>
          Meet some of our recent members
        </p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            Loading profiles...
          </p>
        ) : featured.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No profiles yet. Be the first to{" "}
            <Link to="/register" style={{ color: "#1e3a8a", fontWeight: "bold" }}>
              register
            </Link>
            !
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)"
                : "repeat(auto-fill, minmax(160px, 1fr))",
              gap: isMobile ? "12px" : "20px",
            }}
          >
            {featured.map((user) => (
              <FeaturedCard key={user.id} user={user} isMobile={isMobile} />
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: isMobile ? "24px" : "30px" }}>
          <Link
            to="/search"
            style={{
              background: "white",
              color: "#1e3a8a",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "15px",
              display: "inline-block",
              border: "2px solid #1e3a8a",
            }}
          >
            View All Profiles →
          </Link>
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section style={sectionStyle(isMobile)}>
        <h2 style={sectionTitleStyle(isMobile)}>Why Choose Vivaha?</h2>
        <p style={sectionSubtitleStyle(isMobile)}>
          Trusted by thousands of Indian families
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(220px, 1fr))",
            gap: isMobile ? "12px" : "20px",
          }}
        >
          <FeatureCard
            icon="🔒"
            title="100% Secure"
            description="Bank-level security"
            isMobile={isMobile}
          />
          <FeatureCard
            icon="✅"
            title="Verified"
            description="Authentic profiles"
            isMobile={isMobile}
          />
          <FeatureCard
            icon="🧠"
            title="Smart Match"
            description="AI-powered matches"
            isMobile={isMobile}
          />
          <FeatureCard
            icon="💬"
            title="Private Chat"
            description="Secure messaging"
            isMobile={isMobile}
          />
        </div>
      </section>

      {/* ============ SUCCESS STORIES ============ */}
      <section
        style={{
          ...sectionStyle(isMobile),
          background: "#f8fafc",
        }}
      >
        <h2 style={sectionTitleStyle(isMobile)}>Success Stories 💕</h2>
        <p style={sectionSubtitleStyle(isMobile)}>
          Real couples who found their soulmate
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: isMobile ? "14px" : "24px",
          }}
        >
          <TestimonialCard
            name="Priya & Karthik"
            location="Chennai"
            quote="We matched 6 months ago. Now we're happily married!"
            initials="PK"
            isMobile={isMobile}
          />
          <TestimonialCard
            name="Divya & Ashwin"
            location="Bangalore"
            quote="Found my soulmate within a month. The filters are amazing!"
            initials="DA"
            isMobile={isMobile}
          />
          <TestimonialCard
            name="Meena & Raj"
            location="Mumbai"
            quote="The verified profiles gave me confidence. Our families clicked instantly."
            initials="MR"
            isMobile={isMobile}
          />
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "white",
          padding: isMobile ? "50px 20px" : "60px 20px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: isMobile ? "24px" : "32px", marginBottom: "12px" }}>
          Ready to Find Your Soulmate?
        </h2>
        <p
          style={{
            opacity: 0.9,
            marginBottom: "24px",
            fontSize: isMobile ? "15px" : "17px",
          }}
        >
          Join Vivaha today and start your journey.
        </p>
        <Link
          to="/register"
          style={{
            background: "white",
            color: "#1e3a8a",
            padding: isMobile ? "12px 24px" : "14px 32px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: isMobile ? "15px" : "17px",
            display: "inline-block",
          }}
        >
          Create Free Account
        </Link>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        style={{
          background: "#0f172a",
          color: "white",
          padding: isMobile ? "24px 16px" : "30px 20px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 6px 0", fontSize: isMobile ? "12px" : "14px" }}>
          © {new Date().getFullYear()} Vivaha Matrimony. All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>
          Made with ❤️ for finding lifelong partners
        </p>
      </footer>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Stat({ number, label, isMobile }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: isMobile ? "22px" : "28px",
          fontWeight: "bold",
          color: "#1e3a8a",
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: isMobile ? "12px" : "14px",
          color: "#666",
          marginTop: "4px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon, isMobile }) {
  return (
    <div
      style={{
        background: "white",
        padding: isMobile ? "22px 18px" : "24px",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: isMobile ? "36px" : "42px", marginBottom: "10px" }}>
        {icon}
      </div>
      <div
        style={{
          display: "inline-block",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: "#1e3a8a",
          color: "white",
          lineHeight: "30px",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {number}
      </div>
      <h3
        style={{
          margin: "10px 0 6px 0",
          color: "#1e3a8a",
          fontSize: isMobile ? "16px" : "18px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "#666",
          lineHeight: "1.6",
          margin: 0,
          fontSize: isMobile ? "13px" : "14px",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function FeaturedCard({ user, isMobile }) {
  return (
    <div
      style={{
        background: "white",
        padding: isMobile ? "14px 8px" : "20px 12px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: isMobile ? "56px" : "70px",
          height: isMobile ? "56px" : "70px",
          borderRadius: "50%",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMobile ? "26px" : "32px",
          margin: "0 auto 8px auto",
          overflow: "hidden",
        }}
      >
        {user.photo_url ? (
          <img
            src={user.photo_url}
            alt={user.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          "👤"
        )}
      </div>
      <h3
        style={{
          margin: "6px 0 2px 0",
          fontSize: isMobile ? "14px" : "17px",
          color: "#1e3a8a",
        }}
      >
        {user.name || "Anonymous"}
      </h3>
      <p
        style={{
          margin: 0,
          color: "#666",
          fontSize: isMobile ? "11px" : "14px",
        }}
      >
        {user.age ? `${user.age} yrs` : ""}
        {user.age && user.location ? " • " : ""}
        {user.location ? user.location.substring(0, 12) : ""}
      </p>
      {user.religion && (
        <p
          style={{
            margin: "4px 0 0 0",
            color: "#888",
            fontSize: isMobile ? "10px" : "13px",
          }}
        >
          {user.religion}
        </p>
      )}
    </div>
  );
}

function TestimonialCard({ name, location, quote, initials, isMobile }) {
  return (
    <div
      style={{
        background: "white",
        padding: isMobile ? "20px 16px" : "24px",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "#1e3a8a",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: isMobile ? "16px" : "20px",
          margin: "0 auto 12px auto",
        }}
      >
        {initials}
      </div>
      <p
        style={{
          fontStyle: "italic",
          color: "#444",
          lineHeight: "1.6",
          marginBottom: "14px",
          fontSize: isMobile ? "13px" : "14px",
        }}
      >
        "{quote}"
      </p>
      <p
        style={{
          fontWeight: "bold",
          margin: 0,
          color: "#1e3a8a",
          fontSize: isMobile ? "13px" : "15px",
        }}
      >
        {name}
      </p>
      <p
        style={{
          color: "#888",
          fontSize: isMobile ? "11px" : "13px",
          margin: "4px 0 0 0",
        }}
      >
        📍 {location}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description, isMobile }) {
  return (
    <div
      style={{
        background: "white",
        padding: isMobile ? "18px 12px" : "24px",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: isMobile ? "32px" : "42px", marginBottom: "6px" }}>
        {icon}
      </div>
      <h3
        style={{
          margin: "6px 0",
          color: "#1e3a8a",
          fontSize: isMobile ? "14px" : "17px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "#666",
          lineHeight: "1.5",
          margin: 0,
          fontSize: isMobile ? "12px" : "13px",
        }}
      >
        {description}
      </p>
    </div>
  );
}

// ============================================================
// STYLE HELPERS
// ============================================================
function sectionStyle(isMobile) {
  return {
    padding: isMobile ? "40px 16px" : "60px 20px",
    maxWidth: "1100px",
    margin: "0 auto",
  };
}

function sectionTitleStyle(isMobile) {
  return {
    fontSize: isMobile ? "24px" : "32px",
    textAlign: "center",
    color: "#1e3a8a",
    margin: "0 0 8px 0",
  };
}

function sectionSubtitleStyle(isMobile) {
  return {
    textAlign: "center",
    color: "#666",
    fontSize: isMobile ? "14px" : "16px",
    marginBottom: isMobile ? "26px" : "40px",
  };
}

export default Home;
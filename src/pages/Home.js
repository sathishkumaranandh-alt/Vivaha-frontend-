import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch a few profiles to feature on the home page
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch(`${BACKEND_URL}/profile/search`);
        if (res.ok) {
          const data = await res.json();
          // Shuffle and take 6
          const shuffled = (data.results || []).sort(() => 0.5 - Math.random());
          setFeatured(shuffled.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to load featured profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section style={heroStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            Find Your Perfect Life Partner 💑
          </h1>
          <p style={heroSubtitleStyle}>
            India's most trusted matrimony platform for finding meaningful,
            lifelong relationships. Join thousands of happy couples who found
            love with Vivaha.
          </p>
          <div style={ctaContainerStyle}>
            <Link to="/register" style={primaryButtonStyle}>
              Register Free
            </Link>
            <Link to="/search" style={secondaryButtonStyle}>
              Browse Profiles
            </Link>
          </div>
          <p style={heroSmallTextStyle}>
            🔒 100% Secure • ✅ Verified Profiles • 💯 Free to Start
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STATS BAR */}
      {/* ============================================================ */}
      <section style={statsStyle}>
        <div style={statsGridStyle}>
          <Stat number="10,000+" label="Happy Members" />
          <Stat number="2,500+" label="Successful Matches" />
          <Stat number="500+" label="Weddings This Year" />
          <Stat number="4.8★" label="User Rating" />
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================================ */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>How Vivaha Works</h2>
        <p style={sectionSubtitleStyle}>
          Finding your perfect match is simple — here's how
        </p>

        <div style={threeColGridStyle}>
          <StepCard
            number="1"
            title="Create Your Profile"
            description="Sign up for free and tell us about yourself — your background, interests, and what you're looking for."
            icon="📝"
          />
          <StepCard
            number="2"
            title="Browse & Match"
            description="Use our smart matching algorithm to discover compatible partners based on your preferences."
            icon="🔍"
          />
          <StepCard
            number="3"
            title="Connect & Marry"
            description="Chat with your matches, involve families, and take the beautiful next step together."
            icon="💍"
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURED PROFILES */}
      {/* ============================================================ */}
      <section style={{ ...sectionStyle, background: "#f8fafc" }}>
        <h2 style={sectionTitleStyle}>Featured Profiles</h2>
        <p style={sectionSubtitleStyle}>
          Meet some of our recent members looking for a life partner
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
          <div style={featuredGridStyle}>
            {featured.map((user) => (
              <FeaturedCard key={user.id} user={user} />
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <Link to="/search" style={primaryButtonStyle}>
            View All Profiles →
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SUCCESS STORIES */}
      {/* ============================================================ */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Success Stories 💕</h2>
        <p style={sectionSubtitleStyle}>
          Real couples who found their soulmate on Vivaha
        </p>

        <div style={threeColGridStyle}>
          <TestimonialCard
            name="Priya & Karthik"
            location="Chennai"
            quote="We matched on Vivaha 6 months ago. Now we're happily married! The matching algorithm really works."
            initials="PK"
          />
          <TestimonialCard
            name="Divya & Ashwin"
            location="Bangalore"
            quote="I love how easy it was to filter profiles by religion and location. Found my soulmate within a month!"
            initials="DA"
          />
          <TestimonialCard
            name="Meena & Raj"
            location="Mumbai"
            quote="The verified profiles gave me confidence. Our families met within weeks and we clicked instantly."
            initials="MR"
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* WHY CHOOSE US */}
      {/* ============================================================ */}
      <section style={{ ...sectionStyle, background: "#f8fafc" }}>
        <h2 style={sectionTitleStyle}>Why Choose Vivaha?</h2>
        <p style={sectionSubtitleStyle}>
          Trusted by thousands of Indian families
        </p>

        <div style={fourColGridStyle}>
          <FeatureCard
            icon="🔒"
            title="100% Secure"
            description="Your data is encrypted and protected with bank-level security."
          />
          <FeatureCard
            icon="✅"
            title="Verified Profiles"
            description="Every profile is manually verified to ensure authenticity."
          />
          <FeatureCard
            icon="🧠"
            title="Smart Matching"
            description="Our AI-powered algorithm finds the most compatible matches."
          />
          <FeatureCard
            icon="💬"
            title="Private Chat"
            description="Connect safely with matches in our secure chat system."
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA */}
      {/* ============================================================ */}
      <section style={finalCTAStyle}>
        <h2 style={{ fontSize: "32px", marginBottom: "12px" }}>
          Ready to Find Your Soulmate?
        </h2>
        <p style={{ opacity: 0.9, marginBottom: "24px", fontSize: "17px" }}>
          Join Vivaha today and start your journey to a happy married life.
        </p>
        <Link to="/register" style={finalButtonStyle}>
          Create Free Account
        </Link>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer style={footerStyle}>
        <p style={{ margin: "0 0 6px 0" }}>
          © {new Date().getFullYear()} Vivaha Matrimony. All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.7 }}>
          Made with ❤️ for finding lifelong partners
        </p>
      </footer>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Stat({ number, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1e3a8a" }}>
        {number}
      </div>
      <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
        {label}
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: "42px", marginBottom: "12px" }}>{icon}</div>
      <div style={stepNumberStyle}>{number}</div>
      <h3 style={{ margin: "12px 0 8px 0", color: "#1e3a8a" }}>{title}</h3>
      <p style={{ color: "#666", lineHeight: "1.6", margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

function FeaturedCard({ user }) {
  return (
    <div style={featuredCardStyle}>
      <div style={avatarStyle}>
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
      <h3 style={{ margin: "8px 0 4px 0", fontSize: "17px", color: "#1e3a8a" }}>
        {user.name || "Anonymous"}
      </h3>
      <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
        {user.age ? `${user.age} yrs` : ""}
        {user.age && user.location ? " • " : ""}
        {user.location || ""}
      </p>
      {user.religion && (
        <p style={{ margin: "6px 0 0 0", color: "#888", fontSize: "13px" }}>
          {user.religion}
        </p>
      )}
    </div>
  );
}

function TestimonialCard({ name, location, quote, initials }) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "#1e3a8a",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "20px",
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
          marginBottom: "16px",
        }}
      >
        "{quote}"
      </p>
      <p style={{ fontWeight: "bold", margin: 0, color: "#1e3a8a" }}>{name}</p>
      <p style={{ color: "#888", fontSize: "13px", margin: "4px 0 0 0" }}>
        📍 {location}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div style={{ ...cardStyle, textAlign: "center" }}>
      <div style={{ fontSize: "42px", marginBottom: "8px" }}>{icon}</div>
      <h3 style={{ margin: "8px 0", color: "#1e3a8a", fontSize: "17px" }}>
        {title}
      </h3>
      <p style={{ color: "#666", lineHeight: "1.6", margin: 0, fontSize: "14px" }}>
        {description}
      </p>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const heroStyle = {
  background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  color: "white",
  padding: "80px 20px",
  textAlign: "center",
};

const heroContentStyle = {
  maxWidth: "800px",
  margin: "0 auto",
};

const heroTitleStyle = {
  fontSize: "42px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  lineHeight: "1.2",
};

const heroSubtitleStyle = {
  fontSize: "18px",
  lineHeight: "1.6",
  opacity: 0.95,
  marginBottom: "32px",
};

const ctaContainerStyle = {
  display: "flex",
  gap: "16px",
  justifyContent: "center",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const primaryButtonStyle = {
  background: "white",
  color: "#1e3a8a",
  padding: "14px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "16px",
  display: "inline-block",
};

const secondaryButtonStyle = {
  background: "rgba(255,255,255,0.15)",
  color: "white",
  padding: "14px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "16px",
  border: "2px solid white",
  display: "inline-block",
};

const finalButtonStyle = {
  background: "white",
  color: "#1e3a8a",
  padding: "14px 32px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "17px",
  display: "inline-block",
};

const heroSmallTextStyle = {
  fontSize: "14px",
  opacity: 0.85,
  marginTop: "12px",
};

const statsStyle = {
  background: "white",
  padding: "40px 20px",
  borderBottom: "1px solid #e5e7eb",
};

const statsGridStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "20px",
};

const sectionStyle = {
  padding: "60px 20px",
  maxWidth: "1100px",
  margin: "0 auto",
};

const sectionTitleStyle = {
  fontSize: "32px",
  textAlign: "center",
  color: "#1e3a8a",
  margin: "0 0 8px 0",
};

const sectionSubtitleStyle = {
  textAlign: "center",
  color: "#666",
  fontSize: "16px",
  marginBottom: "40px",
};

const threeColGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
};

const fourColGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
};

const featuredGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: "20px",
};

const cardStyle = {
  background: "white",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  textAlign: "center",
};

const featuredCardStyle = {
  background: "white",
  padding: "20px 12px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  textAlign: "center",
};

const stepNumberStyle = {
  display: "inline-block",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#1e3a8a",
  color: "white",
  lineHeight: "32px",
  fontWeight: "bold",
  fontSize: "16px",
};

const avatarStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "32px",
  margin: "0 auto 8px auto",
  overflow: "hidden",
};

const finalCTAStyle = {
  background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  color: "white",
  padding: "60px 20px",
  textAlign: "center",
};

const footerStyle = {
  background: "#0f172a",
  color: "white",
  padding: "30px 20px",
  textAlign: "center",
};

export default Home;
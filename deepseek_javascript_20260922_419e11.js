import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const COMMUNITIES = [
  { id: "vanniyar", name: "Vanniyar", emoji: "🔥", color: "#dc2626" },
  { id: "naidu", name: "Naidu", emoji: "💫", color: "#2563eb" },
  { id: "kallar", name: "Kallar", emoji: "⚡", color: "#ea580c" },
  { id: "thevar", name: "Thevar", emoji: "🌟", color: "#7c3aed" },
];

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
          const list = (data.results || [])
            .filter((u) => u.photo_url)
            .sort(() => 0.5 - Math.random());
          setFeatured(list.slice(0, 8));
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

      {/* ============================================================
          HERO SECTION
      ============================================================ */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
          color: "white",
          padding: isMobile ? "48px 20px 60px" : "80px 20px 100px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Trust pill */}
          <div
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            ✨ India's Most Trusted Matrimony Platform
          </div>

          <h1
            style={{
              fontSize: isMobile ? "30px" : "48px",
              fontWeight: "800",
              margin: "0 0 16px 0",
              lineHeight: "1.2",
              letterSpacing: "-0.5px",
            }}
          >
            Find Your Perfect Life Partner 💑
          </h1>

          <p
            style={{
              fontSize: isMobile ? "15px" : "18px",
              lineHeight: "1.6",
              opacity: 0.95,
              marginBottom: isMobile ? "26px" : "36px",
              maxWidth: "600px",
              margin: "0 auto 36px",
            }}
          >
            Join thousands of families across Vanniyar, Naidu, Kallar, and Thevar communities who found their perfect match on Vivaha.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <Link
              to="/register"
              style={{
                background: "white",
                color: "#1e3a8a",
                padding: isMobile ? "14px 28px" : "16px 36px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: isMobile ? "15px" : "16px",
                display: "inline-block",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              }}
            >
              Register Free →
            </Link>
            <Link
              to="/search"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                padding: isMobile ? "14px 28px" : "16px 36px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: isMobile ? "15px" : "16px",
                border: "2px solid rgba(255,255,255,0.5)",
                display: "inline-block",
                backdropFilter: "blur(10px)",
              }}
            >
              Browse Profiles
            </Link>
          </div>

          <p style={{ fontSize: isMobile ? "12px" : "13px", opacity: 0.85 }}>
            🔒 100% Secure • ✅ Verified Profiles • 💯 Free to Start
          </p>
        </div>
      </section>

      {/* ============================================================
          STATS BAR
      ============================================================ */}
      <section
        style={{
          background: "white",
          padding: isMobile ? "28px 20px" : "40px 20px",
          borderBottom: "1px solid #e5e7eb",
          marginTop: isMobile ? "-30px" : "-50px",
          marginLeft: "16px",
          marginRight: "16px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          position: "relative",
          zIndex: 2,
          maxWidth: "1000px",
          margin: isMobile ? "-30px auto 0" : "-50px auto 0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? "20px" : "24px",
          }}
        >
          <Stat number="10,000+" label="Happy Members" isMobile={isMobile} />
          <Stat number="2,500+" label="Successful Matches" isMobile={isMobile} />
          <Stat number="500+" label="Weddings This Year" isMobile={isMobile} />
          <Stat number="4.8★" label="User Rating" isMobile={isMobile} />
        </div>
      </section>

      {/* ============================================================
          COMMUNITY SELECTOR CARDS
      ============================================================ */}
      <section style={sectionStyle(isMobile, "60px")}>
        <SectionHeader
          isMobile={isMobile}
          title="Find Your Community"
          subtitle="Choose your community to see relevant matches"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(4, 1fr)",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          {COMMUNITIES.map((c) => (
            <Link
              key={c.id}
              to={`/register?community=${c.id}`}
              onClick={() => localStorage.setItem("community", c.id)}
              style={{
                textDecoration: "none",
                background: "white",
                borderRadius: "16px",
                padding: isMobile ? "20px 12px" : "28px 20px",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                border: "2px solid transparent",
                transition: "all 0.3s",
              }}
            >
              <div style={{ fontSize: isMobile ? "36px" : "48px", marginBottom: "10px" }}>
                {c.emoji}
              </div>
              <h3
                style={{
                  margin: "0 0 4px 0",
                  color: "#1e3a8a",
                  fontSize: isMobile ? "15px" : "18px",
                  fontWeight: "700",
                }}
              >
                {c.name}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#888",
                  fontSize: isMobile ? "11px" : "13px",
                }}
              >
                Browse →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
      ============================================================ */}
      <section
        style={{
          ...sectionStyle(isMobile, "60px"),
          background: "#f8fafc",
        }}
      >
        <SectionHeader
          isMobile={isMobile}
          title="How Vivaha Works"
          subtitle="Finding your perfect match in 3 simple steps"
        />

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
            description="Sign up free and share your background, family details, and preferences."
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

      {/* ============================================================
          FEATURED PROFILES
      ============================================================ */}
      <section style={sectionStyle(isMobile, "60px")}>
        <SectionHeader
          isMobile={isMobile}
          title="Featured Members"
          subtitle="Meet some of our recent members looking for a partner"
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={spinnerStyle} />
            <p style={{ color: "#888", marginTop: "16px" }}>Loading profiles...</p>
          </div>
        ) : featured.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>
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
                : "repeat(auto-fill, minmax(220px, 1fr))",
              gap: isMobile ? "12px" : "20px",
            }}
          >
            {featured.map((user) => (
              <FeaturedCard key={user.id} user={user} isMobile={isMobile} />
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: isMobile ? "24px" : "36px" }}>
          <Link
            to="/search"
            style={{
              background: "#1e3a8a",
              color: "white",
              padding: "14px 32px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "15px",
              display: "inline-block",
              boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
            }}
          >
            View All Profiles →
          </Link>
        </div>
      </section>

      {/* ============================================================
          WHY CHOOSE US
      ============================================================ */}
      <section
        style={{
          ...sectionStyle(isMobile, "60px"),
          background: "#f8fafc",
        }}
      >
        <SectionHeader
          isMobile={isMobile}
          title="Why Choose Vivaha?"
          subtitle="Trusted by thousands of Indian families"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(240px, 1fr))",
            gap: isMobile ? "12px" : "20px",
          }}
        >
          <FeatureCard
            icon="🔒"
            title="100% Secure"
            description="Your data is protected with bank-level encryption."
            isMobile={isMobile}
          />
          <FeatureCard
            icon="✅"
            title="Verified Profiles"
            description="Every profile is verified for authenticity."
            isMobile={isMobile}
          />
          <FeatureCard
            icon="🧠"
            title="Smart Matching"
            description="AI-powered algorithm finds compatible matches."
            isMobile={isMobile}
          />
          <FeatureCard
            icon="💬"
            title="Safe Chat"
            description="Message only after both accept each other's interest."
            isMobile={isMobile}
          />
        </div>
      </section>

      {/* ============================================================
          SUCCESS STORIES
      ============================================================ */}
      <section style={sectionStyle(isMobile, "60px")}>
        <SectionHeader
          isMobile={isMobile}
          title="Success Stories 💕"
          subtitle="Real couples who found their soulmate on Vivaha"
        />

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
            quote="We matched on Vivaha 6 months ago. Now we're happily married! The matching algorithm really works."
            initials="PK"
            isMobile={isMobile}
          />
          <TestimonialCard
            name="Divya & Ashwin"
            location="Bangalore"
            quote="I love how easy it was to filter by community and location. Found my soulmate within a month!"
            initials="DA"
            isMobile={isMobile}
          />
          <TestimonialCard
            name="Meena & Raj"
            location="Coimbatore"
            quote="The verified profiles gave me confidence. Our families met within weeks and we clicked instantly."
            initials="MR"
            isMobile={isMobile}
          />
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
      ============================================================ */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
          color: "white",
          padding: isMobile ? "50px 20px" : "80px 20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? "26px" : "36px",
            marginBottom: "14px",
            fontWeight: "800",
            letterSpacing: "-0.5px",
          }}
        >
          Ready to Find Your Soulmate?
        </h2>
        <p
          style={{
            opacity: 0.9,
            marginBottom: "28px",
            fontSize: isMobile ? "15px" : "17px",
            maxWidth: "500px",
            margin: "0 auto 28px",
          }}
        >
          Join Vivaha today and start your journey to a happy married life.
        </p>
        <Link
          to="/register"
          style={{
            background: "white",
            color: "#1e3a8a",
            padding: isMobile ? "14px 28px" : "16px 40px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "700",
            fontSize: isMobile ? "15px" : "17px",
            display: "inline-block",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          Create Free Account →
        </Link>
      </section>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <footer
        style={{
          background: "#0f172a",
          color: "white",
          padding: isMobile ? "30px 20px" : "40px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            flexWrap: "wrap",
            marginBottom: "16px",
            fontSize: isMobile ? "12px" : "13px",
          }}
        >
          <Link to="/" style={footerLinkStyle}>Home</Link>
          <Link to="/search" style={footerLinkStyle}>Search</Link>
          <Link to="/register" style={footerLinkStyle}>Register</Link>
          <Link to="/subscription" style={footerLinkStyle}>Pricing</Link>
        </div>
        <p
          style={{
            margin: "0 0 6px 0",
            fontSize: isMobile ? "12px" : "13px",
            opacity: 0.7,
          }}
        >
          © {new Date().getFullYear()} Vivaha Matrimony. All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: "11px", opacity: 0.5 }}>
          Made with ❤️ for finding lifelong partners
        </p>
      </footer>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SectionHeader({ isMobile, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: isMobile ? "26px" : "40px" }}>
      <h2
        style={{
          fontSize: isMobile ? "24px" : "32px",
          color: "#1e3a8a",
          margin: "0 0 8px 0",
          fontWeight: "800",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#666",
          fontSize: isMobile ? "14px" : "16px",
          margin: 0,
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function Stat({ number, label, isMobile }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: isMobile ? "22px" : "28px",
          fontWeight: "800",
          color: "#1e3a8a",
          letterSpacing: "-0.5px",
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: isMobile ? "11px" : "13px",
          color: "#666",
          marginTop: "4px",
          fontWeight: "500",
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
        padding: isMobile ? "24px 20px" : "32px 24px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div style={{ fontSize: isMobile ? "42px" : "52px", marginBottom: "12px" }}>
        {icon}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#1e3a8a",
          color: "white",
          lineHeight: "1",
          fontWeight: "bold",
          fontSize: "15px",
          marginBottom: "12px",
        }}
      >
        {number}
      </div>
      <h3
        style={{
          margin: "0 0 8px 0",
          color: "#1e3a8a",
          fontSize: isMobile ? "16px" : "18px",
          fontWeight: "700",
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
  const communityLabel = user.community
    ? user.community.charAt(0).toUpperCase() + user.community.slice(1)
    : null;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: isMobile ? "16px 12px" : "20px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        textAlign: "center",
        border: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          width: isMobile ? "70px" : "90px",
          height: isMobile ? "70px" : "90px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMobile ? "30px" : "42px",
          margin: "0 auto 10px auto",
          overflow: "hidden",
          border: "3px solid #1e3a8a",
          boxShadow: "0 4px 12px rgba(30,58,138,0.2)",
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
          margin: "6px 0 4px 0",
          fontSize: isMobile ? "14px" : "17px",
          color: "#1e3a8a",
          fontWeight: "700",
        }}
      >
        {user.name || "Anonymous"}
      </h3>

      {communityLabel && (
        <div
          style={{
            display: "inline-block",
            background: "#eff6ff",
            color: "#1e40af",
            padding: "2px 10px",
            borderRadius: "10px",
            fontSize: isMobile ? "10px" : "11px",
            fontWeight: "600",
            marginBottom: "4px",
          }}
        >
          {communityLabel}
        </div>
      )}

      <p
        style={{
          margin: "4px 0 0 0",
          color: "#666",
          fontSize: isMobile ? "11px" : "13px",
        }}
      >
        {user.age ? `${user.age} yrs` : ""}
        {user.age && user.location ? " • " : ""}
        {user.location ? user.location.substring(0, 15) : ""}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description, isMobile }) {
  return (
    <div
      style={{
        background: "white",
        padding: isMobile ? "20px 14px" : "28px 20px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: isMobile ? "36px" : "44px", marginBottom: "10px" }}>
        {icon}
      </div>
      <h3
        style={{
          margin: "0 0 6px 0",
          color: "#1e3a8a",
          fontSize: isMobile ? "14px" : "17px",
          fontWeight: "700",
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

function TestimonialCard({ name, location, quote, initials, isMobile }) {
  return (
    <div
      style={{
        background: "white",
        padding: isMobile ? "24px 20px" : "32px 24px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: isMobile ? "18px" : "22px",
          margin: "0 auto 16px auto",
          boxShadow: "0 4px 12px rgba(30,58,138,0.3)",
        }}
      >
        {initials}
      </div>
      <p
        style={{
          fontStyle: "italic",
          color: "#444",
          lineHeight: "1.7",
          marginBottom: "16px",
          fontSize: isMobile ? "13px" : "14px",
        }}
      >
        "{quote}"
      </p>
      <p
        style={{
          fontWeight: "700",
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

// ============================================================
// STYLE HELPERS
// ============================================================
function sectionStyle(isMobile, paddingTop = "60px") {
  return {
    padding: isMobile
      ? `${paddingTop.replace("60px", "44px")} 16px`
      : `${paddingTop} 20px`,
    maxWidth: "1100px",
    margin: "0 auto",
  };
}

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #1e3a8a",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

const footerLinkStyle = {
  color: "#cbd5e1",
  textDecoration: "none",
};

export default Home;
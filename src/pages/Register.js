import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import ImageUpload from "../components/ImageUpload";
import { useCommunities } from "../utils/communities";

const TOTAL_STEPS = 4;

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { communities, loading: loadingCommunities } = useCommunities();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    community: "",
    name: "",
    age: "",
    gender: "",
    religion: "",
    caste: "",
    location: "",
    education: "",
    occupation: "",
    bio: "",
    photo_url: "",
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const c = searchParams.get("community");
    if (c) setForm((f) => ({ ...f, community: c }));
  }, [searchParams]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStep1 = async () => {
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.password) return toast.error("Password is required");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword)
      return toast.error("Passwords don't match");
    if (!form.community) return toast.error("Please select your community");

    setSaving(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { community: form.community } },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          toast.error("This email is already registered. Please login.");
          setTimeout(() => navigate("/login"), 1500);
          return;
        }
        toast.error(error.message);
        return;
      }

      if (data?.user) {
        setUserId(data.user.id);
        await supabase.from("users").upsert([
          {
            id: data.user.id,
            email: form.email.trim(),
            community: form.community,
            role: "user",
          },
        ]);
        toast.success("Account created! Let's build your profile.");
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStep2 = async () => {
    if (!form.name.trim()) return toast.error("Please enter your name");
    if (!form.age || form.age < 18) return toast.error("You must be 18+");
    if (!form.gender) return toast.error("Please select your gender");

    setSaving(true);
    try {
      await supabase
        .from("users")
        .update({
          name: form.name.trim(),
          age: parseInt(form.age, 10),
          gender: form.gender,
          religion: form.religion || null,
          caste: form.caste || null,
          location: form.location || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStep3 = async () => {
    setSaving(true);
    try {
      await supabase
        .from("users")
        .update({
          education: form.education || null,
          occupation: form.occupation || null,
          bio: form.bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const finishRegistration = async () => {
    toast.success("🎉 Welcome to Vivaha Matrimony!");
    navigate("/profile");
  };

  const ProgressBar = () => (
    <div style={progressWrapStyle}>
      {[1, 2, 3, 4].map((n) => (
        <React.Fragment key={n}>
          <div
            style={{
              ...dotStyle,
              background: n <= step ? "#1e3a8a" : "#e5e7eb",
              color: n <= step ? "white" : "#999",
              transform: n === step ? "scale(1.15)" : "scale(1)",
              boxShadow: n === step ? "0 4px 12px rgba(30,58,138,0.4)" : "none",
            }}
          >
            {n < step ? "✓" : n}
          </div>
          {n < 4 && (
            <div
              style={{
                ...lineStyle,
                background: n < step ? "#1e3a8a" : "#e5e7eb",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const StepTitle = ({ title, subtitle }) => (
    <div style={{ textAlign: "center", marginBottom: "24px" }}>
      <h2
        style={{
          color: "#1e3a8a",
          margin: "0 0 6px 0",
          fontSize: isMobile ? "20px" : "22px",
          fontWeight: "700",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#666",
          margin: 0,
          fontSize: "13px",
          lineHeight: "1.5",
        }}
      >
        {subtitle}
      </p>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "4px" }}>💑</div>
          <h1
            style={{
              color: "#1e3a8a",
              margin: "0 0 4px 0",
              fontSize: isMobile ? "18px" : "20px",
              fontWeight: "800",
            }}
          >
            Create Your Account
          </h1>
          <p style={{ color: "#888", margin: 0, fontSize: "12px" }}>
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>

        <ProgressBar />

        {/* STEP 1: Account */}
        {step === 1 && (
          <div style={formWrapStyle}>
            <StepTitle
              title="Let's Get Started"
              subtitle="Create your account with an email and password"
            />

            <Field icon="📧" label="Email Address">
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                style={inputFieldStyle}
                autoComplete="email"
              />
            </Field>

            <Field icon="🔒" label="Password">
              <input
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                style={inputFieldStyle}
                autoComplete="new-password"
              />
            </Field>

            <Field icon="🔐" label="Confirm Password">
              <input
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                style={inputFieldStyle}
                autoComplete="new-password"
              />
            </Field>

            <label style={labelStyle}>Your Community</label>
{loadingCommunities ? (
  <p style={{ fontSize: "13px", color: "#888" }}>Loading communities...</p>
) : communities.length === 0 ? (
  <p style={{ fontSize: "13px", color: "#b91c1c" }}>
    No communities available. Please contact support.
  </p>
) : (
  <div style={inputWrapStyle}>
    <span style={iconStyle}>🏷️</span>
    <select
      value={form.community}
      onChange={(e) => update("community", e.target.value)}
      style={{
        ...inputFieldStyle,
        cursor: "pointer",
        appearance: "none",
        backgroundImage:
          "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: "40px",
      }}
    >
      <option value="">-- Select Your Community --</option>
      {communities.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.emoji || "👥"} {c.name}
        </option>
      ))}
    </select>
  </div>
)}

            <div style={btnRowStyle}>
              <button
                onClick={handleStep1}
                disabled={saving || loadingCommunities}
                style={{
                  ...primaryBtnStyle,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Creating..." : "Next →"}
              </button>
            </div>

            <p style={bottomTextStyle}>
              Already have an account?{" "}
              <Link to="/login" style={linkStyle}>
                Login
              </Link>
            </p>
          </div>
        )}

        {/* STEP 2: Personal */}
        {step === 2 && (
          <div style={formWrapStyle}>
            <StepTitle
              title="Tell Us About You"
              subtitle="This helps us find compatible matches"
            />

            <Field icon="👤" label="Full Name">
              <input
                type="text"
                placeholder="e.g. Priya Raman"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                style={inputFieldStyle}
              />
            </Field>

            <Field icon="🎂" label="Age">
              <input
                type="number"
                placeholder="e.g. 26"
                min="18"
                max="80"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                style={inputFieldStyle}
              />
            </Field>

            <label style={labelStyle}>Gender</label>
            <div style={genderRowStyle}>
              {[
                { value: "male", label: "Male", icon: "👨" },
                { value: "female", label: "Female", icon: "👩" },
                { value: "other", label: "Other", icon: "🧑" },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => update("gender", g.value)}
                  style={{
                    ...genderBtnStyle,
                    border:
                      form.gender === g.value
                        ? "2px solid #1e3a8a"
                        : "2px solid #e5e7eb",
                    background:
                      form.gender === g.value ? "#eff6ff" : "white",
                    color: form.gender === g.value ? "#1e3a8a" : "#555",
                  }}
                >
                  <div style={{ fontSize: "22px" }}>{g.icon}</div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      marginTop: "4px",
                    }}
                  >
                    {g.label}
                  </div>
                </button>
              ))}
            </div>

            <Field icon="🕉️" label="Religion">
              <input
                type="text"
                placeholder="e.g. Hindu"
                value={form.religion}
                onChange={(e) => update("religion", e.target.value)}
                style={inputFieldStyle}
              />
            </Field>

            <Field icon="👥" label="Caste (optional)">
              <input
                type="text"
                placeholder="e.g. Vanniyar"
                value={form.caste}
                onChange={(e) => update("caste", e.target.value)}
                style={inputFieldStyle}
              />
            </Field>

            <Field icon="📍" label="Location (City)">
              <input
                type="text"
                placeholder="e.g. Chennai"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                style={inputFieldStyle}
              />
            </Field>

            <div style={btnRowStyle}>
              <button onClick={prevStep} style={backBtnStyle}>
                ← Back
              </button>
              <button
                onClick={handleStep2}
                disabled={saving}
                style={{
                  ...primaryBtnStyle,
                  flex: 1,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Career + Bio */}
        {step === 3 && (
          <div style={formWrapStyle}>
            <StepTitle
              title="Career & About You"
              subtitle="Optional — you can fill this later too"
            />

            <Field icon="🎓" label="Education">
              <input
                type="text"
                placeholder="e.g. B.Tech, MBA"
                value={form.education}
                onChange={(e) => update("education", e.target.value)}
                style={inputFieldStyle}
              />
            </Field>

            <Field icon="💼" label="Occupation">
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={form.occupation}
                onChange={(e) => update("occupation", e.target.value)}
                style={inputFieldStyle}
              />
            </Field>

            <label style={labelStyle}>About You (Bio)</label>
            <textarea
              placeholder="Tell us about yourself, your family, interests, and what you're looking for..."
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={5}
              maxLength={500}
              style={textareaStyle}
            />
            <p
              style={{
                textAlign: "right",
                fontSize: "11px",
                color: "#888",
                margin: "-6px 0 0 0",
              }}
            >
              {form.bio.length}/500
            </p>

            <div style={btnRowStyle}>
              <button onClick={prevStep} style={backBtnStyle}>
                ← Back
              </button>
              <button
                onClick={handleStep3}
                disabled={saving}
                style={{
                  ...primaryBtnStyle,
                  flex: 1,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Photo */}
        {step === 4 && (
          <div style={formWrapStyle}>
            <StepTitle
              title="Add Your Photo"
              subtitle="Profiles with photos get 10x more matches"
            />

            <div style={{ margin: "20px 0" }}>
              {userId && (
                <ImageUpload
                  userId={userId}
                  currentPhotoUrl={form.photo_url}
                  onUploadSuccess={(url) => update("photo_url", url)}
                />
              )}
            </div>

            <div style={btnRowStyle}>
              <button onClick={prevStep} style={backBtnStyle}>
                ← Back
              </button>
              <button
                onClick={finishRegistration}
                style={{
                  ...primaryBtnStyle,
                  flex: 1,
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                }}
              >
                {form.photo_url ? "🎉 Complete Registration" : "Skip & Complete"}
              </button>
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#888",
                marginTop: "12px",
              }}
            >
              🔒 Your photo is safe and only visible to logged-in members
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ icon, label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={labelStyle}>{label}</label>
      <div style={inputWrapStyle}>
        <span style={iconStyle}>{icon}</span>
        {children}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "90vh",
  padding: "24px 16px",
  background: "#f8fafc",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
};

const cardStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "32px 24px",
  maxWidth: "520px",
  width: "100%",
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
};

const progressWrapStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "28px",
};

const dotStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: "700",
  transition: "all 0.3s",
  flexShrink: 0,
};

const lineStyle = {
  flex: 1,
  height: "2px",
  maxWidth: "40px",
  transition: "background 0.3s",
};

const formWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const inputWrapStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  background: "#fafafa",
  overflow: "hidden",
};

const iconStyle = {
  padding: "0 12px",
  fontSize: "17px",
  background: "#f3f4f6",
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  borderRight: "1px solid #e5e7eb",
};

const inputFieldStyle = {
  flex: 1,
  padding: "12px 14px",
  border: "none",
  background: "transparent",
  fontSize: "15px",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  background: "#fafafa",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

const genderRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "8px",
  marginTop: "-4px",
};

const genderBtnStyle = {
  padding: "12px 6px",
  borderRadius: "12px",
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.2s",
  fontFamily: "inherit",
};

const btnRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "8px",
};

const primaryBtnStyle = {
  background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  color: "white",
  padding: "14px 24px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
  fontFamily: "inherit",
};

const backBtnStyle = {
  background: "#f3f4f6",
  color: "#374151",
  padding: "14px 22px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const bottomTextStyle = {
  textAlign: "center",
  marginTop: "16px",
  fontSize: "13px",
  color: "#666",
  margin: "16px 0 0 0",
};

const linkStyle = {
  color: "#1e3a8a",
  fontWeight: "bold",
  textDecoration: "none",
};

export default Register;

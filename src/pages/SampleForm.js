import React, { useState } from "react";

function SampleForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    gender: "",
    dob: "",
    community: "",
    occupation: "",
    mobile: "",
  });

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Progress Bar */}
        <div style={styles.progressWrap}>
          {[1, 2, 3, 4].map((n) => (
            <React.Fragment key={n}>
              <div
                style={{
                  ...styles.dot,
                  background: n <= step ? "#8B0A2E" : "#f3f4f6",
                  color: n <= step ? "white" : "#9ca3af",
                  transform: n === step ? "scale(1.15)" : "scale(1)",
                  boxShadow: n === step ? "0 6px 16px rgba(139,10,46,0.35)" : "none",
                }}
              >
                {n < step ? "✓" : n}
              </div>
              {n < 4 && (
                <div
                  style={{
                    ...styles.line,
                    background: n < step ? "#8B0A2E" : "#f3f4f6",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Basic */}
        {step === 1 && (
          <div>
            <h2 style={styles.title}>Basic Details</h2>
            <p style={styles.subtitle}>Tell us about yourself</p>

            <Field label="Full Name">
              <input
                style={styles.input}
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </Field>

            <Field label="Gender">
              <div style={styles.chipRow}>
                {["Male", "Female"].map((g) => (
                  <button
                    key={g}
                    onClick={() => update("gender", g)}
                    style={{
                      ...styles.chip,
                      background: form.gender === g ? "#8B0A2E" : "white",
                      color: form.gender === g ? "white" : "#8B0A2E",
                      borderColor: "#8B0A2E",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Date of Birth">
              <input
                type="date"
                style={styles.input}
                value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
              />
            </Field>
          </div>
        )}

        {/* Step 2: Community */}
        {step === 2 && (
          <div>
            <h2 style={styles.title}>Community</h2>
            <p style={styles.subtitle}>Your religious background</p>
            <Field label="Community">
              <input
                style={styles.input}
                placeholder="e.g. Iyer, Vanniyar"
                value={form.community}
                onChange={(e) => update("community", e.target.value)}
              />
            </Field>
          </div>
        )}

        {/* Step 3: Career */}
        {step === 3 && (
          <div>
            <h2 style={styles.title}>Career</h2>
            <p style={styles.subtitle}>Your profession</p>
            <Field label="Occupation">
              <input
                style={styles.input}
                placeholder="e.g. Software Engineer"
                value={form.occupation}
                onChange={(e) => update("occupation", e.target.value)}
              />
            </Field>
          </div>
        )}

        {/* Step 4: Account */}
        {step === 4 && (
          <div>
            <h2 style={styles.title}>Account</h2>
            <p style={styles.subtitle}>Almost done!</p>
            <Field label="Mobile Number">
              <input
                style={styles.input}
                placeholder="10 digit mobile"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
              />
            </Field>
            <div style={styles.summary}>
              <p style={styles.summaryTitle}>Review</p>
              <p style={styles.summaryLine}>Name: {form.name || "-"}</p>
              <p style={styles.summaryLine}>Gender: {form.gender || "-"}</p>
              <p style={styles.summaryLine}>DOB: {form.dob || "-"}</p>
              <p style={styles.summaryLine}>Community: {form.community || "-"}</p>
              <p style={styles.summaryLine}>Occupation: {form.occupation || "-"}</p>
              <p style={styles.summaryLine}>Mobile: {form.mobile || "-"}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={styles.btnRow}>
          {step > 1 && (
            <button onClick={back} style={styles.btnBack}>
              ← Back
            </button>
          )}
          <button
            onClick={step === 4 ? () => alert("Form Ready! Now connect to your backend.") : next}
            style={styles.btnNext}
          >
            {step === 4 ? "Create Profile 💍" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Field component
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "700",
          color: "#6b7280",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fdf2f6 0%, #fff9f5 100%)",
    padding: "24px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: "480px",
    margin: "0 auto",
    background: "white",
    borderRadius: "24px",
    padding: "32px 24px",
    boxShadow: "0 20px 60px rgba(139,10,46,0.12)",
    border: "1px solid #f8e8ed",
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "32px",
  },
  dot: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "800",
    transition: "all 0.3s ease",
    flexShrink: 0,
  },
  line: {
    flex: 1,
    height: "3px",
    maxWidth: "36px",
    borderRadius: "2px",
    transition: "background 0.3s",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "24px",
    color: "#8B0A2E",
    margin: "0 0 6px 0",
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: "13px",
    margin: "0 0 24px 0",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "15px",
    fontFamily: "inherit",
    outline: "none",
    background: "#fafafa",
    boxSizing: "border-box",
    transition: "all 0.2s",
    color: "#1f2937",
  },
  chipRow: {
    display: "flex",
    gap: "10px",
  },
  chip: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "1.5px solid",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  summary: {
    background: "#fff9f5",
    border: "1px dashed #f0c8d4",
    borderRadius: "14px",
    padding: "18px",
    marginTop: "20px",
  },
  summaryTitle: {
    fontWeight: "700",
    color: "#8B0A2E",
    marginBottom: "10px",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  summaryLine: {
    margin: "4px 0",
    fontSize: "13px",
    color: "#4b5563",
  },
  btnRow: {
    display: "flex",
    gap: "10px",
    marginTop: "28px",
  },
  btnBack: {
    padding: "14px 22px",
    borderRadius: "12px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnNext: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #8B0A2E, #a01438)",
    color: "white",
    border: "none",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 8px 20px rgba(139,10,46,0.3)",
  },
};

export default SampleForm;

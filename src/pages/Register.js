import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import ImageUpload from "../components/ImageUpload";
import { useCommunities } from "../utils/communities";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";
const TOTAL_STEPS = 5;

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { communities } = useCommunities();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const [formFields, setFormFields] = useState([]);

  const [form, setForm] = useState({
    // Step 1
    profile_for: "", name: "", gender: "", dob: "", marital_status: "", mother_tongue: "",
    // Step 2
    religion: "", caste: "", sub_caste: "", gothram: "", horoscope: "Available", rasi: "", nakshatra: "",
    // Step 3
    education: "", occupation: "", income: "", college: "", company: "", work_location: "",
    // Step 4
    father_occ: "", mother_occ: "", brothers: "0", sisters: "0", family_type: "Nuclear", food_pref: "Vegetarian", bio: "", photo_url: "",
    // Step 5
    pref_age_min: "", pref_age_max: "", pref_height: "", pref_community: "", pref_education: "", pref_occupation: "", pref_location: "",
    mobile: "", email: "", password: "", confirmPassword: "", terms: false,
    // Custom
    community: "", custom_fields: {},
  });

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/settings`).then(res => res.json()),
      fetch(`${BACKEND_URL}/form-config/fields`).then(res => res.json())
    ])
      .then(([settingsData, fieldsData]) => {
        if (settingsData.settings && settingsData.settings.allow_registration === "false") {
          setRegistrationAllowed(false);
        }
        if (fieldsData.fields) {
          setFormFields(fieldsData.fields.filter(f => f.is_active));
        }
      })
      .catch(console.error)
      .finally(() => setCheckingSettings(false));
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

    // Redirect logged-in users to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  // Pre-fill community from URL
  useEffect(() => {
    const c = searchParams.get("community");
    if (c) setForm((f) => ({ ...f, community: c }));
  }, [searchParams]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateCustom = (key, value) => setForm(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [key]: value } }));

  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const validateStep = (stepNum) => {
    const stepFields = formFields.filter(f => f.step === stepNum);
    for (const field of stepFields) {
      if (field.is_required && !form.custom_fields[field.field_key]) {
        toast.error(`${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const handleStep1 = async () => {
    if (!form.profile_for) return toast.error("Profile Created For is required");
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.gender) return toast.error("Gender is required");
    if (!form.dob) return toast.error("Date of Birth is required");
    if (!form.marital_status) return toast.error("Marital Status is required");
    if (!form.mother_tongue) return toast.error("Mother Tongue is required");
    if (!validateStep(1)) return;
    setStep(2);
  };

  const handleStep2 = async () => {
    if (!form.religion) return toast.error("Religion is required");
    if (!form.caste.trim()) return toast.error("Community / Caste is required");
    if (!validateStep(2)) return;
    setStep(3);
  };

  const handleStep3 = async () => {
    if (!form.education) return toast.error("Education is required");
    if (!form.occupation.trim()) return toast.error("Occupation is required");
    if (!validateStep(3)) return;
    setStep(4);
  };

  const handleStep4 = async () => {
    if (!validateStep(4)) return;
    setStep(5);
  };

  const handleSubmit = async () => {
    if (!form.mobile || form.mobile.length !== 10) return toast.error("Valid 10-digit mobile number is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    if (!form.terms) return toast.error("You must agree to the Terms & Privacy Policy");
    if (!form.community) return toast.error("Community is required for matching");
    if (!validateStep(5)) return;

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
        await supabase.from("users").upsert([{
          id: data.user.id,
          email: form.email.trim(),
          community: form.community,
          role: "user",
          profile_for: form.profile_for,
          name: form.name.trim(),
          gender: form.gender,
          dob: form.dob,
          marital_status: form.marital_status,
          mother_tongue: form.mother_tongue,
          religion: form.religion,
          caste: form.caste,
          sub_caste: form.sub_caste || null,
          gothram: form.gothram || null,
          horoscope: form.horoscope,
          rasi: form.rasi || null,
          nakshatra: form.nakshatra || null,
          education: form.education,
          occupation: form.occupation,
          income: form.income || null,
          college: form.college || null,
          company: form.company || null,
          work_location: form.work_location || null,
          father_occ: form.father_occ || null,
          mother_occ: form.mother_occ || null,
          brothers: parseInt(form.brothers) || 0,
          sisters: parseInt(form.sisters) || 0,
          family_type: form.family_type,
          food_pref: form.food_pref,
          bio: form.bio || null,
          pref_age_min: parseInt(form.pref_age_min) || null,
          pref_age_max: parseInt(form.pref_age_max) || null,
          pref_height: form.pref_height || null,
          pref_community: form.pref_community || null,
          pref_education: form.pref_education || null,
          pref_occupation: form.pref_occupation || null,
          pref_location: form.pref_location || null,
          mobile: form.mobile,
          custom_fields: form.custom_fields,
          updated_at: new Date().toISOString(),
        }]);
        toast.success("🎉 Registration Successful!");
        navigate("/profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const ProgressBar = () => (
    <div style={progressWrapStyle}>
      {[1, 2, 3, 4, 5].map((n) => (
        <React.Fragment key={n}>
          <div style={{ ...dotStyle, background: n <= step ? "#8B0A2E" : "#e5e7eb", color: n <= step ? "white" : "#999", transform: n === step ? "scale(1.15)" : "scale(1)", boxShadow: n === step ? "0 4px 12px rgba(139,10,46,0.4)" : "none" }}>
            {n < step ? "✓" : n}
          </div>
          {n < 5 && <div style={{ ...lineStyle, background: n < step ? "#8B0A2E" : "#e5e7eb" }} />}
        </React.Fragment>
      ))}
    </div>
  );

  const StepTitle = ({ title, subtitle }) => (
    <div style={{ textAlign: "center", marginBottom: "24px" }}>
      <h2 style={{ color: "#8B0A2E", margin: "0 0 6px 0", fontSize: isMobile ? "20px" : "22px", fontWeight: "700" }}>{title}</h2>
      <p style={{ color: "#666", margin: 0, fontSize: "13px", lineHeight: "1.5" }}>{subtitle}</p>
    </div>
  );

  const renderCustomFields = (stepNum) => {
    const stepFields = formFields.filter(f => f.step === stepNum);
    if (stepFields.length === 0) return null;

    return stepFields.map((field) => (
      <div key={field.id} style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>
          {field.label} {field.is_required && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
        {field.type === "select" ? (
          <select value={form.custom_fields[field.field_key] || ""} onChange={(e) => updateCustom(field.field_key, e.target.value)} style={inputFieldStyle}>
            <option value="">Select {field.label}</option>
            {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : field.type === "textarea" ? (
          <textarea value={form.custom_fields[field.field_key] || ""} onChange={(e) => updateCustom(field.field_key, e.target.value)} rows={3} style={{ ...inputFieldStyle, resize: "vertical" }} placeholder={`Enter ${field.label}`} />
        ) : (
          <input type={field.type || "text"} value={form.custom_fields[field.field_key] || ""} onChange={(e) => updateCustom(field.field_key, e.target.value)} style={inputFieldStyle} placeholder={`Enter ${field.label}`} />
        )}
      </div>
    ));
  };

  if (checkingSettings) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;
  if (!registrationAllowed) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: "#8B0A2E", marginBottom: 8 }}>Registration Closed</h2>
        <p style={{ color: "#666", maxWidth: 400, lineHeight: 1.6 }}>New registrations are currently paused.</p>
        <Link to="/login" style={{ marginTop: 16, color: "#8B0A2E", fontWeight: "bold" }}>← Back to Login</Link>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "4px" }}>💍</div>
          <h1 style={{ color: "#8B0A2E", margin: "0 0 4px 0", fontSize: isMobile ? "18px" : "20px", fontWeight: "800" }}>Vivaha Matrimony</h1>
          <p style={{ color: "#888", margin: 0, fontSize: "12px" }}>Step {step} of {TOTAL_STEPS}</p>
        </div>

        <ProgressBar />

        {/* STEP 1: Basic Details */}
        {step === 1 && (
          <div style={formWrapStyle}>
            <StepTitle title="01. Basic Details" subtitle="Tell us who this profile is for" />
            <label style={labelStyle}>Profile Created For *</label>
            <select value={form.profile_for} onChange={(e) => update("profile_for", e.target.value)} style={inputFieldStyle}>
              <option value="">Select</option>
              {["Myself", "Son", "Daughter", "Brother", "Sister", "Relative"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" placeholder="Enter full name" value={form.name} onChange={(e) => update("name", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Gender *</label>
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)} style={inputFieldStyle}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <label style={labelStyle}>Date of Birth *</label>
            <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Marital Status *</label>
            <select value={form.marital_status} onChange={(e) => update("marital_status", e.target.value)} style={inputFieldStyle}>
              <option value="">Select</option>
              <option value="Never Married">Never Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
            <label style={labelStyle}>Mother Tongue *</label>
            <select value={form.mother_tongue} onChange={(e) => update("mother_tongue", e.target.value)} style={inputFieldStyle}>
              <option value="">Select</option>
              {["Tamil", "Telugu", "Malayalam", "Kannada", "Hindi", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {renderCustomFields(1)}
            <div style={btnRowStyle}>
              <button onClick={handleStep1} disabled={saving} style={primaryBtnStyle}>Continue →</button>
            </div>
            <p style={bottomTextStyle}>Already have an account? <Link to="/login" style={linkStyle}>Login</Link></p>
          </div>
        )}

        {/* STEP 2: Community & Horoscope */}
        {step === 2 && (
          <div style={formWrapStyle}>
            <StepTitle title="02. Community & Horoscope" subtitle="Your religious and horoscope details" />
            <label style={labelStyle}>Religion *</label>
            <select value={form.religion} onChange={(e) => update("religion", e.target.value)} style={inputFieldStyle}>
              <option value="">Select</option>
              {["Hindu", "Christian", "Muslim", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <label style={labelStyle}>Community / Caste *</label>
            <input type="text" placeholder="Community / Caste" value={form.caste} onChange={(e) => update("caste", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Sub-Caste</label>
            <input type="text" placeholder="Sub-caste" value={form.sub_caste} onChange={(e) => update("sub_caste", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Gothram</label>
            <input type="text" placeholder="Gothram" value={form.gothram} onChange={(e) => update("gothram", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Horoscope</label>
            <select value={form.horoscope} onChange={(e) => update("horoscope", e.target.value)} style={inputFieldStyle}>
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
            </select>
            <label style={labelStyle}>Rasi</label>
            <select value={form.rasi} onChange={(e) => update("rasi", e.target.value)} style={inputFieldStyle}>
              <option value="">Select Rasi</option>
              {["Mesham", "Rishabam", "Mithunam", "Katakam", "Simmam", "Kanni", "Thulam", "Viruchigam", "Dhanusu", "Makaram", "Kumbam", "Meenam"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <label style={labelStyle}>Nakshatra</label>
            <input type="text" placeholder="Enter Nakshatra" value={form.nakshatra} onChange={(e) => update("nakshatra", e.target.value)} style={inputFieldStyle} />
            {renderCustomFields(2)}
            <div style={btnRowStyle}>
              <button onClick={prevStep} style={backBtnStyle}>← Back</button>
              <button onClick={handleStep2} disabled={saving} style={{ ...primaryBtnStyle, flex: 1 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Education & Career */}
        {step === 3 && (
          <div style={formWrapStyle}>
            <StepTitle title="03. Education & Career" subtitle="Your educational background and profession" />
            <label style={labelStyle}>Highest Education *</label>
            <select value={form.education} onChange={(e) => update("education", e.target.value)} style={inputFieldStyle}>
              <option value="">Select</option>
              {["10th", "12th", "Diploma", "ITI", "UG", "PG", "PhD", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <label style={labelStyle}>Occupation *</label>
            <input type="text" placeholder="Occupation" value={form.occupation} onChange={(e) => update("occupation", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Annual Income</label>
            <select value={form.income} onChange={(e) => update("income", e.target.value)} style={inputFieldStyle}>
              <option value="">Select</option>
              {["Below ₹3 Lakh", "₹3 - ₹5 Lakh", "₹5 - ₹10 Lakh", "₹10 - ₹20 Lakh", "₹20 Lakh+"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <label style={labelStyle}>College / University</label>
            <input type="text" placeholder="College or University" value={form.college} onChange={(e) => update("college", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Company / Organization</label>
            <input type="text" placeholder="Company name" value={form.company} onChange={(e) => update("company", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Work Location</label>
            <input type="text" placeholder="City / State / Country" value={form.work_location} onChange={(e) => update("work_location", e.target.value)} style={inputFieldStyle} />
            {renderCustomFields(3)}
            <div style={btnRowStyle}>
              <button onClick={prevStep} style={backBtnStyle}>← Back</button>
              <button onClick={handleStep3} disabled={saving} style={{ ...primaryBtnStyle, flex: 1 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Family & Lifestyle */}
        {step === 4 && (
          <div style={formWrapStyle}>
            <StepTitle title="04. Family & Lifestyle" subtitle="Tell us about your family background" />
            <label style={labelStyle}>Father's Occupation</label>
            <input type="text" placeholder="Occupation" value={form.father_occ} onChange={(e) => update("father_occ", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Mother's Occupation</label>
            <input type="text" placeholder="Occupation" value={form.mother_occ} onChange={(e) => update("mother_occ", e.target.value)} style={inputFieldStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Brothers</label>
                <input type="number" min="0" value={form.brothers} onChange={(e) => update("brothers", e.target.value)} style={inputFieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sisters</label>
                <input type="number" min="0" value={form.sisters} onChange={(e) => update("sisters", e.target.value)} style={inputFieldStyle} />
              </div>
            </div>
            <label style={labelStyle}>Family Type</label>
            <select value={form.family_type} onChange={(e) => update("family_type", e.target.value)} style={inputFieldStyle}>
              <option value="Nuclear">Nuclear</option>
              <option value="Joint">Joint</option>
            </select>
            <label style={labelStyle}>Food Preference</label>
            <select value={form.food_pref} onChange={(e) => update("food_pref", e.target.value)} style={inputFieldStyle}>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
            </select>
            <label style={labelStyle}>About Yourself</label>
            <textarea placeholder="Write a short introduction..." value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} maxLength={500} style={textareaStyle} />
            <label style={labelStyle}>Profile Photo</label>
            {userId ? (
              <ImageUpload userId={userId} currentPhotoUrl={form.photo_url} onUploadSuccess={(url) => update("photo_url", url)} />
            ) : (
              <p style={{ fontSize: "13px", color: "#888", fontStyle: "italic" }}>Photo upload will be available after account creation (Step 5).</p>
            )}
            {renderCustomFields(4)}
            <div style={btnRowStyle}>
              <button onClick={prevStep} style={backBtnStyle}>← Back</button>
              <button onClick={handleStep4} disabled={saving} style={{ ...primaryBtnStyle, flex: 1 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 5: Partner Preference & Account */}
        {step === 5 && (
          <div style={formWrapStyle}>
            <StepTitle title="05. Partner Preference & Account" subtitle="Final step! Set your preferences and create your account." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Preferred Age From</label>
                <input type="number" min="18" max="100" placeholder="Age" value={form.pref_age_min} onChange={(e) => update("pref_age_min", e.target.value)} style={inputFieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Preferred Age To</label>
                <input type="number" min="18" max="100" placeholder="Age" value={form.pref_age_max} onChange={(e) => update("pref_age_max", e.target.value)} style={inputFieldStyle} />
              </div>
            </div>
            <label style={labelStyle}>Preferred Height</label>
            <input type="text" placeholder="Example: 5'2 - 6'0" value={form.pref_height} onChange={(e) => update("pref_height", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Preferred Community</label>
            <input type="text" placeholder="Any / Community" value={form.pref_community} onChange={(e) => update("pref_community", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Preferred Education</label>
            <input type="text" placeholder="Education" value={form.pref_education} onChange={(e) => update("pref_education", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Preferred Occupation</label>
            <input type="text" placeholder="Occupation" value={form.pref_occupation} onChange={(e) => update("pref_occupation", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Preferred Location</label>
            <input type="text" placeholder="City / State / Country" value={form.pref_location} onChange={(e) => update("pref_location", e.target.value)} style={inputFieldStyle} />
            
            <hr style={{ border: "none", borderTop: "1px solid #f0e0e0", margin: "16px 0" }} />
            
            <label style={labelStyle}>Mobile Number *</label>
            <input type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10 digit mobile number" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Email Address *</label>
            <input type="email" placeholder="Email address" value={form.email} onChange={(e) => update("email", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Password *</label>
            <input type="password" minLength="6" placeholder="Minimum 6 characters" value={form.password} onChange={(e) => update("password", e.target.value)} style={inputFieldStyle} />
            <label style={labelStyle}>Confirm Password *</label>
            <input type="password" minLength="6" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} style={inputFieldStyle} />
            
            <label style={labelStyle}>Your Community *</label>
            <select value={form.community} onChange={(e) => update("community", e.target.value)} style={inputFieldStyle}>
              <option value="">Select Community</option>
              {communities.map((c) => <option key={c.slug} value={c.slug}>{c.emoji || "👥"} {c.name}</option>)}
            </select>

            {renderCustomFields(5)}

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", fontSize: "14px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8B0A2E" }} />
              <span>I agree to the Terms & Privacy Policy</span>
            </label>

            <div style={btnRowStyle}>
              <button onClick={prevStep} style={backBtnStyle}>← Back</button>
              <button onClick={handleSubmit} disabled={saving} style={{ ...primaryBtnStyle, flex: 1, background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
                {saving ? "Creating Profile..." : "Create Profile 💍"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = { minHeight: "90vh", padding: "24px 16px", background: "#f8fafc", display: "flex", alignItems: "flex-start", justifyContent: "center" };
const cardStyle = { background: "white", borderRadius: "20px", padding: "32px 24px", maxWidth: "520px", width: "100%", boxShadow: "0 12px 40px rgba(0,0,0,0.08)" };
const progressWrapStyle = { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "28px" };
const dotStyle = { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", transition: "all 0.3s", flexShrink: 0 };
const lineStyle = { flex: 1, height: "2px", maxWidth: "40px", transition: "background 0.3s" };
const formWrapStyle = { display: "flex", flexDirection: "column", gap: "10px" };
const labelStyle = { fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "0.3px", marginTop: "4px" };
const inputFieldStyle = { width: "100%", padding: "13px 14px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" };
const textareaStyle = { width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" };
const btnRowStyle = { display: "flex", gap: "10px", marginTop: "25px" };
const primaryBtnStyle = { flex: 1, background: "#8B0A2E", color: "white", padding: "14px 24px", borderRadius: "10px", border: "none", fontWeight: "700", fontSize: "16px", cursor: "pointer", fontFamily: "inherit" };
const backBtnStyle = { background: "#eee", color: "#333", padding: "14px 22px", borderRadius: "10px", border: "none", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" };
const bottomTextStyle = { textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#666" };
const linkStyle = { color: "#8B0A2E", fontWeight: "bold", textDecoration: "none" };

export default Register;

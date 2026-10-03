import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { useCommunities } from "../utils/communities";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";
const TOTAL_STEPS = 5;

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { communities } = useCommunities();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const [formFields, setFormFields] = useState([]);
  const [coreFields, setCoreFields] = useState([]);

  const [form, setForm] = useState({
    profile_for: "", name: "", gender: "", dob: "", marital_status: "", mother_tongue: "",
    religion: "", caste: "", sub_caste: "", gothram: "", horoscope: "Available", rasi: "", nakshatra: "",
    education: "", occupation: "", income: "", college: "", company: "", work_location: "",
    father_occ: "", mother_occ: "", brothers: "0", sisters: "0", family_type: "Nuclear", food_pref: "Vegetarian", bio: "", photo_url: "",
    pref_age_min: "", pref_age_max: "", pref_height: "", pref_community: "", pref_education: "", pref_occupation: "", pref_location: "",
    mobile: "", email: "", password: "", confirmPassword: "", terms: false,
    community: "", custom_fields: {},
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data?.user) navigate("/dashboard"); });
  }, [navigate]);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/settings`).then(res => res.json()),
      fetch(`${BACKEND_URL}/form-config/fields`).then(res => res.json()),
      fetch(`${BACKEND_URL}/form-config/core-fields`).then(res => res.json())
    ])
      .then(([settingsData, fieldsData, coreData]) => {
        if (settingsData.settings && settingsData.settings.allow_registration === "false") setRegistrationAllowed(false);
        if (fieldsData.fields) setFormFields(fieldsData.fields.filter(f => f.is_active));
        if (coreData.fields) setCoreFields(coreData.fields);
      })
      .catch(console.error)
      .finally(() => setCheckingSettings(false));
  }, []);

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
  const updateCustom = (key, value) => setForm(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [key]: value } }));

  const isActive = (key) => {
    const f = coreFields.find(x => x.field_key === key);
    return !f || f.is_active !== false;
  };
  const isRequired = (key) => {
    const f = coreFields.find(x => x.field_key === key);
    return !f || f.is_required !== false;
  };

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

  const handleStep1 = () => {
    if (isRequired("profile_for") && !form.profile_for) return toast.error("Profile Created For is required");
    if (isRequired("name") && !form.name.trim()) return toast.error("Name is required");
    if (isRequired("gender") && !form.gender) return toast.error("Gender is required");
    if (isRequired("dob") && !form.dob) return toast.error("Date of Birth is required");
    if (isRequired("marital_status") && !form.marital_status) return toast.error("Marital Status is required");
    if (isRequired("mother_tongue") && !form.mother_tongue) return toast.error("Mother Tongue is required");
    if (!validateStep(1)) return;
    setStep(2);
  };

  const handleStep2 = () => {
    if (isRequired("religion") && !form.religion) return toast.error("Religion is required");
    if (isRequired("caste") && !form.caste.trim()) return toast.error("Community / Caste is required");
    if (!validateStep(2)) return;
    setStep(3);
  };

  const handleStep3 = () => {
    if (isRequired("education") && !form.education) return toast.error("Education is required");
    if (isRequired("occupation") && !form.occupation.trim()) return toast.error("Occupation is required");
    if (!validateStep(3)) return;
    setStep(4);
  };

  const handleStep4 = () => {
    if (!validateStep(4)) return;
    setStep(5);
  };

  const handleSubmit = async () => {
    if (isRequired("mobile") && (!form.mobile || form.mobile.length !== 10)) return toast.error("Valid 10-digit mobile number is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    if (!form.terms) return toast.error("You must agree to the Terms & Privacy Policy");
    if (!form.community) return toast.error("Community is required for matching");
    if (!validateStep(5)) return;

    setSaving(true);
    try {
      // LOGIC UNCHANGED: Same payload sent to backend
      const res = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(), password: form.password, community: form.community,
          profile_for: form.profile_for, name: form.name.trim(), gender: form.gender, dob: form.dob,
          marital_status: form.marital_status, mother_tongue: form.mother_tongue, religion: form.religion,
          caste: form.caste, sub_caste: form.sub_caste || null, gothram: form.gothram || null,
          horoscope: form.horoscope, rasi: form.rasi || null, nakshatra: form.nakshatra || null,
          education: form.education, occupation: form.occupation, income: form.income || null,
          college: form.college || null, company: form.company || null, work_location: form.work_location || null,
          father_occ: form.father_occ || null, mother_occ: form.mother_occ || null,
          brothers: form.brothers, sisters: form.sisters,
          family_type: form.family_type, food_pref: form.food_pref, bio: form.bio || null,
          pref_age_min: form.pref_age_min || null, pref_age_max: form.pref_age_max || null,
          pref_height: form.pref_height || null, pref_community: form.pref_community || null,
          pref_education: form.pref_education || null, pref_occupation: form.pref_occupation || null,
          pref_location: form.pref_location || null, mobile: form.mobile,
          custom_fields: form.custom_fields,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("🎉 Registration Successful!");
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(), password: form.password,
      });
      if (loginError) { toast.error("Please log in."); navigate("/login"); }
      else navigate("/profile");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Network error. Please try again.");
    } finally { setSaving(false); }
  };

  const renderCustomFields = (stepNum) => {
    const stepFields = formFields.filter(f => f.step === stepNum);
    if (stepFields.length === 0) return null;
    return stepFields.map((field) => (
      <div key={field.id} style={{ marginBottom: "18px" }}>
        <label style={styles.label}>{field.label} {field.is_required && <span style={{ color: "#dc2626" }}>*</span>}</label>
        {field.type === "select" ? (
          <select value={form.custom_fields[field.field_key] || ""} onChange={(e) => updateCustom(field.field_key, e.target.value)} style={styles.input}>
            <option value="">Select {field.label}</option>
            {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : field.type === "textarea" ? (
          <textarea value={form.custom_fields[field.field_key] || ""} onChange={(e) => updateCustom(field.field_key, e.target.value)} rows={3} style={{ ...styles.input, resize: "vertical" }} placeholder={`Enter ${field.label}`} />
        ) : (
          <input type={field.type || "text"} value={form.custom_fields[field.field_key] || ""} onChange={(e) => updateCustom(field.field_key, e.target.value)} style={styles.input} placeholder={`Enter ${field.label}`} />
        )}
      </div>
    ));
  };

  if (checkingSettings) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;
  if (!registrationAllowed) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 64, textAlign: "center", marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: "#8B0A2E", marginBottom: 8, textAlign: "center" }}>Registration Closed</h2>
          <p style={{ color: "#666", maxWidth: 400, textAlign: "center", margin: "0 auto" }}>New registrations are currently paused.</p>
          <Link to="/login" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#8B0A2E", fontWeight: "bold" }}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "42px", marginBottom: "4px" }}>💍</div>
          <h1 style={{ color: "#8B0A2E", margin: "0 0 4px 0", fontSize: isMobile ? "20px" : "22px", fontWeight: "800", fontFamily: "'Playfair Display', serif" }}>Vivaha Matrimony</h1>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "12px", fontWeight: "600" }}>STEP {step} OF {TOTAL_STEPS}</p>
        </div>

        {/* Progress Bar (Modern Dots) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <React.Fragment key={n}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: "800", transition: "all 0.3s ease", flexShrink: 0,
                background: n <= step ? "#8B0A2E" : "#f3f4f6", color: n <= step ? "white" : "#9ca3af",
                transform: n === step ? "scale(1.15)" : "scale(1)", boxShadow: n === step ? "0 6px 16px rgba(139,10,46,0.35)" : "none"
              }}>
                {n < step ? "✓" : n}
              </div>
              {n < 5 && <div style={{ flex: 1, height: "3px", maxWidth: "36px", borderRadius: "2px", background: n < step ? "#8B0A2E" : "#f3f4f6", transition: "background 0.3s" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 style={styles.title}>Basic Details</h2>
            <p style={styles.subtitle}>Tell us who this profile is for</p>
            {isActive("profile_for") && (<div><label style={styles.label}>Profile Created For {isRequired("profile_for") && "*"}</label><select value={form.profile_for} onChange={(e) => update("profile_for", e.target.value)} style={styles.input}><option value="">Select</option>{["Myself", "Son", "Daughter", "Brother", "Sister", "Relative"].map(o => <option key={o} value={o}>{o}</option>)}</select></div>)}
            {isActive("name") && (<div><label style={styles.label}>Full Name {isRequired("name") && "*"}</label><input type="text" placeholder="Enter full name" value={form.name} onChange={(e) => update("name", e.target.value)} style={styles.input} /></div>)}
            {isActive("gender") && (<div><label style={styles.label}>Gender {isRequired("gender") && "*"}</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {["male", "female"].map(g => (
                  <button key={g} onClick={() => update("gender", g)} style={{
                    flex: 1, padding: "14px", borderRadius: "12px", border: "1.5px solid", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                    background: form.gender === g ? "#8B0A2E" : "white", color: form.gender === g ? "white" : "#8B0A2E", borderColor: "#8B0A2E"
                  }}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
                ))}
              </div>
            </div>)}
            {isActive("dob") && (<div><label style={styles.label}>Date of Birth {isRequired("dob") && "*"}</label><input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} style={styles.input} /></div>)}
            {isActive("marital_status") && (<div><label style={styles.label}>Marital Status {isRequired("marital_status") && "*"}</label><select value={form.marital_status} onChange={(e) => update("marital_status", e.target.value)} style={styles.input}><option value="">Select</option><option value="Never Married">Never Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option><option value="Separated">Separated</option></select></div>)}
            {isActive("mother_tongue") && (<div><label style={styles.label}>Mother Tongue {isRequired("mother_tongue") && "*"}</label><select value={form.mother_tongue} onChange={(e) => update("mother_tongue", e.target.value)} style={styles.input}><option value="">Select</option>{["Tamil", "Telugu", "Malayalam", "Kannada", "Hindi", "Other"].map(o => <option key={o} value={o}>{o}</option>)}</select></div>)}
            {renderCustomFields(1)}
            <div style={styles.btnRow}><button onClick={handleStep1} disabled={saving} style={styles.btnNext}>Continue →</button></div>
            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#666" }}>Already have an account? <Link to="/login" style={{ color: "#8B0A2E", fontWeight: "bold", textDecoration: "none" }}>Login</Link></p>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2 style={styles.title}>Community & Horoscope</h2>
            <p style={styles.subtitle}>Your religious and horoscope details</p>
            {isActive("religion") && (<div><label style={styles.label}>Religion {isRequired("religion") && "*"}</label><select value={form.religion} onChange={(e) => update("religion", e.target.value)} style={styles.input}><option value="">Select</option>{["Hindu", "Christian", "Muslim", "Other"].map(o => <option key={o} value={o}>{o}</option>)}</select></div>)}
            {isActive("caste") && (<div><label style={styles.label}>Community / Caste {isRequired("caste") && "*"}</label><input type="text" placeholder="Community / Caste" value={form.caste} onChange={(e) => update("caste", e.target.value)} style={styles.input} /></div>)}
            {isActive("sub_caste") && (<div><label style={styles.label}>Sub-Caste {isRequired("sub_caste") && "*"}</label><input type="text" placeholder="Sub-caste" value={form.sub_caste} onChange={(e) => update("sub_caste", e.target.value)} style={styles.input} /></div>)}
            {isActive("gothram") && (<div><label style={styles.label}>Gothram {isRequired("gothram") && "*"}</label><input type="text" placeholder="Gothram" value={form.gothram} onChange={(e) => update("gothram", e.target.value)} style={styles.input} /></div>)}
            {isActive("horoscope") && (<div><label style={styles.label}>Horoscope {isRequired("horoscope") && "*"}</label><select value={form.horoscope} onChange={(e) => update("horoscope", e.target.value)} style={styles.input}><option value="Available">Available</option><option value="Not Available">Not Available</option></select></div>)}
            {isActive("rasi") && (<div><label style={styles.label}>Rasi {isRequired("rasi") && "*"}</label><select value={form.rasi} onChange={(e) => update("rasi", e.target.value)} style={styles.input}><option value="">Select Rasi</option>{["Mesham", "Rishabam", "Mithunam", "Katakam", "Simmam", "Kanni", "Thulam", "Viruchigam", "Dhanusu", "Makaram", "Kumbam", "Meenam"].map(o => <option key={o} value={o}>{o}</option>)}</select></div>)}
            {isActive("nakshatra") && (<div><label style={styles.label}>Nakshatra {isRequired("nakshatra") && "*"}</label><input type="text" placeholder="Enter Nakshatra" value={form.nakshatra} onChange={(e) => update("nakshatra", e.target.value)} style={styles.input} /></div>)}
            {renderCustomFields(2)}
            <div style={styles.btnRow}><button onClick={prevStep} style={styles.btnBack}>← Back</button><button onClick={handleStep2} disabled={saving} style={{ ...styles.btnNext, flex: 1 }}>Continue →</button></div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2 style={styles.title}>Education & Career</h2>
            <p style={styles.subtitle}>Your educational background and profession</p>
            {isActive("education") && (<div><label style={styles.label}>Highest Education {isRequired("education") && "*"}</label><select value={form.education} onChange={(e) => update("education", e.target.value)} style={styles.input}><option value="">Select</option>{["10th", "12th", "Diploma", "ITI", "UG", "PG", "PhD", "Other"].map(o => <option key={o} value={o}>{o}</option>)}</select></div>)}
            {isActive("occupation") && (<div><label style={styles.label}>Occupation {isRequired("occupation") && "*"}</label><input type="text" placeholder="Occupation" value={form.occupation} onChange={(e) => update("occupation", e.target.value)} style={styles.input} /></div>)}
            {isActive("income") && (<div><label style={styles.label}>Annual Income {isRequired("income") && "*"}</label><select value={form.income} onChange={(e) => update("income", e.target.value)} style={styles.input}><option value="">Select</option>{["Below ₹3 Lakh", "₹3 - ₹5 Lakh", "₹5 - ₹10 Lakh", "₹10 - ₹20 Lakh", "₹20 Lakh+"].map(o => <option key={o} value={o}>{o}</option>)}</select></div>)}
            {isActive("college") && (<div><label style={styles.label}>College {isRequired("college") && "*"}</label><input type="text" placeholder="College or University" value={form.college} onChange={(e) => update("college", e.target.value)} style={styles.input} /></div>)}
            {isActive("company") && (<div><label style={styles.label}>Company {isRequired("company") && "*"}</label><input type="text" placeholder="Company name" value={form.company} onChange={(e) => update("company", e.target.value)} style={styles.input} /></div>)}
            {isActive("work_location") && (<div><label style={styles.label}>Work Location {isRequired("work_location") && "*"}</label><input type="text" placeholder="City / State / Country" value={form.work_location} onChange={(e) => update("work_location", e.target.value)} style={styles.input} /></div>)}
            {renderCustomFields(3)}
            <div style={styles.btnRow}><button onClick={prevStep} style={styles.btnBack}>← Back</button><button onClick={handleStep3} disabled={saving} style={{ ...styles.btnNext, flex: 1 }}>Continue →</button></div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h2 style={styles.title}>Family & Lifestyle</h2>
            <p style={styles.subtitle}>Tell us about your family background</p>
            {isActive("father_occ") && (<div><label style={styles.label}>Father's Occupation {isRequired("father_occ") && "*"}</label><input type="text" value={form.father_occ} onChange={(e) => update("father_occ", e.target.value)} style={styles.input} /></div>)}
            {isActive("mother_occ") && (<div><label style={styles.label}>Mother's Occupation {isRequired("mother_occ") && "*"}</label><input type="text" value={form.mother_occ} onChange={(e) => update("mother_occ", e.target.value)} style={styles.input} /></div>)}
            {(isActive("brothers") || isActive("sisters")) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {isActive("brothers") && (<div><label style={styles.label}>Brothers {isRequired("brothers") && "*"}</label><input type="number" min="0" value={form.brothers} onChange={(e) => update("brothers", e.target.value)} style={styles.input} /></div>)}
                {isActive("sisters") && (<div><label style={styles.label}>Sisters {isRequired("sisters") && "*"}</label><input type="number" min="0" value={form.sisters} onChange={(e) => update("sisters", e.target.value)} style={styles.input} /></div>)}
              </div>
            )}
            {isActive("family_type") && (<div><label style={styles.label}>Family Type {isRequired("family_type") && "*"}</label><select value={form.family_type} onChange={(e) => update("family_type", e.target.value)} style={styles.input}><option value="Nuclear">Nuclear</option><option value="Joint">Joint</option></select></div>)}
            {isActive("food_pref") && (<div><label style={styles.label}>Food Preference {isRequired("food_pref") && "*"}</label><select value={form.food_pref} onChange={(e) => update("food_pref", e.target.value)} style={styles.input}><option value="Vegetarian">Vegetarian</option><option value="Non-Vegetarian">Non-Vegetarian</option><option value="Eggetarian">Eggetarian</option></select></div>)}
            {isActive("bio") && (<div><label style={styles.label}>About Yourself {isRequired("bio") && "*"}</label><textarea placeholder="Write a short introduction..." value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} maxLength={500} style={{ ...styles.input, resize: "vertical" }} /></div>)}
            {renderCustomFields(4)}
            <div style={styles.btnRow}><button onClick={prevStep} style={styles.btnBack}>← Back</button><button onClick={handleStep4} disabled={saving} style={{ ...styles.btnNext, flex: 1 }}>Continue →</button></div>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div>
            <h2 style={styles.title}>Partner Preference & Account</h2>
            <p style={styles.subtitle}>Final step!</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div><label style={styles.label}>Preferred Age From</label><input type="number" min="18" max="100" value={form.pref_age_min} onChange={(e) => update("pref_age_min", e.target.value)} style={styles.input} /></div>
              <div><label style={styles.label}>Preferred Age To</label><input type="number" min="18" max="100" value={form.pref_age_max} onChange={(e) => update("pref_age_max", e.target.value)} style={styles.input} /></div>
            </div>
            <div><label style={styles.label}>Preferred Height</label><input type="text" placeholder="5'2 - 6'0" value={form.pref_height} onChange={(e) => update("pref_height", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Preferred Community</label><input type="text" value={form.pref_community} onChange={(e) => update("pref_community", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Preferred Education</label><input type="text" value={form.pref_education} onChange={(e) => update("pref_education", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Preferred Occupation</label><input type="text" value={form.pref_occupation} onChange={(e) => update("pref_occupation", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Preferred Location</label><input type="text" value={form.pref_location} onChange={(e) => update("pref_location", e.target.value)} style={styles.input} /></div>

            <hr style={{ border: "none", borderTop: "1px solid #f0e0e0", margin: "20px 0" }} />

            {isActive("mobile") && (<div><label style={styles.label}>Mobile Number {isRequired("mobile") && "*"}</label><input type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10 digit mobile number" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} style={styles.input} /></div>)}
            <div><label style={styles.label}>Email Address *</label><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Password *</label><input type="password" minLength="6" value={form.password} onChange={(e) => update("password", e.target.value)} style={styles.input} /></div>
            <div><label style={styles.label}>Confirm Password *</label><input type="password" minLength="6" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} style={styles.input} /></div>

            <div><label style={styles.label}>Your Community *</label><select value={form.community} onChange={(e) => update("community", e.target.value)} style={styles.input}><option value="">Select Community</option>{communities.map((c) => <option key={c.slug} value={c.slug}>{c.emoji || "👥"} {c.name}</option>)}</select></div>

            {renderCustomFields(5)}

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", fontSize: "14px", cursor: "pointer", color: "#4b5563" }}>
              <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#8B0A2E" }} />
              <span>I agree to the Terms & Privacy Policy</span>
            </label>

            <div style={styles.btnRow}><button onClick={prevStep} style={styles.btnBack}>← Back</button><button onClick={handleSubmit} disabled={saving} style={{ ...styles.btnNext, flex: 1, background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>{saving ? "Creating Profile..." : "Create Profile 💍"}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #fdf2f6 0%, #fff9f5 100%)", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  card: { maxWidth: "520px", margin: "0 auto", background: "white", borderRadius: "24px", padding: "32px 24px", boxShadow: "0 20px 60px rgba(139,10,46,0.12)", border: "1px solid #f8e8ed" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#8B0A2E", margin: "0 0 4px 0", fontWeight: "700" },
  subtitle: { color: "#9ca3af", fontSize: "13px", margin: "0 0 24px 0" },
  label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "6px", marginTop: "4px" },
  input: { width: "100%", padding: "14px 16px", border: "1.5px solid #e5e7eb", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box", transition: "all 0.2s", color: "#1f2937" },
  btnRow: { display: "flex", gap: "10px", marginTop: "28px" },
  btnBack: { padding: "14px 22px", borderRadius: "12px", background: "#f3f4f6", color: "#374151", border: "none", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" },
  btnNext: { flex: 1, padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #8B0A2E, #a01438)", color: "white", border: "none", fontWeight: "700", fontSize: "15px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 20px rgba(139,10,46,0.3)" },
};

export default Register;

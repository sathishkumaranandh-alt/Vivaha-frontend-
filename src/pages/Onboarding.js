import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { useCommunities } from "../utils/communities";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const STEPS = [
  { key: "basic", title: "Basic Details", icon: "👤", sub: "Tell us about yourself" },
  { key: "community", title: "Community", icon: "🕉️", sub: "Your religious background" },
  { key: "career", title: "Education & Career", icon: "💼", sub: "What do you do?" },
  { key: "family", title: "Family Details", icon: "🏠", sub: "About your family" },
  { key: "photo", title: "Add Photo", icon: "📷", sub: "A clear face photo" },
  { key: "prefs", title: "Partner Preferences", icon: "💕", sub: "What you're looking for" },
];

const RELIGIONS = ["Hindu", "Christian", "Muslim", "Jain", "Buddhist", "Sikh", "Other"];
const MARITAL_STATUS = ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"];
const FAMILY_TYPES = ["Nuclear", "Joint", "Others"];
const FOOD_PREFS = ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"];
const MOTHER_TONGUES = ["Tamil", "Telugu", "Kannada", "Malayalam", "Hindi", "English", "Other"];
const EDUCATION_OPTIONS = ["High School", "Diploma", "Bachelor's", "Master's", "Doctorate", "Other"];
const INCOME_OPTIONS = ["Below 3 LPA", "3-6 LPA", "6-10 LPA", "10-15 LPA", "15-25 LPA", "25+ LPA"];

function Onboarding() {
  const navigate = useNavigate();
  const { communities } = useCommunities();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [userId, setUserId] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "",
    gender: "",
    dob: "",
    mobile: "",
    location: "",
    mother_tongue: "Tamil",
    bio: "",
    religion: "Hindu",
    community: "",
    sub_caste: "",
    gothram: "",
    rasi: "",
    nakshatra: "",
    education: "",
    college: "",
    occupation: "",
    company: "",
    work_location: "",
    income: "",
    father_occ: "",
    mother_occ: "",
    brothers: "0",
    sisters: "0",
    family_type: "Nuclear",
    food_pref: "Vegetarian",
    marital_status: "Never Married",
    photo_url: "",
    pref_age_min: "21",
    pref_age_max: "35",
    pref_height: "",
    pref_community: "",
    pref_education: "",
    pref_occupation: "",
    pref_location: "",
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUserId(user.id);
      try {
        const res = await fetch(`${BACKEND_URL}/profile/${user.id}?viewerId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile((prev) => ({
              ...prev,
              ...data.profile,
              custom_fields: data.profile.custom_fields || {},
            }));
          }
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const update = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  const getAge = (dobStr) => {
    if (!dobStr) return 0;
    const diff = Date.now() - new Date(dobStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const validateStep = () => {
    const step = STEPS[stepIndex].key;

    if (step === "basic") {
      if (!profile.name?.trim()) return "Name is required";
      if (!profile.gender) return "Gender is required";
      if (!profile.dob) return "Date of Birth is required";
      const age = getAge(profile.dob);
      if (age < 21) return "You must be at least 21 years old";
      if (age > 80) return "Please enter a valid Date of Birth";
      if (!profile.mobile || profile.mobile.length !== 10) return "Valid 10-digit mobile required";
      if (!profile.location?.trim()) return "Location is required";
      return null;
    }
    if (step === "community") {
      if (!profile.religion) return "Religion is required";
      if (!profile.community) return "Community is required";
      return null;
    }
    if (step === "career") {
      if (!profile.education) return "Education is required";
      if (!profile.occupation?.trim()) return "Occupation is required";
      return null;
    }
    if (step === "family") {
      return null; // Optional
    }
    if (step === "photo") {
      if (!profile.photo_url) return "Please upload a profile photo";
      return null;
    }
    if (step === "prefs") {
      return null;
    }
    return null;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // Save to profile immediately as primary photo
      await fetch(`${BACKEND_URL}/photos/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          photo_url: publicUrl,
          is_primary: true,
          is_private: false,
        }),
      });

      update("photo_url", publicUrl);
      toast.success("Photo uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clean nullable numbers
    const payload = { ...profile };
    ["brothers", "sisters", "pref_age_min", "pref_age_max"].forEach((k) => {
      if (payload[k] === "" || payload[k] === undefined) payload[k] = null;
      else if (payload[k] !== null) payload[k] = Number(payload[k]);
    });
    if (payload.dob === "") payload.dob = null;
    if (payload.income === "") payload.income = null;

    delete payload.custom_fields_meta;

    const res = await fetch(`${BACKEND_URL}/profile/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, email: user.email, ...payload }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to save");
    }
  };

  const handleNext = async () => {
    const error = validateStep();
    if (error) return toast.error(error);

    setSaving(true);
    try {
      await saveProfile();
      if (stepIndex === STEPS.length - 1) {
        toast.success("🎉 Profile complete!");
        navigate("/dashboard");
      } else {
        setStepIndex((i) => i + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSkip = async () => {
    if (!window.confirm("Are you sure? Incomplete profile gets fewer matches.")) return;
    setSaving(true);
    try {
      await saveProfile();
      toast.info("You can complete your profile later");
      navigate("/dashboard");
    } catch {
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ marginTop: 16, color: "#8a6b6b" }}>Loading...</p>
      </div>
    );
  }

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex) / STEPS.length) * 100;

  const S = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFF9F5 0%, #FDF2F6 100%)",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: isMobile ? "100px" : "40px",
    },
    topBar: {
      position: "sticky",
      top: 0,
      background: "white",
      borderBottom: "1px solid #f0e0e0",
      padding: isMobile ? "12px 16px" : "16px 32px",
      zIndex: 10,
      boxShadow: "0 2px 8px rgba(139,10,46,0.04)",
    },
    topBarInner: {
      maxWidth: "720px",
      margin: "0 auto",
    },
    progressRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
      fontSize: "12px",
      color: "#8a6b6b",
      fontWeight: 600,
    },
    progressBar: {
      height: "6px",
      background: "#FDF2F6",
      borderRadius: "10px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      width: `${progress}%`,
      background: "linear-gradient(90deg, #8B0A2E, #D4A017)",
      borderRadius: "10px",
      transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    content: {
      maxWidth: "720px",
      margin: "0 auto",
      padding: isMobile ? "20px 16px" : "32px",
    },
    stepIcon: {
      fontSize: "48px",
      textAlign: "center",
      marginBottom: "6px",
      animation: "popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    stepTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "24px" : "30px",
      fontWeight: 800,
      color: "#8B0A2E",
      textAlign: "center",
      margin: "0 0 6px 0",
    },
    stepSub: {
      textAlign: "center",
      color: "#8a6b6b",
      fontSize: "13px",
      marginBottom: "24px",
    },
    card: {
      background: "white",
      borderRadius: "20px",
      padding: isMobile ? "20px" : "28px",
      border: "1px solid #f0e0e0",
      boxShadow: "0 8px 30px rgba(139,10,46,0.06)",
      animation: "slideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "14px",
    },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: 700,
      color: "#555",
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1.5px solid #e5e7eb",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      background: "#FAFAFA",
      boxSizing: "border-box",
      color: "#1f2937",
      transition: "border-color 0.2s, background 0.2s",
    },
    req: { color: "#dc2626" },
    bottomBar: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "white",
      borderTop: "1px solid #f0e0e0",
      padding: isMobile ? "12px 16px" : "16px 32px",
      zIndex: 20,
      boxShadow: "0 -4px 20px rgba(139,10,46,0.08)",
    },
    bottomInner: {
      maxWidth: "720px",
      margin: "0 auto",
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    btnBack: {
      background: "white",
      color: "#374151",
      border: "1.5px solid #e5e7eb",
      padding: "14px 20px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnNext: {
      flex: 1,
      background: "linear-gradient(135deg, #8B0A2E, #a01438)",
      color: "white",
      border: "none",
      padding: "15px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "15px",
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(139,10,46,0.3)",
    },
    btnSkip: {
      background: "none",
      border: "none",
      color: "#8a6b6b",
      fontSize: "12px",
      textDecoration: "underline",
      cursor: "pointer",
      padding: "8px",
      fontFamily: "inherit",
      display: "block",
      margin: "12px auto 0 auto",
    },
    photoPreview: {
      width: "140px",
      height: "140px",
      borderRadius: "50%",
      margin: "0 auto 16px auto",
      background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "52px",
      overflow: "hidden",
      border: "4px solid white",
      boxShadow: "0 8px 30px rgba(139,10,46,0.15)",
    },
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          0% { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* TOP PROGRESS BAR */}
      <div style={S.topBar}>
        <div style={S.topBarInner}>
          <div style={S.progressRow}>
            <span>
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div style={S.progressBar}>
            <div style={S.progressFill} />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={S.content}>
        <div style={S.stepIcon}>{currentStep.icon}</div>
        <h1 style={S.stepTitle}>{currentStep.title}</h1>
        <p style={S.stepSub}>{currentStep.sub}</p>

        <div style={S.card} key={stepIndex}>
          {/* STEP 1: BASIC */}
          {currentStep.key === "basic" && (
            <div style={S.grid}>
              <div>
                <label style={S.label}>
                  Full Name <span style={S.req}>*</span>
                </label>
                <input
                  style={S.input}
                  value={profile.name || ""}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label style={S.label}>
                  Gender <span style={S.req}>*</span>
                </label>
                <select
                  style={S.input}
                  value={profile.gender || ""}
                  onChange={(e) => update("gender", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label style={S.label}>
                  Date of Birth <span style={S.req}>*</span>
                </label>
                <input
                  type="date"
                  style={S.input}
                  value={profile.dob || ""}
                  onChange={(e) => update("dob", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>
                  Mobile <span style={S.req}>*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  style={S.input}
                  value={profile.mobile || ""}
                  onChange={(e) => update("mobile", e.target.value)}
                  placeholder="10-digit number"
                />
              </div>
              <div>
                <label style={S.label}>
                  Location / City <span style={S.req}>*</span>
                </label>
                <input
                  style={S.input}
                  value={profile.location || ""}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="e.g. Chennai"
                />
              </div>
              <div>
                <label style={S.label}>Mother Tongue</label>
                <select
                  style={S.input}
                  value={profile.mother_tongue || "Tamil"}
                  onChange={(e) => update("mother_tongue", e.target.value)}
                >
                  {MOTHER_TONGUES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
                <label style={S.label}>About You (short bio)</label>
                <textarea
                  rows={3}
                  style={{ ...S.input, resize: "vertical", minHeight: "80px" }}
                  value={profile.bio || ""}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Tell us about yourself in a few lines..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: COMMUNITY */}
          {currentStep.key === "community" && (
            <div style={S.grid}>
              <div>
                <label style={S.label}>
                  Religion <span style={S.req}>*</span>
                </label>
                <select
                  style={S.input}
                  value={profile.religion || "Hindu"}
                  onChange={(e) => update("religion", e.target.value)}
                >
                  {RELIGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>
                  Community <span style={S.req}>*</span>
                </label>
                <select
                  style={S.input}
                  value={profile.community || ""}
                  onChange={(e) => update("community", e.target.value)}
                >
                  <option value="">Select Community</option>
                  {communities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.emoji || "👥"} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Sub-Caste</label>
                <input
                  style={S.input}
                  value={profile.sub_caste || ""}
                  onChange={(e) => update("sub_caste", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Gothram</label>
                <input
                  style={S.input}
                  value={profile.gothram || ""}
                  onChange={(e) => update("gothram", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Rasi</label>
                <input
                  style={S.input}
                  value={profile.rasi || ""}
                  onChange={(e) => update("rasi", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Nakshatra</label>
                <input
                  style={S.input}
                  value={profile.nakshatra || ""}
                  onChange={(e) => update("nakshatra", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: CAREER */}
          {currentStep.key === "career" && (
            <div style={S.grid}>
              <div>
                <label style={S.label}>
                  Education <span style={S.req}>*</span>
                </label>
                <select
                  style={S.input}
                  value={profile.education || ""}
                  onChange={(e) => update("education", e.target.value)}
                >
                  <option value="">Select</option>
                  {EDUCATION_OPTIONS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>College / University</label>
                <input
                  style={S.input}
                  value={profile.college || ""}
                  onChange={(e) => update("college", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>
                  Occupation <span style={S.req}>*</span>
                </label>
                <input
                  style={S.input}
                  value={profile.occupation || ""}
                  onChange={(e) => update("occupation", e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <label style={S.label}>Company</label>
                <input
                  style={S.input}
                  value={profile.company || ""}
                  onChange={(e) => update("company", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Work Location</label>
                <input
                  style={S.input}
                  value={profile.work_location || ""}
                  onChange={(e) => update("work_location", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Annual Income</label>
                <select
                  style={S.input}
                  value={profile.income || ""}
                  onChange={(e) => update("income", e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  {INCOME_OPTIONS.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: FAMILY */}
          {currentStep.key === "family" && (
            <div style={S.grid}>
              <div>
                <label style={S.label}>Father's Occupation</label>
                <input
                  style={S.input}
                  value={profile.father_occ || ""}
                  onChange={(e) => update("father_occ", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Mother's Occupation</label>
                <input
                  style={S.input}
                  value={profile.mother_occ || ""}
                  onChange={(e) => update("mother_occ", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Brothers</label>
                <input
                  type="number"
                  min="0"
                  style={S.input}
                  value={profile.brothers ?? "0"}
                  onChange={(e) => update("brothers", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Sisters</label>
                <input
                  type="number"
                  min="0"
                  style={S.input}
                  value={profile.sisters ?? "0"}
                  onChange={(e) => update("sisters", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Family Type</label>
                <select
                  style={S.input}
                  value={profile.family_type || "Nuclear"}
                  onChange={(e) => update("family_type", e.target.value)}
                >
                  {FAMILY_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Food Preference</label>
                <select
                  style={S.input}
                  value={profile.food_pref || "Vegetarian"}
                  onChange={(e) => update("food_pref", e.target.value)}
                >
                  {FOOD_PREFS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Marital Status</label>
                <select
                  style={S.input}
                  value={profile.marital_status || "Never Married"}
                  onChange={(e) => update("marital_status", e.target.value)}
                >
                  {MARITAL_STATUS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: PHOTO */}
          {currentStep.key === "photo" && (
            <div style={{ textAlign: "center" }}>
              <div style={S.photoPreview}>
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt="Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  "👤"
                )}
              </div>
              <p style={{ color: "#8a6b6b", fontSize: "13px", marginBottom: "20px" }}>
                A clear face photo helps get <strong style={{ color: "#8B0A2E" }}>3x more matches</strong>
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ ...S.btnNext, maxWidth: "280px", margin: "0 auto", opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? "Uploading..." : profile.photo_url ? "🔄 Change Photo" : "📤 Upload Photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />
            </div>
          )}

          {/* STEP 6: PREFERENCES */}
          {currentStep.key === "prefs" && (
            <div style={S.grid}>
              <div>
                <label style={S.label}>Preferred Age (Min)</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  style={S.input}
                  value={profile.pref_age_min || ""}
                  onChange={(e) => update("pref_age_min", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Preferred Age (Max)</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  style={S.input}
                  value={profile.pref_age_max || ""}
                  onChange={(e) => update("pref_age_max", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Preferred Height</label>
                <input
                  style={S.input}
                  placeholder="e.g. 5'4&quot; - 5'8&quot;"
                  value={profile.pref_height || ""}
                  onChange={(e) => update("pref_height", e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Preferred Community</label>
                <select
                  style={S.input}
                  value={profile.pref_community || ""}
                  onChange={(e) => update("pref_community", e.target.value)}
                >
                  <option value="">Any</option>
                  {communities.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Preferred Education</label>
                <input
                  style={S.input}
                  value={profile.pref_education || ""}
                  onChange={(e) => update("pref_education", e.target.value)}
                  placeholder="e.g. Any Graduate"
                />
              </div>
              <div>
                <label style={S.label}>Preferred Occupation</label>
                <input
                  style={S.input}
                  value={profile.pref_occupation || ""}
                  onChange={(e) => update("pref_occupation", e.target.value)}
                />
              </div>
              <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
                <label style={S.label}>Preferred Location</label>
                <input
                  style={S.input}
                  value={profile.pref_location || ""}
                  onChange={(e) => update("pref_location", e.target.value)}
                  placeholder="e.g. Chennai, Bangalore"
                />
              </div>
            </div>
          )}
        </div>

        <button type="button" onClick={handleSkip} style={S.btnSkip}>
          Skip for now
        </button>
      </div>

      {/* BOTTOM BAR */}
      <div style={S.bottomBar}>
        <div style={S.bottomInner}>
          {stepIndex > 0 && (
            <button type="button" onClick={handleBack} style={S.btnBack}>
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            style={{ ...S.btnNext, opacity: saving ? 0.6 : 1 }}
          >
            {saving
              ? "Saving..."
              : stepIndex === STEPS.length - 1
              ? "🎉 Complete Profile"
              : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #f0e0e0",
  borderTop: "4px solid #8B0A2E",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

export default Onboarding;

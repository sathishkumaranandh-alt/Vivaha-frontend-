import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import { apiFetch } from "../utils/api"; // 🛡️ Added for JWT

const CORE_TAB_MAP = {
  name: "basic", profile_for: "basic", dob: "basic", mother_tongue: "basic",
  mobile: "basic", gender: "basic", marital_status: "basic", bio: "basic",
  location: "basic",
  religion: "community", caste: "community", sub_caste: "community",
  gothram: "community", horoscope: "community", rasi: "community", nakshatra: "community",
  education: "career", occupation: "career", income: "career",
  college: "career", company: "career", work_location: "career",
  father_occ: "family", mother_occ: "family", brothers: "family",
  sisters: "family", family_type: "family", food_pref: "family",
  pref_age_min: "prefs", pref_age_max: "prefs", pref_height: "prefs",
  pref_community: "prefs", pref_education: "prefs", pref_occupation: "prefs",
  pref_location: "prefs",
};

const STEPS = [
  { key: "basic", title: "Basic Details", icon: "👤", sub: "Tell us about yourself" },
  { key: "community", title: "Community", icon: "🕉️", sub: "Your religious background" },
  { key: "career", title: "Education & Career", icon: "💼", sub: "What do you do?" },
  { key: "family", title: "Family Details", icon: "🏠", sub: "About your family" },
  { key: "prefs", title: "Partner Preferences", icon: "💕", sub: "What you're looking for" },
  { key: "photo", title: "Add Photo", icon: "📷", sub: "A clear face photo" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [userId, setUserId] = useState(null);
  const fileInputRef = useRef(null);

  const [coreFieldsConfig, setCoreFieldsConfig] = useState([]);
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);

  const [profile, setProfile] = useState({
    custom_fields: {},
    photo_url: "",
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function loadConfig() {
      try {
        // 🛡️ SECURITY FIX: Switched to apiFetch
        const [coreRes, customRes] = await Promise.all([
          apiFetch(`/form-config/core-fields`).then((r) =>
            r.ok ? r.json() : { fields: [] }
          ),
          apiFetch(`/form-config/fields`).then((r) =>
            r.ok ? r.json() : { fields: [] }
          ),
        ]);
        const activeCore = (coreRes.fields || []).filter(
          (f) => f.is_active !== false
        );
        const activeCustom = (customRes.fields || []).filter(
          (f) => f.is_active !== false
        );
        setCoreFieldsConfig(activeCore);
        setCustomFieldsConfig(activeCustom);
      } catch (err) {
        console.error("Form config load error:", err);
      } finally {
        setConfigLoaded(true);
      }
    }
    loadConfig();
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
        // 🛡️ SECURITY FIX: Switched to apiFetch & removed viewerId
        const res = await apiFetch(`/profile/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile({
              ...data.profile,
              custom_fields: data.profile.custom_fields || {},
              photo_url: data.profile.photo_url || "",
            });
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

  const updateField = (key, value) =>
    setProfile((p) => ({ ...p, [key]: value }));
  const updateCustom = (key, value) =>
    setProfile((p) => ({
      ...p,
      custom_fields: { ...p.custom_fields, [key]: value },
    }));

  const getAge = (dobStr) => {
    if (!dobStr) return 0;
    const diff = Date.now() - new Date(dobStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const buildTabFields = (tabKey) => {
    const sortFn = (a, b) => {
      const ao = a.display_order || 0;
      const bo = b.display_order || 0;
      if (ao !== bo) return ao - bo;
      return (a.label || "").localeCompare(b.label || "");
    };
    const coreInTab = coreFieldsConfig
      .filter((f) => (CORE_TAB_MAP[f.field_key] || "basic") === tabKey)
      .sort(sortFn);
    const customInTab = customFieldsConfig
      .filter((f) => (f.profile_tab || "basic") === tabKey)
      .sort(sortFn);
    return { coreInTab, customInTab };
  };

  const validateStep = () => {
    const step = STEPS[stepIndex].key;
    if (step === "photo") {
      if (!profile.photo_url) return "Please upload a profile photo";
      return null;
    }

    const { coreInTab, customInTab } = buildTabFields(step);
    const allFields = [...coreInTab, ...customInTab];

    for (const field of allFields) {
      if (!field.is_required) continue;
      const value = profile.custom_fields?.[field.field_key]
        ? profile.custom_fields[field.field_key]
        : profile[field.field_key];
      if (!value || String(value).trim() === "") {
        return `${field.label} is required`;
      }
    }

    if (step === "basic" && profile.dob) {
      const age = getAge(profile.dob);
      if (age < 21) return "You must be at least 21 years old";
      if (age > 80) return "Please enter a valid Date of Birth";
    }
    return null;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // 🛡️ SECURITY FIX: Switched to apiFetch & removed user_id from body
      await apiFetch(`/photos/add`, {
        method: "POST",
        body: JSON.stringify({
          photo_url: publicUrl,
          is_primary: true,
          is_private: false,
        }),
      });

      updateField("photo_url", publicUrl);
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

    const payload = { ...profile };
    const numberFields = [
      "age",
      "pref_age_min",
      "pref_age_max",
      "brothers",
      "sisters",
    ];
    numberFields.forEach((k) => {
      if (payload[k] === "" || payload[k] === undefined) payload[k] = null;
      else if (payload[k] !== null) payload[k] = Number(payload[k]);
    });
    if (payload.dob === "") payload.dob = null;
    if (payload.income === "") payload.income = null;

    delete payload.id;
    delete payload.email;
    delete payload.should_blur_photos;
    delete payload.owner_is_paid;
    delete payload.hidden_by_owner;
    delete payload.contact_masked;
    delete payload.contact_locked_reason;
    delete payload.contact_request_status;
    delete payload.locked_by_paid_member;

    // 🛡️ SECURITY FIX: Switched to apiFetch & removed id/email from body
    const res = await apiFetch(`/profile/${user.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
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
    if (!window.confirm("Skip? Incomplete profile gets fewer matches."))
      return;
    setSaving(true);
    try {
      await saveProfile();
      toast.info("You can complete your profile later");
    } catch {}
    navigate("/dashboard");
    setSaving(false);
  };

  if (loading || !configLoaded) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ marginTop: 16, color: "#8a6b6b" }}>Loading...</p>
      </div>
    );
  }

  const currentStep = STEPS[stepIndex];
  const progress = (stepIndex / STEPS.length) * 100;

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(217,108,145,0.22)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    background: "rgba(255,255,255,0.68)",
    boxSizing: "border-box",
    color: "#1f2937",
    transition: "border-color 0.2s, background 0.2s",
  };
  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "#7A2948",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const renderCoreField = (field) => {
    const { field_key, label, type, is_required, options } = field;
    let value = profile[field_key] ?? "";
    let opts = Array.isArray(options) && options.length > 0 ? options : null;
    const resolvedType = type || "text";

    if (field_key === "gender") {
      const genderOptions =
        opts && opts.length > 0 ? opts : ["Male", "Female"];

      if (value) {
        const lowerVal = String(value).toLowerCase();
        const matched = genderOptions.find(
          (o) => String(o).toLowerCase() === lowerVal
        );
        if (matched) value = matched;
      }

      return (
        <div key={field_key}>
          <label style={labelStyle}>
            {label}{" "}
            {is_required && <span style={{ color: "#dc2626" }}>*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => updateField(field_key, e.target.value.toLowerCase())}
            style={inputStyle}
          >
            <option value="">Select {label}</option>
            {genderOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    let inputEl;
    if (resolvedType === "select" && opts) {
      inputEl = (
        <select
          value={value}
          onChange={(e) => updateField(field_key, e.target.value)}
          style={inputStyle}
        >
          <option value="">Select {label}</option>
          {opts.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    } else if (resolvedType === "date") {
      inputEl = (
        <input
          type="date"
          value={value}
          onChange={(e) => updateField(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "number") {
      inputEl = (
        <input
          type="number"
          value={value}
          onChange={(e) => updateField(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "tel") {
      inputEl = (
        <input
          type="tel"
          maxLength={10}
          value={value}
          onChange={(e) => updateField(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "email") {
      inputEl = (
        <input
          type="email"
          value={value}
          onChange={(e) => updateField(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "textarea") {
      inputEl = (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => updateField(field_key, e.target.value)}
          style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
        />
      );
    } else {
      inputEl = (
        <input
          type="text"
          value={value}
          onChange={(e) => updateField(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    }

    return (
      <div key={field_key}>
        <label style={labelStyle}>
          {label}{" "}
          {is_required && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
        {inputEl}
      </div>
    );
  };

  const renderCustomField = (field) => {
    const { field_key, label, type, is_required, options } = field;
    const value = profile.custom_fields?.[field_key] || "";
    const opts = Array.isArray(options) ? options : [];
    const resolvedType = type || "text";

    let inputEl;
    if (resolvedType === "select") {
      inputEl = (
        <select
          value={value}
          onChange={(e) => updateCustom(field_key, e.target.value)}
          style={inputStyle}
        >
          <option value="">Select {label}</option>
          {opts.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    } else if (resolvedType === "date") {
      inputEl = (
        <input
          type="date"
          value={value}
          onChange={(e) => updateCustom(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "number") {
      inputEl = (
        <input
          type="number"
          value={value}
          onChange={(e) => updateCustom(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "tel") {
      inputEl = (
        <input
          type="tel"
          maxLength={10}
          value={value}
          onChange={(e) => updateCustom(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "email") {
      inputEl = (
        <input
          type="email"
          value={value}
          onChange={(e) => updateCustom(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    } else if (resolvedType === "textarea") {
      inputEl = (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => updateCustom(field_key, e.target.value)}
          style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
        />
      );
    } else {
      inputEl = (
        <input
          type="text"
          value={value}
          onChange={(e) => updateCustom(field_key, e.target.value)}
          style={inputStyle}
        />
      );
    }

    return (
      <div key={field_key}>
        <label style={labelStyle}>
          {label}{" "}
          {is_required && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
        {inputEl}
      </div>
    );
  };

  const { coreInTab, customInTab } = buildTabFields(currentStep.key);

  const S = {
    page: {
      minHeight: "100vh",
      position: "relative",
      background: "radial-gradient(ellipse at 8% 8%, rgba(255,255,255,0.98), transparent 32%), radial-gradient(ellipse at 92% 16%, rgba(248,220,231,0.92), transparent 32%), radial-gradient(ellipse at 70% 88%, rgba(217,108,145,0.13), transparent 34%), linear-gradient(135deg, #FFF1F5 0%, #FFF8FA 48%, #F8DCE7 100%)",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: isMobile ? "100px" : "40px",
    },
    topBar: {
      position: "sticky",
      top: 0,
      background: "rgba(255,255,255,0.62)",
      borderBottom: "1px solid rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px) saturate(150%)",
      WebkitBackdropFilter: "blur(20px) saturate(150%)",
      padding: isMobile ? "12px 16px" : "16px 32px",
      zIndex: 10,
      boxShadow: "0 8px 28px rgba(122,41,72,0.06)",
    },
    topBarInner: { maxWidth: "860px", margin: "0 auto" },
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
      background: "rgba(255,255,255,0.62)",
      borderRadius: "10px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      width: `${progress}%`,
      background: "linear-gradient(90deg, #D96C91, #7A2948)",
      borderRadius: "10px",
      transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    content: {
      maxWidth: "860px",
      margin: "0 auto",
      padding: isMobile ? "20px 16px" : "36px 32px",
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
      color: "#7A2948",
      textAlign: "center",
      margin: "0 0 6px 0",
    },
    stepSub: {
      textAlign: "center",
      color: "#94677A",
      fontSize: "13px",
      marginBottom: "24px",
    },
    card: {
      background: "linear-gradient(145deg, rgba(255,255,255,0.76), rgba(255,255,255,0.48))",
      borderRadius: "26px",
      padding: isMobile ? "20px" : "34px",
      border: "1px solid rgba(255,255,255,0.92)",
      boxShadow: "0 24px 65px rgba(122,41,72,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
      backdropFilter: "blur(24px) saturate(150%)",
      WebkitBackdropFilter: "blur(24px) saturate(150%)",
      animation: "slideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "14px",
    },
    bottomBar: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(255,255,255,0.74)",
      borderTop: "1px solid rgba(255,255,255,0.9)",
      backdropFilter: "blur(22px) saturate(150%)",
      WebkitBackdropFilter: "blur(22px) saturate(150%)",
      padding: isMobile ? "12px 16px" : "16px 32px",
      zIndex: 20,
      boxShadow: "0 -8px 32px rgba(122,41,72,0.09)",
    },
    bottomInner: {
      maxWidth: "720px",
      margin: "0 auto",
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    btnBack: {
      background: "rgba(255,255,255,0.72)",
      color: "#7A2948",
      border: "1px solid rgba(217,108,145,0.26)",
      padding: "14px 20px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnNext: {
      flex: 1,
      background: "linear-gradient(115deg, #D96C91, #A83D67 55%, #7A2948)",
      color: "white",
      border: "none",
      padding: "15px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "15px",
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 10px 24px rgba(168,61,103,0.26)",
    },
    btnSkip: {
      background: "none",
      border: "none",
      color: "#94677A",
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
      background: "linear-gradient(135deg, #FFF1F5, #F8DCE7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "52px",
      overflow: "hidden",
      border: "4px solid rgba(255,255,255,0.92)",
      boxShadow: "0 12px 34px rgba(168,61,103,0.18)",
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
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

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

      <div style={S.content}>
        <div style={S.stepIcon}>{currentStep.icon}</div>
        <h1 style={S.stepTitle}>{currentStep.title}</h1>
        <p style={S.stepSub}>{currentStep.sub}</p>

        <div style={S.card} key={stepIndex}>
          {currentStep.key !== "photo" && (
            <>
              {coreInTab.length > 0 || customInTab.length > 0 ? (
                <div style={S.grid}>
                  {coreInTab.map((field) => renderCoreField(field))}
                  {customInTab.map((field) => renderCustomField(field))}
                </div>
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    color: "#8a6b6b",
                    padding: "20px 0",
                  }}
                >
                  No fields configured for this section.
                </p>
              )}
            </>
          )}

          {currentStep.key === "photo" && (
            <div style={{ textAlign: "center" }}>
              <div style={S.photoPreview}>
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "👤"
                )}
              </div>
              <p
                style={{
                  color: "#8a6b6b",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                A clear face photo helps get{" "}
                <strong style={{ color: "#8B0A2E" }}>3x more matches</strong>
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  ...S.btnNext,
                  maxWidth: "280px",
                  margin: "0 auto",
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading
                  ? "Uploading..."
                  : profile.photo_url
                  ? "🔄 Change Photo"
                  : "📤 Upload Photo"}
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
        </div>

        <button type="button" onClick={handleSkip} style={S.btnSkip}>
          Skip for now
        </button>
      </div>

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

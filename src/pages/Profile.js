import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import PhotoGallery from "../components/PhotoGallery";j
import ReportModal from "../components/ReportModal";
import BackButton from "../components/BackButton";
import { toast } from "../utils/toast";
import { useCommunities } from "../utils/communities";
import { calculateMatchScore } from "../utils/matchScore";
import { getPageTheme, getCardStyle } from "../utils/pageTheme";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function getAge(dobString) {
  if (!dobString) return 0;
  const diff = Date.now() - new Date(dobString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ============================================
// CORE FIELD → PROFILE TAB MAP
// (Which tab each core field belongs to)
// ============================================
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

// ============================================
// TAB LABELS
// ============================================
const TAB_LABELS = {
  basic: "👤 Basic",
  community: "🕉️ Community",
  career: "💼 Career",
  family: "🏠 Family",
  prefs: "💕 Preferences",
  photos: "📷 Photos",
};

function Profile() {
  const { id } = useParams();
  const isOwnProfile = !id;
  const { communities } = useCommunities();

  const [profile, setProfile] = useState({
    name: "", age: "", gender: "", religion: "", caste: "",
    location: "", education: "", occupation: "", bio: "",
    photo_url: "", community: "", income: "", marital_status: "",
    profile_for: "", dob: "", mother_tongue: "", sub_caste: "",
    gothram: "", horoscope: "Available", rasi: "", nakshatra: "",
    college: "", company: "", work_location: "", father_occ: "",
    mother_occ: "", brothers: "0", sisters: "0", family_type: "Nuclear",
    food_pref: "Vegetarian", mobile: "", pref_age_min: "", pref_age_max: "",
    pref_height: "", pref_community: "", pref_education: "",
    pref_occupation: "", pref_location: "", custom_fields: {},
    should_blur_photos: false, owner_is_paid: false, hidden_by_owner: false,
    contact_masked: false, contact_locked_reason: null, contact_request_status: "none",
    locked_by_paid_member: false,
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTab, setEditTab] = useState("basic");
  const [fadeIn, setFadeIn] = useState(true);
  const [matchScore, setMatchScore] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [activeTab, setActiveTab] = useState("about");

  const [interestStatus, setInterestStatus] = useState("none");
  const [interestDirection, setInterestDirection] = useState(null);
  const [interestBusy, setInterestBusy] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);

  const [pageTheme, setPageTheme] = useState(getPageTheme("profile"));

  const [coreFieldsConfig, setCoreFieldsConfig] = useState([]);
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const handler = () => setPageTheme(getPageTheme("profile"));
    window.addEventListener("theme-refresh", handler);
    return () => window.removeEventListener("theme-refresh", handler);
  }, []);

  useEffect(() => {
    setFadeIn(false);
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [editTab]);

  // Load Form Config
  useEffect(() => {
    async function loadConfig() {
      try {
        const [coreRes, customRes] = await Promise.all([
          fetch(`${BACKEND_URL}/form-config/core-fields`).then(r => r.ok ? r.json() : { fields: [] }),
          fetch(`${BACKEND_URL}/form-config/fields`).then(r => r.ok ? r.json() : { fields: [] }),
        ]);
        const activeCore = (coreRes.fields || []).filter(f => f.is_active !== false && f.show_in_profile !== false);
        const activeCustom = (customRes.fields || []).filter(f => f.is_active !== false && f.show_in_profile !== false);
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
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Please log in."); setLoading(false); return; }
        setCurrentUserId(user.id);
        const targetId = id || user.id;

        const res = await fetch(`${BACKEND_URL}/profile/${targetId}?viewerId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile({
              ...data.profile,
              name: data.profile.name || "",
              age: data.profile.age || "",
              gender: data.profile.gender || "",
              religion: data.profile.religion || "",
              caste: data.profile.caste || "",
              location: data.profile.location || "",
              education: data.profile.education || "",
              occupation: data.profile.occupation || "",
              bio: data.profile.bio || "",
              photo_url: data.profile.photo_url || "",
              community: data.profile.community || "",
              income: data.profile.income || "",
              marital_status: data.profile.marital_status || "Never Married",
              profile_for: data.profile.profile_for || "",
              dob: data.profile.dob || "",
              mother_tongue: data.profile.mother_tongue || "",
              sub_caste: data.profile.sub_caste || "",
              gothram: data.profile.gothram || "",
              horoscope: data.profile.horoscope || "Available",
              rasi: data.profile.rasi || "",
              nakshatra: data.profile.nakshatra || "",
              college: data.profile.college || "",
              company: data.profile.company || "",
              work_location: data.profile.work_location || "",
              father_occ: data.profile.father_occ || "",
              mother_occ: data.profile.mother_occ || "",
              brothers: data.profile.brothers ?? "0",
              sisters: data.profile.sisters ?? "0",
              family_type: data.profile.family_type || "Nuclear",
              food_pref: data.profile.food_pref || "Vegetarian",
              mobile: data.profile.mobile || "",
              pref_age_min: data.profile.pref_age_min || "",
              pref_age_max: data.profile.pref_age_max || "",
              pref_height: data.profile.pref_height || "",
              pref_community: data.profile.pref_community || "",
              pref_education: data.profile.pref_education || "",
              pref_occupation: data.profile.pref_occupation || "",
              pref_location: data.profile.pref_location || "",
              custom_fields: data.profile.custom_fields || {},
              should_blur_photos: data.profile.should_blur_photos === true,
              owner_is_paid: data.profile.owner_is_paid === true,
              hidden_by_owner: data.profile.hidden_by_owner === true,
              contact_masked: data.profile.contact_masked === true,
              contact_locked_reason: data.profile.contact_locked_reason || null,
              contact_request_status: data.profile.contact_request_status || "none",
              locked_by_paid_member: data.profile.locked_by_paid_member === true,
            });
            setProfileExists(true);

            if (!isOwnProfile) {
              fetch(`${BACKEND_URL}/visitors/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewerId: user.id, viewedId: targetId })
              }).catch(err => console.error("Failed to log view:", err));

              fetch(`${BACKEND_URL}/profile/${user.id}?viewerId=${user.id}`)
                .then(r => r.json())
                .then(viewerData => {
                  if (viewerData?.profile) {
                    const score = calculateMatchScore(viewerData.profile, data.profile);
                    setMatchScore(score);
                  }
                })
                .catch(err => console.error("Match score error:", err));
            }
          }
        } else if (res.status === 404 && isOwnProfile) {
          setProfileExists(false);
          setIsEditing(true);
        } else {
          setError(isOwnProfile ? "Could not load your profile." : "This profile does not exist.");
        }

        if (!isOwnProfile) {
          await loadInterestStatus(user.id, targetId);
          await loadShortlistStatus(user.id, targetId);
        }
      } catch (err) {
        console.error(err);
        setError("Network error. Try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isOwnProfile]);

  const loadInterestStatus = async (uid, other) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/status/${uid}/${other}`);
      if (res.ok) {
        const data = await res.json();
        setInterestStatus(data.status || "none");
        setInterestDirection(data.direction || null);
      }
    } catch {}
  };

  const loadShortlistStatus = async (uid, other) => {
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlisted/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setIsShortlisted((data.shortlisted || []).some((s) => s.shortlisted_user_id === other));
      }
    } catch {}
  };

  const handleSendInterest = async () => {
    if (!currentUserId) return;
    if (interestStatus === "pending" && interestDirection === "sent") return toast.info("Interest already sent");
    if (interestStatus === "accepted") return toast.info("Already connected");
    setInterestBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/interests/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: currentUserId, receiver_id: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setInterestStatus("pending");
        setInterestDirection("sent");
        toast.success("❤️ Interest sent!");
      } else {
        toast.error(data.error || "Could not send interest");
      }
    } catch { toast.error("Network error"); } finally { setInterestBusy(false); }
  };

  const handleShortlist = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/interests/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, shortlisted_user_id: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsShortlisted(data.action === "added");
        toast.success(data.action === "added" ? "Shortlisted" : "Removed");
      }
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    try {
      setSaving(true);

      if (profile.dob) {
        const age = getAge(profile.dob);
        if (age < 21) {
          toast.error("You must be at least 21 years old.");
          setSaving(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const {
        is_boosted, should_blur_photos, owner_is_paid, viewer_is_paid,
        viewer_has_approval, locked_by_paid_member, hidden_by_owner,
        boost_expires_at, match_score, viewer_permissions, contact_masked,
        contact_locked_reason, contact_request_status, ...safeProfile
      } = profile;

      delete safeProfile.id;
      delete safeProfile.email;

      const cleanedProfile = { ...safeProfile };
      const nullableDateFields = ["dob"];
      const nullableNumberFields = ["age", "pref_age_min", "pref_age_max", "brothers", "sisters"];

      nullableDateFields.forEach((field) => {
        if (!cleanedProfile[field] || cleanedProfile[field] === "") cleanedProfile[field] = null;
      });
      nullableNumberFields.forEach((field) => {
        if (cleanedProfile[field] === "" || cleanedProfile[field] === undefined) cleanedProfile[field] = null;
        else if (cleanedProfile[field] !== null) cleanedProfile[field] = Number(cleanedProfile[field]);
      });

      if (cleanedProfile.income === "") cleanedProfile.income = null;

      const profileData = { id: user.id, email: user.email, ...cleanedProfile, updated_at: new Date().toISOString() };

      const res = await fetch(`${BACKEND_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success("Profile saved!");
      setProfileExists(true);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const completion = (() => {
    const fields = ["name", "dob", "gender", "religion", "caste", "location", "education", "occupation", "bio", "photo_url", "community", "mobile", "marital_status", "family_type", "food_pref"];
    const filled = fields.filter((f) => profile[f] && String(profile[f]).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  })();

  // Theme shortcuts
  const pageBg = pageTheme.bg;
  const pageHeading = pageTheme.heading;
  const pageBody = pageTheme.body;
  const pageMuted = pageTheme.muted;
  const pageLink = pageTheme.link;
  const baseSize = `${pageTheme.baseSize}px`;
  const cardStyle = getCardStyle(pageTheme);

  const labelStyle_dynamic = {
    color: pageTheme.labelColor || pageMuted,
    fontSize: `${pageTheme.labelSize || 12}px`,
    fontWeight: parseInt(pageTheme.labelWeight) || 500,
  };
  const valueStyle_dynamic = {
    color: pageTheme.valueColor || pageBody,
    fontSize: `${pageTheme.valueSize || 12}px`,
    fontWeight: parseInt(pageTheme.valueWeight) || 600,
  };

  // ============================================
  // DYNAMIC FIELD RENDERING
  // ============================================
  const updateField = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));
  const updateCustom = (key, value) => setProfile(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [key]: value } }));

  // Renders core field using DB-provided type and options
  const renderCoreField = (field) => {
    const { field_key, label, type, is_required } = field;
    const value = profile[field_key] ?? "";
    const options = Array.isArray(field.options) && field.options.length > 0 ? field.options : null;
    const resolvedType = type || "text";

    const commonProps = {
      value: value,
      onChange: (e) => updateField(field_key, e.target.value),
      style: inputStyle,
    };

    let inputEl;
    if (resolvedType === "select" && options) {
      inputEl = (
        <select {...commonProps}>
          <option value="">Select {label}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    } else if (resolvedType === "date") {
      inputEl = <input type="date" {...commonProps} />;
    } else if (resolvedType === "number") {
      inputEl = <input type="number" {...commonProps} />;
    } else if (resolvedType === "tel") {
      inputEl = <input type="tel" {...commonProps} maxLength={10} />;
    } else if (resolvedType === "email") {
      inputEl = <input type="email" {...commonProps} />;
    } else if (resolvedType === "textarea") {
      inputEl = <textarea {...commonProps} rows={3} style={{ ...inputStyle, resize: "vertical" }} />;
    } else {
      inputEl = <input type="text" {...commonProps} />;
    }

    return (
      <div key={field_key}>
        <label style={labelStyle}>{label}{is_required && " *"}</label>
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
          {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    } else if (resolvedType === "date") {
      inputEl = <input type="date" value={value} onChange={(e) => updateCustom(field_key, e.target.value)} style={inputStyle} />;
    } else if (resolvedType === "number") {
      inputEl = <input type="number" value={value} onChange={(e) => updateCustom(field_key, e.target.value)} style={inputStyle} />;
    } else if (resolvedType === "tel") {
      inputEl = <input type="tel" value={value} maxLength={10} onChange={(e) => updateCustom(field_key, e.target.value)} style={inputStyle} />;
    } else if (resolvedType === "email") {
      inputEl = <input type="email" value={value} onChange={(e) => updateCustom(field_key, e.target.value)} style={inputStyle} />;
    } else if (resolvedType === "textarea") {
      inputEl = <textarea value={value} rows={3} onChange={(e) => updateCustom(field_key, e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />;
    } else {
      inputEl = <input type="text" value={value} onChange={(e) => updateCustom(field_key, e.target.value)} style={inputStyle} />;
    }

    return (
      <div key={field_key}>
        <label style={labelStyle}>{label}{is_required && " *"}</label>
        {inputEl}
      </div>
    );
  };

  const buildTabFields = (tabKey) => {
    const coreInTab = coreFieldsConfig
      .filter(f => (CORE_TAB_MAP[f.field_key] || "basic") === tabKey)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const customInTab = customFieldsConfig
      .filter(f => (f.profile_tab || "basic") === tabKey)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return { coreInTab, customInTab };
  };

  const tabsWithFields = ["basic", "community", "career", "family", "prefs"].filter(t => {
    const { coreInTab, customInTab } = buildTabFields(t);
    return coreInTab.length > 0 || customInTab.length > 0;
  });

  // ============ LOADING / ERROR ============
  if (loading || !configLoaded) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", background: pageBg, minHeight: "100vh" }}>
        <div style={spinnerStyle} />
        <p style={{ color: pageMuted, marginTop: "16px" }}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", background: pageBg, minHeight: "100vh" }}>
        <BackButton />
        <p style={{ color: "#b91c1c", marginBottom: "20px" }}>{error}</p>
        <Link to="/login" style={{ color: pageLink, fontWeight: "bold" }}>Go to Login</Link>
      </div>
    );
  }

  // ============ EDIT MODE ============
  if (isOwnProfile && isEditing) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", background: pageBg, minHeight: "100vh", boxSizing: "border-box" }}>
        <BackButton fallback="/dashboard" />

        <div style={{ background: "linear-gradient(135deg, #8B0A2E, #a01438)", borderRadius: "16px", padding: "24px", marginBottom: "20px", color: "white" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", margin: 0 }}>
            {profileExists ? "✏️ Edit Your Profile" : "📝 Create Your Profile"}
          </h1>
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
              <span>Profile Completeness</span>
              <strong>{completion}%</strong>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
              <div style={{ width: `${completion}%`, height: "100%", background: "#D4A017" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
          {tabsWithFields.map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setEditTab(tabKey)}
              style={{
                padding: "10px 18px", borderRadius: "10px", border: "1.5px solid", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s",
                background: editTab === tabKey ? pageLink : "white",
                color: editTab === tabKey ? "white" : pageHeading,
                borderColor: editTab === tabKey ? pageLink : pageTheme.cardBorder
              }}
            >
              {TAB_LABELS[tabKey] || tabKey}
            </button>
          ))}
          <button
            onClick={() => setEditTab("photos")}
            style={{
              padding: "10px 18px", borderRadius: "10px", border: "1.5px solid", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s",
              background: editTab === "photos" ? pageLink : "white",
              color: editTab === "photos" ? "white" : pageHeading,
              borderColor: editTab === "photos" ? pageLink : pageTheme.cardBorder
            }}
          >
            {TAB_LABELS.photos}
          </button>
        </div>

        <form onSubmit={handleSave} style={cardStyle}>
          <div style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(8px)", transition: "all 0.25s ease" }}>
            {tabsWithFields.includes(editTab) && (
              <div>
                <h3 style={{ ...labelHeader, color: pageHeading, borderBottomColor: pageTheme.cardBorder }}>
                  {TAB_LABELS[editTab]}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                  {buildTabFields(editTab).coreInTab.map(field => renderCoreField(field))}
                  {buildTabFields(editTab).customInTab.map(field => renderCustomField(field))}
                </div>
              </div>
            )}

            {editTab === "photos" && (
              <div>
                <h3 style={{ ...labelHeader, color: pageHeading, borderBottomColor: pageTheme.cardBorder }}>Your Photos</h3>
                {currentUserId && (
                  <PhotoGallery
                    userId={currentUserId}
                    onPrimaryChange={(url) => setProfile({ ...profile, photo_url: url })}
                    fallbackPhotoUrl={profile.photo_url}
                  />
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "28px", borderTop: `1px solid ${pageTheme.cardBorder}`, paddingTop: "20px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, background: pageLink, color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
              {saving ? "Saving..." : "💾 Save Profile"}
            </button>
            {profileExists && (
              <button type="button" onClick={() => setIsEditing(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "14px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ============ HIDDEN BY OWNER ============
  if (profile.hidden_by_owner) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px", textAlign: "center", background: pageBg, minHeight: "100vh", boxSizing: "border-box" }}>
        <BackButton />
        <div style={cardStyle}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: pageHeading, fontFamily: "'Playfair Display', serif", marginBottom: "12px" }}>{profile.name || "This User"}</h2>
          <p style={{ color: pageMuted, fontSize: baseSize, lineHeight: 1.6 }}>
            {profile.age ? `${profile.age} yrs · ` : ""}{profile.location || ""}
          </p>
          <p style={{ color: pageMuted, fontSize: baseSize, marginTop: "12px" }}>This user has restricted who can see their profile.</p>
        </div>
      </div>
    );
  }

  // ============ VIEW MODE ============
  const myCommunity = communities.find((c) => c.slug === profile.community);

  const displayLocation =
    profile.location ||
    profile.custom_fields?.place ||
    profile.custom_fields?.location ||
    "";

  const S = {
    layout: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "16px 16px 48px 16px" : "32px 32px 80px 32px",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: "320px 1fr",
      gap: "24px",
      alignItems: "start",
      background: pageBg,
      fontSize: baseSize,
      color: pageBody,
      boxSizing: "border-box",
    },
    heartBig: {
      position: "absolute",
      top: "60px",
      right: "14px",
      width: "36px",
      height: "36px",
      background: "rgba(255,255,255,0.9)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: pageHeading,
      fontSize: "18px",
      fontWeight: "bold",
      border: "none",
      cursor: "pointer",
      zIndex: 5,
    },
    mainCard: cardStyle,
    profileHeader: {
      display: "flex",
      justifyContent: "space-between",
      gap: "20px",
      paddingBottom: "20px",
      borderBottom: `1px solid ${pageTheme.cardBorder}`,
      flexWrap: "wrap",
      marginBottom: "20px",
    },
    nameH1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "28px",
      fontWeight: 700,
      color: pageHeading,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "4px",
      flexWrap: "wrap",
    },
    badge: { background: "#10B981", color: "white", fontSize: "11px", padding: "3px 10px", borderRadius: "10px", fontWeight: 700 },
    paidBadge: { background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", fontSize: "11px", padding: "3px 10px", borderRadius: "10px", fontWeight: 700 },
    sub: { color: pageMuted, fontSize: "14px" },
    actionsCol: { display: "flex", flexDirection: "column", gap: "8px", minWidth: isMobile ? "100%" : "160px" },
    btnPrimary: { background: pageLink, color: "white", border: "none", padding: "11px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" },
    btnOutline: { background: "white", color: pageHeading, border: `1.5px solid ${pageHeading}`, padding: "10px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" },
    btnReport: { background: "none", border: "none", color: pageMuted, fontSize: "12px", textDecoration: "underline", cursor: "pointer", padding: "4px", fontFamily: "inherit" },
    infoRow: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "20px" },
    infoItem: { display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: pageBody },
    iconBox: { width: "32px", height: "32px", borderRadius: "8px", background: "#FDF2F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 },
    tabs: { display: "flex", gap: "24px", borderBottom: `1px solid ${pageTheme.cardBorder}`, marginBottom: "20px", overflowX: "auto" },
    tab: { background: "none", border: "none", padding: "12px 0", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, color: pageMuted, cursor: "pointer", whiteSpace: "nowrap", borderBottom: "2px solid transparent", marginBottom: "-1px" },
    tabActive: { color: pageHeading, borderColor: pageHeading },
    aboutText: { color: pageBody, fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" },
    tagsWrap: { display: "flex", gap: "6px", flexWrap: "wrap" },
    interestTag: { background: "#FFF9F5", border: `1px solid ${pageTheme.cardBorder}`, color: pageMuted, padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 500 },
    quickInfo: cardStyle,
    qiTitle: { fontFamily: "'Playfair Display', serif", color: pageHeading, fontSize: "16px", marginBottom: "16px" },
    qiRow: { display: "flex", gap: "12px", padding: "9px 0", borderBottom: `1px solid ${pageTheme.cardBorder}`, alignItems: "center" },
    qiLabel: { ...labelStyle_dynamic, flex: "0 0 110px" },
    qiValue: { ...valueStyle_dynamic, flex: 1 },
    notProvided: { color: "#999", fontStyle: "italic", fontWeight: 400 },
  };

  const fieldOrLock = (value) => {
    if (value) return value;
    if (isOwnProfile) return <span style={S.notProvided}>Not set</span>;
    if (profile.locked_by_paid_member && !value) {
      if (["rasi", "nakshatra", "gothram"].includes(value)) {
        return <Link to="/subscription" style={{ color: "#D4A017", fontWeight: 700, textDecoration: "none" }}>🔒 Upgrade to view</Link>;
      }
    }
    return <span style={S.notProvided}>Not provided</span>;
  };

  return (
    <>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 16px 0 16px", background: pageBg }}>
        {!isOwnProfile && <BackButton fallback="/search" />}
      </div>

      <div style={S.layout}>
        <div style={{ position: "relative" }}>
          {isOwnProfile && (
            <div style={{ marginBottom: "12px", textAlign: "right" }}>
              <button onClick={() => setIsEditing(true)} style={{ background: "#FDF2F6", color: pageHeading, border: `1px solid ${pageTheme.cardBorder}`, padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✏️ Manage Photos</button>
            </div>
          )}

          <PhotoGallery userId={id || currentUserId} readOnly={!isOwnProfile} fallbackPhotoUrl={profile.photo_url} onPrimaryChange={(url) => setProfile({ ...profile, photo_url: url })} shouldBlur={profile.should_blur_photos === true} hideRequest={profile.locked_by_paid_member === true} />

          {!isOwnProfile && (
            <button style={S.heartBig} onClick={handleShortlist} title="Shortlist">{isShortlisted ? "♥" : "♡"}</button>
          )}
        </div>

        <div>
          <div style={S.mainCard}>
            <div style={S.profileHeader}>
              <div>
                <h1 style={S.nameH1}>
                  {profile.name || "Anonymous"}
                  {profile.is_verified && <span style={S.badge}>✓ Verified</span>}
                  {profile.owner_is_paid && <span style={S.paidBadge}>👑 Paid Member</span>}
                </h1>

                {matchScore && !isOwnProfile && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px", background: "white",
                    border: `1.5px solid ${matchScore.color}`, padding: "6px 14px", borderRadius: "20px",
                    marginBottom: "8px", boxShadow: `0 4px 12px ${matchScore.color}30`
                  }}>
                    <span style={{ fontSize: "14px" }}>💯</span>
                    <span style={{ color: matchScore.color, fontWeight: "800", fontSize: "14px" }}>
                      {matchScore.percent}% Match
                    </span>
                    <span style={{ color: pageMuted, fontSize: "12px", fontWeight: "600" }}>
                      • {matchScore.label}
                    </span>
                  </div>
                )}

                <div style={S.sub}>
                  {profile.dob ? `DOB: ${new Date(profile.dob).toLocaleDateString("en-IN")}` : (isOwnProfile ? "" : (profile.hidden_by_owner ? "" : (profile.locked_by_paid_member ? "🔒 DOB hidden" : "")))}
                  {profile.dob && displayLocation ? " • " : ""}{displayLocation}
                </div>
              </div>
              <div style={S.actionsCol}>
                {isOwnProfile ? (
                  <>
                    <button onClick={() => setIsEditing(true)} style={S.btnPrimary}>✏️ Edit Profile</button>
                    <Link to="/dashboard" style={{ ...S.btnOutline, textDecoration: "none", textAlign: "center" }}>📊 Dashboard</Link>
                  </>
                ) : (
                  <>
                    {interestStatus === "accepted" ? (
                      <Link to={`/messages?to=${id}`} style={{ ...S.btnPrimary, textDecoration: "none", textAlign: "center" }}>💬 Message</Link>
                    ) : (
                      <button onClick={handleSendInterest} disabled={interestBusy || (interestStatus === "pending" && interestDirection === "sent")} style={{ ...S.btnPrimary, opacity: interestBusy ? 0.6 : 1 }}>
                        {interestStatus === "pending" && interestDirection === "sent" ? "✓ Interest Sent" : interestStatus === "pending" && interestDirection === "received" ? "📥 Respond to Interest" : "💌 Send Interest"}
                      </button>
                    )}
                    <button onClick={handleShortlist} style={S.btnOutline}>{isShortlisted ? "♥ Shortlisted" : "♡ Shortlist"}</button>
                    <button onClick={() => setShowReportModal(true)} style={S.btnReport}>⚐ Report</button>
                  </>
                )}
              </div>
            </div>

            <div style={S.infoRow}>
              {profile.education && <div style={S.infoItem}><div style={S.iconBox}>🎓</div>{profile.education}</div>}
              {profile.occupation && <div style={S.infoItem}><div style={S.iconBox}>💼</div>{profile.occupation}</div>}
              {profile.income ? (<div style={S.infoItem}><div style={S.iconBox}>💰</div>₹ {profile.income}</div>) : !isOwnProfile && profile.locked_by_paid_member ? (<div style={S.infoItem}><div style={S.iconBox}>💰</div><Link to="/subscription" style={{ color: "#D4A017", fontWeight: 700, textDecoration: "none" }}>🔒 Upgrade to view income</Link></div>) : null}
              {profile.community && <div style={S.infoItem}><div style={S.iconBox}>🏷️</div>{myCommunity?.name || profile.community}</div>}
              {profile.marital_status && <div style={S.infoItem}><div style={S.iconBox}>💍</div>{profile.marital_status.replace(/_/g, " ")}</div>}
            </div>

            <div style={S.tabs}>
              {["about", "community", "family", "preferences"].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}>
                  {t === "about" ? "About" : t === "community" ? "Community & Horoscope" : t === "family" ? "Family Details" : "Partner Preferences"}
                </button>
              ))}
            </div>

            {activeTab === "about" && (
              <>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: pageHeading, fontSize: "16px", marginBottom: "10px" }}>About {isOwnProfile ? "Me" : profile.name?.split(" ")[0] || "Them"}</h3>
                <p style={S.aboutText}>{profile.bio || "No description provided yet."}</p>
                <div style={S.tagsWrap}>{["Reading", "Music", "Family time", "Travel", "Cooking"].map((tag) => (<span key={tag} style={S.interestTag}>{tag}</span>))}</div>
              </>
            )}

            {activeTab === "community" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={S.qiRow}><span style={S.qiLabel}>Religion</span><span style={S.qiValue}>{profile.religion || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Caste</span><span style={S.qiValue}>{profile.caste || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Sub-Caste</span><span style={S.qiValue}>{profile.sub_caste || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Gothram</span><span style={S.qiValue}>{fieldOrLock(profile.gothram)}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Horoscope</span><span style={S.qiValue}>{profile.horoscope || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Rasi</span><span style={S.qiValue}>{fieldOrLock(profile.rasi)}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Nakshatra</span><span style={S.qiValue}>{fieldOrLock(profile.nakshatra)}</span></div>
              </div>
            )}

            {activeTab === "family" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={S.qiRow}><span style={S.qiLabel}>Father's Occ.</span><span style={S.qiValue}>{profile.father_occ || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Mother's Occ.</span><span style={S.qiValue}>{profile.mother_occ || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Brothers</span><span style={S.qiValue}>{profile.brothers ?? "0"}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Sisters</span><span style={S.qiValue}>{profile.sisters ?? "0"}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Family Type</span><span style={S.qiValue}>{profile.family_type || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Food Pref.</span><span style={S.qiValue}>{profile.food_pref || <span style={S.notProvided}>Not provided</span>}</span></div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={S.qiRow}><span style={S.qiLabel}>Age Range</span><span style={S.qiValue}>{profile.pref_age_min ? `${profile.pref_age_min} - ${profile.pref_age_max || "—"} yrs` : <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Height</span><span style={S.qiValue}>{profile.pref_height || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Community</span><span style={S.qiValue}>{profile.pref_community || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Education</span><span style={S.qiValue}>{profile.pref_education || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Occupation</span><span style={S.qiValue}>{profile.pref_occupation || <span style={S.notProvided}>Not provided</span>}</span></div>
                <div style={S.qiRow}><span style={S.qiLabel}>Location</span><span style={S.qiValue}>{profile.pref_location || <span style={S.notProvided}>Not provided</span>}</span></div>
              </div>
            )}
          </div>

          <div style={S.quickInfo}>
            <h3 style={S.qiTitle}>Quick Info</h3>
            <div style={S.qiRow}><span style={S.qiLabel}>🎓 Education</span><span style={S.qiValue}>{profile.education || <span style={S.notProvided}>Not provided</span>}</span></div>
            <div style={S.qiRow}><span style={S.qiLabel}>💼 Occupation</span><span style={S.qiValue}>{profile.occupation || <span style={S.notProvided}>Not provided</span>}</span></div>
            <div style={S.qiRow}><span style={S.qiLabel}>💰 Income</span><span style={S.qiValue}>{profile.income ? `₹ ${profile.income}` : (profile.locked_by_paid_member ? <Link to="/subscription" style={{ color: "#D4A017", fontWeight: 700, textDecoration: "none" }}>🔒 Upgrade to view</Link> : <span style={S.notProvided}>Not provided</span>)}</span></div>
            <div style={S.qiRow}><span style={S.qiLabel}>🏷️ Community</span><span style={S.qiValue}>{myCommunity?.name || profile.community || <span style={S.notProvided}>Not provided</span>}</span></div>
            <div style={S.qiRow}><span style={S.qiLabel}>📍 Location</span><span style={S.qiValue}>{displayLocation || <span style={S.notProvided}>Not provided</span>}</span></div>

            <div style={S.qiRow}>
              <span style={S.qiLabel}>📱 Mobile</span>
              <span style={S.qiValue}>
                {profile.mobile ? (<span>{profile.mobile}</span>) : isOwnProfile ? (<span style={S.notProvided}>Not set</span>) : profile.locked_by_paid_member ? (<Link to="/subscription" style={{ color: "#D4A017", fontWeight: 700, textDecoration: "none" }}>⭐ Upgrade to view mobile</Link>) : profile.contact_masked && profile.contact_locked_reason === "owner_privacy" ? (<ContactRequestRow userId={id} status={profile.contact_request_status} isMobile={isMobile} />) : (<span style={S.notProvided}>Not provided</span>)}
              </span>
            </div>
          </div>
        </div>

        {showReportModal && (<ReportModal reportedUserId={id} reportedUserName={profile.name} onClose={() => setShowReportModal(false)} />)}
      </div>
    </>
  );
}

function ContactRequestRow({ userId, status: initialStatus, isMobile }) {
  const [status, setStatus] = useState(initialStatus || "none");
  const [sending, setSending] = useState(false);

  const handleRequest = async () => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch(`${BACKEND_URL}/contact-requests/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester_id: user.id, owner_id: userId }),
      });
      if (res.ok) { setStatus("pending"); toast.success("Contact request sent!"); }
      else { toast.error("Could not send request"); }
    } catch { toast.error("Network error"); } finally { setSending(false); }
  };

  if (status === "approved") return <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "11px" }}>✅ Access approved — Refresh</span>;
  if (status === "pending") return <span style={{ color: "#D4A017", fontWeight: 700, fontSize: "11px" }}>⏳ Request pending</span>;
  if (status === "denied") return <span style={{ color: "#991b1b", fontWeight: 700, fontSize: "11px" }}>❌ Request denied</span>;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      <span style={{ color: "#8a6b6b", fontSize: "11px" }}>🔒 Hidden by user</span>
      <button onClick={handleRequest} disabled={sending} style={{ background: "#D4A017", color: "white", border: "none", padding: isMobile ? "5px 10px" : "4px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: sending ? 0.6 : 1 }}>
        {sending ? "Sending..." : "📩 Request"}
      </button>
    </span>
  );
}

const labelStyle = { display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase" };
const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box" };
const labelHeader = { fontSize: "16px", marginBottom: "16px", borderBottom: "1px solid #f0e0e0", paddingBottom: "8px", fontFamily: "'Playfair Display', serif" };
const spinnerStyle = { width: "40px", height: "40px", border: "4px solid #f0e0e0", borderTop: "4px solid #8B0A2E", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" };

export default Profile;

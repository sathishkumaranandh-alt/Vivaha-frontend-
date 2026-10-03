import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import BackButton from "../components/BackButton";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";
const BOT_USERNAME = "Vivah12_bot"; // Your Telegram bot username

function UserSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [adminSettings, setAdminSettings] = useState({});

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [changingPass, setChangingPass] = useState(false);

  const [prefs, setPrefs] = useState({
    email_on_interest: true,
    email_on_message: true,
    email_on_match: true,
    show_online_status: true,
    profile_visible: true,
  });

  const [privacy, setPrivacy] = useState({
    photo_privacy: "public",
    contact_privacy: "matches",
    profile_visibility: "everyone",
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // NEW: Telegram State
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isEnabled = (key) => adminSettings[key] !== "false";

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setUser(user);

        const saved = localStorage.getItem(`prefs_${user.id}`);
        if (saved) setPrefs(JSON.parse(saved));

        const settingsRes = await fetch(`${BACKEND_URL}/settings`);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setAdminSettings(data.settings || {});
        }

        const { data: userData } = await supabase
          .from("users")
          .select("photo_privacy, contact_privacy, profile_visibility, telegram_chat_id")
          .eq("id", user.id)
          .single();

        if (userData) {
          setPrivacy({
            photo_privacy: userData.photo_privacy || "public",
            contact_privacy: userData.contact_privacy || "matches",
            profile_visibility: userData.profile_visibility || "everyone",
          });
          // NEW: Check if Telegram is linked
          setTelegramConnected(!!userData.telegram_chat_id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  // NEW: Auto-check Telegram status when user returns to the tab
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("telegram_chat_id")
        .eq("id", user.id)
        .single();
      if (data) setTelegramConnected(!!data.telegram_chat_id);
    };
    window.addEventListener("focus", checkStatus);
    return () => window.removeEventListener("focus", checkStatus);
  }, [user]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.newPass || passwords.newPass.length < 6) return toast.error("Password must be at least 6 characters");
    if (passwords.newPass !== passwords.confirm) return toast.error("Passwords don't match");
    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) toast.error(error.message);
      else { toast.success("Password updated!"); setPasswords({ current: "", newPass: "", confirm: "" }); }
    } catch { toast.error("Network error"); }
    finally { setChangingPass(false); }
  };

  const togglePref = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(`prefs_${user.id}`, JSON.stringify(updated));
    toast.success("Preferences saved");
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const updates = { updated_at: new Date().toISOString() };
      if (isEnabled("privacy_show_profile_visibility")) updates.profile_visibility = privacy.profile_visibility;
      if (isEnabled("privacy_show_photo_privacy")) updates.photo_privacy = privacy.photo_privacy;
      if (isEnabled("privacy_show_contact_privacy")) updates.contact_privacy = privacy.contact_privacy;

      const { error } = await supabase.from("users").update(updates).eq("id", user.id);
      if (error) throw error;
      toast.success("Privacy settings saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save privacy settings");
    } finally {
      setSavingPrivacy(false);
    }
  };

  // NEW: Telegram Handlers
  const handleConnectTelegram = () => {
    if (!user) return;
    // Open Telegram with the user's ID as the start parameter
    window.open(`https://t.me/${BOT_USERNAME}?start=${user.id}`, "_blank");
  };

  const handleDisconnectTelegram = async () => {
    if (!user) return;
    setTelegramLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/telegram/unlink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setTelegramConnected(false);
        toast.success("Telegram disconnected");
      } else {
        toast.error("Failed to disconnect Telegram");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return toast.error('Type "DELETE" to confirm');
    if (!window.confirm("Are you absolutely sure? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await supabase.from("users").delete().eq("id", user.id);
      await supabase.from("interests").delete().eq("sender_id", user.id);
      await supabase.from("interests").delete().eq("receiver_id", user.id);
      await supabase.from("messages").delete().eq("sender_id", user.id);
      await supabase.from("messages").delete().eq("receiver_id", user.id);
      await supabase.from("shortlists").delete().eq("user_id", user.id);
      await supabase.auth.signOut();
      toast.success("Account deleted. Goodbye 👋");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Could not delete account");
    } finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#8a6b6b", marginTop: "16px" }}>Loading settings...</p>
      </div>
    );
  }

  const hasAnyPrivacyFeature =
    isEnabled("privacy_show_profile_visibility") ||
    isEnabled("privacy_show_photo_privacy") ||
    isEnabled("privacy_show_contact_privacy") ||
    isEnabled("privacy_show_profile_visible_toggle") ||
    isEnabled("privacy_show_online_status_toggle");

  const S = {
    page: { background: "#FFF9F5", minHeight: "calc(100vh - 70px)" },
    layout: { maxWidth: "900px", margin: "0 auto", padding: isMobile ? "16px" : "28px 32px 60px" },
    header: { marginBottom: "24px" },
    h1: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "26px", fontWeight: 700, color: "#8B0A2E", marginBottom: "4px" },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    tabs: { display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" },
    tab: (active) => ({ background: active ? "#8B0A2E" : "white", color: active ? "white" : "#8B0A2E", border: active ? "1.5px solid #8B0A2E" : "1.5px solid #f0e0e0", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }),
    card: { background: "white", borderRadius: "14px", padding: isMobile ? "20px" : "28px", border: "1px solid #f0e0e0", boxShadow: "0 2px 12px rgba(139,10,46,0.04)" },
    cardTitle: { fontFamily: "'Playfair Display', serif", color: "#8B0A2E", fontSize: "18px", fontWeight: 700, marginBottom: "6px" },
    cardDesc: { color: "#8a6b6b", fontSize: "13px", marginBottom: "20px" },
    label: { display: "block", fontSize: "12px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "6px", marginTop: "14px" },
    input: { width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box" },
    inputDisabled: { width: "100%", padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#6b7280", boxSizing: "border-box", cursor: "not-allowed" },
    select: { width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#FFF9F5", boxSizing: "border-box", cursor: "pointer" },
    primaryBtn: { background: "#8B0A2E", color: "white", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginTop: "20px", boxShadow: "0 4px 14px rgba(139,10,46,0.25)" },
    dangerBtn: { background: "#dc2626", color: "white", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginTop: "20px" },
    toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f3f4f6", gap: "12px" },
    toggleLabel: { fontSize: "14px", fontWeight: 600, color: "#2D1B1B", marginBottom: "2px" },
    toggleHint: { fontSize: "12px", color: "#8a6b6b" },
    privacyHint: { fontSize: "12px", color: "#888", marginTop: "4px", marginBottom: "16px", lineHeight: 1.5, fontStyle: "italic" },
    disabledNotice: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px", color: "#6b7280", fontSize: "13px", textAlign: "center" },
  };

  const ToggleSwitch = ({ value, onChange }) => (
    <div onClick={onChange} style={{ width: "46px", height: "26px", borderRadius: "13px", background: value ? "#8B0A2E" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: value ? "23px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.layout}>
        <BackButton />

        <div style={S.header}>
          <h1 style={S.h1}>⚙️ Settings</h1>
          <p style={S.sub}>Manage your account, preferences, and privacy</p>
        </div>

        <div style={S.tabs}>
          <button style={S.tab(activeTab === "account")} onClick={() => setActiveTab("account")}>👤 Account</button>
          <button style={S.tab(activeTab === "notifications")} onClick={() => setActiveTab("notifications")}>🔔 Notifications</button>
          <button style={S.tab(activeTab === "privacy")} onClick={() => setActiveTab("privacy")}>🔒 Privacy</button>
          <button style={S.tab(activeTab === "danger")} onClick={() => setActiveTab("danger")}>⚠️ Danger</button>
        </div>

        {activeTab === "account" && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>Account Information</h3>
            <p style={S.cardDesc}>Your login email and password</p>
            <label style={S.label}>Email Address</label>
            <input style={S.inputDisabled} value={user?.email || ""} disabled />
            <p style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>Email cannot be changed. Contact support if needed.</p>

            <hr style={{ border: "none", borderTop: "1px solid #f0e0e0", margin: "28px 0" }} />
            <h3 style={S.cardTitle}>Change Password</h3>
            <p style={S.cardDesc}>Use a strong password at least 6 characters long</p>

            <form onSubmit={handlePasswordChange}>
              <label style={S.label}>Current Password (optional)</label>
              <input type="password" style={S.input} placeholder="Leave blank to skip" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
              <label style={S.label}>New Password *</label>
              <input type="password" style={S.input} placeholder="At least 6 characters" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} required minLength={6} />
              <label style={S.label}>Confirm New Password *</label>
              <input type="password" style={S.input} placeholder="Re-enter password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required minLength={6} />
              <button type="submit" disabled={changingPass} style={{ ...S.primaryBtn, opacity: changingPass ? 0.6 : 1 }}>
                {changingPass ? "Updating..." : "🔐 Update Password"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "notifications" && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>Email Notifications</h3>
            <p style={S.cardDesc}>Choose which events should trigger an email</p>
            <div style={S.toggleRow}>
              <div><div style={S.toggleLabel}>New Interest Received</div><div style={S.toggleHint}>When someone sends you an interest</div></div>
              <ToggleSwitch value={prefs.email_on_interest} onChange={() => togglePref("email_on_interest")} />
            </div>
            <div style={S.toggleRow}>
              <div><div style={S.toggleLabel}>New Message</div><div style={S.toggleHint}>When you receive a chat message</div></div>
              <ToggleSwitch value={prefs.email_on_message} onChange={() => togglePref("email_on_message")} />
            </div>
            <div style={S.toggleRow}>
              <div><div style={S.toggleLabel}>New Match</div><div style={S.toggleHint}>When you get a new mutual match</div></div>
              <ToggleSwitch value={prefs.email_on_match} onChange={() => togglePref("email_on_match")} />
            </div>

            {/* NEW: Telegram Notifications Section */}
            <hr style={{ border: "none", borderTop: "1px solid #f0e0e0", margin: "28px 0" }} />
            <h3 style={S.cardTitle}>Telegram Notifications</h3>
            <p style={S.cardDesc}>Get instant alerts for new matches and profile views directly on Telegram.</p>
            <div style={S.toggleRow}>
              <div>
                <div style={S.toggleLabel}>{telegramConnected ? "✅ Telegram Connected" : "🔗 Connect Telegram"}</div>
                <div style={S.toggleHint}>
                  {telegramConnected ? "You are receiving instant Telegram alerts." : `Click to link your account with @${BOT_USERNAME}`}
                </div>
              </div>
              {telegramConnected ? (
                <button 
                  onClick={handleDisconnectTelegram} 
                  disabled={telegramLoading}
                  style={{...S.dangerBtn, marginTop: 0, padding: "8px 16px", fontSize: "13px", opacity: telegramLoading ? 0.6 : 1}}
                >
                  {telegramLoading ? "..." : "Disconnect"}
                </button>
              ) : (
                <button 
                  onClick={handleConnectTelegram} 
                  style={{...S.primaryBtn, marginTop: 0, padding: "8px 16px", fontSize: "13px"}}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "privacy" && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>Privacy Settings</h3>
            <p style={S.cardDesc}>Control who can see your profile, photos, and contact information</p>

            {!hasAnyPrivacyFeature ? (
              <div style={S.disabledNotice}>
                🔒 Privacy options are currently disabled by the administrator.
              </div>
            ) : (
              <>
                {isEnabled("privacy_show_profile_visibility") && (
                  <>
                    <label style={S.label}>Who Can See My Profile?</label>
                    <select value={privacy.profile_visibility} onChange={(e) => setPrivacy({ ...privacy, profile_visibility: e.target.value })} style={S.select}>
                      <option value="everyone">🌍 Everyone</option>
                      <option value="verified">✅ Verified Users Only</option>
                      <option value="paid">💎 Paid Members Only</option>
                      <option value="matches">💕 Matches Only</option>
                    </select>
                    <p style={S.privacyHint}>Control who can see your full profile.</p>
                  </>
                )}

                {isEnabled("privacy_show_photo_privacy") && (
                  <>
                    <label style={S.label}>Who Can See My Photos?</label>
                    <select value={privacy.photo_privacy} onChange={(e) => setPrivacy({ ...privacy, photo_privacy: e.target.value })} style={S.select}>
                      <option value="public">🌍 Public - Everyone can see</option>
                      <option value="matches">💕 Matches Only</option>
                      <option value="private">🔒 Private - Nobody (blurred)</option>
                    </select>
                    <p style={S.privacyHint}>If set to "Matches Only", photos will be blurred for others.</p>
                  </>
                )}

                {isEnabled("privacy_show_contact_privacy") && (
                  <>
                    <label style={S.label}>Who Can See My Contact Info?</label>
                    <select value={privacy.contact_privacy} onChange={(e) => setPrivacy({ ...privacy, contact_privacy: e.target.value })} style={S.select}>
                      <option value="public">🌍 Public - Everyone can see</option>
                      <option value="matches">💕 Matches Only</option>
                      <option value="private">🔒 Private - Hidden</option>
                    </select>
                    <p style={S.privacyHint}>Hides your mobile number from other members.</p>
                  </>
                )}

                <button onClick={handleSavePrivacy} disabled={savingPrivacy} style={{ ...S.primaryBtn, opacity: savingPrivacy ? 0.6 : 1 }}>
                  {savingPrivacy ? "Saving..." : "💾 Save Privacy Settings"}
                </button>

                {(isEnabled("privacy_show_profile_visible_toggle") || isEnabled("privacy_show_online_status_toggle")) && (
                  <>
                    <hr style={{ border: "none", borderTop: "1px solid #f0e0e0", margin: "28px 0" }} />
                    <h3 style={{ ...S.cardTitle, fontSize: "16px" }}>Other Privacy Options</h3>

                    {isEnabled("privacy_show_profile_visible_toggle") && (
                      <div style={S.toggleRow}>
                        <div><div style={S.toggleLabel}>Profile Visible to All</div><div style={S.toggleHint}>When OFF, 

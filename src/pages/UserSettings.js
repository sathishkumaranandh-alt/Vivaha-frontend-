import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

function UserSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  // Password change
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [changingPass, setChangingPass] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState({
    email_on_interest: true,
    email_on_message: true,
    email_on_match: true,
    show_online_status: true,
    profile_visible: true,
  });

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setUser(user);

        // Load saved preferences from localStorage (until backend supports)
        const saved = localStorage.getItem(`prefs_${user.id}`);
        if (saved) {
          setPrefs(JSON.parse(saved));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  // ============================================================
  // PASSWORD CHANGE
  // ============================================================
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.newPass || passwords.newPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("Passwords don't match");
      return;
    }

    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPass,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated!");
        setPasswords({ current: "", newPass: "", confirm: "" });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setChangingPass(false);
    }
  };

  // ============================================================
  // PREFERENCES TOGGLE
  // ============================================================
  const togglePref = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(`prefs_${user.id}`, JSON.stringify(updated));
    toast.success("Preferences saved");
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    if (!window.confirm("Are you absolutely sure? This cannot be undone.")) return;

    setDeleting(true);
    try {
      // Delete profile data first
      await supabase.from("users").delete().eq("id", user.id);
      await supabase.from("interests").delete().eq("sender_id", user.id);
      await supabase.from("interests").delete().eq("receiver_id", user.id);
      await supabase.from("messages").delete().eq("sender_id", user.id);
      await supabase.from("messages").delete().eq("receiver_id", user.id);
      await supabase.from("shortlists").delete().eq("user_id", user.id);

      // Sign out
      await supabase.auth.signOut();
      toast.success("Account deleted. Goodbye 👋");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Could not delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#8a6b6b", marginTop: "16px" }}>Loading settings...</p>
      </div>
    );
  }

  const S = {
    page: { background: "#FFF9F5", minHeight: "calc(100vh - 70px)" },
    layout: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: isMobile ? "16px" : "28px 32px 60px",
    },
    header: { marginBottom: "24px" },
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: isMobile ? "22px" : "26px",
      fontWeight: 700,
      color: "#8B0A2E",
      marginBottom: "4px",
    },
    sub: { color: "#8a6b6b", fontSize: "13px", margin: 0 },
    tabs: {
      display: "flex",
      gap: "8px",
      marginBottom: "20px",
      overflowX: "auto",
      paddingBottom: "4px",
    },
    tab: (active) => ({
      background: active ? "#8B0A2E" : "white",
      color: active ? "white" : "#8B0A2E",
      border: active ? "1.5px solid #8B0A2E" : "1.5px solid #f0e0e0",
      padding: "10px 18px",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
    }),
    card: {
      background: "white",
      borderRadius: "14px",
      padding: isMobile ? "20px" : "28px",
      border: "1px solid #f0e0e0",
      boxShadow: "0 2px 12px rgba(139,10,46,0.04)",
    },
    cardTitle: {
      fontFamily: "'Playfair Display', serif",
      color: "#8B0A2E",
      fontSize: "18px",
      fontWeight: 700,
      marginBottom: "6px",
    },
    cardDesc: {
      color: "#8a6b6b",
      fontSize: "13px",
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "12px",
      fontWeight: 700,
      color: "#555",
      textTransform: "uppercase",
      letterSpacing: "0.3px",
      marginBottom: "6px",
      marginTop: "14px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      background: "#FFF9F5",
      boxSizing: "border-box",
    },
    inputDisabled: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      background: "#f9fafb",
      color: "#6b7280",
      boxSizing: "border-box",
      cursor: "not-allowed",
    },
    primaryBtn: {
      background: "#8B0A2E",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
      marginTop: "20px",
      boxShadow: "0 4px 14px rgba(139,10,46,0.25)",
    },
    dangerBtn: {
      background: "#dc2626",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "inherit",
      marginTop: "20px",
    },
    toggleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 0",
      borderBottom: "1px solid #f3f4f6",
      gap: "12px",
    },
    toggleLabel: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#2D1B1B",
      marginBottom: "2px",
    },
    toggleHint: {
      fontSize: "12px",
      color: "#8a6b6b",
    },
  };

  const ToggleSwitch = ({ value, onChange }) => (
    <div
      onClick={onChange}
      style={{
        width: "46px",
        height: "26px",
        borderRadius: "13px",
        background: value ? "#8B0A2E" : "#d1d5db",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: "3px",
          left: value ? "23px" : "3px",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.layout}>
        <div style={S.header}>
          <h1 style={S.h1}>⚙️ Settings</h1>
          <p style={S.sub}>Manage your account, preferences, and privacy</p>
        </div>

        {/* TABS */}
        <div style={S.tabs}>
          <button style={S.tab(activeTab === "account")} onClick={() => setActiveTab("account")}>
            👤 Account
          </button>
          <button style={S.tab(activeTab === "notifications")} onClick={() => setActiveTab("notifications")}>
            🔔 Notifications
          </button>
          <button style={S.tab(activeTab === "privacy")} onClick={() => setActiveTab("privacy")}>
            🔒 Privacy
          </button>
          <button style={S.tab(activeTab === "danger")} onClick={() => setActiveTab("danger")}>
            ⚠️ Danger Zone
          </button>
        </div>

        {/* ============ ACCOUNT TAB ============ */}
        {activeTab === "account" && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>Account Information</h3>
            <p style={S.cardDesc}>Your login email and password</p>

            <label style={S.label}>Email Address</label>
            <input style={S.inputDisabled} value={user?.email || ""} disabled />

            <p style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>
              Email cannot be changed. Contact support if needed.
            </p>

            <hr style={{ border: "none", borderTop: "1px solid #f0e0e0", margin: "28px 0" }} />

            <h3 style={S.cardTitle}>Change Password</h3>
            <p style={S.cardDesc}>Use a strong password at least 6 characters long</p>

            <form onSubmit={handlePasswordChange}>
              <label style={S.label}>Current Password (optional)</label>
              <input
                type="password"
                style={S.input}
                placeholder="Leave blank to skip"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />

              <label style={S.label}>New Password *</label>
              <input
                type="password"
                style={S.input}
                placeholder="At least 6 characters"
                value={passwords.newPass}
                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                required
                minLength={6}
              />

              <label style={S.label}>Confirm New Password *</label>
              <input
                type="password"
                style={S.input}
                placeholder="Re-enter password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
                minLength={6}
              />

              <button type="submit" disabled={changingPass} style={{ ...S.primaryBtn, opacity: changingPass ? 0.6 : 1 }}>
                {changingPass ? "Updating..." : "🔐 Update Password"}
              </button>
            </form>
          </div>
        )}

        {/* ============ NOTIFICATIONS TAB ============ */}
        {activeTab === "notifications" && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>Email Notifications</h3>
            <p style={S.cardDesc}>Choose which events should trigger an email</p>

            <div style={S.toggleRow}>
              <div>
                <div style={S.toggleLabel}>New Interest Received</div>
                <div style={S.toggleHint}>When someone sends you an interest</div>
              </div>
              <ToggleSwitch value={prefs.email_on_interest} onChange={() => togglePref("email_on_interest")} />
            </div>

            <div style={S.toggleRow}>
              <div>
                <div style={S.toggleLabel}>New Message</div>
                <div style={S.toggleHint}>When you receive a chat message</div>
              </div>
              <ToggleSwitch value={prefs.email_on_message} onChange={() => togglePref("email_on_message")} />
            </div>

            <div style={S.toggleRow}>
              <div>
                <div style={S.toggleLabel}>New Match</div>
                <div style={S.toggleHint}>When you get a new mutual match</div>
              </div>
              <ToggleSwitch value={prefs.email_on_match} onChange={() => togglePref("email_on_match")} />
            </div>

            <p style={{ fontSize: "12px", color: "#8a6b6b", marginTop: "20px", fontStyle: "italic" }}>
              ℹ️ Email notifications will be enabled once the email service is set up.
            </p>
          </div>
        )}

        {/* ============ PRIVACY TAB ============ */}
        {activeTab === "privacy" && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>Privacy Settings</h3>
            <p style={S.cardDesc}>Control who can see your profile and activity</p>

            <div style={S.toggleRow}>
              <div>
                <div style={S.toggleLabel}>Profile Visible to All</div>
                <div style={S.toggleHint}>When OFF, only connected users see your profile</div>
              </div>
              <ToggleSwitch value={prefs.profile_visible} onChange={() => togglePref("profile_visible")} />
            </div>

            <div style={S.toggleRow}>
              <div>
                <div style={S.toggleLabel}>Show Online Status</div>
                <div style={S.toggleHint}>Show a green dot when you're active</div>
              </div>
              <ToggleSwitch value={prefs.show_online_status} onChange={() => togglePref("show_online_status")} />
            </div>

            <p style={{ fontSize: "12px", color: "#8a6b6b", marginTop: "20px", fontStyle: "italic" }}>
              ℹ️ Advanced privacy controls coming soon.
            </p>
          </div>
        )}

        {/* ============ DANGER ZONE TAB ============ */}
        {activeTab === "danger" && (
          <div style={{ ...S.card, borderColor: "#fecaca" }}>
            <h3 style={{ ...S.cardTitle, color: "#dc2626" }}>⚠️ Danger Zone</h3>
            <p style={S.cardDesc}>
              These actions are permanent and cannot be undone. Please be careful.
            </p>

            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "20px",
            }}>
              <h4 style={{ margin: "0 0 6px 0", color: "#991b1b", fontSize: "14px", fontWeight: 700 }}>
                Delete Account
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#991b1b", lineHeight: 1.6 }}>
                This will permanently delete your profile, photos, messages, interests, and all
                data. Your account cannot be recovered.
              </p>
            </div>

            <label style={S.label}>Type "DELETE" to confirm</label>
            <input
              style={S.input}
              type="text"
              placeholder="DELETE"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />

            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== "DELETE"}
              style={{
                ...S.dangerBtn,
                opacity: deleting || deleteConfirm !== "DELETE" ? 0.5 : 1,
                cursor: deleting || deleteConfirm !== "DELETE" ? "not-allowed" : "pointer",
              }}
            >
              {deleting ? "Deleting..." : "🗑️ Permanently Delete My Account"}
            </button>
          </div>
        )}

        {/* Back to Dashboard */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link to="/dashboard" style={{ color: "#8B0A2E", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
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

export default UserSettings;
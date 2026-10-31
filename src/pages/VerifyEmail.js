import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [cooldown, setCooldown] = useState(30);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/login?verified=1` },
      });
      if (error) throw error;
      toast.success("Verification email sent again 📧");
      setCooldown(60);
    } catch (err) {
      toast.error("Could not send now. Please wait a minute and try again.");
      setCooldown(60);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 24, padding: "32px 22px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 48 }}>📧</div>
        <h2 style={{ margin: "8px 0", color: "var(--vg-accent)" }}>Verify your email</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          We sent a verification link to<br />
          <b style={{ wordBreak: "break-all" }}>{email || "your email"}</b>
        </p>
        <p style={{ fontSize: 13, opacity: 0.8 }}>
          Open the email, tap the link, then come back and login. Check your Spam folder too.
        </p>
        <button
          onClick={resend}
          disabled={sending || cooldown > 0 || !email}
          style={{ marginTop: 10, padding: "12px 20px", borderRadius: 12, border: "none", background: "var(--vg-accent)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: sending || cooldown > 0 ? 0.6 : 1 }}
        >
          {sending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </button>
        <p style={{ marginTop: 18, fontSize: 14 }}>
          <Link to="/login">Go to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;

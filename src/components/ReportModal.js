import React, { useState } from "react";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const REASONS = [
  { value: "fake_profile", label: "Fake Profile / Impersonation" },
  { value: "inappropriate_photos", label: "Inappropriate Photos" },
  { value: "harassment", label: "Harassment / Abusive Behavior" },
  { value: "spam", label: "Spam / Advertising" },
  { value: "underage", label: "Underage User" },
  { value: "married", label: "Already Married" },
  { value: "other", label: "Other" },
];

function ReportModal({ reportedUserId, reportedUserName, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert("Please select a reason");
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in first.");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/reports/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          details: details.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const err = await res.json();
        alert("Failed to submit: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Report error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={closeStyle}>
          ✕
        </button>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "60px", marginBottom: "12px" }}>✅</div>
            <h3 style={{ color: "#16a34a", margin: "0 0 8px 0" }}>
              Report Submitted
            </h3>
            <p style={{ color: "#666", margin: 0 }}>
              Thank you. Our admin team will review this report shortly.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>
              🚨 Report User
            </h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: 0 }}>
              You are reporting{" "}
              <strong>{reportedUserName || "this user"}</strong>. Please select
              a reason below.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Reason for reporting:</label>
              <div style={{ marginBottom: "16px" }}>
                {REASONS.map((r) => (
                  <label key={r.value} style={radioOptionStyle}>
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      style={{ marginRight: "8px" }}
                    />
                    {r.label}
                  </label>
                ))}
              </div>

              <label style={labelStyle}>Additional details (optional):</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened..."
                rows={3}
                style={textareaStyle}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="submit"
                  disabled={submitting || !reason}
                  style={{
                    flex: 1,
                    background: submitting ? "#94a3b8" : "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "15px",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "28px",
  maxWidth: "480px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
};

const closeStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "#f3f4f6",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  color: "#666",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  color: "#555",
  marginBottom: "8px",
};

const radioOptionStyle = {
  display: "block",
  padding: "8px",
  fontSize: "14px",
  color: "#444",
  cursor: "pointer",
  borderRadius: "6px",
};

const textareaStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};

export default ReportModal;
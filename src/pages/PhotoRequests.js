import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function PhotoRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const res = await fetch(`${BACKEND_URL}/photo-requests/incoming/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (id, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/photo-requests/respond/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(status === "approved" ? "Request approved ✅" : "Request denied ❌");
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch {
      toast.error("Failed to respond");
    }
  };

  if (loading) return <div style={{ padding: "80px 20px", textAlign: "center" }}>Loading requests... ⏳</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "16px" : "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "22px" : "28px", color: "#8B0A2E", marginBottom: "4px" }}>
          📩 Photo Access Requests
        </h1>
        <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
          Approve or deny requests from members who want to view your photos
        </p>
      </div>

      {requests.length === 0 ? (
        <div style={{ background: "white", borderRadius: "14px", padding: "60px 20px", textAlign: "center", border: "1px solid #f0e0e0" }}>
          <div style={{ fontSize: "50px", marginBottom: "12px" }}>📭</div>
          <h3 style={{ color: "#8B0A2E", marginBottom: "8px" }}>No pending requests</h3>
          <p style={{ color: "#8a6b6b", fontSize: "13px", margin: 0 }}>
            When someone requests to view your photos, they'll appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requests.map((r) => (
            <div key={r.id} style={{ background: "white", borderRadius: "14px", padding: "16px", border: "1px solid #f0e0e0", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0, overflow: "hidden" }}>
                {r.requester?.photo_url ? (
                  <img src={r.requester.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : "👤"}
              </div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#8B0A2E", marginBottom: "2px" }}>
                  {r.requester?.name || "Someone"}
                </div>
                <div style={{ fontSize: "12px", color: "#8a6b6b" }}>
                  {r.requester?.age ? `${r.requester.age} yrs` : ""}
                  {r.requester?.age && r.requester?.location ? " • " : ""}
                  {r.requester?.location || ""}
                </div>
                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "4px" }}>
                  Requested {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleRespond(r.id, "approved")} style={{ background: "#16a34a", color: "white", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                  ✅ Approve
                </button>
                <button onClick={() => handleRespond(r.id, "denied")} style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                  ❌ Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoRequests;

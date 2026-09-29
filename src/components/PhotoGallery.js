import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import usePlan from "../utils/usePlan";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function PhotoGallery({ userId, readOnly = false, onPrimaryChange, fallbackPhotoUrl, shouldBlur = false }) {
  const { permissions } = usePlan();
  const MAX_PHOTOS = permissions.max_photos || 3;

  const [photos, setPhotos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [requestStatus, setRequestStatus] = useState("none");
  const [requesting, setRequesting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/photos/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      if (userId) fetchPhotos();

      // Check request status
      if (user && userId && user.id !== userId && readOnly) {
        try {
          const res = await fetch(`${BACKEND_URL}/photo-requests/status/${user.id}/${userId}`);
          if (res.ok) {
            const data = await res.json();
            setRequestStatus(data.status || "none");
          }
        } catch {}
      }
    }
    init();
  }, [userId, fetchPhotos, readOnly]);

  const handleRequestAccess = async () => {
    if (!currentUserId || !userId) return;
    setRequesting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/photo-requests/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester_id: currentUserId, owner_id: userId }),
      });
      if (res.ok) {
        setRequestStatus("pending");
        toast.success("Photo access requested!");
      } else {
        toast.error("Could not send request");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRequesting(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`Your plan allows only ${MAX_PHOTOS} photo${MAX_PHOTOS !== 1 ? "s" : ""}. Upgrade to add more.`);
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        const res = await fetch(`${BACKEND_URL}/photos/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            photo_url: publicUrl,
            is_primary: photos.length === 0 && file === files[0],
            is_private: isPrivate,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save photo");
        }
      }

      await fetchPhotos();
      setActiveIndex(0);
      toast.success("Photo(s) uploaded!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    const photoToDelete = photos[activeIndex];
    if (!photoToDelete || photoToDelete.id === "fallback") return;
    if (!window.confirm("Delete this photo?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/photos/${photoToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = photos.filter((_, i) => i !== activeIndex);
        setPhotos(remaining);
        setActiveIndex(0);
        if (photoToDelete.is_primary && onPrimaryChange) {
          onPrimaryChange(remaining.length > 0 ? remaining[0].photo_url : "");
        }
        toast.success("Photo deleted!");
      }
    } catch {
      toast.error("Could not delete photo.");
    }
  };

  const handleSetPrimary = async () => {
    const photoToSet = photos[activeIndex];
    if (!photoToSet || photoToSet.is_primary || photoToSet.id === "fallback") return;

    try {
      const res = await fetch(`${BACKEND_URL}/photos/${photoToSet.id}/primary`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set main photo");

      setPhotos(photos.map((p, i) => ({ ...p, is_primary: i === activeIndex })));
      if (onPrimaryChange) onPrimaryChange(photoToSet.photo_url);
      toast.success("Main photo updated!");
    } catch (err) {
      toast.error(err.message || "Could not update main photo.");
    }
  };

  const handleTogglePrivate = async (value) => {
    setIsPrivate(value);
    try {
      await fetch(`${BACKEND_URL}/photos/${userId}/privacy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_private: value }),
      });
    } catch {}
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#8a6b6b", fontSize: "13px" }}>Loading photos...</div>;

  const displayPhotos = photos.length > 0 ? photos : (fallbackPhotoUrl ? [{ id: "fallback", photo_url: fallbackPhotoUrl, is_primary: true }] : []);
  const activePhoto = displayPhotos[activeIndex] || displayPhotos[0];
  const limitReached = displayPhotos.length >= MAX_PHOTOS;
  const isBlurred = shouldBlur && !readOnly === false; // blur only when viewing others

  const nextLightbox = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % displayPhotos.length); };
  const prevLightbox = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length); };

  return (
    <div>
      {/* === MAIN PHOTO VIEWER === */}
      {activePhoto && (
        <div
          onClick={() => !shouldBlur && setLightboxIndex(activeIndex)}
          style={{ position: "relative", marginBottom: "16px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 24px rgba(139,10,46,0.12)", background: "#f8f8f8", cursor: shouldBlur ? "default" : "pointer" }}
        >
          <div style={{ width: "100%", aspectRatio: "4 / 5", position: "relative" }}>
            <img
              src={activePhoto.photo_url}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: shouldBlur ? "blur(20px)" : (isPrivate && activePhoto.is_private ? "blur(13px)" : "none")
              }}
            />

            {/* Blur overlay */}
            {shouldBlur && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.15)",
              }}>
                <div style={{
                  background: "white", padding: "12px 20px", borderRadius: "20px",
                  fontSize: "13px", fontWeight: 700, color: "#2D1B1B",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)", marginBottom: "14px",
                  textAlign: "center", maxWidth: "90%",
                }}>
                  🔒 Photo is protected. Request to view photo
                </div>

                {requestStatus === "none" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRequestAccess(); }}
                    disabled={requesting}
                    style={{
                      background: "#D4A017", color: "white", border: "none",
                      padding: "12px 24px", borderRadius: "20px",
                      fontWeight: 700, fontSize: "13px", cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(212,160,23,0.5)",
                      fontFamily: "inherit", opacity: requesting ? 0.6 : 1,
                    }}
                  >
                    {requesting ? "Sending..." : "📩 Request to View"}
                  </button>
                )}
                {requestStatus === "pending" && (
                  <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                    ⏳ Request Pending
                  </div>
                )}
                {requestStatus === "denied" && (
                  <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                    ❌ Request Denied
                  </div>
                )}
                {requestStatus === "approved" && (
                  <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                    ✅ Access Approved — Refresh
                  </div>
                )}
              </div>
            )}
          </div>

          {!shouldBlur && activePhoto.is_primary && (
            <div style={{ position: "absolute", top: "12px", left: "12px", background: "#D4A017", color: "white", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px" }}>
              ⭐ Main Profile Photo
            </div>
          )}

          {!shouldBlur && !readOnly && activePhoto.id !== "fallback" && (
            <div style={{ position: "absolute", bottom: "12px", right: "12px", display: "flex", gap: "8px" }}>
              {!activePhoto.is_primary && (
                <button onClick={(e) => { e.stopPropagation(); handleSetPrimary(); }} style={{ background: "white", color: "#8B0A2E", border: "none", padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  ⭐ Set as Main
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} style={{ background: "#dc2626", color: "white", border: "none", width: "36px", height: "36px", borderRadius: "50%", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                🗑️
              </button>
            </div>
          )}
        </div>
      )}

      {/* === THUMBNAILS === */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => { if (!shouldBlur) { setActiveIndex(index); setLightboxIndex(index); } }}
            style={{
              position: "relative",
              aspectRatio: "4 / 5",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: shouldBlur ? "default" : "pointer",
              border: index === activeIndex ? "3px solid #8B0A2E" : "2px solid #f0e0e0",
            }}
          >
            <img
              src={photo.photo_url}
              alt=""
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                filter: shouldBlur ? "blur(12px)" : (isPrivate && photo.is_private ? "blur(10px)" : "none"),
              }}
            />
            {photo.is_primary && !shouldBlur && (
              <div style={{ position: "absolute", top: 0, left: 0, background: "#D4A017", color: "white", fontSize: "8px", fontWeight: 700, padding: "2px 4px" }}>
                MAIN
              </div>
            )}
          </div>
        ))}

        {!readOnly && !limitReached && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ aspectRatio: "4 / 5", borderRadius: "10px", border: "2px dashed #d1d5db", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#FFF9F5", color: "#8a6b6b" }}
          >
            <span style={{ fontSize: "20px" }}>{uploading ? "⏳" : "➕"}</span>
            <span style={{ fontSize: "9px", fontWeight: 600, marginTop: "2px" }}>{uploading ? "..." : "Add"}</span>
          </div>
        )}

        {!readOnly && limitReached && (
          <Link to="/subscription" style={{ aspectRatio: "4 / 5", borderRadius: "10px", border: "2px dashed #D4A017", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "linear-gradient(135deg, #FDF2F6, #FFF9F5)", color: "#8B0A2E", textDecoration: "none", padding: "6px", textAlign: "center" }}>
            <span style={{ fontSize: "18px" }}>⭐</span>
            <span style={{ fontSize: "9px", fontWeight: 700, marginTop: "2px" }}>Upgrade</span>
          </Link>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />

      {!readOnly && (
        <div style={{ marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#2D1B1B" }}>🔒 Private Gallery</div>
              <div style={{ fontSize: "12px", color: "#777" }}>Only approved members can see private photos</div>
            </div>
            <label style={{ position: "relative", width: "48px", height: "25px" }}>
              <input type="checkbox" checked={isPrivate} onChange={(e) => handleTogglePrivate(e.target.checked)} style={{ display: "none" }} />
              <span style={{ position: "absolute", inset: 0, background: isPrivate ? "#8B0A2E" : "#ccc", borderRadius: "20px", cursor: "pointer", transition: ".3s" }}>
                <span style={{ position: "absolute", width: "19px", height: "19px", left: isPrivate ? "26px" : "3px", top: "3px", background: "white", borderRadius: "50%", transition: ".3s" }} />
              </span>
            </label>
          </div>
        </div>
      )}

      <p style={{ fontSize: "11px", color: "#888", marginTop: "8px", textAlign: "center" }}>
        {displayPhotos.length} / {MAX_PHOTOS} photos uploaded
      </p>

      {/* LIGHTBOX */}
      {lightboxIndex !== null && displayPhotos[lightboxIndex] && !shouldBlur && (
        <div onClick={() => setLightboxIndex(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px" }}>
          <button onClick={() => setLightboxIndex(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.2)", color: "white", border: "none", width: "40px", height: "40px", borderRadius: "50%", fontSize: "20px", cursor: "pointer" }}>✕</button>
          {displayPhotos.length > 1 && (
            <button onClick={prevLightbox} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", color: "white", border: "none", width: "44px", height: "44px", borderRadius: "50%", fontSize: "24px", cursor: "pointer" }}>‹</button>
          )}
          <img src={displayPhotos[lightboxIndex].photo_url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} />
          {displayPhotos.length > 1 && (
            <button onClick={nextLightbox} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", color: "white", border: "none", width: "44px", height: "44px", borderRadius: "50%", fontSize: "24px", cursor: "pointer" }}>›</button>
          )}
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;

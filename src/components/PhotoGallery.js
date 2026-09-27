import React, { useState, useEffect, useRef, useCallback } from "react";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";
const MAX_PHOTOS = 7;

function PhotoGallery({ userId, readOnly = false, onPrimaryChange, fallbackPhotoUrl }) {
  const [photos, setPhotos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [blurPrivate, setBlurPrivate] = useState(true);
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
    if (!userId) return;
    fetchPhotos();
  }, [userId, fetchPhotos]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`You can only upload up to ${MAX_PHOTOS} photos.`);
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

        await fetch(`${BACKEND_URL}/photos/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            photo_url: publicUrl,
            is_primary: photos.length === 0 && file === files[0],
            is_private: isPrivate,
          }),
        });
      }
      
      await fetchPhotos();
      setActiveIndex(0); // Reset to first photo
      toast.success("Photo(s) uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Try again.");
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
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
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
    } catch (err) {
      console.error("Failed to save privacy setting", err);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center", color: "#8a6b6b", fontSize: "13px" }}>Loading photos...</div>;
  }

  const displayPhotos = photos.length > 0 ? photos : (fallbackPhotoUrl ? [{ id: "fallback", photo_url: fallbackPhotoUrl, is_primary: true }] : []);
  const activePhoto = displayPhotos[activeIndex] || displayPhotos[0];

  return (
    <div>
      {/* === MAIN PHOTO VIEWER === */}
      {activePhoto && (
        <div style={{ position: "relative", marginBottom: "16px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 24px rgba(139,10,46,0.12)", background: "#f8f8f8" }}>
          <div style={{ width: "100%", aspectRatio: "4 / 5", position: "relative" }}>
            <img 
              src={activePhoto.photo_url} 
              alt="Profile" 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover",
                filter: (isPrivate && blurPrivate && activePhoto.is_private) ? "blur(13px)" : "none"
              }} 
            />
          </div>

          {activePhoto.is_primary && (
            <div style={{ position: "absolute", top: "12px", left: "12px", background: "#D4A017", color: "white", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              ⭐ Main Profile Photo
            </div>
          )}

          {!readOnly && activePhoto.id !== "fallback" && (
            <div style={{ position: "absolute", bottom: "12px", right: "12px", display: "flex", gap: "8px" }}>
              {!activePhoto.is_primary && (
                <button onClick={handleSetPrimary} style={{ background: "white", color: "#8B0A2E", border: "none", padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "4px" }}>
                  ⭐ Set as Main
                </button>
              )}
              <button onClick={handleDelete} style={{ background: "#dc2626", color: "white", border: "none", width: "36px", height: "36px", borderRadius: "50%", fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            onClick={() => setActiveIndex(index)}
            style={{
              position: "relative",
              aspectRatio: "4 / 5",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: "pointer",
              border: index === activeIndex ? "3px solid #8B0A2E" : "2px solid #f0e0e0",
              transition: "border 0.2s, transform 0.2s",
              transform: index === activeIndex ? "scale(1.05)" : "scale(1)",
            }}
          >
            <img 
              src={photo.photo_url} 
              alt="" 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover",
                filter: (isPrivate && blurPrivate && photo.is_private) ? "blur(10px)" : "none"
              }} 
            />
            {photo.is_primary && (
              <div style={{ position: "absolute", top: 0, left: 0, background: "#D4A017", color: "white", fontSize: "8px", fontWeight: 700, padding: "2px 4px", borderBottomRight: "6px" }}>
                MAIN
              </div>
            )}
          </div>
        ))}

        {/* Upload Button */}
        {!readOnly && displayPhotos.length < MAX_PHOTOS && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              aspectRatio: "4 / 5",
              borderRadius: "10px",
              border: "2px dashed #d1d5db",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: "#FFF9F5",
              color: "#8a6b6b",
            }}
          >
            <span style={{ fontSize: "20px" }}>{uploading ? "⏳" : "➕"}</span>
            <span style={{ fontSize: "9px", fontWeight: 600, marginTop: "2px" }}>{uploading ? "..." : "Add"}</span>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />

      {/* === PRIVACY CONTROLS === */}
      {!readOnly && (
        <div style={{ marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #eee" }}>
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #eee" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#2D1B1B" }}>👁️ Blur Private Photos</div>
              <div style={{ fontSize: "12px", color: "#777" }}>Hide photos until access is approved</div>
            </div>
            <label style={{ position: "relative", width: "48px", height: "25px" }}>
              <input type="checkbox" checked={blurPrivate} onChange={(e) => setBlurPrivate(e.target.checked)} style={{ display: "none" }} />
              <span style={{ position: "absolute", inset: 0, background: blurPrivate ? "#8B0A2E" : "#ccc", borderRadius: "20px", cursor: "pointer", transition: ".3s" }}>
                <span style={{ position: "absolute", width: "19px", height: "19px", left: blurPrivate ? "26px" : "3px", top: "3px", background: "white", borderRadius: "50%", transition: ".3s" }} />
              </span>
            </label>
          </div>
        </div>
      )}

      <p style={{ fontSize: "11px", color: "#888", marginTop: "8px", textAlign: "center" }}>
        {displayPhotos.length} / {MAX_PHOTOS} photos uploaded · Tap any photo to view full size
      </p>
    </div>
  );
}

export default PhotoGallery;

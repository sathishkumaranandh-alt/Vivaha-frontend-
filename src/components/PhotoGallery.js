import React, { useState, useEffect, useRef } from "react";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";
const MAX_PHOTOS = 5;

function PhotoGallery({ userId, readOnly = false, onPrimaryChange, fallbackPhotoUrl }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    fetchPhotos();
  }, [userId]);

  const fetchPhotos = async () => {
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
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= MAX_PHOTOS) {
      toast.error(`You can only upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // 2. Save to your backend
      const res = await fetch(`${BACKEND_URL}/photos/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          photo_url: publicUrl,
          is_primary: photos.length === 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to save photo");

      // 3. Refresh the gallery
      await fetchPhotos();
      if (photos.length === 0 && onPrimaryChange) onPrimaryChange(publicUrl);
      toast.success("Photo uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/photos/${photoId}`, { method: "DELETE" });
      if (res.ok) {
        // If the deleted photo was the main profile photo, tell the parent
        const deletedPhoto = photos.find(p => p.id === photoId);
        if (deletedPhoto?.is_primary && onPrimaryChange) {
          onPrimaryChange("");
        }
        // Immediately update local state (removes it visually)
        setPhotos(photos.filter(p => p.id !== photoId));
        toast.success("Photo deleted!");
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not delete photo.");
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/photos/${photoId}/primary`, { method: "PATCH" });
      if (res.ok) {
        // Update local state to reflect new primary
        setPhotos(photos.map(p => ({ ...p, is_primary: p.id === photoId })));
        const newPrimary = photos.find(p => p.id === photoId);
        if (onPrimaryChange && newPrimary) onPrimaryChange(newPrimary.photo_url);
        toast.success("Main photo updated!");
      }
    } catch (err) {
      toast.error("Could not update main photo.");
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center", color: "#8a6b6b", fontSize: "13px" }}>Loading photos...</div>;
  }

  const displayPhotos = photos.length > 0 ? photos : (fallbackPhotoUrl ? [{ id: "fallback", photo_url: fallbackPhotoUrl, is_primary: true }] : []);

  return (
    <div>
      {/* Main Photo Viewer (Lightbox style) */}
      {displayPhotos.length > 0 && (
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#FDF2F6",
              boxShadow: "0 8px 24px rgba(139,10,46,0.12)",
              border: "3px solid white",
            }}
          >
            <img
              src={selectedPhoto || displayPhotos.find(p => p.is_primary)?.photo_url || displayPhotos[0].photo_url}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          {displayPhotos.find(p => p.is_primary) && (
            <div style={{ position: "absolute", top: "12px", left: "12px", background: "#D4A017", color: "white", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              ⭐ Main Photo
            </div>
          )}
        </div>
      )}

      {/* Thumbnail Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
        {displayPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo.photo_url)}
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: "pointer",
              border: photo.is_primary ? "3px solid #8B0A2E" : "2px solid #f0e0e0",
              transition: "transform 0.2s",
            }}
          >
            <img src={photo.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            
            {/* Delete button (only on own profile) */}
            {!readOnly && photo.id !== "fallback" && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(220,38,38,0.9)", color: "white", border: "none", width: "22px", height: "22px", borderRadius: "50%", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
                title="Delete"
              >
                ✕
              </button>
            )}

            {/* Set Primary button */}
            {!readOnly && !photo.is_primary && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo.id); }}
                style={{ position: "absolute", bottom: "4px", left: "4px", background: "rgba(255,255,255,0.9)", color: "#8B0A2E", border: "none", padding: "2px 6px", borderRadius: "6px", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}
                title="Set as Main Photo"
              >
                Set Main
              </button>
            )}
          </div>
        ))}

        {/* Upload Button (if under limit and not readOnly) */}
        {!readOnly && displayPhotos.length < MAX_PHOTOS && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              aspectRatio: "1 / 1",
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

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />

      <p style={{ fontSize: "11px", color: "#888", marginTop: "8px", textAlign: "center" }}>
        {displayPhotos.length} / {MAX_PHOTOS} photos uploaded
      </p>
    </div>
  );
}

export default PhotoGallery;

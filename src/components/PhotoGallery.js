import React, { useState, useEffect, useRef, useCallback } from "react";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";
const MAX_PHOTOS = 7;

function PhotoGallery({ userId, readOnly = false, onPrimaryChange, fallbackPhotoUrl }) {
  const [photos, setPhotos] = useState([]);
  const [mainPhotoUrl, setMainPhotoUrl] = useState(fallbackPhotoUrl || "");
  const [isPrivate, setIsPrivate] = useState(false);
  const [blurPrivate, setBlurPrivate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/photos/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const fetchedPhotos = data.photos || [];
        setPhotos(fetchedPhotos);
        
        const primary = fetchedPhotos.find(p => p.is_primary);
        if (primary) setMainPhotoUrl(primary.photo_url);
        else if (fetchedPhotos.length > 0) setMainPhotoUrl(fetchedPhotos[0].photo_url);
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
      toast.success("Photo(s) uploaded!");
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
        await fetchPhotos();
        toast.success("Photo deleted!");
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not delete photo.");
    }
  };

  const handleSetMain = async (photoId, url) => {
    try {
      const res = await fetch(`${BACKEND_URL}/photos/${photoId}/primary`, { method: "PATCH" });
      if (res.ok) {
        setPhotos(photos.map(p => ({ ...p, is_primary: p.id === photoId })));
        setMainPhotoUrl(url);
        if (onPrimaryChange) onPrimaryChange(url);
        toast.success("Main profile photo updated.");
      }
    } catch (err) {
      toast.error("Could not update main photo.");
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

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.h1}>📸 My Photos</h1>
        <p style={S.sub}>Add photos to make your matrimonial profile more attractive</p>
      </div>

      <div style={S.card}>
        {/* Main Photo */}
        <div style={S.mainPhotoSection}>
          <div style={S.sectionTitle}>Profile Photo</div>
          <div style={S.mainPhoto}>
            {mainPhotoUrl ? (
              <img src={mainPhotoUrl} alt="Profile" style={S.mainImg} />
            ) : (
              <div style={S.placeholderImg}>👤</div>
            )}
            {mainPhotoUrl && <div style={S.profileLabel}>⭐ Main Profile Photo</div>}
          </div>
        </div>

        {/* Gallery */}
        <div>
          <div style={S.sectionTitle}>Photo Gallery ({photos.length}/{MAX_PHOTOS})</div>
          <div style={S.gallery}>
            {photos.map((photo) => (
              <div key={photo.id} style={S.photoItem}>
                <img 
                  src={photo.photo_url} 
                  alt="" 
                  style={{
                    ...S.photoImg,
                    filter: (isPrivate && blurPrivate && photo.is_private) ? "blur(13px)" : "none"
                  }} 
                />
                {photo.is_primary && <div style={S.mainBadge}>⭐ Main</div>}
                {!readOnly && (
                  <div style={S.photoActions}>
                    {!photo.is_primary && (
                      <button onClick={() => handleSetMain(photo.id, photo.photo_url)} style={{...S.actionBtn, ...S.setMainBtn}}>
                        Set Main
                      </button>
                    )}
                    <button onClick={() => handleDelete(photo.id)} style={{...S.actionBtn, ...S.deleteBtn}}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add Photo */}
            {!readOnly && photos.length < MAX_PHOTOS && (
              <div onClick={() => fileInputRef.current?.click()} style={S.addPhoto}>
                <span style={{ fontSize: "32px", marginBottom: "5px" }}>{uploading ? "⏳" : "＋"}</span>
                <strong>{uploading ? "Uploading..." : "Add Photo"}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Controls */}
        {!readOnly && (
          <div style={S.controls}>
            <div style={S.controlRow}>
              <div style={S.controlInfo}>
                <strong>🔒 Private Gallery</strong>
                <small>Only members you approve can see private photos</small>
              </div>
              <label style={S.switch}>
                <input type="checkbox" checked={isPrivate} onChange={(e) => handleTogglePrivate(e.target.checked)} />
                <span style={S.slider}></span>
              </label>
            </div>

            <div style={S.controlRow}>
              <div style={S.controlInfo}>
                <strong>👁️ Blur Private Photos</strong>
                <small>Hide photos until access is approved</small>
              </div>
              <label style={S.switch}>
                <input type="checkbox" checked={blurPrivate} onChange={(e) => setBlurPrivate(e.target.checked)} />
                <span style={S.slider}></span>
              </label>
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
    </div>
  );
}

const S = {
  container: { maxWidth: "900px", margin: "auto", padding: "0" },
  header: { textAlign: "center", marginBottom: "22px" },
  h1: { fontSize: "27px", marginBottom: "7px", color: "#8B0A2E", fontFamily: "'Playfair Display', serif" },
  sub: { color: "#777", fontSize: "14px" },
  card: { background: "white", borderRadius: "18px", padding: "20px", boxShadow: "0 5px 25px rgba(0,0,0,.08)" },
  mainPhotoSection: { marginBottom: "25px" },
  sectionTitle: { fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#2D1B1B" },
  mainPhoto: { position: "relative", width: "100%", maxWidth: "330px", margin: "auto", aspectRatio: "4 / 5", borderRadius: "18px", overflow: "hidden", background: "#eee" },
  mainImg: { width: "100%", height: "100%", objectFit: "cover" },
  placeholderImg: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px", color: "#ccc" },
  profileLabel: { position: "absolute", bottom: "12px", left: "12px", background: "rgba(0,0,0,.75)", color: "white", padding: "7px 12px", borderRadius: "20px", fontSize: "12px" },
  gallery: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px" },
  photoItem: { position: "relative", aspectRatio: "4 / 5", borderRadius: "12px", overflow: "hidden", background: "#eee" },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  mainBadge: { position: "absolute", top: "7px", left: "7px", background: "rgba(212,160,23,0.9)", color: "white", padding: "3px 6px", borderRadius: "15px", fontSize: "10px", fontWeight: "bold" },
  photoActions: { position: "absolute", bottom: "6px", left: "6px", right: "6px", display: "flex", gap: "5px" },
  actionBtn: { flex: 1, border: "none", padding: "6px 4px", borderRadius: "7px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" },
  setMainBtn: { background: "rgba(255,255,255,0.9)", color: "#8B0A2E" },
  deleteBtn: { background: "rgba(220,38,38,0.9)", color: "white" },
  addPhoto: { border: "2px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", cursor: "pointer", color: "#777", aspectRatio: "4 / 5", borderRadius: "12px" },
  controls: { marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "20px" },
  controlRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #eee" },
  controlInfo: { display: "flex", flexDirection: "column" },
  controlInfoStrong: { fontSize: "15px", fontWeight: "bold" },
  switch: { position: "relative", width: "48px", height: "25px", display: "inline-block" },
  slider: { position: "absolute", inset: 0, background: "#ccc", borderRadius: "20px", cursor: "pointer", transition: ".3s" },
};

export default PhotoGallery;

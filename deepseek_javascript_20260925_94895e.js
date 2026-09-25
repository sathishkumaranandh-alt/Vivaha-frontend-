import React, { useState, useEffect, useRef } from "react";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const MAX_PHOTOS = 5;

function PhotoGallery({ userId, onPrimaryChange, readOnly = false, fallbackPhotoUrl = "" }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(null);
  const fileInputRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (userId) loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Auto-migrate: if no photos in gallery but user has a fallback photo_url,
  // automatically add it to the user_photos table (only for own profile).
  useEffect(() => {
    async function autoMigrate() {
      if (readOnly) return; // Don't auto-migrate other users' photos
      if (loading) return;
      if (photos.length > 0) return; // Already has photos
      if (!fallbackPhotoUrl) return; // No fallback either
      if (migrating) return;

      setMigrating(true);
      try {
        const res = await fetch(`${BACKEND_URL}/photos/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            photo_url: fallbackPhotoUrl,
            is_primary: true,
          }),
        });
        if (res.ok) {
          await loadPhotos();
        }
      } catch (err) {
        console.error("Auto-migrate error:", err);
      } finally {
        setMigrating(false);
      }
    }
    autoMigrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, photos.length, fallbackPhotoUrl, readOnly, userId]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, photos]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/photos/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error("Load photos error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const res = await fetch(`${BACKEND_URL}/photos/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          photo_url: publicUrl,
          is_primary: photos.length === 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Photo uploaded!");
        await loadPhotos();
        if (data.photo.is_primary && onPrimaryChange) {
          onPrimaryChange(publicUrl);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetPrimary = async (photoId) => {
    if (readOnly) return;
    setBusy(photoId);
    try {
      const res = await fetch(`${BACKEND_URL}/photos/${photoId}/primary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Main photo updated");
        await loadPhotos();
        if (onPrimaryChange) onPrimaryChange(data.photo.photo_url);
      }
    } catch (err) {
      console.error("Set primary error:", err);
      toast.error("Could not set main photo");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (photoId, isPrimaryPhoto) => {
    if (readOnly) return;
    if (!window.confirm(isPrimaryPhoto ? "Delete your main photo?" : "Delete this photo?")) return;

    setBusy(photoId);
    try {
      const res = await fetch(
        `${BACKEND_URL}/photos/${photoId}?user_id=${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Photo deleted");
        await loadPhotos();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Could not delete photo");
    } finally {
      setBusy(null);
    }
  };

  const openLightbox = (photoId) => {
    const index = photos.findIndex((p) => p.id === photoId);
    if (index !== -1) setLightboxIndex(index);
  };

  const nextPhoto = () => setLightboxIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);

  // ============================================================
  // FALLBACK LOGIC — if no gallery photos but has a fallback url
  // ============================================================
  const hasFallbackOnly = photos.length === 0 && fallbackPhotoUrl;
  const primary = photos.find((p) => p.is_primary) || photos[0];
  const secondaries = photos.filter((p) => p.id !== primary?.id);
  const currentLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  // Loading
  if (loading || migrating) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#8a6b6b", fontSize: "13px" }}>
        Loading photos...
      </div>
    );
  }

  // ============================================================
  // READ-ONLY MODE (viewing someone else)
  // ============================================================
  if (readOnly) {
    // No gallery photos AND no fallback
    if (photos.length === 0 && !fallbackPhotoUrl) {
      return (
        <div style={emptyReadOnlyStyle}>
          <div style={{ fontSize: "56px", marginBottom: "8px", opacity: 0.4 }}>👤</div>
          <p style={{ margin: 0, color: "#8a6b6b", fontSize: "13px", fontWeight: 500 }}>
            No photos uploaded
          </p>
        </div>
      );
    }

    // If only fallback exists (their registration photo)
    if (hasFallbackOnly) {
      return (
        <div>
          <div style={mainWrapperStyle}>
            <img
              src={fallbackPhotoUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
              onClick={() => setLightboxIndex(0)}
            />
          </div>
          <p style={hintStyle}>1 photo</p>

          {/* Mini lightbox for fallback */}
          {lightboxIndex !== null && (
            <div style={lightboxOverlayStyle} onClick={() => setLightboxIndex(null)}>
              <div style={lightboxContentStyle} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setLightboxIndex(null)} style={lightboxCloseStyle}>✕</button>
                <img src={fallbackPhotoUrl} alt="" style={lightboxImgStyle} />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Normal read-only with gallery photos
    return (
      <div>
        <div style={mainWrapperStyle}>
          <img
            src={primary.photo_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
            onClick={() => openLightbox(primary.id)}
          />
        </div>

        {secondaries.length > 0 && (
          <div style={thumbsRowStyle(secondaries.length)}>
            {secondaries.map((photo) => (
              <div key={photo.id} style={thumbWrapperStyle(false, true)}>
                <img
                  src={photo.photo_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
                  onClick={() => openLightbox(photo.id)}
                />
              </div>
            ))}
          </div>
        )}

        <p style={hintStyle}>
          {photos.length} {photos.length === 1 ? "photo" : "photos"} · Tap to view full size
        </p>

        {lightboxIndex !== null && currentLightboxPhoto && (
          <Lightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={prevPhoto}
            onNext={nextPhoto}
            onSelect={setLightboxIndex}
          />
        )}
      </div>
    );
  }

  // ============================================================
  // EDITABLE MODE (own profile)
  // ============================================================
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Main photo */}
      <div style={mainWrapperStyle}>
        {primary ? (
          <>
            <img
              src={primary.photo_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
              onClick={() => openLightbox(primary.id)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(primary.id, true);
              }}
              disabled={busy === primary.id}
              style={deleteMainBtnStyle}
              title="Delete main photo"
            >
              ✕
            </button>
          </>
        ) : hasFallbackOnly ? (
          // Fallback: show user.photo_url while auto-migration happens
          <img
            src={fallbackPhotoUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={addMainBtnStyle}
            type="button"
          >
            <span style={{ fontSize: "48px" }}>📷</span>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>
              {uploading ? "Uploading..." : "Add Main Photo"}
            </span>
          </button>
        )}

        {uploading && (
          <div style={overlayStyle}>
            <div style={spinnerSmallStyle} />
            <span style={{ color: "white", fontSize: "12px", fontWeight: 600 }}>
              Uploading...
            </span>
          </div>
        )}
      </div>

      {/* 5 thumbnail slots */}
      <div style={thumbsRowStyle(5)}>
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
          const photo = i === 0 ? primary : secondaries[i - 1];
          const isPrimarySlot = i === 0;

          return (
            <div key={i} style={thumbWrapperStyle(isPrimarySlot, !!photo)}>
              {photo ? (
                <>
                  <img
                    src={photo.photo_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
                    onClick={() => openLightbox(photo.id)}
                  />

                  {!isPrimarySlot && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(photo.id);
                        }}
                        disabled={busy === photo.id}
                        style={setMainBtnStyle}
                        title="Set as main photo"
                      >
                        MAIN
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo.id, false);
                        }}
                        disabled={busy === photo.id}
                        style={deleteSmallBtnStyle}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </>
                  )}

                  {isPrimarySlot && <div style={primaryBadgeStyle}>MAIN</div>}
                </>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={addSlotBtnStyle}
                  title="Add photo"
                  type="button"
                >
                  {uploading ? "⏳" : "+"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={hintStyle}>
        {photos.length}/{MAX_PHOTOS} photos uploaded
        {photos.length > 0 && <> · Tap any photo to view full size</>}
      </p>

      {lightboxIndex !== null && currentLightboxPhoto && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={prevPhoto}
          onNext={nextPhoto}
          onSelect={setLightboxIndex}
        />
      )}
    </div>
  );
}

// ============================================================
// LIGHTBOX COMPONENT
// ============================================================
function Lightbox({ photos, index, onClose, onPrev, onNext, onSelect }) {
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div style={lightboxOverlayStyle} onClick={onClose}>
      <div style={lightboxContentStyle} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={lightboxCloseStyle} title="Close (Esc)">✕</button>
        <div style={lightboxCounterStyle}>{index + 1} / {photos.length}</div>

        {photos.length > 1 && (
          <button onClick={onPrev} style={{ ...lightboxNavStyle, left: "16px" }} title="Previous">‹</button>
        )}

        <img src={photo.photo_url} alt="" style={lightboxImgStyle} />

        {photos.length > 1 && (
          <button onClick={onNext} style={{ ...lightboxNavStyle, right: "16px" }} title="Next">›</button>
        )}

        {photos.length > 1 && (
          <div style={lightboxThumbStripStyle}>
            {photos.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => onSelect(idx)}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  border: idx === index ? "2px solid #D4A017" : "2px solid rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  flexShrink: 0,
                  opacity: idx === index ? 1 : 0.6,
                }}
              >
                <img src={p.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const emptyReadOnlyStyle = {
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
  borderRadius: "16px",
  padding: "60px 20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #f0e0e0",
  aspectRatio: "3/4",
};

const mainWrapperStyle = {
  position: "relative",
  width: "100%",
  aspectRatio: "3/4",
  borderRadius: "16px",
  overflow: "hidden",
  background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #f0e0e0",
  marginBottom: "12px",
};

const addMainBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  color: "#8B0A2E",
  fontFamily: "inherit",
};

const deleteMainBtnStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "rgba(139,10,46,0.9)",
  color: "white",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  fontFamily: "inherit",
  zIndex: 3,
};

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

const spinnerSmallStyle = {
  width: "24px",
  height: "24px",
  border: "3px solid rgba(255,255,255,0.3)",
  borderTop: "3px solid white",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const thumbsRowStyle = (count) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${Math.max(count, 1)}, 1fr)`,
  gap: "6px",
});

const thumbWrapperStyle = (isPrimarySlot, hasPhoto) => ({
  position: "relative",
  aspectRatio: "1",
  borderRadius: "8px",
  overflow: "hidden",
  background: hasPhoto ? "transparent" : "#FDF2F6",
  border: isPrimarySlot ? "2px solid #D4A017" : "2px solid #f0e0e0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const setMainBtnStyle = {
  position: "absolute",
  bottom: "2px",
  left: "2px",
  right: "2px",
  background: "rgba(139,10,46,0.9)",
  color: "white",
  border: "none",
  borderRadius: "4px",
  padding: "2px 4px",
  fontSize: "8px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  zIndex: 3,
};

const deleteSmallBtnStyle = {
  position: "absolute",
  top: "2px",
  right: "2px",
  background: "rgba(0,0,0,0.6)",
  color: "white",
  border: "none",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "10px",
  padding: 0,
  fontFamily: "inherit",
  zIndex: 3,
};

const primaryBadgeStyle = {
  position: "absolute",
  top: "2px",
  left: "2px",
  background: "#D4A017",
  color: "#8B0A2E",
  fontSize: "8px",
  fontWeight: 800,
  padding: "2px 5px",
  borderRadius: "4px",
  fontFamily: "inherit",
  zIndex: 3,
};

const addSlotBtnStyle = {
  background: "none",
  border: "none",
  color: "#8B0A2E",
  fontSize: "24px",
  padding: 0,
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  cursor: "pointer",
};

const hintStyle = {
  textAlign: "center",
  fontSize: "11px",
  color: "#8a6b6b",
  marginTop: "10px",
  marginBottom: 0,
};

const lightboxOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.92)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "20px",
};

const lightboxContentStyle = {
  position: "relative",
  maxWidth: "90vw",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const lightboxImgStyle = {
  maxWidth: "90vw",
  maxHeight: "80vh",
  objectFit: "contain",
  borderRadius: "12px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
};

const lightboxCloseStyle = {
  position: "absolute",
  top: "-50px",
  right: "0",
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "white",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  fontSize: "18px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
};

const lightboxCounterStyle = {
  position: "absolute",
  top: "-44px",
  left: "0",
  color: "rgba(255,255,255,0.7)",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "1px",
};

const lightboxNavStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "white",
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  fontSize: "28px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  lineHeight: 1,
  userSelect: "none",
};

const lightboxThumbStripStyle = {
  display: "flex",
  gap: "8px",
  marginTop: "20px",
  padding: "0 10px",
  overflowX: "auto",
  maxWidth: "90vw",
};

export default PhotoGallery;
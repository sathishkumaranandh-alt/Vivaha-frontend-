import React, { useState, useEffect, useRef } from "react";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const MAX_PHOTOS = 5;

function PhotoGallery({ userId, onPrimaryChange, readOnly = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [busy, setBusy] = useState(null);
  const fileInputRef = useRef(null);
  const [pendingSlot, setPendingSlot] = useState(null);

  useEffect(() => {
    if (userId) loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  const handleAddClick = (slotIndex) => {
    if (readOnly) return;
    setPendingSlot(slotIndex);
    fileInputRef.current?.click();
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

    setUploading(pendingSlot);
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
      setUploading(null);
      setPendingSlot(null);
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

  if (loading) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#8a6b6b", fontSize: "13px" }}>
        Loading photos...
      </div>
    );
  }

  const primary = photos.find((p) => p.is_primary) || photos[0];
  const secondaries = photos.filter((p) => p.id !== primary?.id);

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* MAIN PHOTO */}
      <div style={mainWrapperStyle}>
        {primary ? (
          <>
            <img
              src={primary.photo_url}
              alt="Main"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {!readOnly && (
              <button
                onClick={() => handleDelete(primary.id, true)}
                disabled={busy === primary.id}
                style={deleteMainBtnStyle}
                title="Delete main photo"
                type="button"
              >
                ✕
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => handleAddClick(0)}
            disabled={uploading === 0 || readOnly}
            style={addMainBtnStyle}
            type="button"
          >
            <span style={{ fontSize: "48px" }}>📷</span>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>
              {uploading === 0 ? "Uploading..." : readOnly ? "No Photo" : "Add Main Photo"}
            </span>
          </button>
        )}

        {uploading === 0 && (
          <div style={overlayStyle}>
            <div style={spinnerSmallStyle} />
            <span style={{ color: "white", fontSize: "12px", fontWeight: 600 }}>
              Uploading...
            </span>
          </div>
        )}
      </div>

      {/* THUMBNAIL SLOTS */}
      <div style={thumbsRowStyle}>
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
          const photo = i === 0 ? primary : secondaries[i - 1];
          const isPrimarySlot = i === 0;

          return (
            <div key={i} style={thumbWrapperStyle(isPrimarySlot, !!photo)}>
              {photo ? (
                <>
                  <img
                    src={photo.photo_url}
                    alt={`Photo ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {!isPrimarySlot && !readOnly && (
                    <button
                      onClick={() => handleSetPrimary(photo.id)}
                      disabled={busy === photo.id}
                      style={setMainBtnStyle}
                      title="Set as main photo"
                      type="button"
                    >
                      MAIN
                    </button>
                  )}

                  {!isPrimarySlot && !readOnly && (
                    <button
                      onClick={() => handleDelete(photo.id, false)}
                      disabled={busy === photo.id}
                      style={deleteSmallBtnStyle}
                      title="Delete"
                      type="button"
                    >
                      ✕
                    </button>
                  )}

                  {isPrimarySlot && (
                    <div style={primaryBadgeStyle}>MAIN</div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleAddClick(i)}
                  disabled={uploading === i || readOnly}
                  style={{
                    ...addSlotBtnStyle,
                    cursor: uploading === i || readOnly ? "not-allowed" : "pointer",
                  }}
                  title={uploading === i ? "Uploading..." : "Add photo"}
                  type="button"
                >
                  {uploading === i ? "⏳" : "+"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* HINT */}
      <p style={hintStyle}>
        {photos.length}/{MAX_PHOTOS} photos uploaded
        {!readOnly && photos.length > 0 && (
          <> • Tap <strong>MAIN</strong> on any photo to make it primary</>
        )}
      </p>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
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

const thumbsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "6px",
};

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
};

const hintStyle = {
  textAlign: "center",
  fontSize: "11px",
  color: "#8a6b6b",
  marginTop: "10px",
  marginBottom: 0,
};

export default PhotoGallery;
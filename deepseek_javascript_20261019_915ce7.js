import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import usePlan from "../utils/usePlan";
import { apiFetch } from "../utils/api"; // 🛡️ Added for JWT Security

const SLIDE_INTERVAL = 4000; // 4 seconds per photo

function PhotoGallery({ userId, readOnly = false, onPrimaryChange, fallbackPhotoUrl, shouldBlur = false, hideRequest = false }) {
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
  const [adminSettings, setAdminSettings] = useState({});
  const fileInputRef = useRef(null);

  // ============================================
  // AUTO-SLIDESHOW STATE
  // ============================================
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const touchStartXRef = useRef(null);

  const showPrivateToggle = adminSettings.privacy_show_private_gallery !== "false";
  const showPhotoRequest = adminSettings.privacy_show_photo_request !== "false";

  const fetchPhotos = useCallback(async () => {
    try {
      // 🛡️ Switched to apiFetch
      const res = await apiFetch(`/photos/${userId}`);
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

      try {
        const r = await apiFetch(`/settings`);
        if (r.ok) {
          const d = await r.json();
          setAdminSettings(d.settings || {});
        }
      } catch {}

      if (user && userId && user.id !== userId && readOnly) {
        try {
          // 🛡️ Switched to apiFetch
          const res = await apiFetch(`/photo-requests/status/${user.id}/${userId}`);
          if (res.ok) {
            const data = await res.json();
            setRequestStatus(data.status || "none");
          }
        } catch {}
      }
    }
    init();
  }, [userId, fetchPhotos, readOnly]);

  // ============================================
  // AUTO-SLIDESHOW ENGINE
  // ============================================
  const displayPhotos = photos.length > 0 ? photos : (fallbackPhotoUrl ? [{ id: "fallback", photo_url: fallbackPhotoUrl, is_primary: true }] : []);
  const totalPhotos = displayPhotos.length;

  const slideshowActive =
    totalPhotos > 1 &&
    !shouldBlur &&
    lightboxIndex === null &&
    isAutoPlay &&
    !isHovering &&
    !uploading;

  useEffect(() => {
    if (!slideshowActive) {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
      return;
    }

    autoTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalPhotos);
    }, SLIDE_INTERVAL);

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [slideshowActive, totalPhotos]);

  useEffect(() => {
    if (!slideshowActive) {
      setProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
      return;
    }

    setProgress(0);
    const startTime = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / SLIDE_INTERVAL) * 100, 100);
      setProgress(pct);
    }, 40);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [slideshowActive, activeIndex, totalPhotos]);

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setActiveIndex((prev) => (prev + 1) % totalPhotos);
      else setActiveIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
      setProgress(0);
    }
    touchStartXRef.current = null;
  };

  const goToIndex = (idx) => {
    setActiveIndex(idx);
    setProgress(0);
  };

  const handleRequestAccess = async () => {
    if (!currentUserId || !userId) return;
    setRequesting(true);
    try {
      // 🛡️ Switched to apiFetch & removed requester_id from body
      const res = await apiFetch(`/photo-requests/request`, {
        method: "POST",
        body: JSON.stringify({ owner_id: userId }),
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
      toast.error(`Your plan allows only ${MAX_PHOTOS} photo${MAX_PHOTOS !== 1 ? "s" : ""}.`);
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars").upload(fileName, file, { cacheControl: "3600", upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        // 🛡️ Switched to apiFetch & removed user_id from body
        const res = await apiFetch(`/photos/add`, {
          method: "POST",
          body: JSON.stringify({
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
      // 🛡️ Switched to apiFetch
      const res = await apiFetch(`/photos/${photoToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = photos.filter((_, i) => i !== activeIndex);
        setPhotos(remaining);
        setActiveIndex(0);
        if (photoToDelete.is_primary && onPrimaryChange) {
          onPrimaryChange(remaining.length > 0 ? remaining[0].photo_url : "");
        }
        toast.success("Photo deleted!");
      }
    } catch { toast.error("Could not delete photo."); }
  };

  const handleSetPrimary = async () => {
    const photoToSet = photos[activeIndex];
    if (!photoToSet || photoToSet.is_primary || photoToSet.id === "fallback") return;

    try {
      // 🛡️ Switched to apiFetch
      const res = await apiFetch(`/photos/${photoToSet.id}/primary`, { method: "PATCH" });
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
      // 🛡️ Switched to apiFetch
      await apiFetch(`/photos/${userId}/privacy`, {
        method: "PUT",
        body: JSON.stringify({ is_private: value }),
      });
    } catch {}
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#8a6b6b", fontSize: "13px" }}>Loading photos...</div>;

  const activePhoto = displayPhotos[activeIndex] || displayPhotos[0];
  const limitReached = displayPhotos.length >= MAX_PHOTOS;

  const nextLightbox = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % displayPhotos.length); };
  const prevLightbox = (e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length); };

  return (
    <div>
      <style>{`
        @keyframes photoFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes dotPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
        @keyframes shimmerSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes floatUp { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .vivah-photo-stack img { will-change: opacity; }
        .vivah-dot-active { animation: dotPulse 1.4s ease-in-out infinite; }
        .vivah-slide-counter { animation: floatUp 0.4s ease-out; }
      `}</style>

      {activePhoto && (
        <div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => !shouldBlur && setLightboxIndex(activeIndex)}
          style={{
            position: "relative",
            marginBottom: "16px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(139,10,46,0.12)",
            background: "#f8f8f8",
            cursor: shouldBlur ? "default" : "pointer",
          }}
        >
          <div style={{ width: "100%", aspectRatio: "4 / 5", position: "relative" }} className="vivah-photo-stack">

            {/* 🛡️ PRIVACY FIX: Cross-fade stack with URL check */}
            {displayPhotos.map((photo, idx) => (
              photo.photo_url ? (
                <img
                  key={photo.id || idx}
                  src={photo.photo_url}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: idx === activeIndex ? 1 : 0,
                    transition: "opacity 0.9s ease-in-out",
                    filter: shouldBlur ? "blur(20px)" : (isPrivate && photo.is_private ? "blur(13px)" : "none"),
                    zIndex: idx === activeIndex ? 1 : 0,
                  }}
                />
              ) : (
                <div
                  key={photo.id || idx}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #FDF2F6, #f8d0dd)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px",
                    opacity: idx === activeIndex ? 1 : 0,
                    transition: "opacity 0.9s ease-in-out",
                    zIndex: idx === activeIndex ? 1 : 0,
                  }}
                >
                  🔒
                </div>
              )
            ))}

            {totalPhotos > 1 && !shouldBlur && lightboxIndex === null && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "rgba(255,255,255,0.25)", zIndex: 5, display: "flex", gap: "4px", padding: "0 2px", boxSizing: "border-box" }}>
                {displayPhotos.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: "100%", background: "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                    {i < activeIndex && <div style={{ position: "absolute", inset: 0, background: "#D4A017" }} />}
                    {i === activeIndex && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${progress}%`, background: "linear-gradient(90deg, #D4A017, #f0b830)", transition: "width 0.08s linear", boxShadow: "0 0 8px rgba(212,160,23,0.7)" }} />}
                  </div>
                ))}
              </div>
            )}

            {totalPhotos > 1 && !shouldBlur && (
              <div className="vivah-slide-counter" style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.55)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, backdropFilter: "blur(6px)", zIndex: 6 }}>
                {activeIndex + 1} / {totalPhotos}
              </div>
            )}

            {totalPhotos > 1 && !shouldBlur && (
              <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", zIndex: 6, background: "rgba(0,0,0,0.35)", padding: "6px 10px", borderRadius: "20px", backdropFilter: "blur(6px)" }}>
                {displayPhotos.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); goToIndex(i); }} className={i === activeIndex ? "vivah-dot-active" : ""} style={{ width: i === activeIndex ? "10px" : "7px", height: i === activeIndex ? "10px" : "7px", borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: i === activeIndex ? "#D4A017" : "rgba(255,255,255,0.6)", transition: "all 0.3s ease" }} aria-label={`Photo ${i + 1}`} />
                ))}
              </div>
            )}

            {totalPhotos > 1 && !shouldBlur && (
              <button onClick={(e) => { e.stopPropagation(); setIsAutoPlay((prev) => !prev); }} style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(0,0,0,0.45)", color: "white", border: "none", width: "28px", height: "28px", borderRadius: "50%", fontSize: "12px", cursor: "pointer", zIndex: 6, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", transition: "transform 0.2s ease" }} title={isAutoPlay ? "Pause slideshow" : "Play slideshow"}>
                {isAutoPlay ? "⏸" : "▶"}
              </button>
            )}

            {shouldBlur && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)", zIndex: 10 }}>
                <div style={{ background: "white", padding: "12px 20px", borderRadius: "20px", fontSize: "13px", fontWeight: 700, color: "#2D1B1B", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", marginBottom: "14px", textAlign: "center", maxWidth: "90%" }}>
                  🔒 Photo is protected
                </div>
                {showPhotoRequest && !hideRequest && (
                  <>
                    {requestStatus === "none" && (
                      <button onClick={(e) => { e.stopPropagation(); handleRequestAccess(); }} disabled={requesting} style={{ background: "#D4A017", color: "white", border: "none", padding: "12px 24px", borderRadius: "20px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", opacity: requesting ? 0.6 : 1 }}>
                        {requesting ? "Sending..." : "📩 Request to View"}
                      </button>
                    )}
                    {requestStatus === "pending" && <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>⏳ Pending</div>}
                    {requestStatus === "denied" && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>❌ Denied</div>}
                    {requestStatus === "approved" && <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 20px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>✅ Approved</div>}
                  </>
                )}
                {hideRequest && (
                  <Link to="/subscription" style={{ background: "linear-gradient(135deg, #D4A017, #b8860b)", color: "white", padding: "12px 24px", borderRadius: "20px", fontWeight: 700, fontSize: "13px", textDecoration: "none", boxShadow: "0 4px 12px rgba(212,160,23,0.5)" }}>
                    ⭐ Upgrade to View
                  </Link>
                )}
              </div>
            )}
          </div>

          {!shouldBlur && activePhoto.is_primary && (
            <div style={{ position: "absolute", top: "12px", left: "12px", background: "#D4A017", color: "white", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", zIndex: 7 }}>
              ⭐ Main Photo
            </div>
          )}

          {!shouldBlur && !readOnly && activePhoto.id !== "fallback" && (
            <div style={{ position: "absolute", bottom: "12px", right: "12px", display: "flex", gap: "8px", zIndex: 7 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => { if (!shouldBlur && photo.photo_url) { goToIndex(index); setLightboxIndex(index); } }}
            style={{
              position: "relative", aspectRatio: "4 / 5", borderRadius: "10px", overflow: "hidden",
              cursor: shouldBlur ? "default" : "pointer",
              border: index === activeIndex ? "3px solid #8B0A2E" : "2px solid #f0e0e0",
              transition: "border-color 0.3s ease, transform 0.2s ease",
              transform: index === activeIndex ? "scale(1.03)" : "scale(1)",
            }}
          >
            {/* 🛡️ PRIVACY FIX: Thumbnail check */}
            {photo.photo_url ? (
              <img
                src={photo.photo_url}
                alt=""
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  filter: shouldBlur ? "blur(12px)" : (isPrivate && photo.is_private ? "blur(10px)" : "none"),
                }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                🔒
              </div>
            )}
            
            {photo.is_primary && !shouldBlur && (
              <div style={{ position: "absolute", top: 0, left: 0, background: "#D4A017", color: "white", fontSize: "8px", fontWeight: 700, padding: "2px 4px" }}>MAIN</div>
            )}
            {index === activeIndex && !shouldBlur && (
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 3px #D4A017", borderRadius: "10px", pointerEvents: "none" }} />
            )}
          </div>
        ))}

        {!readOnly && !limitReached && (
          <div onClick={() => fileInputRef.current?.click()} style={{ aspectRatio: "4 / 5", borderRadius: "10px", border: "2px dashed #d1d5db", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#FFF9F5", color: "#8a6b6b" }}>
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

      {!readOnly && showPrivateToggle && (
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
        {totalPhotos > 1 && !shouldBlur && (
          <span style={{ marginLeft: "6px", color: "#D4A017", fontWeight: 700 }}>
            · {isAutoPlay ? "▶ Auto-sliding" : "⏸ Paused"}
          </span>
        )}
      </p>

      {lightboxIndex !== null && displayPhotos[lightboxIndex] && displayPhotos[lightboxIndex].photo_url && !shouldBlur && (
        <div onClick={() => setLightboxIndex(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px" }}>
          <button onClick={() => setLightboxIndex(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.2)", color: "white", border: "none", width: "40px", height: "40px", borderRadius: "50%", fontSize: "20px", cursor: "pointer" }}>✕</button>
          {displayPhotos.length > 1 && (
            <button onClick={prevLightbox} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", color: "white", border: "none", width: "44px", height: "44px", borderRadius: "50%", fontSize: "24px", cursor: "pointer" }}>‹</button>
          )}
          <img src={displayPhotos[lightboxIndex].photo_url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px", animation: "photoFadeIn 0.3s ease-out" }} />
          {displayPhotos.length > 1 && (
            <button onClick={nextLightbox} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", color: "white", border: "none", width: "44px", height: "44px", borderRadius: "50%", fontSize: "24px", cursor: "pointer" }}>›</button>
          )}
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
import React, { useState } from "react";
import supabase from "../supabaseClient";

function ImageUpload({ userId, currentPhotoUrl, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhotoUrl || null);
  const [error, setError] = useState(null);

  // ============================================================
  // HANDLE FILE SELECTION
  // ============================================================
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate: must be an image
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    // Validate: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large. Maximum size is 5MB.");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to Supabase
    await uploadImage(file);
  };

  // ============================================================
  // UPLOAD TO SUPABASE STORAGE
  // ============================================================
  const uploadImage = async (file) => {
    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Save the URL to the user's profile
      const { error: updateError } = await supabase
        .from("users")
        .update({ photo_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Notify parent component
      if (onUploadSuccess) onUploadSuccess(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed: " + (err.message || "Please try again."));
      setPreview(currentPhotoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ textAlign: "center" }}>
      {/* Photo preview / placeholder */}
      <div style={previewContainerStyle}>
        {preview ? (
          <img
            src={preview}
            alt="Profile"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            👤
          </div>
        )}
        {uploading && (
          <div style={uploadingOverlayStyle}>
            <p style={{ margin: 0, color: "white", fontWeight: "bold" }}>
              Uploading... ⏳
            </p>
          </div>
        )}
      </div>

      {/* Upload button */}
      <label
        htmlFor="photo-upload"
        style={{
          display: "inline-block",
          background: uploading ? "#94a3b8" : "#1e3a8a",
          color: "white",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: uploading ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "14px",
          marginTop: "12px",
        }}
      >
        {uploading
          ? "Uploading..."
          : preview
          ? "📷 Change Photo"
          : "📷 Upload Photo"}
      </label>
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: "none" }}
      />

      {/* Error message */}
      {error && (
        <p style={{ color: "#b91c1c", fontSize: "14px", marginTop: "10px" }}>
          {error}
        </p>
      )}

      {/* Help text */}
      <p style={{ color: "#888", fontSize: "12px", marginTop: "8px" }}>
        JPG, PNG, or GIF • Max 5MB
      </p>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const previewContainerStyle = {
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  background: "#f3f4f6",
  margin: "0 auto",
  overflow: "hidden",
  border: "3px solid #1e3a8a",
  position: "relative",
};

const uploadingOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default ImageUpload;
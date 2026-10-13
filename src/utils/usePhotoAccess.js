import { usePlan } from "./usePlan";

export function usePhotoAccess() {
  const { permissions, plan, loading } = usePlan();

  // Helper: check if viewer should see full photo
  const shouldBlur = (targetProfile, viewerContext = {}) => {
    // Loading state — hide photo until we know
    if (loading) return true;

    // 🚫 Admin feature disabled (assume from localStorage cache)
    const adminSettings = getAdminSettings();
    if (adminSettings.privacy_show_photo_privacy === "false") {
      return false;
    }

    // 🔒 User's own privacy choice
    const userPrivacy = targetProfile?.photo_privacy || "public";
    if (userPrivacy === "hidden") return true;

    const isPaid =
      plan && !plan.toLowerCase().includes("free") &&
      permissions.see_full_photo === true;

    if (userPrivacy === "premium_only" && !isPaid) return true;

    // 🎯 Plan rule: Free user → blur
    if (!permissions.see_full_photo) {
      // Exception: already interacted
      const interacted =
        viewerContext.hasInterest ||
        viewerContext.isShortlisted ||
        viewerContext.isMatched ||
        viewerContext.isReceived;
      if (interacted) return false;
      return true;
    }

    return false;
  };

  // Blur intensity (from admin settings)
  const blurAmount = () => {
    const s = getAdminSettings();
    return `${parseInt(s.card_photo_blur) || 20}px`;
  };

  // Can user send photo request?
  const canRequestPhoto = () => {
    const s = getAdminSettings();
    if (s.privacy_show_photo_request === "false") return false;
    return permissions.request_photo === true;
  };

  return { shouldBlur, blurAmount, canRequestPhoto, plan, permissions };
}

// Read admin settings from localStorage cache
function getAdminSettings() {
  try {
    const cached = localStorage.getItem("vivaha_home_settings_v1");
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

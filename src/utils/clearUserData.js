// On logout / account deletion: remove personal data this browser kept for the previous user
// (last Discover cards, remembered tabs, scroll positions, per-user preferences).
export default function clearUserData() {
  try {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith("vg_") || k.startsWith("prefs_")) sessionStorage.removeItem(k);
    });
  } catch {}
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("prefs_")) localStorage.removeItem(k);
    });
  } catch {}
}

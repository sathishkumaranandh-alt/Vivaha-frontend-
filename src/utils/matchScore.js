// src/utils/matchScore.js
// Pure function to calculate mutual match score between two profiles.

export function getAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function calculateMatchScore(viewer, target) {
  if (!viewer || !target) return null;

  let totalPoints = 0;
  let earnedPoints = 0;
  const breakdown = [];

  const viewerAge = viewer.age || getAge(viewer.dob);
  const targetAge = target.age || getAge(target.dob);

  // 1. AGE MATCH (40 points — 20 each direction)
  if (target.pref_age_min || target.pref_age_max) {
    totalPoints += 20;
    const min = target.pref_age_min || 0;
    const max = target.pref_age_max || 100;
    if (viewerAge && viewerAge >= min && viewerAge <= max) {
      earnedPoints += 20;
      breakdown.push({ label: "Age fits their preference", status: "good" });
    } else {
      breakdown.push({ label: "Age outside their preference", status: "bad" });
    }
  }

  if (viewer.pref_age_min || viewer.pref_age_max) {
    totalPoints += 20;
    const min = viewer.pref_age_min || 0;
    const max = viewer.pref_age_max || 100;
    if (targetAge && targetAge >= min && targetAge <= max) {
      earnedPoints += 20;
      breakdown.push({ label: "Their age fits your preference", status: "good" });
    } else {
      breakdown.push({ label: "Their age outside your preference", status: "bad" });
    }
  }

  // 2. COMMUNITY (30 points — 15 each direction)
  if (target.pref_community) {
    totalPoints += 15;
    if (viewer.community === target.pref_community) {
      earnedPoints += 15;
      breakdown.push({ label: "Community matches their pref", status: "good" });
    } else {
      breakdown.push({ label: "Community differs from their pref", status: "bad" });
    }
  }

  if (viewer.pref_community) {
    totalPoints += 15;
    if (target.community === viewer.pref_community) {
      earnedPoints += 15;
      breakdown.push({ label: "Community matches your pref", status: "good" });
    } else {
      breakdown.push({ label: "Community differs from your pref", status: "bad" });
    }
  }

  // 3. EDUCATION (20 points)
  if (target.pref_education && viewer.education) {
    totalPoints += 20;
    if (viewer.education.toLowerCase().includes(target.pref_education.toLowerCase())) {
      earnedPoints += 20;
      breakdown.push({ label: "Education matches", status: "good" });
    } else {
      breakdown.push({ label: "Education differs", status: "bad" });
    }
  }

  // 4. LOCATION (10 points)
  if (target.pref_location && (viewer.location || viewer.work_location)) {
    totalPoints += 10;
    const vLoc = (viewer.location || viewer.work_location || "").toLowerCase();
    if (vLoc.includes(target.pref_location.toLowerCase())) {
      earnedPoints += 10;
      breakdown.push({ label: "Location matches", status: "good" });
    } else {
      breakdown.push({ label: "Location differs", status: "bad" });
    }
  }

  if (totalPoints === 0) return null;

  const percent = Math.round((earnedPoints / totalPoints) * 100);

  return {
    percent,
    breakdown,
    label:
      percent >= 80 ? "Excellent Match" :
      percent >= 60 ? "Good Match" :
      percent >= 40 ? "Fair Match" : "Low Match",
    color:
      percent >= 80 ? "#16a34a" :
      percent >= 60 ? "#22c55e" :
      percent >= 40 ? "#f59e0b" : "#dc2626",
  };
}

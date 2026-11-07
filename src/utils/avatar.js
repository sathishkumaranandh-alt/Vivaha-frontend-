// 🛡️ Privacy: draws the initial-letter avatar locally (no member name is sent to any third-party site)
export function initialsAvatar(name, bg = "#8B0A2E", fg = "#ffffff") {
  const letter = (String(name || "?").trim()[0] || "?").toUpperCase().replace(/[<>&"']/g, "?");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">` +
    `<rect width="512" height="512" fill="${bg}"/>` +
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="230" font-weight="700" fill="${fg}">${letter}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

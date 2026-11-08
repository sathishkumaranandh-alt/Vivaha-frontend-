// ⚡ Shrinks a photo in the browser before upload (phone photos are often 3–8 MB; this makes them ~200–400 KB).
// If anything goes wrong it quietly returns the original file, so uploads never break.
export default async function compressImage(file, maxSide = 1280, quality = 0.82) {
  try {
    if (!file || !file.type || !file.type.startsWith("image/")) return file;
    if (/gif|svg/i.test(file.type)) return file; // keep animations / vectors as they are
    if (file.size < 150 * 1024) return file; // already small

    let bitmap;
    if (typeof createImageBitmap === "function") {
      try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { bitmap = null; }
    }
    if (!bitmap) {
      bitmap = await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
      });
    }

    const w = bitmap.width, h = bitmap.height;
    if (!w || !h) return file;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const cw = Math.round(w * scale), ch = Math.round(h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // PNG transparency -> white
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(bitmap, 0, 0, cw, ch);
    if (bitmap.close) bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file; // not smaller -> keep original

    const base = (file.name || "photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch (e) {
    return file;
  }
}

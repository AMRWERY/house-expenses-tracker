const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

/**
 * Turn a picked photo into a JPEG data URL no bigger than `maxSide` pixels, ready to send to the server.
 * Resizing here keeps uploads small and strips whatever the original carried (location data, huge dimensions).
 * Throws `invalid_image` for anything that is not a readable png/jpeg/webp.
 */
export async function fileToReceipt(file: File, maxSide = 1600): Promise<string> {
  if (!ACCEPTED.includes(file.type) || file.size > MAX_SOURCE_BYTES) throw new Error("invalid_image");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("invalid_image");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("invalid_image");
  ctx.fillStyle = "#fff"; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

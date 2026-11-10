/** The picture shown when someone has not uploaded their own. */
export const DEFAULT_AVATAR = "/img/fake-user.png";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/**
 * Turn a picked file into a small square JPEG data URL (centered crop, 256px) ready to send to the server.
 * Resizing here keeps uploads tiny and strips whatever the original carried (location data, huge dimensions).
 * Throws `invalid_image` for anything that is not a readable png/jpeg/webp.
 */
export async function fileToAvatar(file: File, size = 256): Promise<string> {
  if (!ACCEPTED.includes(file.type) || file.size > MAX_SOURCE_BYTES) throw new Error("invalid_image");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("invalid_image");
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("invalid_image");
  ctx.fillStyle = "#fff"; // JPEG has no transparency
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

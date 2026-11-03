export interface CompressedImage {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

const MAX_DIMENSION_PX = 1024;
const MAX_OUTPUT_BYTES = 500 * 1024;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const JPEG_QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5];

/**
 * Mengecilkan foto di sisi klien (maks. 1024px, JPEG) agar payload ke server
 * tetap < 500 KB, sesuai pipeline di System Architecture PRD.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("File yang dipilih bukan gambar. Pilih foto bahan dapur ya.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Ukuran foto terlalu besar (maksimal 25 MB).");
  }

  const image = await decodeImage(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION_PX / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Browser ini belum mendukung pemrosesan foto.");
  }

  // Latar putih agar area transparan (PNG) tidak menjadi hitam saat diubah ke JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  let dataUrl = "";
  for (const quality of JPEG_QUALITY_STEPS) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (getDataUrlBytes(dataUrl) <= MAX_OUTPUT_BYTES) break;
  }

  return { dataUrl, width, height, sizeBytes: getDataUrlBytes(dataUrl) };
}

async function decodeImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } catch {
    throw new Error("Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

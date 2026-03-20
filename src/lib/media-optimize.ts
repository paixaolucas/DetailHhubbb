// =============================================================================
// media-optimize.ts — client-side image compression and video validation
// =============================================================================

/**
 * Compresses an image file to fit within maxSizeMB using canvas.
 * GIFs are returned as-is (canvas strips animation).
 * PNG/WebP/JPEG are converted to JPEG at descending quality until target size.
 */
export async function compressImage(file: File, maxSizeMB = 1): Promise<File> {
  // Never compress GIFs — canvas strips animation
  if (file.type === "image/gif") return file;
  // Already within limit
  if (file.size <= maxSizeMB * 1024 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down to max 2048px on the longest side
      const MAX_DIM = 2048;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIM);
          width = MAX_DIM;
        } else {
          width = Math.round((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const maxBytes = maxSizeMB * 1024 * 1024;
      let quality = 0.88;

      function tryBlob() {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Compression failed")); return; }
            if (blob.size <= maxBytes || quality <= 0.15) {
              // Keep original extension if possible, else .jpg
              const baseName = file.name.replace(/\.[^.]+$/, "");
              resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
            } else {
              quality = Math.round((quality - 0.08) * 100) / 100;
              tryBlob();
            }
          },
          "image/jpeg",
          quality
        );
      }
      tryBlob();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

/**
 * Validates a video file for upload.
 * Returns an error string, or null if valid.
 */
export function validateVideoFile(file: File): string | null {
  const MAX_MB = 100;
  const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];
  if (!ALLOWED.includes(file.type)) {
    return "Formato não suportado. Use MP4, WebM ou MOV.";
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return `Vídeo muito grande. Máximo ${MAX_MB}MB (atual: ${(file.size / 1024 / 1024).toFixed(1)}MB).`;
  }
  return null;
}

/**
 * Checks video duration via HTMLVideoElement.
 * Returns an error string, or null if valid.
 */
export function checkVideoDuration(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      cleanup();
      if (video.duration > 600) {
        resolve(`Vídeo muito longo. Máximo 10 minutos (atual: ${Math.ceil(video.duration / 60)}min).`);
      } else {
        resolve(null);
      }
    };
    video.onerror = () => { cleanup(); resolve(null); }; // don't block on metadata error
    video.src = url;
  });
}

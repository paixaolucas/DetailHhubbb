"use client";

export async function extractVideoFrames(
  file: File,
  maxFrames = 6,
  quality = 0.8
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "metadata";

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      const frames: string[] = [];
      const start = 0.5;
      const end = duration - 0.5;
      const effectiveDuration = Math.max(end - start, 0);
      const count = Math.min(maxFrames, Math.floor(effectiveDuration) + 1);

      const timestamps: number[] = [];
      for (let i = 0; i < count; i++) {
        timestamps.push(
          count === 1 ? start : start + (effectiveDuration * i) / (count - 1)
        );
      }

      let idx = 0;

      const captureFrame = () => {
        if (idx >= timestamps.length) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = timestamps[idx];
      };

      video.addEventListener("seeked", () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            idx++;
            captureFrame();
            return;
          }
          ctx.drawImage(video, 0, 0, 1280, 720);
          frames.push(canvas.toDataURL("image/jpeg", quality));
          idx++;
          captureFrame();
        } catch {
          idx++;
          captureFrame();
        }
      });

      captureFrame();
    });

    video.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar o vídeo"));
    });
  });
}

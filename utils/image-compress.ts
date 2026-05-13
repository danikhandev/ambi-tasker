/**
 * Client-side image compression utility.
 * Compresses images before upload to reduce bandwidth and storage costs.
 * Uses the browser's Canvas API for efficient compression.
 */

interface CompressOptions {
  /** Max width in pixels (default: 1920) */
  maxWidth?: number;
  /** Max height in pixels (default: 1920) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.85) */
  quality?: number;
  /** Output MIME type (default: 'image/jpeg') */
  outputType?: string;
}

/**
 * Compress an image file before upload.
 * Maintains aspect ratio while reducing dimensions and file size.
 * 
 * @param file - The original File or Blob to compress
 * @param options - Compression options
 * @returns A compressed File object
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    outputType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Create a new File from the blob
            const fileName = file instanceof File ? file.name : `compressed_${Date.now()}.jpg`;
            const ext = outputType === "image/png" ? ".png" : ".jpg";
            const compressedName = fileName.replace(/\.[^/.]+$/, ext);

            const compressedFile = new File([blob], compressedName, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image for compression"));
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

/**
 * Compress a base64 data URL to a smaller File.
 * Useful for camera captures which are typically large base64 strings.
 */
export async function compressBase64(
  base64Data: string,
  fileName: string = "image.jpg",
  options: CompressOptions = {}
): Promise<File> {
  const response = await fetch(base64Data);
  const blob = await response.blob();
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  return compressImage(file, options);
}

/**
 * Get human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

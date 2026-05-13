import { compressImage } from "@/utils/image-compress";

/**
 * Upload an image with automatic compression and validation.
 * Uses the /api/upload endpoint which handles Supabase storage.
 * 
 * @param file The file to upload (File or Blob)
 * @param bucket The bucket name (default: 'avatars')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
  file: File | Blob,
  bucket: string = "avatars",
  filePath?: string
): Promise<string> {
  // Convert Blob to File if needed
  if (file instanceof Blob && !(file instanceof File)) {
    const ext = "jpg";
    const fileName = `${Math.random().toString(36).substring(2)}${Date.now()}.${ext}`;
    file = new File([file], fileName, { type: file.type || "image/jpeg" });
  }

  // Compress before upload (max 1200px, 85% quality)
  try {
    const compressed = await compressImage(file as File, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
    });
    file = compressed;
  } catch (err) {
    console.warn("Image compression failed, uploading original:", err);
    // Continue with uncompressed file
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Upload failed");
  }

  return json.url;
}

/**
 * Delete an image (no-op for local uploads, handles Supabase cleanup)
 * @param url The full public URL of the image
 * @param bucket The bucket name (default: 'avatars')
 */
export async function deleteImage(
  url: string,
  bucket: string = "avatars"
): Promise<void> {
  if (!url) return;

  // Skip deletion for local uploads
  if (url.startsWith("/uploads/") || url.startsWith("/verifications/")) {
    return;
  }

  // For Supabase URLs, the server-side storage service handles deletion
  // Client-side deletion is not needed since the upload API manages lifecycle
}

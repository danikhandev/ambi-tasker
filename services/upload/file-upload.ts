/**
 * File Upload Utility — Supabase Storage
 * All file uploads go through Supabase Storage buckets.
 * Falls back to local storage only in development if Supabase is unavailable.
 */

import { v4 as uuidv4 } from "uuid";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export enum UploadMethod {
  SUPABASE = "supabase",
  LOCAL = "local",
}

export const getUploadMethod = (): UploadMethod => {
  // Check if Supabase credentials are real (not placeholder values)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const hasRealCredentials =
    supabaseUrl &&
    !supabaseUrl.includes("YOUR_SUPABASE") &&
    !supabaseUrl.includes("placeholder") &&
    supabaseKey &&
    !supabaseKey.includes("YOUR_SUPABASE");

  // If credentials are placeholders, always use local
  if (!hasRealCredentials) return UploadMethod.LOCAL;

  // Always prefer Supabase in production when real credentials exist
  if (process.env.NODE_ENV === "production") return UploadMethod.SUPABASE;
  const method = process.env.FILE_UPLOAD_METHOD?.toLowerCase();
  if (method === "local") return UploadMethod.LOCAL;
  return UploadMethod.SUPABASE;
};

// Supabase bucket name (create this bucket in your Supabase dashboard)
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

// ─── Supabase Upload ──────────────────────────────────────────────────────────

async function uploadToSupabase(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  // Dynamic import to keep this server-side only
  const { createSafeServerClient } = await import("@/lib/supabase-server");
  const supabase = await createSafeServerClient();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name);
  const filename = `${folder}/${uuidv4()}${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: file.type,
      cacheControl: "public, max-age=31536000",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ─── Local Upload (development fallback) ──────────────────────────────────────

async function uploadLocal(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name);
  const filename = `${uuidv4()}${ext}`;

  const uploadDir = path.join(process.cwd(), "public", folder);
  await mkdir(uploadDir, { recursive: true });

  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, new Uint8Array(bytes));

  return `/${folder}/${filename}`;
}

// ─── Main Upload Function ─────────────────────────────────────────────────────

/**
 * Upload a file using the configured method (Supabase Storage or local).
 */
export async function uploadFile(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  const method = getUploadMethod();

  if (method === UploadMethod.SUPABASE) {
    return uploadToSupabase(file, folder);
  } else {
    return uploadLocal(file, folder);
  }
}

/**
 * Upload multiple files.
 */
export async function uploadFiles(
  files: File[],
  folder: string = "uploads"
): Promise<string[]> {
  return Promise.all(files.map((file) => uploadFile(file, folder)));
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteFromSupabase(fileUrl: string): Promise<void> {
  try {
    const { createSafeServerClient } = await import("@/lib/supabase-server");
    const supabase = await createSafeServerClient();

    // Extract the path from the full URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/folder/file.jpg
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split(`/object/public/${BUCKET_NAME}/`);
    const filePath = pathParts.length > 1 ? pathParts[1] : fileUrl;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
    }
  } catch (error) {
    console.error("Delete error:", error);
  }
}

async function deleteLocal(fileUrl: string): Promise<void> {
  try {
    const { unlink } = await import("fs/promises");
    const filepath = path.join(process.cwd(), "public", fileUrl);
    await unlink(filepath);
  } catch {
    // File may not exist — that's fine
  }
}

/**
 * Delete a file using the configured method.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (!fileUrl) return;

  const method = getUploadMethod();

  if (method === UploadMethod.SUPABASE) {
    await deleteFromSupabase(fileUrl);
  } else {
    await deleteLocal(fileUrl);
  }
}

/**
 * Delete multiple files.
 */
export async function deleteFiles(fileUrls: string[]): Promise<void> {
  await Promise.all(fileUrls.map((url) => deleteFile(url)));
}

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Validate file type against a list of allowed MIME types.
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const mainType = type.split("/")[0];
      return file.type.startsWith(mainType + "/");
    }
    return file.type === type;
  });
}

/**
 * Validate file size in MB.
 */
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Validate image file (type + size).
 */
export function validateImage(
  file: File,
  maxSizeInMB: number = 5
): { isValid: boolean; error?: string } {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!validateFileType(file, allowedTypes)) {
    return {
      isValid: false,
      error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    };
  }

  if (!validateFileSize(file, maxSizeInMB)) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit.`,
    };
  }

  return { isValid: true };
}
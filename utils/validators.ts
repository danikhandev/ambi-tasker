/**
 * Client-side File Validation Utilities
 * These functions can be used in client components for immediate validation feedback
 */

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      // Match any subtype (e.g., "image/*")
      const mainType = type.split("/")[0];
      return file.type.startsWith(mainType + "/");
    }
    return file.type === type;
  });
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Validate image file (client-side)
 */
export function validateImage(file: File, maxSizeInMB: number = 5): {
  isValid: boolean;
  error?: string;
} {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

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

/**
 * Validate document file (client-side)
 */
export function validateDocument(file: File, maxSizeInMB: number = 10): {
  isValid: boolean;
  error?: string;
} {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  if (!validateFileType(file, allowedTypes)) {
    return {
      isValid: false,
      error: "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT are allowed.",
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

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

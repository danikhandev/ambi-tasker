// services/upload/validation.ts

/**
 * Validate file type against a list of allowed MIME types.
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const mainType = type.split('/')[0];
      return file.type.startsWith(mainType + '/');
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
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (!validateFileType(file, allowedTypes)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
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

import { NextRequest, NextResponse } from "next/server";
import { userGuard } from "@/services/auth/guards";
import { uploadFile, getPublicUrl, BUCKETS } from "@/services/storage";
import { v4 as uuidv4 } from "uuid";

// Allowed MIME types for image uploads
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    // For KYC documents, we use the KYC bucket
    const bucket = (formData.get("bucket") as string) || BUCKETS.KYC;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Validate file extension as additional security layer
    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: "Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed." },
        { status: 400 }
      );
    }

    const fileName = `${guard.user.id}/${uuidv4()}.${fileExt}`;
    
    // Convert File to Buffer for the service
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use our robust storage service (handles bucket creation and service role key)
    const data = await uploadFile(bucket, fileName, buffer, file.type);

    if (!data) {
      throw new Error("Upload succeeded but no data was returned");
    }

    // Get public URL
    const publicUrl = getPublicUrl(bucket, fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
      bucket: bucket
    });

  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 });
  }
}

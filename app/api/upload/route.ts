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
    const bucket = (formData.get("bucket") as string) || BUCKETS.KYC;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB for chat, 5MB for others)
    const isChatBucket = bucket === BUCKETS.CHAT;
    const maxSize = isChatBucket ? 10 * 1024 * 1024 : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    
    if (isChatBucket) {
      const isAudioType = file.type.toLowerCase().startsWith("audio/") || ["webm", "wav", "mp3", "ogg", "m4a"].includes(fileExt);
      const isImageType = ALLOWED_TYPES.includes(file.type.toLowerCase()) || ["jpg", "jpeg", "png", "webp"].includes(fileExt);
      const isDocType = ["application/pdf", "text/plain", "application/msword"].includes(file.type.toLowerCase()) || ["pdf", "txt", "doc", "docx"].includes(fileExt);

      if (!isImageType && !isAudioType && !isDocType) {
        return NextResponse.json(
          { success: false, error: "Invalid file type for chat. Images, audio, and documents are supported." },
          { status: 400 }
        );
      }
    } else {
      // Validate file type strictly for KYC/Avatars
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Only JPG, PNG, and WebP images are allowed." },
          { status: 400 }
        );
      }

      // Validate file extension as additional security layer
      const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
      if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
        return NextResponse.json(
          { success: false, error: "Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed." },
          { status: 400 }
        );
      }
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

import { NextRequest, NextResponse } from "next/server";
import { userGuard } from "@/services/auth/guards";
import { uploadFile, getPublicUrl, BUCKETS } from "@/services/storage";
import { logger } from "@/utils/logger";
import { prisma } from "@/services/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/provider/upload-image
 * 
 * Secure endpoint for uploading provider profile and KYC images.
 * Files are validated for type and size (< 2MB) before being uploaded to Supabase Storage.
 * 
 * Accepts multipart/form-data with:
 * - image: File
 * - type: 'profile' | 'cnicFront' | 'cnicBack' | 'selfie'
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    if (guard.user.role !== "PROVIDER") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const formData = await req.formData();
    const image = formData.get("image") as File;
    const type = formData.get("type") as string;

    if (!image) {
      return NextResponse.json({ success: false, error: "Image is required" }, { status: 400 });
    }

    const validTypes = ["profile", "cnicFront", "cnicBack", "selfie"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid image type" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ success: false, error: "Invalid file type. Only JPG/PNG allowed." }, { status: 400 });
    }

    // Limit image size (< 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (image.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large. Limit is 2MB." }, { status: 400 });
    }

    const userId = guard.user.id;
    const bucket = type === "profile" ? BUCKETS.PROFILES : BUCKETS.KYC;
    const extension = image.type === "image/png" ? "png" : "jpg";
    const path = `providers/${userId}/${type}-${Date.now()}.${extension}`;

    // Upload to scalable storage
    const result = await uploadFile(bucket, path, image, image.type);

    if (!result?.path) {
      throw new Error("Failed to upload image");
    }

    let imageUrl = result.path;

    // Update the database
    if (type === "profile") {
      imageUrl = getPublicUrl(bucket, result.path);
      await prisma.user.update({
        where: { id: userId },
        data: { profileImage: imageUrl }
      });
    } else {
      const updateData: any = {};
      if (type === "cnicFront") updateData.cnicFrontUrl = imageUrl;
      if (type === "cnicBack") updateData.cnicBackUrl = imageUrl;
      if (type === "selfie") updateData.selfieUrl = imageUrl;
      
      await prisma.providerProfile.update({
        where: { userId },
        data: updateData
      });
    }

    return NextResponse.json({
      success: true,
      url: imageUrl
    });

  } catch (error: any) {
    logger.error("Upload image error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

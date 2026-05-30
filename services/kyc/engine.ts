import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";
import { GoogleVisionService } from "./googleVision";
import { sendNotification } from "@/services/notifications";

export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";

export interface KycVerificationResult {
  providerId: string;
  kycStatus: KycStatus;
  confidenceScore: number;
  result: "PASS" | "FAIL" | "REVIEW";
  message: string;
  nextAction: string;
}

/**
 * AI-Powered KYC Verification Engine (Production Level)
 */
export class KycEngine {
  
  static async verify(
    providerId: string, 
    files: { front: string; back: string; selfie: string },
    providedCnicNumber?: string,
    checkOnly: boolean = false
  ): Promise<KycVerificationResult> {
    try {
      logger.info(`Starting Production KYC verification for provider: ${providerId}`);

      // 1. Get User Data
      const user = await prisma.user.findUnique({ 
        where: { id: providerId },
        include: { providerProfile: true }
      });
      if (!user) throw new Error("Provider not found");

      // 2. Liveness & Selfie Quality Validation
      const selfieResult = await GoogleVisionService.detectFaces(files.selfie);
      
      if (!selfieResult.isPerson) {
        return this.rejection(providerId, "Invalid selfie. Please ensure you are taking a photo of yourself, not an object or a screen.");
      }
      if (!selfieResult.faceDetected) {
        return this.rejection(providerId, "No face detected in selfie. Please ensure your face is clearly visible.");
      }
      if (selfieResult.faceCount > 1) {
        return this.rejection(providerId, "Multiple faces detected in selfie. Please take a photo with only your face visible.");
      }
      if (selfieResult.confidence < 0.8) {
        return this.rejection(providerId, "Selfie quality is too low. Please use better lighting and ensure focus.");
      }
      if (selfieResult.isBlurred) {
        return this.rejection(providerId, "Selfie is blurry. Please hold the camera still.");
      }
      if (selfieResult.fraudFlags && selfieResult.fraudFlags.length > 0) {
        // Step 7: Fraud Detection during selfie capture
        return this.rejection(providerId, "Security verification failed. Digital screen or spoofing detected during selfie capture.");
      }

      // 3. Document Quality & Face Detection
      const idFaceResult = await GoogleVisionService.detectFaces(files.front);
      const idFaceDetected = idFaceResult.faceDetected;
      
      if (idFaceResult.fraudFlags && idFaceResult.fraudFlags.length > 0) {
        return this.rejection(providerId, "Security verification failed on identity document. Screen or forgery artifacts detected.");
      }
      if (idFaceResult.isBlurred || idFaceResult.isUnderExposed) {
        return this.rejection(providerId, "Identity document is illegible. Please ensure the scan is clear, well-lit, and without glare.");
      }
      if (!idFaceDetected) {
        return this.rejection(providerId, "No face detected on the ID card. Please ensure the document is clear and well-lit.");
      }

      // 4. Face Similarity Check
      const similarityScore = GoogleVisionService.compareFaces(selfieResult, idFaceResult);
      logger.info(`Face Similarity Score: ${similarityScore}%`);

      // 5. OCR Data Extraction & Secondary Fraud Analysis
      const ocrResult = await GoogleVisionService.extractText(files.front);
      if (ocrResult.fraudFlags && ocrResult.fraudFlags.length > 0) {
        return this.rejection(providerId, "Security check failed. Automated fraud detection flagged the document.");
      }
      if (!ocrResult.fullText) {
        return this.rejection(providerId, "Could not read ID card. Please ensure the text is legible.");
      }

      // 6. Data Validation
      const extractedCnic = ocrResult.cnic || providedCnicNumber;
      if (!extractedCnic) {
        return this.rejection(providerId, "Could not extract CNIC number from ID card.");
      }

      // 7. Duplicate Check
      const isDuplicate = await this.checkDuplicateCnic(providerId, extractedCnic);
      if (isDuplicate) {
        return this.rejection(providerId, "This CNIC is already registered with another account.");
      }

      // 8. Risk Scoring & Decision Engine
      let finalStatus: KycStatus = "VERIFIED";
      let confidenceScore = Math.round((selfieResult.confidence * 0.4 + (similarityScore / 100) * 0.6) * 100);
      let message = "Your identity has been successfully verified.";
      let resultMode: "PASS" | "FAIL" | "REVIEW" = "PASS";

      // Strict Rejection Rules
      if (similarityScore < 75) {
          return this.rejection(providerId, "Face match failed. The selfie does not match the ID card portrait.");
      }

      // Step 9: Waitlisting / Admin Review Trigger
      // If confidence is moderate or OCR data is missing key fields, send to review instead of instant verify
      if (similarityScore < 85 || !ocrResult.cnic || !ocrResult.name) {
        finalStatus = "UNDER_REVIEW";
        message = "Your documents are under review for additional manual validation.";
        resultMode = "REVIEW";
      }

      // 10. Persistent Storage & Status Update
      if (!checkOnly) {
          await prisma.providerProfile.update({
            where: { userId: providerId },
            data: {
              verificationStatus: finalStatus as any,
              kycConfidenceScore: confidenceScore,
              cnicNumber: extractedCnic,
              faceDetected: selfieResult.faceDetected,
              idFaceDetected: idFaceDetected,
              faceMatchScore: similarityScore,
              ocrData: ocrResult as any,
              rejectionReason: (finalStatus as string) === "REJECTED" ? message : null,
              kycVerifiedAt: finalStatus === "VERIFIED" ? new Date() : null,
              kycData: {
                extractedAt: new Date().toISOString(),
                similarityScore,
                ocrData: ocrResult,
                selfieQuality: {
                    confidence: selfieResult.confidence,
                    isBlurred: selfieResult.isBlurred,
                    isUnderExposed: selfieResult.isUnderExposed,
                    faceCount: selfieResult.faceCount,
                    fraudFlags: selfieResult.fraudFlags
                },
                idQuality: {
                    faceDetected: idFaceDetected,
                    confidence: idFaceResult.confidence,
                    isBlurred: idFaceResult.isBlurred,
                    isUnderExposed: idFaceResult.isUnderExposed,
                    fraudFlags: idFaceResult.fraudFlags
                },
                fraudRisk: resultMode === "REVIEW" ? "MEDIUM" : "LOW",
                engine: "AmbiTasker Enterprise KYC - Google Cloud Vision v1 + Heuristic Matcher"
              } as any
            }
          });

          // Step 11: Provider Notification
          await sendNotification({
            userId: providerId,
            title: finalStatus === "VERIFIED" ? "KYC Approved" : "KYC Under Review",
            body: finalStatus === "VERIFIED" 
              ? "Your identity has been verified. You can now accept bookings on the platform."
              : "Your KYC documents require manual audit. We will notify you once complete.",
            type: "SYSTEM",
            actionUrl: "/provider/dashboard"
          });
      }

      return {
        providerId,
        kycStatus: finalStatus,
        confidenceScore,
        result: resultMode,
        message,
        nextAction: finalStatus === "VERIFIED" ? "Proceed to Dashboard" : "Wait for Review"
      };

    } catch (error: any) {
      logger.error("KYC Engine Fatal Error:", error);
      throw error;
    }
  }

  private static async checkDuplicateCnic(providerId: string, cnic: string): Promise<boolean> {
    const existing = await prisma.providerProfile.findFirst({
      where: {
        cnicNumber: cnic,
        NOT: { userId: providerId }
      }
    });
    return !!existing;
  }

  private static async rejection(providerId: string, message: string): Promise<KycVerificationResult> {
    // Persistent record of rejection if possible, or just return result
    logger.warn(`KYC Rejected for ${providerId}: ${message}`);
    
    // Update Provider Profile immediately to REJECTED if called during processing
    try {
      await prisma.providerProfile.update({
        where: { userId: providerId },
        data: {
          verificationStatus: "REJECTED",
          rejectionReason: message
        }
      });

      await sendNotification({
        userId: providerId,
        title: "KYC Rejected",
        body: `Your identity verification failed: ${message}`,
        type: "ALERT",
        actionUrl: "/provider/verify"
      });
    } catch (e) {
      logger.error("Failed to update status on rejection", e);
    }
    
    return {
      providerId,
      kycStatus: "REJECTED",
      confidenceScore: 0,
      result: "FAIL",
      message,
      nextAction: "Re-upload documents"
    };
  }
}


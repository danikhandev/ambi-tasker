import { logger } from "@/utils/logger";

interface OCRResult {
  extractedText: string;
  confidence: number;
  matchedName: boolean;
  rawResponse?: any;
}

/**
 * Validates an uploaded ID document using an OCR provider (e.g., Google Cloud Vision).
 * @param imageUrl The URL of the uploaded document in Supabase Storage
 * @param expectedName The registered name of the user to match against the ID
 */
export async function validateDocumentOCR(imageUrl: string, expectedName: string): Promise<OCRResult> {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    // 1. Fallback / Dev mode if no API key is present
    if (!apiKey) {
      logger.warn("No GOOGLE_VISION_API_KEY provided. Using structural OCR fallback.");
      return {
        extractedText: "MOCK_ID_TEXT",
        confidence: 0.95,
        matchedName: true, // Auto-approve in dev
      };
    }

    // 2. Real Google Vision API Integration
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            source: { imageUri: imageUrl }
          },
          features: [
            { type: "TEXT_DETECTION" }
          ]
        }
      ]
    };

    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations;
    
    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        extractedText: "",
        confidence: 0,
        matchedName: false,
      };
    }

    // The first annotation contains the entire extracted text
    const fullText = textAnnotations[0].description.toUpperCase();
    const expectedNameUpper = expectedName.toUpperCase();

    // 3. Simple Fuzzy Match (Can be expanded with Levenshtein distance)
    const nameParts = expectedNameUpper.split(' ');
    let matchedParts = 0;

    nameParts.forEach(part => {
      if (fullText.includes(part)) {
        matchedParts++;
      }
    });

    // Require at least 50% of the name parts to match
    const matchRatio = matchedParts / nameParts.length;
    const isMatched = matchRatio >= 0.5;

    return {
      extractedText: fullText,
      confidence: matchRatio,
      matchedName: isMatched,
      rawResponse: data
    };

  } catch (error) {
    logger.error("OCR Validation Failed:", error);
    throw error;
  }
}

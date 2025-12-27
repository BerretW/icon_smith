import { GoogleGenAI } from "@google/genai";
import { IconStyle, ColorMode, GeminiModelId } from "../types";

// Helper to initialize AI with a dynamic key
const getAIClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key chybí. Prosím nastavte svůj Gemini API klíč v nastavení (ozubené kolo).");
  }
  return new GoogleGenAI({ apiKey });
};

const getStylePrompt = (colorMode: ColorMode) => {
  if (colorMode === 'color') {
    return `
Style definition: Red Dead Redemption 2 catalog item illustration.
Characteristics: Vintage watercolor, colored pencil or ink wash aesthetic. Realistic but hand-drawn. Muted, authentic western colors (earth tones, faded dyes).
Crucial Requirements:
1. NO TEXT. Do not generate labels, words, letters, signatures, or numbers.
2. ISOLATED SUBJECT. The object must be isolated on a pure white background (#FFFFFF).
3. 100x100 pixel aesthetic. Bold details.
`;
  }
  return `
Style definition: Red Dead Redemption 2 inventory icon style. 
Characteristics: High contrast, black ink on pure white background, lithograph or woodcut aesthetic, Arthur Morgan's journal style.
Crucial Requirements:
1. NO TEXT. Do not generate labels, words, letters, signatures, or numbers.
2. ISOLATED SUBJECT. The object must be isolated on a pure white background.
3. 100x100 pixel aesthetic. Keep details bold and simple. No colors (monochrome black/dark grey on white).
`;
};

export const generateIcon = async (
  prompt: string, 
  style: IconStyle, 
  colorMode: ColorMode,
  apiKey: string,
  modelId: GeminiModelId
): Promise<string> => {
  const ai = getAIClient(apiKey);
  const baseStyle = getStylePrompt(colorMode);
  
  const specificStylePrompt = style === 'woodcut' 
    ? "Create a rough, carved woodcut style illustration." 
    : "Create a clean, hand-drawn inventory icon.";

  const finalPrompt = `${baseStyle} ${specificStylePrompt} Subject: ${prompt}. Ensure NO TEXT is present.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: finalPrompt }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data received from Gemini.");
  } catch (error) {
    console.error("Icon generation failed:", error);
    throw error;
  }
};

export const transformImageToIcon = async (
  base64Image: string, 
  mimeType: string, 
  prompt: string | undefined, 
  colorMode: ColorMode,
  apiKey: string,
  modelId: GeminiModelId
): Promise<string> => {
  const ai = getAIClient(apiKey);
  const userPrompt = prompt || "Convert this image into an RDR2 icon.";
  const baseStyle = getStylePrompt(colorMode);
  
  const transformationPrompt = `${baseStyle} 
  Task: Redraw the provided image into this style. 
  Focus: ${colorMode === 'color' ? 'Convert to a vintage color illustration.' : 'Convert to a black and white woodcut/lithograph.'}
  Strictly remove any background from the original image and place the subject on pure white.
  Ensure NO TEXT is added.
  Additional context: ${userPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          { text: transformationPrompt }
        ]
      },
       config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No transformed image received from Gemini.");
  } catch (error) {
    console.error("Image transformation failed:", error);
    throw error;
  }
};

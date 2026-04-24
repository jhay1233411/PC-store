import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../constants";

const getApiKey = () => {
  const metaEnv = (import.meta as any).env || {};

  const key =
    metaEnv?.GEMINI_API_KEY?.trim() ||
    metaEnv?.VITE_GEMINI_API_KEY?.trim() ||
    metaEnv?.VITE_OTHER_API_KEY?.trim();

  return key ?? "";
};

const createAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

const SHOP_CATALOG = PRODUCTS.map(p => 
  `- ${p.name} (${p.category}): ₱${p.price.toLocaleString()}${p.socket ? `, Socket: ${p.socket}` : ''}${p.ramType ? `, RAM: ${p.ramType}` : ''}${p.wattage ? `, Wattage: ${p.wattage}W` : ''}. Description: ${p.description}`
).join('\n');

export const getGeminiResponse = async (
  prompt: string, 
  history: { role: string; parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] }[] = [],
  image?: { data: string; mimeType: string }
) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "AI Assistant is not configured. Please add your API key in the Settings menu.";
  }

  try {
    const contents = [...history];
    const userParts: any[] = [{ text: prompt }];
    
    if (image) {
      userParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    contents.push({ role: "user", parts: userParts });

    const ai = createAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: `You are a PC building expert assistant in the year 2026. 
You are specifically an assistant for "PC MASTER", a high-end hardware shop.

CRITICAL: Your answers MUST be grounded in the following real-time inventory from our shop. 
ONLY recommend products from this list when helping users build or upgrade their PCs. 
If a user asks for something we don't have, politely mention what we DO have that is comparable.

CURRENT SHOP INVENTORY:
${SHOP_CATALOG}

GUIDELINES:
1. Be technical but accessible.
2. For troubleshooting, ask clarifying questions if the images aren't clear.
3. All prices are in Philippine Peso (PHP).
4. You can see images if users upload them to help diagnose issues with their hardware, assembly, or cable management.
5. Always prefer suggesting a full compatible build using our current inventory.`
      }
    });

    if (!response || !response.text) {
      console.warn("Gemini API returned an empty response:", response);
      return "I received an empty response from the AI. Please try rephrasing your question.";
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    const errorMessage = error?.message || "";
    const errorStatus = error?.status || "";

    if (errorMessage.includes("API key not valid") || errorMessage.includes("invalid API key")) {
      return "The API key provided is invalid. Please check your Settings.";
    }
    
    if (errorMessage.includes("Quota exceeded") || errorStatus === "RESOURCE_EXHAUSTED" || errorMessage.includes("429")) {
      return "The AI Assistant has reached its free usage limit. Please wait a moment or try again later.";
    }

    if (errorMessage.includes("permission") || errorStatus === "PERMISSION_DENIED" || errorMessage.includes("403")) {
      return "The AI Assistant does not have permission to use this model with the current API key. Ensure the 'Generative Language API' is enabled in your Google Cloud Console.";
    }

    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
};

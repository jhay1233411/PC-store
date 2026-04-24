import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../constants";

const getApiKey = () => {
  // Priority 1: Standard platform key
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  // Priority 2: User provided key from .env.example suggestion
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_OTHER_API_KEY) return metaEnv.VITE_OTHER_API_KEY;
  return "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

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
    return "AI Assistant is not configured. Please ensure your API key is properly set.";
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

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents,
      config: {
        systemInstruction: `You are a PC building expert assistant named "Master AI" for the PC MASTER hardware shop in 2026.

RELEVANT INVENTORY:
${SHOP_CATALOG}

YOUR CORE RULES:
1. GROUNDED RECOMMENDATIONS: Only recommend hardware that exists in our inventory listed above. If you MUST mention another product for comparison, state clearly that PC MASTER does not currently stock it.
2. TECHNICAL ACCURACY: Verify socket compatibility (e.g., LGA1700 vs LGA1851) and RAM types (DDR4 vs DDR5) based on the inventory data.
3. CURRENCY: All prices are in Philippine Peso (PHP). Use the ₱ symbol.
4. IMAGE ANALYSIS: You can analyze images of motherboard debug LEDs, cable management, and hardware assembly to provide diagnostic help.
5. TONE: Professional, enthusiastic about tech, and highly precise.
6. SHOP PRIDE: Proudly represent PC MASTER as the premier hardware destination.`
      }
    });

    if (!response || !response.text) {
      console.warn("Gemini API empty response");
      return "I processed your request but didn't generate a text response. Could you try rephrasing?";
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    const errorMessage = error?.message || "";
    const errorStatus = error?.status || "";

    if (errorMessage.includes("API key not valid") || errorMessage.includes("invalid API key")) {
      return "The API key is invalid. Please check your environment configurations.";
    }
    
    if (errorMessage.includes("Quota exceeded") || errorStatus === "RESOURCE_EXHAUSTED" || errorMessage.includes("429")) {
      return "The AI Assistant's quota has been reached. Please wait a moment before asking another question.";
    }

    if (errorStatus === "PERMISSION_DENIED") {
      return "Access denied to the Generative Language API. Please ensure the API is enabled.";
    }

    return "I hit a snag while thinking. Could you try sending your message again?";
  }
};

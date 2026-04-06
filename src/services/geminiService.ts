import { GoogleGenAI } from "@google/genai";

// Use import.meta.env for Vite environments, fallback to empty string
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
               (import.meta as any).env?.GEMINI_API_KEY || 
               '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const geminiService = {
  forecastLead: async (visitNotes: string, doctorName: string, purpose: string) => {
    if (!ai) {
      console.warn('Gemini API not configured - returning mock forecast');
      // Return mock data when API is not available
      return {
        isLead: true,
        confidence: 0.75,
        reasoning: "Based on the visit notes, this doctor shows interest in our products.",
        suggestedPriority: "high"
      };
    }
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following visit notes from a Medical Representative (MR) and determine if this doctor is likely to become a high-potential lead for pharmaceutical sales.
        
        Doctor: ${doctorName}
        Purpose: ${purpose}
        Notes: ${visitNotes}
        
        Respond in JSON format with:
        - isLead: boolean
        - confidence: number (0-1)
        - reasoning: string (brief explanation)
        - suggestedPriority: "high" | "medium" | "low"`,
        config: {
          responseMimeType: "application/json",
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Error forecasting lead:", error);
      return null;
    }
  },

  analyzeSales: async (query: string, salesSummary: string) => {
    if (!ai) {
      return null; // fallback to client-side
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a pharmaceutical sales analytics AI. Sales Data: ${salesSummary}. Query: "${query}". Provide a concise, actionable response with specific recommendations.`,
        config: {
          responseMimeType: "text/plain",
        },
      });
      return response.text || null;
    } catch {
      return null;
    }
  },
};

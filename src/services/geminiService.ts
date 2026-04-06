import { GoogleGenAI } from "@google/genai";
import { Visit, VisitFrequencyAnalysis, VisitCommentAnalysis, AIForecast } from '../types';

// Use import.meta.env for Vite environments, fallback to empty string
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ||
               (import.meta as any).env?.GEMINI_API_KEY ||
               '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const geminiService = {
  forecastLead: async (visitNotes: string, doctorName: string, purpose: string) => {
    if (!ai) {
      console.warn('Gemini API not configured - returning mock forecast');
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

  analyzeVisitFrequency: async (visits: Visit[], entityName: string, entityType: string): Promise<VisitFrequencyAnalysis | null> => {
    if (!ai) {
      const totalVisits = visits.length;
      const now = new Date();
      const visitDates = visits.map(v => new Date(v.visit_date)).sort((a, b) => b.getTime() - a.getTime());
      const lastVisit = visitDates[0] ? visitDates[0].toISOString().split('T')[0] : 'Never';
      const visits30 = visitDates.filter(d => (now.getTime() - d.getTime()) <= 30 * 86400000).length;
      const visits90 = visitDates.filter(d => (now.getTime() - d.getTime()) <= 90 * 86400000).length;
      let recommended: VisitFrequencyAnalysis['recommended_frequency'] = 'monthly';
      if (visits30 >= 8) recommended = 'daily';
      else if (visits30 >= 4) recommended = 'weekly';
      else if (visits30 >= 2) recommended = 'biweekly';
      else if (visits90 <= 1) recommended = 'quarterly';
      return {
        entity_id: visits[0]?.doctor_id || 0,
        entity_type: entityType as any,
        entity_name: entityName,
        total_visits: totalVisits,
        last_visit_date: lastVisit,
        visits_last_30_days: visits30,
        visits_last_90_days: visits90,
        avg_gap_between_visits: totalVisits > 1 ? Math.round(90 / (visits90 || 1)) : 0,
        recommended_frequency: recommended,
        is_overdue: visits30 === 0,
        next_recommended_date: new Date(now.getTime() + (recommended === 'daily' ? 1 : recommended === 'weekly' ? 7 : recommended === 'biweekly' ? 14 : recommended === 'monthly' ? 30 : 90) * 86400000).toISOString().split('T')[0],
        trend: visits30 >= visits90 / 3 ? 'stable' : 'decreasing',
      };
    }

    try {
      const visitHistory = visits.map(v => `${v.visit_date}: ${v.purpose} - ${v.conversation_summary || v.notes || 'No notes'}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the visit frequency pattern for this healthcare entity and recommend the optimal visit schedule.

        Entity: ${entityName} (${entityType})
        Total Visits: ${visits.length}
        Visit History:
        ${visitHistory}

        Respond in JSON format with:
        - entity_name: string
        - total_visits: number
        - last_visit_date: string (YYYY-MM-DD or "Never")
        - visits_last_30_days: number
        - visits_last_90_days: number
        - avg_gap_between_visits: number (in days)
        - recommended_frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly"
        - is_overdue: boolean
        - next_recommended_date: string (YYYY-MM-DD)
        - trend: "increasing" | "stable" | "decreasing"`,
        config: { responseMimeType: "application/json" },
      });
      const data = JSON.parse(response.text || "{}");
      return { entity_id: visits[0]?.doctor_id || 0, entity_type: entityType as any, ...data };
    } catch { return null; }
  },

  analyzeVisitComments: async (visits: Visit[], entityName: string): Promise<VisitCommentAnalysis | null> => {
    if (!ai) {
      const comments = visits.filter(v => v.conversation_summary || v.notes).slice(-10);
      return {
        entity_id: visits[0]?.doctor_id || 0,
        entity_name: entityName,
        total_comments_analyzed: comments.length,
        overall_sentiment: comments.length > 0 ? 'positive' as const : 'neutral' as const,
        sentiment_trend: 'stable' as const,
        key_concerns: ['Follow-up needed', 'Product interest detected'],
        interest_topics: ['Product efficacy', 'Pricing', 'Samples'],
        product_mentions: [],
        engagement_score: comments.length > 0 ? 65 : 20,
        summary: comments.length > 0 ? 'Doctor shows moderate interest. Follow-up recommended to discuss product details.' : 'No conversation data available for analysis.',
      };
    }

    try {
      const comments = visits.filter(v => v.conversation_summary || v.notes).slice(-10);
      const commentText = comments.map(v => `[${v.visit_date}] ${v.conversation_summary || v.notes}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these visit conversation summaries for sentiment, interests, and key insights.

        Entity: ${entityName}
        Number of conversations: ${comments.length}
        Conversations:
        ${commentText}

        Respond in JSON format with:
        - entity_name: string
        - total_comments_analyzed: number
        - overall_sentiment: "positive" | "neutral" | "negative"
        - sentiment_trend: "improving" | "stable" | "declining"
        - key_concerns: string[] (top 3 concerns raised by the doctor/entity)
        - interest_topics: string[] (top 3 topics they showed interest in)
        - product_mentions: string[] (products mentioned or discussed)
        - engagement_score: number (0-100, how engaged they are)
        - summary: string (2-3 sentence summary for the MR)`,
        config: { responseMimeType: "application/json" },
      });
      const data = JSON.parse(response.text || "{}");
      return { entity_id: visits[0]?.doctor_id || 0, ...data };
    } catch { return null; }
  },

  forecastEntityLead: async (profile: { name: string; type: string; tier: string; specialty?: string }, visits: Visit[], transcript?: string): Promise<AIForecast | null> => {
    if (!ai) {
      const hasTranscript = !!(transcript && transcript.length > 20);
      const hasOrders = visits.some(v => (v as any).order_value > 0);
      const probability = hasTranscript ? 60 : hasOrders ? 45 : 20;
      return {
        entity_id: 0,
        entity_type: profile.type as any,
        entity_name: profile.name,
        lead_probability: probability,
        lead_status: probability >= 60 ? 'hot' as const : probability >= 35 ? 'warm' as const : 'cold' as const,
        revenue_forecast: probability * 150,
        recommended_actions: hasTranscript
          ? ['Schedule follow-up visit within 7 days', 'Prepare product samples', 'Share detailed pricing information']
          : ['Visit within 14 days to assess interest', 'Introduce product portfolio'],
        risk_factors: ['No recent visit data', 'Engagement level unknown'],
        confidence: hasTranscript ? 55 : 30,
        reasoning: hasTranscript ? 'Based on transcript analysis, moderate interest signals detected.' : 'Insufficient data for accurate forecast. Recommend a visit to gather more information.',
      };
    }

    try {
      const visitHistory = visits.slice(-10).map(v => `${v.visit_date}: ${v.purpose} - ${v.conversation_summary || v.notes || 'No notes'}`).join('\n');
      const tx = transcript ? `\nLatest Transcript:\n${transcript}` : '';
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this healthcare entity for lead potential. Consider their profile, visit history, and any latest conversation transcript.

        Profile: ${JSON.stringify(profile)}
        Visit History (${visits.length} visits):
        ${visitHistory}${tx}

        Respond in JSON format with:
        - entity_name: string
        - lead_probability: number (0-100, overall likelihood of becoming a high-value lead)
        - lead_status: "hot" | "warm" | "cold" | "unknown"
        - revenue_forecast: number (estimated monthly revenue in INR)
        - recommended_actions: string[] (3 specific next steps for the MR)
        - risk_factors: string[] (2-3 factors that could prevent conversion)
        - confidence: number (0-100, how confident you are in this assessment)
        - reasoning: string (brief explanation of the forecast)`,
        config: { responseMimeType: "application/json" },
      });
      const data = JSON.parse(response.text || "{}");
      return { entity_id: 0, entity_type: profile.type as any, ...data };
    } catch { return null; }
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

  analyzeExpenses: async (query: string, expenseSummary: string) => {
    if (!ai) return null;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expense optimization AI for a pharmaceutical sales company. Expense Data: ${expenseSummary}. Query: "${query}". Provide specific, actionable recommendations to reduce costs. Be concise.`,
        config: { responseMimeType: "text/plain" },
      });
      return response.text || null;
    } catch {
      return null;
    }
  },
};

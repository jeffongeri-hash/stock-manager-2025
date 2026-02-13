
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const handleApiError = (error: any) => {
  const msg = error?.message || "";
  console.error("Gemini API Error Detail:", error);
  
  if (msg.includes("500") || msg.includes("Rpc failed") || msg.includes("xhr error")) {
    window.dispatchEvent(new CustomEvent('gemini-server-error'));
  }
  
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    window.dispatchEvent(new CustomEvent('gemini-quota-error'));
  }
  
  if (msg.includes("Requested entity was not found.") || msg.includes("API_KEY_INVALID") || msg.includes("401") || msg.includes("403")) {
    window.dispatchEvent(new CustomEvent('gemini-key-invalid'));
  }
  throw error;
};

export const cleanMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .replace(/_{1,2}/g, '')
    .replace(/`{1,3}/g, '')
    .trim();
};

const taxSchema = {
  type: Type.OBJECT,
  properties: {
    federal: { type: Type.NUMBER },
    state: { type: Type.NUMBER },
    local: { type: Type.NUMBER },
    fica: { type: Type.NUMBER },
    totalTax: { type: Type.NUMBER },
    takeHome: { type: Type.NUMBER },
    effectiveRate: { type: Type.NUMBER },
    analysis: { type: Type.STRING },
    arbitrageInsight: { type: Type.STRING }
  },
  required: ["federal", "state", "local", "fica", "totalTax", "takeHome", "effectiveRate", "analysis", "arbitrageInsight"]
};

export const getTaxEstimation = async (zipCode: string, grossIncome: number) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Calculate tax estimation for zip code ${zipCode} with $${grossIncome} income. Use 2025 brackets and rules. Rely on your generalized training data for this zip code's state/local taxes.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: taxSchema
      },
    });
    return JSON.parse(response.text);
  } catch (error) { return handleApiError(error); }
};

const goalInsightSchema = {
  type: Type.OBJECT,
  properties: {
    goalName: { type: Type.STRING },
    estimatedLumpSum: { type: Type.NUMBER },
    estimatedRecurringAnnual: { type: Type.NUMBER },
    breakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          cost: { type: Type.NUMBER },
          description: { type: Type.STRING }
        },
        required: ["category", "cost", "description"]
      }
    },
    investmentAdvice: { type: Type.STRING },
    marketContext: { type: Type.STRING }
  },
  required: ["goalName", "estimatedLumpSum", "estimatedRecurringAnnual", "breakdown", "investmentAdvice", "marketContext"]
};

export const getGoalMarketInsight = async (goalType: string, location: string) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Provide a detailed cost breakdown and investment planning insight for '${goalType}' in 2025 in ${location}. Include realistic one-time costs and recurring annual impacts. Format strictly as JSON.`,
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: goalInsightSchema
      },
    });
    const data = JSON.parse(response.text);
    return { ...data, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return handleApiError(error); }
};

export const getCostOfLivingAndSalary = async (location: string, jobTitle: string, familySize: number, hasPets: boolean) => {
  try {
    const ai = getAI();
    if (!ai) return { text: "AI scanning requires a connected API key.", sources: [] };
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze cost of living and salary for a ${jobTitle} in ${location} for 2025. Consider a family size of ${familySize} and pet ownership: ${hasPets}. Provide a detailed breakdown including a markdown table for the monthly budget.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    return { text: cleanMarkdown(response.text), sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return handleApiError(error); }
};

const budgetSchema = {
  type: Type.OBJECT,
  properties: {
    location: { type: Type.STRING },
    totalMonthly: { type: Type.NUMBER },
    breakdown: {
      type: Type.OBJECT,
      properties: {
        housing: { type: Type.NUMBER },
        childcare: { type: Type.NUMBER },
        food: { type: Type.NUMBER },
        utilities: { type: Type.NUMBER },
        transportation: { type: Type.NUMBER },
        healthcare: { type: Type.NUMBER },
        miscellaneous: { type: Type.NUMBER }
      },
      required: ["housing", "childcare", "food", "utilities", "transportation", "healthcare", "miscellaneous"]
    },
    analysisText: { type: Type.STRING }
  },
  required: ["location", "totalMonthly", "breakdown", "analysisText"]
};

export const getChildCostsAnalysis = async (location: string, familySize: number) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze ACTUAL MONTHLY living expenses for a family of ${familySize} in ${location} for 2025. Search specifically for median rent and childcare costs.`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json", 
        responseSchema: budgetSchema 
      },
    });
    const data = JSON.parse(response.text);
    return { ...data, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return handleApiError(error); }
};

export const getComparativeFamilyAnalysis = async (locA: string, locB: string, size: number) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Compare real-world MONTHLY family costs for a household of ${size} between ${locA} and ${locB} for 2025. Ensure your results reflect factual regional price disparities.`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json", 
        responseSchema: { type: Type.ARRAY, items: budgetSchema } 
      },
    });
    const data = JSON.parse(response.text);
    return { locations: data, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return handleApiError(error); }
};

const optionsSchema = {
  type: Type.OBJECT,
  properties: {
    stockPrice: { type: Type.NUMBER },
    strategies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          longStrike: { type: Type.NUMBER },
          longExpiry: { type: Type.STRING },
          longPremium: { type: Type.NUMBER },
          longDelta: { type: Type.NUMBER },
          shortStrike: { type: Type.NUMBER },
          shortExpiry: { type: Type.STRING },
          shortPremium: { type: Type.NUMBER },
          netDebit: { type: Type.NUMBER },
          breakEven: { type: Type.NUMBER },
          potentialAnnualReturn: { type: Type.NUMBER },
          description: { type: Type.STRING }
        },
        required: ["longStrike", "longExpiry", "longPremium", "longDelta", "shortStrike", "shortExpiry", "shortPremium", "netDebit", "breakEven", "description"]
      }
    },
    generalAnalysis: { type: Type.STRING }
  },
  required: ["stockPrice", "strategies", "generalAnalysis"]
};

export const analyzeOptionsStrategy = async (ticker: string, criteria: any) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a PMCC (Poor Man's Covered Call) analysis for ${ticker} in 2025. Criteria: ${JSON.stringify(criteria)}.`,
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: optionsSchema
      },
    });
    const data = JSON.parse(response.text);
    return { ...data, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return handleApiError(error); }
};

export const findRollOpportunities = async (ticker: string, currentStrike: number) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find 2025 options rolling opportunities for ${ticker} currently at ${currentStrike} strike.`,
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });
    return JSON.parse(response.text);
  } catch (error) { return handleApiError(error); }
};

export const getFireAdvice = async (data: string) => {
  try {
    const ai = getAI();
    if (!ai) return "AI advisor requires a connected API key.";
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `As a senior FIRE advisor, provide acceleration strategies for this situation: ${data}.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    return response.text;
  } catch (error) { return handleApiError(error); }
};

export const getVacationPlanning = async (origin: string, destination: string, budget: number, startDate: string, endDate: string, styles: string[]) => {
  try {
    const ai = getAI();
    if (!ai) return { text: "AI required." };
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Plan a vacation from ${origin} to ${destination} from ${startDate} to ${endDate} with $${budget} budget. Styles: ${styles.join(',')}.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    return { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) { return handleApiError(error); }
};

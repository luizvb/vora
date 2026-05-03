import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "placeholder-key";
const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === "true" || (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY);

export const getModel = (temperature = 0) => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    apiKey: GOOGLE_API_KEY,
    temperature,
  });
};

export interface AgentResponse {
  agent: string;
  feedback: string;
  metrics: Record<string, unknown>;
}

// Mock responses for deterministic dev mode
export const MOCK_RESPONSES: Record<string, AgentResponse> = {
  sales: {
    agent: "sales",
    feedback: "The representative handled initial objections well but failed to secure a firm next step. Focus on 'the ask' at the end of the call.",
    metrics: { closeProbability: 65, missedAsks: 1 }
  },
  coach: {
    agent: "coach",
    feedback: "Great empathy shown when the customer mentioned budget constraints. Try to mirror their energy level more consistently.",
    metrics: { rapportScore: 82, listeningRatio: 60 }
  },
  linguistics: {
    agent: "linguistics",
    feedback: "Pace was slightly fast (160 wpm). Used 'um' 12 times. Consider pausing after key statements for impact.",
    metrics: { fillerWords: 12, pace: "Fast" }
  },
  analyst: {
    agent: "analyst",
    feedback: "The value proposition was linked to cost savings, which is good. Needs more concrete ROI figures to counter pricing pressure.",
    metrics: { valueStrength: 75, pricingObjections: 2 }
  }
};

export const isMockMode = () => IS_DEV;

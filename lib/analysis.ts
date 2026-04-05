import { UserRole } from "@/app/context/UserContext";

export interface AnalysisResult {
  overallScore: number;
  pros: { quote: string; analysis: string }[];
  cons: { quote: string; analysis: string }[];
  linguisticStats: {
    fillerWords: number;
    tone: string;
    talkTime: number; // Percentage
  };
  actionPlan: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
}

export function simulateAnalysis(transcript: string, role: UserRole): AnalysisResult {
  const length = transcript.length;
  // Deterministic but varies based on length
  const scoreBase = Math.min(100, Math.max(0, 70 + (length % 30)));
  const fillerCount = Math.floor(length / 100) + (length % 10);
  
  const tones = ['Confident', 'Empathetic', 'Persuasive', 'Hesitant', 'Professional'];
  const tone = tones[length % tones.length];
  
  const talkTime = 40 + (length % 30); // 40-70%

  return {
    overallScore: role === 'SALES_MANAGER' ? scoreBase - 5 : scoreBase,
    pros: [
      { 
        quote: "I understand your concern about the integration timeline...", 
        analysis: "Great display of empathy and active listening." 
      },
      { 
        quote: "Our solution typically pays for itself in under 6 months.", 
        analysis: "Strong value proposition delivery." 
      }
    ],
    cons: [
      { 
        quote: "Um, I think we can, uh, definitely look into that next week.", 
        analysis: "High frequency of filler words reduces authority." 
      },
      { 
        quote: "I'm not sure if we support that specific feature yet.", 
        analysis: "Lack of product knowledge in key area." 
      }
    ],
    linguisticStats: {
      fillerWords: fillerCount,
      tone: tone,
      talkTime: talkTime
    },
    actionPlan: [
      { title: "Reduce Filler Words", description: "Practice pausing instead of saying 'uh' or 'um'.", priority: 'high' },
      { title: "Product Deep Dive", description: "Review the technical specifications for integration.", priority: 'medium' },
      { title: "Closing Techniques", description: "Try to secure a follow-up date earlier in the call.", priority: 'high' }
    ]
  };
}

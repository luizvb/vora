import { describe, it, expect, vi } from 'vitest';
import { aggregateAgentResponses } from '../lib/analysis';

describe('VORA Feature-by-Feature Analysis Tests', () => {
  const mockTranscript = "Transcript: User: Hi, I'm interested in the product but the price is a bit high. Sales: I understand, let's look at the ROI.";

  describe('Sales Feature (Closing Probability & Strategy)', () => {
    it('should calculate overall score based on sales close probability', () => {
      const mockResponses = [
        { agent: 'sales', feedback: 'Great closing.', metrics: { closeProbability: 95 } },
        { agent: 'linguistics', feedback: 'Good rapport.', metrics: { rapportScore: 85 } },
        { agent: 'coach', feedback: 'Excellent.', metrics: {} },
        { agent: 'analyst', feedback: 'Strategic.', metrics: {} }
      ];
      
      const result = aggregateAgentResponses(mockResponses, mockTranscript);
      // Formula: Math.round((rapportScore + closeProbability) / 2)
      // (85 + 95) / 2 = 90
      expect(result.overallScore).toBe(90);
    });

    it('should extract sales-specific insights into the action plan', () => {
      const mockResponses = [
        { agent: 'sales', feedback: 'Focus on the value proposition.', metrics: { closeProbability: 50 } }
      ];
      const result = aggregateAgentResponses(mockResponses, mockTranscript);
      const salesAction = result.actionPlan.find(a => a.title === 'Improve Closing');
      expect(salesAction?.description).toContain('Focus on the value proposition');
    });
  });

  describe('Linguistics Feature (Filler Words, Tone, Pace)', () => {
    it('should correctly map linguistic metrics to the report', () => {
      const mockResponses = [
        { 
          agent: 'linguistics', 
          feedback: 'Slightly hesitant.', 
          metrics: { fillerWords: 12, pace: 'Fast', rapportScore: 60 } 
        }
      ];
      const result = aggregateAgentResponses(mockResponses, mockTranscript);
      expect(result.linguisticStats.fillerWords).toBe(12);
      expect(result.linguisticStats.tone).toBe('Fast');
    });
  });

  describe('Coach Feature (Empathy & Active Listening)', () => {
    it('should include coaching analysis in pros/cons', () => {
      const mockResponses = [
        { agent: 'coach', feedback: 'Strong empathy shown during objection handling.', metrics: {} }
      ];
      const result = aggregateAgentResponses(mockResponses, mockTranscript);
      const empathyPro = result.pros.find(p => p.quote === 'Strong empathy');
      expect(empathyPro?.analysis).toBe('Strong empathy shown during objection handling.');
    });
  });

  describe('Strategic Analyst Feature (ROI & Business Logic)', () => {
    it('should include analyst feedback in the action plan', () => {
      const mockResponses = [
        { agent: 'analyst', feedback: 'Needs more concrete ROI figures.', metrics: {} }
      ];
      const result = aggregateAgentResponses(mockResponses, mockTranscript);
      const analystAction = result.actionPlan.find(a => a.title === 'ROI Deep Dive');
      expect(analystAction?.description).toContain('Needs more concrete ROI figures');
    });
  });

  describe('Aggregation Logic (Unified Action Map)', () => {
    it('should handle missing agents gracefully using defaults', () => {
      const result = aggregateAgentResponses([], mockTranscript);
      expect(result.overallScore).toBe(65); // Default (80 + 50) / 2
      expect(result.linguisticStats.fillerWords).toBe(0);
      expect(result.actionPlan).toHaveLength(3);
    });

    it('should prioritize high priority tasks in the action plan', () => {
      const result = aggregateAgentResponses([], mockTranscript);
      const highPriority = result.actionPlan.filter(a => a.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
    });
  });
});

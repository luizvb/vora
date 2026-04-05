import { describe, it, expect, vi } from 'vitest';
import { runAnalysis } from '../lib/langchain/graph';
import { aggregateAgentResponses } from '../lib/analysis';
import { createReport, getReportById } from '../lib/report-service';

// Mock LangChain to avoid real API calls
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    withStructuredOutput: vi.fn().mockReturnThis(),
    invoke: vi.fn().mockResolvedValue({ content: 'Mocked feedback', nextAgent: 'FINISH' })
  }))
}));

// Mock the environment to ensure mock mode is on
process.env.NEXT_PUBLIC_DEV_MODE = "true";

describe('VORA Integration Tests', () => {
  const mockTranscript = "Hello, I want to buy your product but it is too expensive.";

  it('should run the full supervisor analysis flow (mocked)', async () => {
    const responses = await runAnalysis(mockTranscript);
    
    expect(responses).toHaveLength(4);
    const agents = responses.map(r => r.agent);
    expect(agents).toContain('sales');
    expect(agents).toContain('coach');
    expect(agents).toContain('linguistics');
    expect(agents).toContain('analyst');
  });

  it('should aggregate agent responses into a Unified Action Map', () => {
    const mockResponses = [
      { agent: 'sales', feedback: 'Good closing.', metrics: { closeProbability: 90 } },
      { agent: 'coach', feedback: 'Be nice.', metrics: {} },
      { agent: 'linguistics', feedback: 'A bit fast.', metrics: { fillerWords: 5, pace: 'Fast', rapportScore: 70 } },
      { agent: 'analyst', feedback: 'Save money.', metrics: {} }
    ];
    
    const result = aggregateAgentResponses(mockResponses, mockTranscript);
    
    expect(result.overallScore).toBe(80); // (90 + 70) / 2
    expect(result.actionPlan).toHaveLength(3);
    expect(result.actionPlan[0].title).toBe('Improve Closing');
    expect(result.linguisticStats.fillerWords).toBe(5);
  });

  it('should persist and retrieve reports using PGlite', async () => {
    const reportId = await createReport('user_test', 'SALES_REP', mockTranscript);
    expect(reportId).toBeDefined();
    expect(typeof reportId).toBe('string');

    const retrieved = await getReportById(reportId);
    console.log('Retrieved keys:', Object.keys(retrieved || {}));
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe('user_test');
    expect(retrieved?.transcript).toBe(mockTranscript);
    expect(Array.isArray(retrieved?.pros)).toBe(true);
    expect(retrieved?.overallScore).toBeGreaterThan(0);
    expect(retrieved?.actionPlan).toHaveLength(3);
  });
});

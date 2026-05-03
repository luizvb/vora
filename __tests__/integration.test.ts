import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAnalysis } from '../lib/langchain/graph';
import { aggregateAgentResponses } from '../lib/analysis';
import { runCoachTurn } from '../lib/coach/orchestrator';

const savedReports: Record<string, Record<string, unknown>> = {};

function tableMock(table: string) {
  if (table === 'coaching_sessions') {
    return {
      insert: vi.fn(async (row: Record<string, unknown>) => {
        savedReports[row.id as string] = {
          created_at: new Date().toISOString(),
          ...row,
        };
        return { error: null };
      }),
      select: vi.fn(() => ({
        eq: vi.fn((_column: string, id: string) => ({
          maybeSingle: vi.fn(async () => ({ data: savedReports[id] || null, error: null })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(async () => ({ data: Object.values(savedReports), error: null })),
        })),
      })),
    };
  }

  return {
    insert: vi.fn(async () => ({ error: null })),
  };
}

vi.mock('../lib/supabase', () => ({
  isE2EAuthEnabled: () => false,
  getSupabaseBrowserClient: () => ({
    from: tableMock,
    schema: () => ({ from: tableMock }),
  }),
}));

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

describe('CaaSy Integration Tests', () => {
  const mockTranscript = "Hello, I want to buy your product but it is too expensive.";

  beforeEach(() => {
    for (const key of Object.keys(savedReports)) delete savedReports[key];
  });

  it('should run the full supervisor analysis flow (mocked)', async () => {
    const responses = await runAnalysis(mockTranscript);
    
    expect(responses).toHaveLength(4);
    const agents = responses.map(r => r.agent);
    expect(agents).toContain('sales');
    expect(agents).toContain('coach');
    expect(agents).toContain('linguistics');
    expect(agents).toContain('analyst');
  });

  it('should run Coach Me as a chat turn without creating a report', async () => {
    const result = await runCoachTurn([
      { role: 'user', content: 'I need to ask a buyer for scope clarity without sounding defensive.' },
    ]);

    expect(result.reply).toContain('practical');
    expect(result.routedTo.length).toBeGreaterThan(0);
    expect(Object.keys(savedReports)).toHaveLength(0);
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

  it('should persist and retrieve reports using Supabase', async () => {
    const reportId = await createReport('00000000-0000-0000-0000-000000000001', 'SALES_REP', mockTranscript, {
      id: '11111111-1111-1111-1111-111111111111',
      sessionId: '22222222-2222-2222-2222-222222222222',
      overallScore: 82,
      pros: [{ quote: 'Clear next step', analysis: 'The seller created direction.' }],
      cons: [{ quote: 'Needs urgency', analysis: 'The buyer did not commit to timing.' }],
      linguisticStats: { fillerWords: 3, tone: 'Steady', talkTime: 52 },
      actionPlan: [
        { title: 'Clarify urgency', description: 'Ask what happens if nothing changes.', priority: 'high' },
      ],
      agentDetails: [],
    });
    expect(reportId).toBeDefined();
    expect(typeof reportId).toBe('string');

    const retrieved = await getReportById(reportId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe('00000000-0000-0000-0000-000000000001');
    expect(retrieved?.transcript).toBe(mockTranscript);
    expect(Array.isArray(retrieved?.pros)).toBe(true);
    expect(retrieved?.overallScore).toBeGreaterThan(0);
    expect(retrieved?.actionPlan).toHaveLength(1);
  });
});

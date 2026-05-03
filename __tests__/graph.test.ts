import { describe, it, expect } from 'vitest';
import { graph } from '../lib/langchain/graph';

// CaaSy Graph Test Suite (Analyzing Feature Flow)
// --------------------------------------------------
// This test validates that the supervisor and specialist agents 
// correctly route, analyze, and accumulate insights from a transcript.

describe('CaaSy Graph & Specialist Routing (Graph Analysis)', () => {
  const mockTranscript = "User: I need more value for the same price. Sales: Our ROI is higher.";

  it('should call all required specialists in a single analysis run', async () => {
    // Process.env override is already handled in vitest.setup.ts usually
    process.env.NEXT_PUBLIC_DEV_MODE = "true";
    
    const initialState = {
      transcript: mockTranscript,
      nextAgent: "supervisor",
      responses: [],
      messages: []
    };

    const finalState = await graph.invoke(initialState);
    
    // Check if each critical agent responded
    const agentNames = finalState.responses.map(r => r.agent);
    expect(agentNames).toContain('sales');
    expect(agentNames).toContain('coach');
    expect(agentNames).toContain('linguistics');
    expect(agentNames).toContain('analyst');
    expect(finalState.nextAgent).toBe('FINISH');
  });

  it('should correctly accumulate agent responses in state', async () => {
    const initialState = {
      transcript: mockTranscript,
      nextAgent: "supervisor",
      responses: [],
      messages: []
    };

    const finalState = await graph.invoke(initialState);
    expect(finalState.responses.length).toBe(4);
    
    // Validate response structure
    finalState.responses.forEach(r => {
      expect(r).toHaveProperty('agent');
      expect(r).toHaveProperty('feedback');
      expect(r).toHaveProperty('metrics');
    });
  });

  describe('Supervisor Decision Logic', () => {
    it('should complete analysis after all specialists have finished', async () => {
       const stateWithAllButOne = {
         transcript: mockTranscript,
         responses: [
           { agent: 'sales', feedback: 'X', metrics: {} },
           { agent: 'coach', feedback: 'Y', metrics: {} },
           { agent: 'linguistics', feedback: 'Z', metrics: {} },
           { agent: 'analyst', feedback: 'W', metrics: {} }
         ],
         nextAgent: 'supervisor',
         messages: []
       };
       
       const finalState = await graph.invoke(stateWithAllButOne);
       expect(finalState.nextAgent).toBe('FINISH');
    });
  });
});

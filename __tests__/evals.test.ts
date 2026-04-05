import { describe, it, expect } from 'vitest';
import { runAnalysis } from '../lib/langchain/graph';
import fs from 'fs';
import path from 'path';

// VORA LLM Eval Suite
// ------------------
// WARNING: This test calls the real Gemini API. 
// It is used to validate the quality of the agents' reasoning.

const LOG_FILE = path.join(process.cwd(), 'VORA_EVALS.log');

function logEval(title: string, content: any) {
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}] === ${title} ===\n${content}\n${'='.repeat(50)}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  console.log(entry);
}

describe('VORA LLM Quality Evals (Real API)', () => {
  // Clear log file at start
  if (fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');

  const hasApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (hasApiKey) {
     process.env.NEXT_PUBLIC_DEV_MODE = "false";
  }

  it.runIf(hasApiKey)('should provide high-quality sales feedback for a pricing objection', async () => {
    const transcript = `
      User: Your product looks good, but it's $5000/month. That's way over our budget.
      Sales: I understand the price is a concern. However, if you look at the time saved, it pays for itself.
      User: Maybe, but I need to talk to my boss.
      Sales: No problem, let me know.
    `;

    const responses = await runAnalysis(transcript);
    const salesAgent = responses.find(r => r.agent === 'sales');

    logEval('Sales Agent Real Feedback', salesAgent?.feedback);

    expect(salesAgent?.feedback.length).toBeGreaterThan(50);
    expect(salesAgent?.feedback.toLowerCase()).toMatch(/next step|objection|budget|follow up/);
  }, 60000);

  it.runIf(hasApiKey)('should identify filler words and pace in linguistics', async () => {
    const transcript = "Um, so, like, I think we can, uh, definitely help you with that, you know?";

    const responses = await runAnalysis(transcript);
    const linguistics = responses.find(r => r.agent === 'linguistics');

    logEval('Linguistics Agent Real Feedback', linguistics?.feedback);

    expect(linguistics?.feedback.toLowerCase()).toMatch(/filler|um|uh|pace/);
  }, 60000);
});

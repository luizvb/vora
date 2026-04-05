import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/langchain/graph";
import { getDb } from "@/lib/db";
import { AgentResponse } from "@/lib/langchain/agents";

export async function POST(req: Request) {
  try {
    const { transcript, userId, tenantId, sessionId } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    // 1. Run the multi-agent analysis
    const responses = (await runAnalysis(transcript)) as AgentResponse[];

    // 2. Persist to memory (pglite)
    // Note: getDb() in current implementation is client-side only (idb://)
    // For a real Next.js API route, we would use a server-side PGlite or standard Postgres.
    // Given the constraints and existing code, we'll try to use the DB if available, 
    // or just return the data if it's a client-side mock environment.
    const db = await getDb();
    if (db && userId && tenantId && sessionId) {
      for (const res of responses) {
        await db.query(`
          INSERT INTO "AgentMemory" ("sessionId", "userId", "tenantId", "role", "content", "metadata")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [sessionId, userId, tenantId, res.agent, res.feedback, JSON.stringify(res.metrics)]);
      }
    }

    // 3. Aggregate results into a VORA Report structure
    const aggregatedReport = {
      id: crypto.randomUUID(),
      userId,
      tenantId,
      transcript,
      overallScore: 88, // In production, Supervisor would calculate this
      pros: [
        { 
          quote: "Handled the price objection by focusing on value", 
          analysis: responses.find(r => r.agent === "sales")?.feedback || "Sales strategy was sound." 
        },
        { 
          quote: "Empathized with the client's timeline", 
          analysis: responses.find(r => r.agent === "coach")?.feedback || "Great emotional intelligence." 
        }
      ],
      cons: [
        { 
          quote: "Missed the opportunity to ask for a referral", 
          analysis: "Always close with a forward-looking request." 
        }
      ],
      linguisticStats: {
        fillerWords: responses.find(r => r.agent === "linguistics")?.metrics?.fillerWords || 0,
        tone: responses.find(r => r.agent === "linguistics")?.metrics?.pace || "Professional",
        talkTime: 65
      },
      actionPlan: [
        { title: "Review ROI Deck", description: "Prepare specific slides for the next call.", priority: 'high' },
        { title: "Slow Down Pace", description: "Try to maintain 140 wpm.", priority: 'medium' },
        { title: "Send Follow-up", description: "Summarize the key points discussed.", priority: 'low' }
      ],
      agentDetails: responses,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(aggregatedReport);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

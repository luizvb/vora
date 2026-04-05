import { getDb } from "./db";
import { AnalysisResult, simulateAnalysis } from "./analysis";
import { UserRole } from "@/app/context/UserContext";

export interface Report {
  id: string;
  userId: string;
  transcript: string;
  overallScore: number;
  pros: { quote: string; analysis: string }[];
  cons: { quote: string; analysis: string }[];
  linguisticStats: {
    fillerWords: number;
    tone: string;
    talkTime: number; // Percentage
  };
  actionPlan: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  createdAt: string;
}

export async function saveAgentMemory(sessionId: string, userId: string, tenantId: string, role: string, content: string, metadata?: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.query(`
    INSERT INTO "AgentMemory" ("sessionId", "userId", "tenantId", "role", "content", "metadata")
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [sessionId, userId, tenantId, role, content, JSON.stringify(metadata || {})]);
}

export async function createReport(userId: string, role: UserRole, transcript: string, analysisData?: any): Promise<string> {
  const db = await getDb();
  if (!db) return "mock-id-fallback";

  const analysis = analysisData || simulateAnalysis(transcript, role);
  const id = analysisData?.id || "rep_" + Math.random().toString(36).substring(2, 9);
  const tenantId = analysisData?.tenantId || 'tenant_default';
  const sessionId = analysisData?.sessionId || crypto.randomUUID();

  // Save individual agent details to AgentMemory if available
  if (analysisData?.agentDetails && Array.isArray(analysisData.agentDetails)) {
    for (const agentRes of analysisData.agentDetails) {
      await saveAgentMemory(
        sessionId,
        userId,
        tenantId,
        agentRes.agent,
        agentRes.feedback,
        agentRes.metrics
      );
    }
  }
  
  await db.query(`
    INSERT INTO "Report" ("id", "userId", "tenantId", "transcript", "overallScore", "pros", "cons", "linguisticStats", "actionPlan")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    id, 
    userId, 
    tenantId,
    transcript, 
    analysis.overallScore, 
    JSON.stringify(analysis.pros), 
    JSON.stringify(analysis.cons), 
    JSON.stringify(analysis.linguisticStats), 
    JSON.stringify(analysis.actionPlan)
  ]);

  return id;
}

export async function getReportById(id: string): Promise<Report | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.query('SELECT * FROM "Report" WHERE "id" = $1', [id]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    pros: typeof row.pros === 'string' ? JSON.parse(row.pros) : row.pros,
    cons: typeof row.cons === 'string' ? JSON.parse(row.cons) : row.cons,
    linguisticStats: typeof row.linguisticStats === 'string' ? JSON.parse(row.linguisticStats) : row.linguisticStats,
    actionPlan: typeof row.actionPlan === 'string' ? JSON.parse(row.actionPlan) : row.actionPlan,
  } as Report;
}

import { PGlite } from "@electric-sql/pglite";

let dbInstance: any = null;

export async function getDb() {
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') return null;
  
  if (!dbInstance) {
    const connectionString = process.env.NODE_ENV === 'test' ? "memory://" : "idb://vora-db";
    dbInstance = new PGlite(connectionString);
    // Initialize schema matching schema.prisma
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "role" TEXT DEFAULT 'SALES_REP',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Report" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "transcript" TEXT NOT NULL,
        "overallScore" INTEGER NOT NULL,
        "pros" JSONB NOT NULL,
        "cons" JSONB NOT NULL,
        "linguisticStats" JSONB NOT NULL,
        "actionPlan" JSONB NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "AgentMemory" (
        "id" SERIAL PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return dbInstance;
}

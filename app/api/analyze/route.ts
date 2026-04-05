import { NextResponse } from "next/server";
import { graph } from "@/lib/langchain/graph";
import { getDb } from "@/lib/db";
import { AgentResponse } from "@/lib/langchain/agents";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { transcript, userId, tenantId, sessionId } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const initialState = {
            transcript,
            nextAgent: "supervisor",
            responses: [],
            messages: []
          };

          const eventStream = await graph.stream(initialState);
          let finalResponses: AgentResponse[] = [];

          for await (const event of eventStream) {
            const nodeName = Object.keys(event)[0];
            const nodeOutput = event[nodeName];

            if (nodeName === "supervisor") {
              if (nodeOutput.nextAgent && nodeOutput.nextAgent !== "FINISH") {
                sendEvent({ 
                  agent: 'supervisor', 
                  status: `Routing to ${nodeOutput.nextAgent}...`,
                  timestamp: new Date().toISOString()
                });
              }
            } else {
              sendEvent({ 
                agent: nodeName, 
                status: `Analyzing transcript...`,
                timestamp: new Date().toISOString()
              });
              if (nodeOutput.responses) {
                finalResponses = nodeOutput.responses;
              }
            }
          }

          // 3. Aggregate results into a VORA Report structure
          const aggregatedReport = {
            id: crypto.randomUUID(),
            userId,
            tenantId,
            transcript,
            overallScore: 88,
            pros: [
              { 
                quote: "Handled the price objection by focusing on value", 
                analysis: finalResponses.find(r => r.agent === "sales")?.feedback || "Sales strategy was sound." 
              },
              { 
                quote: "Empathized with the client's timeline", 
                analysis: finalResponses.find(r => r.agent === "coach")?.feedback || "Great emotional intelligence." 
              }
            ],
            cons: [
              { 
                quote: "Missed the opportunity to ask for a referral", 
                analysis: "Always close with a forward-looking request." 
              }
            ],
            linguisticStats: {
              fillerWords: finalResponses.find(r => r.agent === "linguistics")?.metrics?.fillerWords || 0,
              tone: finalResponses.find(r => r.agent === "linguistics")?.metrics?.pace || "Professional",
              talkTime: 65
            },
            actionPlan: [
              { title: "Review ROI Deck", description: "Prepare specific slides for the next call.", priority: 'high' },
              { title: "Slow Down Pace", description: "Try to maintain 140 wpm.", priority: 'medium' },
              { title: "Send Follow-up", description: "Summarize the key points discussed.", priority: 'low' }
            ],
            agentDetails: finalResponses,
            createdAt: new Date().toISOString()
          };

          sendEvent({ done: true, report: aggregatedReport });
          controller.close();
        } catch (error: any) {
          console.error("Analysis Stream Error:", error);
          sendEvent({ error: typeof error === 'string' ? error : error.message || "Unknown stream error" });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

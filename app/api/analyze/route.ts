import { NextResponse } from "next/server";
import { graph } from "@/lib/langchain/graph";
import { aggregateAgentResponses } from "@/lib/analysis";
import { AgentResponse } from "@/lib/langchain/agents";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { transcript, userId, tenantId } = (await req.json()) as {
      transcript?: string;
      userId?: string;
      tenantId?: string;
    };

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
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
            const eventRecord = event as Record<string, { nextAgent?: string; responses?: AgentResponse[] }>;
            const nodeName = Object.keys(eventRecord)[0];
            const nodeOutput = eventRecord[nodeName];

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

          // 3. Aggregate results into a CaaSy report structure using the real data
          const analysis = aggregateAgentResponses(finalResponses, transcript);
          
          const aggregatedReport = {
            id: crypto.randomUUID(),
            userId,
            tenantId,
            transcript,
            ...analysis,
            agentDetails: finalResponses,
            createdAt: new Date().toISOString()
          };

          sendEvent({ done: true, report: aggregatedReport });
          controller.close();
        } catch (error: unknown) {
          console.error("Analysis Stream Error:", error);
          sendEvent({ error: getErrorMessage(error) });
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
  } catch (error: unknown) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unknown stream error";
}

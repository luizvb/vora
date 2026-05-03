import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel, MOCK_RESPONSES, isMockMode, AgentResponse } from "./agents";
import { 
  SUPERVISOR_PROMPT, 
  SALES_PROMPT, 
  COACH_PROMPT, 
  LINGUISTICS_PROMPT, 
  ANALYST_PROMPT 
} from "./prompts";
import { z } from "zod";

// Define the state schema
interface AgentState {
  transcript: string;
  nextAgent: string;
  responses: AgentResponse[];
  messages: BaseMessage[];
}

// Structured Output Schema for Supervisor
const routingSchema = z.object({
  nextAgent: z.enum(["sales", "coach", "linguistics", "analyst", "FINISH"]).describe("The next agent to call or FINISH if done.")
});

const specialistSchema = z.object({
  feedback: z.string().describe("Concise, actionable coaching feedback from this specialist."),
  metrics: z.object({
    closeProbability: z.number().optional(),
    missedAsks: z.number().optional(),
    rapportScore: z.number().optional(),
    listeningRatio: z.number().optional(),
    fillerWords: z.number().optional(),
    pace: z.string().optional(),
    valueStrength: z.number().optional(),
    pricingObjections: z.number().optional(),
  }).describe("Numeric and categorical metrics found by this specialist.")
});

// Supervisor Node: Decides who speaks next
const supervisorNode = async (state: AgentState) => {
  if (isMockMode()) {
    const agents = ["sales", "coach", "linguistics", "analyst"];
    const completed = state.responses.map(r => r.agent);
    const remaining = agents.filter(a => !completed.includes(a));
    
    if (remaining.length === 0) {
      return { nextAgent: "FINISH" };
    }
    return { nextAgent: remaining[0] };
  }

  const model = getModel().withStructuredOutput(routingSchema);
  const systemMessage = new SystemMessage(SUPERVISOR_PROMPT);
  const humanMessage = new HumanMessage(`Transcript: ${state.transcript}\n\nProcessed Agents: ${state.responses.map(r => r.agent).join(", ")}. Who should speak next?`);
  
  const response = await model.invoke([systemMessage, humanMessage]);
  return { nextAgent: response.nextAgent };
};

// Specialist Nodes
const createSpecialistNode = (agentName: string, prompt: string) => {
  return async (state: AgentState) => {
    if (isMockMode()) {
      return { 
        responses: [...state.responses, MOCK_RESPONSES[agentName]],
        nextAgent: "supervisor" 
      };
    }

    const model = getModel().withStructuredOutput(specialistSchema);
    const systemMessage = new SystemMessage(prompt);
    const humanMessage = new HumanMessage(
      `Analyze this transcript and return structured feedback plus metrics. Transcript: ${state.transcript}`
    );
    const response = await model.invoke([systemMessage, humanMessage]);

    const result: AgentResponse = {
      agent: agentName,
      feedback: response.feedback,
      metrics: normalizeMetrics(agentName, response.metrics)
    };

    return { 
      responses: [...state.responses, result],
      nextAgent: "supervisor" 
    };
  };
};

function normalizeMetrics(agentName: string, metrics: z.infer<typeof specialistSchema>["metrics"]) {
  if (agentName === "sales") {
    return {
      closeProbability: numberMetric(metrics.closeProbability, 65),
      missedAsks: numberMetric(metrics.missedAsks, 0),
      ...metrics,
    };
  }
  if (agentName === "linguistics") {
    return {
      fillerWords: numberMetric(metrics.fillerWords, 0),
      pace: stringMetric(metrics.pace, "Professional"),
      rapportScore: numberMetric(metrics.rapportScore, 80),
      ...metrics,
    };
  }
  if (agentName === "coach") {
    return {
      rapportScore: numberMetric(metrics.rapportScore, 80),
      listeningRatio: numberMetric(metrics.listeningRatio, 50),
      ...metrics,
    };
  }
  return metrics;
}

function numberMetric(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function stringMetric(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

// Build the graph
const builder = new StateGraph<AgentState>({
  channels: {
    transcript: { value: (a, b) => b, default: () => "" },
    nextAgent: { value: (a, b) => b, default: () => "supervisor" },
    responses: { value: (a, b) => b, default: () => [] },
    messages: { value: (a, b) => a.concat(b), default: () => [] }
  }
})
  .addNode("supervisor", supervisorNode)
  .addNode("sales", createSpecialistNode("sales", SALES_PROMPT))
  .addNode("coach", createSpecialistNode("coach", COACH_PROMPT))
  .addNode("linguistics", createSpecialistNode("linguistics", LINGUISTICS_PROMPT))
  .addNode("analyst", createSpecialistNode("analyst", ANALYST_PROMPT))
  .addEdge("sales", "supervisor")
  .addEdge("coach", "supervisor")
  .addEdge("linguistics", "supervisor")
  .addEdge("analyst", "supervisor")
  .addConditionalEdges("supervisor", (state) => {
    if (state.nextAgent === "FINISH") return END;
    return state.nextAgent;
  });

builder.setEntryPoint("supervisor");

export const graph = builder.compile();

export const runAnalysis = async (transcript: string): Promise<AgentResponse[]> => {
  const initialState: AgentState = {
    transcript,
    nextAgent: "supervisor",
    responses: [],
    messages: []
  };

  const finalState = (await graph.invoke({ ...initialState })) as unknown as AgentState;
  return finalState.responses;
};

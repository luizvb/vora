import { StateGraph, END } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel, MOCK_RESPONSES, isMockMode, AgentResponse } from "./agents";
import { 
  SUPERVISOR_PROMPT, 
  SALES_PROMPT, 
  COACH_PROMPT, 
  LINGUISTICS_PROMPT, 
  ANALYST_PROMPT 
} from "./prompts";

// Define the state schema
interface AgentState {
  transcript: string;
  nextAgent: string;
  responses: AgentResponse[];
  messages: BaseMessage[];
}

// Supervisor Node: Decides who speaks next
const supervisorNode = async (state: AgentState, config?: RunnableConfig) => {
  if (isMockMode()) {
    const agents = ["sales", "coach", "linguistics", "analyst"];
    const completed = state.responses.map(r => r.agent);
    const remaining = agents.filter(a => !completed.includes(a));
    
    if (remaining.length === 0) {
      return { nextAgent: "FINISH" };
    }
    return { nextAgent: remaining[0] };
  }

  const model = getModel();
  const systemMessage = new SystemMessage(SUPERVISOR_PROMPT);
  const humanMessage = new HumanMessage(`Transcript: ${state.transcript}\n\nProcessed Agents: ${state.responses.map(r => r.agent).join(", ")}. Who should speak next? Answer only with one word: sales, coach, linguistics, analyst, or FINISH.`);
  
  const response = await model.invoke([systemMessage, humanMessage]);
  const decision = (response.content as string).trim().toUpperCase();
  
  return { nextAgent: decision === "FINISH" ? "FINISH" : decision.toLowerCase() };
};

// Specialist Nodes
const createSpecialistNode = (agentName: string, prompt: string) => {
  return async (state: AgentState, config?: RunnableConfig) => {
    if (isMockMode()) {
      return { 
        responses: [...state.responses, MOCK_RESPONSES[agentName]],
        nextAgent: "supervisor" 
      };
    }

    const model = getModel();
    const systemMessage = new SystemMessage(prompt);
    const humanMessage = new HumanMessage(`Analyze this transcript: ${state.transcript}`);
    
    // We want structured output, but for now we'll keep it simple or use function calling
    // Gemini supports tool calling, but for this task I'll just parse the output or use simple schema
    const response = await model.invoke([systemMessage, humanMessage]);
    
    // Simple mock-like parsing for demonstration if not mock mode
    // In production, we'd use StructuredOutputParser or similar
    const result: AgentResponse = {
      agent: agentName,
      feedback: response.content as string,
      metrics: {} // LLM would normally populate this via tool calling
    };

    return { 
      responses: [...state.responses, result],
      nextAgent: "supervisor" 
    };
  };
};

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

export const runAnalysis = async (transcript: string) => {
  const initialState: AgentState = {
    transcript,
    nextAgent: "supervisor",
    responses: [],
    messages: []
  };

  const finalState = await graph.invoke(initialState);
  return finalState.responses;
};

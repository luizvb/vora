import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { getModel, isMockMode } from "@/lib/langchain/agents";
import { BASE_PROMPT, COACH_PROMPT, SALES_PROMPT, LINGUISTICS_PROMPT, ANALYST_PROMPT } from "@/lib/langchain/prompts";

export type CoachChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Specialist = "sales" | "coach" | "linguistics" | "analyst";

const supervisorSchema = z.object({
  answerDirectly: z.boolean().describe("True when the supervisor can answer without specialist support."),
  specialists: z.array(z.enum(["sales", "coach", "linguistics", "analyst"])).max(2).describe("Specialists to consult only when truly needed."),
  coachingResponse: z.string().describe("A concise WhatsApp-style coaching response when answerDirectly is true."),
  reason: z.string().describe("Short internal routing reason."),
});

const specialistSchema = z.object({
  feedback: z.string().describe("Concise coaching input for the supervisor."),
});

const synthesisSchema = z.object({
  coachingResponse: z.string().describe("Final WhatsApp-style coaching answer for the user."),
});

export async function runCoachTurn(messages: CoachChatMessage[]) {
  if (messages.length === 0) {
    throw new Error("At least one message is required.");
  }

  if (isMockMode()) {
    return mockCoachTurn(messages);
  }

  const transcript = formatMessages(messages);
  const supervisor = await getModel(0.2).withStructuredOutput(supervisorSchema).invoke([
    new SystemMessage(COACH_SUPERVISOR_PROMPT),
    new HumanMessage(`Conversation so far:\n${transcript}\n\nDecide whether to answer directly or consult specialists.`),
  ]);

  const specialists = supervisor.answerDirectly ? [] : uniqueSpecialists(supervisor.specialists);
  if (supervisor.answerDirectly || specialists.length === 0) {
    return {
      reply: supervisor.coachingResponse,
      routedTo: [] as Specialist[],
      reason: supervisor.reason,
    };
  }

  const specialistFeedback = await Promise.all(
    specialists.map(async (specialist) => {
      const feedback = await getModel(0).withStructuredOutput(specialistSchema).invoke([
        new SystemMessage(getSpecialistPrompt(specialist)),
        new HumanMessage(`Give only the coaching input needed for this chat turn. Conversation:\n${transcript}`),
      ]);

      return `${specialist}: ${feedback.feedback}`;
    })
  );

  const synthesis = await getModel(0.2).withStructuredOutput(synthesisSchema).invoke([
    new SystemMessage(COACH_SYNTHESIS_PROMPT),
    new HumanMessage(`Conversation:\n${transcript}\n\nSpecialist input:\n${specialistFeedback.join("\n")}`),
  ]);

  return {
    reply: synthesis.coachingResponse,
    routedTo: specialists,
    reason: supervisor.reason,
  };
}

function mockCoachTurn(messages: CoachChatMessage[]) {
  const lastMessage = messages.at(-1)?.content || "";
  const salesSignal = /price|buyer|deal|call|scope|close|objection|sales/i.test(lastMessage);
  const routedTo: Specialist[] = salesSignal ? ["sales", "coach"] : [];

  return {
    reply: salesSignal
      ? "Here is a practical way to handle it: name the business outcome first, ask one clear question, then confirm the next step. Keep the tone calm and specific."
      : "Start by naming the real tension in one sentence. Then choose the smallest next action you can take today and rehearse the words before the conversation.",
    routedTo,
    reason: salesSignal ? "Sales context detected." : "Direct coaching was enough for this turn.",
  };
}

function uniqueSpecialists(values: Specialist[]) {
  return Array.from(new Set(values)).slice(0, 2);
}

function formatMessages(messages: CoachChatMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "User" : "CaaSy"}: ${message.content}`)
    .join("\n");
}

function getSpecialistPrompt(specialist: Specialist) {
  if (specialist === "sales") return SALES_PROMPT;
  if (specialist === "linguistics") return LINGUISTICS_PROMPT;
  if (specialist === "analyst") return ANALYST_PROMPT;
  return COACH_PROMPT;
}

const COACH_SUPERVISOR_PROMPT = `${BASE_PROMPT}
You are the CaaSy Coach Me supervisor.
This is a live chat, not a report.
Your job is to help the user in a short, practical WhatsApp-style coaching exchange.

Routing rules:
- Answer directly whenever the user needs general personal coaching, confidence, framing, decision prep, or emotional clarity.
- Consult Sales only for sales calls, buyers, deals, objections, negotiation, closing, discovery, or pipeline context.
- Consult Linguistics only when the user asks for wording, tone, phrasing, pace, clarity, or communication style.
- Consult Analyst only when the user asks about business impact, ROI, strategic tradeoffs, or stakeholder value.
- Consult Coach only when the user needs deeper behavior, confidence, empathy, or personal development support.
- Use at most two specialists.
- Do not create a report.
- Do not mention agents, routing, or internal process to the user.`;

const COACH_SYNTHESIS_PROMPT = `${BASE_PROMPT}
You are CaaSy in a private coaching chat.
Synthesize specialist input into one concise reply.
Write like a helpful coach in a chat app:
- 2 to 5 short paragraphs or bullets.
- Give specific language the user can use.
- End with one practical next step.
- Do not mention agents, routing, or reports.`;

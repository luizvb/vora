import { NextResponse } from "next/server";
import { runCoachTurn, type CoachChatMessage } from "@/lib/coach/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages?: CoachChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }

    const validMessages = messages.filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim()
    );

    if (validMessages.length === 0) {
      return NextResponse.json({ error: "At least one non-empty message is required." }, { status: 400 });
    }

    const result = await runCoachTurn(validMessages.slice(-12));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Coach Me Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "The coaching chat failed.";
}

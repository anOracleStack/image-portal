import { NextRequest, NextResponse } from "next/server";
import { helpAssistantReply, type ChatTurn } from "@/lib/assistant";

export async function POST(req: NextRequest) {
  let body: { message?: string; history?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const reply = await helpAssistantReply(message, history);

  return NextResponse.json({
    reply,
    llm: Boolean(process.env.OPENAI_API_KEY?.trim()),
  });
}

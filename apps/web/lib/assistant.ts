import type { EnhanceOptions } from "@ip/vision";
import {
  helpReplyFallback,
  workshopReplyFallback,
  type ChatTurn,
  type WorkshopReply,
} from "@/lib/assistant-fallback";

export type { ChatTurn, WorkshopReply };
export { helpReplyFallback, workshopReplyFallback };

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type OpenAIMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

async function openaiChat(
  system: string,
  messages: ChatTurn[],
  visionImageBase64?: string,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const apiMessages: OpenAIMessage[] = [{ role: "system", content: system }];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    const isLastUser =
      i === messages.length - 1 &&
      m.role === "user" &&
      Boolean(visionImageBase64);
    if (isLastUser && visionImageBase64) {
      apiMessages.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${visionImageBase64}` },
          },
        ],
      });
    } else {
      apiMessages.push({ role: m.role, content: m.content });
    }
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      max_tokens: 500,
      messages: apiMessages,
    }),
  });

  if (!res.ok) {
    console.error("[assistant] OpenAI error", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

const HELP_SYSTEM = `You are the RQ Plus (Image Portal) help assistant on rub.pub.
Answer briefly (2–4 sentences). Topics: creating portals, casual destination URLs (we add https://), workshop upload/approve flow, rub.pub/scan for viewers, gallery privacy, pricing, exports.
Use & not "and" when listing items. Never ask for passwords or API keys. If unsure, suggest Dashboard → Create Portal or /pricing.`;

export async function helpAssistantReply(
  input: string,
  history: ChatTurn[] = [],
): Promise<string> {
  const recent = history.slice(-8);
  const llm = await openaiChat(HELP_SYSTEM, [
    ...recent,
    { role: "user", content: input },
  ]);
  return llm ?? helpReplyFallback(input);
}

const WORKSHOP_SYSTEM = `You help creators refine an enhanced image preview in RQ Plus workshop chat.
Respond with JSON only (no markdown): {"reply":"string","adjust":{...} or null,"wantsApprove":boolean}
adjust keys (optional, numbers): brightness (0.7-1.3), sharpness (0.5-2.5), contrast (0.8-1.3), maxEdge (1280|1920|2560).
Set wantsApprove true when user says approve/go live/looks good.
If no references yet, reply asking them to upload first and omit adjust.
When a reference image is attached, describe what you see and give specific creative feedback.
Apply adjust when they want visual changes; opinions only when they ask for critique.`;

function parseWorkshopJson(raw: string): WorkshopReply | null {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonBlock) return null;
  try {
    const parsed = JSON.parse(jsonBlock[0]) as {
      reply?: string;
      adjust?: EnhanceOptions;
      wantsApprove?: boolean;
    };
    if (!parsed.reply) return null;
    const adjust = parsed.adjust;
    const cleanAdjust: EnhanceOptions | undefined =
      adjust && Object.keys(adjust).length > 0 ? adjust : undefined;
    return {
      reply: parsed.reply,
      adjust: cleanAdjust,
      wantsApprove: Boolean(parsed.wantsApprove),
    };
  } catch {
    return null;
  }
}

export type WorkshopAssistantOpts = {
  /** JPEG base64 (no data: prefix) for optional vision when OPENAI_API_KEY is set */
  referenceImageBase64?: string;
};

export async function workshopAssistantReply(
  message: string,
  refCount: number,
  history: ChatTurn[] = [],
  opts: WorkshopAssistantOpts = {},
): Promise<WorkshopReply> {
  if (!hasOpenAI()) return workshopReplyFallback(message, refCount);

  const recent = history.slice(-6).map((t) => ({
    role: t.role,
    content: t.content,
  }));

  const llm = await openaiChat(
    WORKSHOP_SYSTEM,
    [
      ...recent,
      {
        role: "user",
        content: `References on file: ${refCount}. User message: ${message}`,
      },
    ],
    opts.referenceImageBase64,
  );

  if (!llm) return workshopReplyFallback(message, refCount);

  const parsed = parseWorkshopJson(llm);
  if (parsed) {
    if (refCount === 0 && parsed.adjust) {
      return workshopReplyFallback(message, refCount);
    }
    return parsed;
  }

  return { reply: llm };
}

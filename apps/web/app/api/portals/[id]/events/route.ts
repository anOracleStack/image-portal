import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const stream = new ReadableStream({
    start(controller) {
      let running = true;

      (async function poll() {
        while (running) {
          try {
            const db = createAdminClient();
            const { data, error } = await db
              .from("scan_events")
              .select("created_at", { count: "exact", head: true })
              .eq("portal_id", id);

            const count = error ? 0 : (data?.length ?? 0);
            const newest = (data?.[0] as { created_at?: string } | undefined)?.created_at ?? new Date().toISOString();

            const payload = `data: ${JSON.stringify({ count, newest })}\n\n`;
            controller.enqueue(new TextEncoder().encode(payload));
          } catch {
            // keep polling
          }

          await new Promise((r) => setTimeout(r, 5000));
        }
      })();

      return () => {
        running = false;
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

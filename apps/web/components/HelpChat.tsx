"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { helpReplyFallback } from "@/lib/assistant-fallback";

type ChatMessage = { role: "user" | "assistant"; content: string };

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I'm the RQ Plus help assistant. Ask about creating portals, uploading images, scanning, gallery privacy, or pricing.",
};

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, busy]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/help/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(0, -1),
        }),
      });
      const data = await res.json();
      const reply =
        res.ok && data.reply
          ? String(data.reply)
          : helpReplyFallback(text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: helpReplyFallback(text) },
      ]);
    } finally {
      setBusy(false);
    }
  }, [busy, input, messages]);

  return (
    <div className="ip-help-chat">
      {open && (
        <div className="ip-help-chat-panel" role="dialog" aria-label="Help chat">
          <div className="ip-help-chat-header">
            <strong>Help</strong>
            <button
              type="button"
              className="ip-btn ip-btn-ghost ip-btn-sm"
              onClick={() => setOpen(false)}
              aria-label="Close help"
            >
              Close
            </button>
          </div>
          <div className="ip-help-chat-log">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`ip-help-chat-bubble ip-help-chat-${msg.role}`}
              >
                {msg.content}
              </div>
            ))}
            {busy && (
              <div className="ip-help-chat-bubble ip-help-chat-assistant ip-muted">
                Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            className="ip-help-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              className="ip-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Help question"
              disabled={busy}
            />
            <button
              type="submit"
              className="ip-btn ip-btn-secondary ip-btn-sm"
              disabled={!input.trim() || busy}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ip-help-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close help chat" : "Open help chat"}
      >
        {open ? "×" : "?"}
      </button>
    </div>
  );
}

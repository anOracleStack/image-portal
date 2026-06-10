"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { helpReplyFallback } from "@/lib/assistant-fallback";

type ChatMessage = { role: "user" | "assistant"; content: string };

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I'm the RQ Plus help assistant. Ask about creating portals, uploading images, scanning, gallery privacy, or pricing.",
};

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface HelpChatProps {
  embedded?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function HelpChat({
  embedded = false,
  open: controlledOpen,
  onOpenChange,
}: HelpChatProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    setMicSupported(getSpeechRecognition() !== null);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, busy]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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

  const toggleMic = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [listening]);

  const rootClass = embedded
    ? `ip-help-chat ip-help-chat-embedded${open ? " ip-help-chat-open" : ""}`
    : "ip-help-chat";

  return (
    <div className={rootClass}>
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
            <button
              type="button"
              className={`ip-btn ip-btn-ghost ip-btn-sm ip-help-chat-mic${listening ? " ip-help-chat-mic-active" : ""}`}
              onClick={toggleMic}
              disabled={!micSupported || busy}
              aria-label={listening ? "Stop listening" : "Voice input"}
              title={
                micSupported
                  ? listening
                    ? "Stop listening"
                    : "Voice input"
                  : "Voice input not supported in this browser"
              }
            >
              {listening ? "◉" : "🎤"}
            </button>
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

      {!embedded && (
        <button
          type="button"
          className="ip-help-chat-fab"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close help chat" : "Open help chat"}
        >
          {open ? "×" : "?"}
        </button>
      )}
    </div>
  );
}

export function HelpChatFooterToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="ip-dash-footer-help-btn"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Close help" : "Open help"}
    >
      <span className="ip-dash-footer-help-icon" aria-hidden>
        ?
      </span>
      <span>Help</span>
    </button>
  );
}

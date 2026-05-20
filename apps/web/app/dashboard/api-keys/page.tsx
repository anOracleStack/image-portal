"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient_ } from "@/lib/supabase-browser";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const generateKey = async () => {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName || "default" }),
    });
    const data = await res.json();
    if (data.key) {
      setNewKey(data.key);
      setKeyName("");
      await fetchKeys();
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    await fetchKeys();
  };

  const dismissNewKey = () => setNewKey(null);

  const s = {
    page: { color: "#ededed" },
    heading: {
      fontSize: "1.5rem",
      fontWeight: 700,
      margin: "0 0 1.5rem",
    },
    section: {
      background: "#141414",
      border: "1px solid #222",
      borderRadius: 12,
      padding: "1.5rem",
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      fontSize: "0.85rem",
      color: "#888",
      marginBottom: 6,
    },
    inputRow: {
      display: "flex",
      gap: 8,
    },
    input: {
      flex: 1,
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #333",
      background: "#0a0a0a",
      color: "#ededed",
      fontSize: "0.9rem",
      outline: "none",
    },
    btn: (bg: string, fg = "#ededed") => ({
      background: bg,
      border: "none",
      borderRadius: 8,
      padding: "10px 18px",
      fontSize: "0.85rem",
      fontWeight: 600,
      color: fg,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
    }),
    newKeyBox: {
      background: "#0d2818",
      border: "1px solid #22c55e",
      borderRadius: 10,
      padding: "16px",
      marginBottom: "1.5rem",
    },
    newKeyLabel: { fontSize: "0.82rem", color: "#22c55e", marginBottom: 8 },
    keyValue: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#ededed",
      wordBreak: "break-all" as const,
      fontFamily: "monospace",
      marginBottom: 8,
    },
    keyWarning: {
      fontSize: "0.78rem",
      color: "#facc15",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
    },
    th: {
      textAlign: "left" as const,
      padding: "10px 8px",
      fontSize: "0.82rem",
      color: "#888",
      borderBottom: "1px solid #222",
    },
    td: {
      padding: "10px 8px",
      fontSize: "0.85rem",
      borderBottom: "1px solid #1a1a1a",
      color: "#ccc",
    },
    empty: {
      textAlign: "center" as const,
      padding: "2rem",
      color: "#666",
    },
    prefix: {
      fontFamily: "monospace",
      color: "#7df",
    },
    revokeBtn: {
      background: "none",
      border: "1px solid #5a1a1a",
      borderRadius: 6,
      padding: "4px 10px",
      fontSize: "0.78rem",
      color: "#ef4444",
      cursor: "pointer",
    },
  };

  return (
    <div style={s.page}>
      <h1 style={s.heading}>API Keys</h1>

      {newKey && (
        <div style={s.newKeyBox}>
          <div style={s.newKeyLabel}>Your new API key (shown once)</div>
          <div style={s.keyValue}>{newKey}</div>
          <div style={s.keyWarning}>
            Save this key — you will not be able to see it again.
          </div>
          <button
            style={{
              ...s.btn("#1a5a1a"),
              marginTop: 10,
            }}
            onClick={dismissNewKey}
          >
            I&apos;ve saved it
          </button>
        </div>
      )}

      <div style={s.section}>
        <label style={s.label}>Key name (optional)</label>
        <div style={s.inputRow}>
          <input
            style={s.input}
            type="text"
            placeholder="e.g. CI pipeline"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
          <button
            style={s.btn("#7df", "#0a0a0a")}
            onClick={generateKey}
          >
            Generate Key
          </button>
        </div>
      </div>

      <div style={s.section}>
        {loading ? (
          <div style={s.empty}>Loading...</div>
        ) : keys.length === 0 ? (
          <div style={s.empty}>No API keys yet</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Name</th>
                <th style={s.th}>Prefix</th>
                <th style={s.th}>Last used</th>
                <th style={s.th}>Created</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td style={s.td}>{k.name}</td>
                  <td style={s.td}>
                    <span style={s.prefix}>{k.key_prefix}...</span>
                  </td>
                  <td style={s.td}>{timeAgo(k.last_used_at)}</td>
                  <td style={s.td}>{timeAgo(k.created_at)}</td>
                  <td style={s.td}>
                    <button
                      style={s.revokeBtn}
                      onClick={() => revokeKey(k.id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

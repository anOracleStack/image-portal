"use client";

import { useEffect, useState, useCallback } from "react";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

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

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageIntro
        title="API Keys"
        lines={[
          "Generate keys for CI,",
          "integrations, & automation.",
        ]}
      />

      {newKey && (
        <div className="ip-key-reveal">
          <BalancedText
            className="ip-text-block"
            style={{ color: "var(--success)", fontSize: "0.82rem", marginBottom: 8 }}
            lines={["Your new API key", "(shown once)"]}
          />
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              wordBreak: "break-all",
              fontFamily: "monospace",
              marginBottom: 8,
            }}
          >
            {newKey}
          </div>
          <BalancedText
            className="ip-faint ip-text-block"
            style={{ fontSize: "0.78rem", color: "var(--warning, #facc15)" }}
            lines={[
              "Save this key —",
              "you will not see it again.",
            ]}
          />
          <button
            type="button"
            className="ip-btn ip-btn-primary"
            style={{ marginTop: 10 }}
            onClick={dismissNewKey}
          >
            I&apos;ve saved it
          </button>
        </div>
      )}

      <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
        <label className="ip-label" style={{ display: "block", marginBottom: 6 }}>
          Key name (optional)
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="ip-input"
            type="text"
            placeholder="e.g. CI pipeline"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            style={{ flex: "1 1 200px" }}
          />
          <button type="button" className="ip-btn ip-btn-primary" onClick={generateKey}>
            Generate Key
          </button>
        </div>
      </div>

      <div className="ip-card ip-table-scroll">
        {loading ? (
          <div className="ip-empty-state" style={{ padding: "2rem" }}>
            <BalancedText className="ip-muted ip-text-block" lines={["Loading…"]} />
          </div>
        ) : keys.length === 0 ? (
          <div className="ip-empty-state" style={{ padding: "2rem" }}>
            <BalancedText className="ip-muted ip-text-block" lines={["No API keys yet."]} />
          </div>
        ) : (
          <table className="ip-data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Last used</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td>
                    <span className="ip-mono" style={{ color: "var(--accent)" }}>
                      {k.key_prefix}...
                    </span>
                  </td>
                  <td>{timeAgo(k.last_used_at)}</td>
                  <td>{timeAgo(k.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="ip-btn ip-btn-ghost"
                      style={{
                        borderColor: "var(--danger)",
                        color: "var(--danger)",
                        padding: "4px 10px",
                        fontSize: "0.78rem",
                      }}
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

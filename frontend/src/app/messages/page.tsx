"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { ConversationSummary, Message } from "@/lib/types";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function refreshConversations() {
    return api.get<ConversationSummary[]>("/messaging/conversations").then(setConversations);
  }

  useEffect(() => {
    refreshConversations().finally(() => setLoading(false));
    const interval = setInterval(refreshConversations, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-xl font-bold text-petrole-800 sm:text-2xl">Messages</h1>

      <div className="flex flex-col gap-4 sm:flex-row" style={{ minHeight: "60vh" }}>
        <div className="w-full shrink-0 border border-petrole-200 bg-white sm:w-56 lg:w-64">
          {loading && <p className="px-4 py-6 text-sm text-petrole-500">Chargement…</p>}
          {!loading && conversations.length === 0 && (
            <p className="px-4 py-6 text-sm text-petrole-500">
              Aucune conversation pour l'instant — un locataire doit envoyer un premier message depuis son espace.
            </p>
          )}
          {conversations.map((c) => (
            <button
              key={c.tenantId}
              onClick={() => setSelectedTenantId(c.tenantId)}
              className={`block w-full border-b border-petrole-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-fond ${
                selectedTenantId === c.tenantId ? "bg-fond" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-petrole-800">{c.tenantName}</span>
                {c.unreadCount > 0 && (
                  <span className="rounded-full bg-or-400 px-2 py-0.5 text-xs text-white">{c.unreadCount}</span>
                )}
              </div>
              <p className="truncate text-xs text-petrole-500">{c.propertyName}</p>
              {c.lastMessage && <p className="truncate text-xs text-petrole-400">{c.lastMessage}</p>}
            </button>
          ))}
        </div>

        <div className="min-h-64 flex-1 border border-petrole-200 bg-white">
          {selectedTenantId ? (
            <ConversationThread tenantId={selectedTenantId} onSent={refreshConversations} />
          ) : (
            <p className="px-4 py-6 text-sm text-petrole-500">Sélectionnez une conversation.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ConversationThread({ tenantId, onSent }: { tenantId: string; onSent: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function refresh() {
    return api.get<Message[]>(`/messaging/conversations/${tenantId}/messages`).then(setMessages);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setSending(true);
    try {
      await api.post(`/messaging/conversations/${tenantId}/messages`, { body });
      setBody("");
      await refresh();
      onSent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer ce message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "50vh" }}>
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[75%] ${m.senderRole === "TENANT" ? "" : "ml-auto"}`}>
            <div className={`px-3 py-2 text-sm ${m.senderRole === "TENANT" ? "bg-fond text-petrole-800" : "bg-petrole-700 text-white"}`}>
              {m.body}
            </div>
            <p className={`mt-1 text-xs text-petrole-400 ${m.senderRole === "TENANT" ? "" : "text-right"}`}>
              {new Date(m.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-xs text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-3 border-t border-petrole-100 p-4">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-petrole-700 px-4 py-2 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60"
        >
          {sending ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

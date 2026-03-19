"use client";

// =============================================================================
// ChatWidget — General community chat
// Only visible when ≥10 members online (polled via presence API)
// Uses SSE (EventSource) when available; falls back to 10s polling on Vercel.
// SSE endpoint: /api/communities/[id]/chat/stream?token=<jwt>
// =============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { MessageCircle, Send, X, Minimize2, ChevronDown } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

const CHAT_MIN_ONLINE = 10;
const POLL_INTERVAL_MS = 10000; // fallback polling interval
const PRESENCE_INTERVAL_MS = 60000;

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
}

interface ChatWidgetProps {
  communityId: string;
  spaceId?: string;
  label?: string;
}

export function ChatWidget({ communityId, spaceId, label = "Chat Geral" }: ChatWidgetProps) {
  const [online, setOnline] = useState(0);
  const [chatVisible, setChatVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  const myUserId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // ── Presence ping ────────────────────────────────────────────────────────────
  const ping = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/presence`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        setOnline(d.data.onlineCount);
        setChatVisible(d.data.onlineCount >= CHAT_MIN_ONLINE);
      }
    } catch { /* ignore */ }
  }, [communityId, token]);

  // ── Polling fallback (used when SSE is unavailable or times out) ─────────────
  const fetchMessages = useCallback(async () => {
    if (!chatVisible || !open) return;
    try {
      const url = spaceId
        ? `/api/communities/${communityId}/chat?spaceId=${spaceId}`
        : `/api/communities/${communityId}/chat`;
      const res = await fetch(url, { headers });
      const d = await res.json();
      if (d.success) setMessages(d.data);
    } catch { /* ignore */ }
  }, [communityId, chatVisible, open, headers, spaceId]);

  // ── Presence interval ────────────────────────────────────────────────────────
  useEffect(() => {
    ping();
    const id = setInterval(ping, PRESENCE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [ping]);

  // ── SSE connection (with polling fallback) ───────────────────────────────────
  useEffect(() => {
    if (!chatVisible || !open || !token) return;

    let pollFallback: ReturnType<typeof setInterval> | null = null;
    let usingSse = false;

    // Try SSE first
    if (typeof EventSource !== "undefined") {
      const sseParams = new URLSearchParams({ token });
      if (spaceId) sseParams.set("spaceId", spaceId);
      const url = `/api/communities/${communityId}/chat/stream?${sseParams}`;

      const es = new EventSource(url);
      esRef.current = es;
      usingSse = true;

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data) as {
            type: "init" | "messages";
            messages: ChatMessage[];
          };
          if (data.type === "init") {
            setMessages(data.messages);
          } else if (data.type === "messages") {
            setMessages((prev) => {
              const ids = new Set(prev.map((m) => m.id));
              const fresh = data.messages.filter((m) => !ids.has(m.id));
              return [...prev, ...fresh];
            });
          }
        } catch { /* ignore malformed event */ }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        usingSse = false;
        // Fall back to polling
        fetchMessages();
        pollFallback = setInterval(fetchMessages, POLL_INTERVAL_MS);
      };
    } else {
      // Browser doesn't support EventSource — use polling
      fetchMessages();
      pollFallback = setInterval(fetchMessages, POLL_INTERVAL_MS);
    }

    return () => {
      if (usingSse && esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (pollFallback) clearInterval(pollFallback);
    };
  }, [chatVisible, open, token, communityId, spaceId, fetchMessages]);

  // ── Auto-scroll on new messages ───────────────────────────────────────────────
  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !token) return;
    setSending(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: input.trim(), ...(spaceId ? { spaceId } : {}) }),
      });
      const d = await res.json();
      if (d.success) {
        setMessages((prev) => [...prev, d.data]);
        setInput("");
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  if (!chatVisible) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white px-4 py-3 rounded-2xl shadow-2xl transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-semibold">{label}</span>
        <span className="bg-white/20 text-xs font-bold px-1.5 py-0.5 rounded-full">
          {online}
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 bg-[#1E1E1E] border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all duration-200 ${minimized ? "h-14" : "h-96"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
        <span className="text-sm font-semibold text-[#EEE6E4] flex-1">{label}</span>
        <span className="text-xs text-gray-400">{online} online</span>
        <button onClick={() => setMinimized((v) => !v)} className="text-gray-400 hover:text-[#EEE6E4] transition-colors p-0.5 ml-1">
          {minimized ? <ChevronDown className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-[#EEE6E4] transition-colors p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Seja o primeiro a falar!</p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user?.id === myUserId;
                const name = msg.user ? `${msg.user.firstName} ${msg.user.lastName}` : "Anônimo";
                const initials = msg.user ? `${msg.user.firstName[0] ?? ""}${msg.user.lastName[0] ?? ""}`.toUpperCase() : "?";
                return (
                  <div key={msg.id} className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    {msg.user?.avatarUrl ? (
                      <Image src={msg.user.avatarUrl} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMe ? "items-end" : ""}`}>
                      {!isMe && <span className="text-[10px] text-gray-500 font-medium">{msg.user?.firstName}</span>}
                      <div className={`text-xs rounded-xl px-3 py-1.5 leading-relaxed ${isMe ? "bg-[#006079] text-white" : "bg-white/10 text-[#EEE6E4]"}`}>
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 border-t border-white/10 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mensagem..."
              maxLength={500}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:border-[#009CD9]/40 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-8 h-8 bg-[#006079] hover:bg-[#007A99] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

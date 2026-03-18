"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { MessageSquare, Send, ArrowLeft, Search, User, PenSquare, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface ConversationParticipant {
  userId: string;
  user: Participant;
}

interface DirectMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: Participant;
}

interface Conversation {
  id: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages: DirectMessage[]; // last message preview
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (diff < 86_400_000) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getInitials(u: Participant) {
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
}

function otherParticipant(conv: Conversation, myId: string): Participant {
  return (
    conv.participants.find((p) => p.userId !== myId)?.user ??
    conv.participants[0].user
  );
}

function Avatar({ user, size = "md" }: { user: Participant; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.firstName}
        width={40}
        height={40}
        className={`${sz} rounded-xl object-cover flex-shrink-0 border border-gray-200`}
      />
    );
  }
  return (
    <div
      className={`${sz} bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {getInitials(user)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export default function MessagesPage() {
  const [myId, setMyId] = useState("");
  const [token, setToken] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New conversation modal state
  const [showNewConv, setShowNewConv] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [creatingConv, setCreatingConv] = useState(false);
  const userSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load auth
  useEffect(() => {
    const t = localStorage.getItem("detailhub_access_token") ?? "";
    const id = localStorage.getItem("detailhub_user_id") ?? "";
    setToken(t);
    setMyId(id);
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setConversations(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadConversations();
  }, [token, loadConversations]);

  // Load messages for selected conversation
  const loadMessages = useCallback(
    async (convId: string) => {
      setMsgLoading(true);
      try {
        const res = await fetch(`/api/conversations/${convId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setMessages(data.data ?? []);
      } finally {
        setMsgLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);

    // Poll for new messages every 5s
    pollRef.current = setInterval(() => loadMessages(selected.id), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selected, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (conv: Conversation) => {
    setSelected(conv);
    setMessages([]);
    setDraft("");
  };

  const sendMessage = async () => {
    if (!draft.trim() || !selected || sending) return;
    setSending(true);
    const body = draft.trim();
    setDraft("");
    try {
      const res = await fetch(`/api/conversations/${selected.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        // Refresh conversation list to update last message
        loadConversations();
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filtered = conversations.filter((conv) => {
    if (!search) return true;
    const other = otherParticipant(conv, myId);
    return `${other.firstName} ${other.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  // Debounced user search
  const handleUserSearch = (q: string) => {
    setUserSearch(q);
    if (userSearchRef.current) clearTimeout(userSearchRef.current);
    if (!q.trim()) { setUserResults([]); return; }
    userSearchRef.current = setTimeout(async () => {
      setUserSearching(true);
      try {
        const res = await fetch(`/api/search?type=users&q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUserResults(data.data ?? []);
      } finally {
        setUserSearching(false);
      }
    }, 300);
  };

  const startConversation = async (participantId: string) => {
    setCreatingConv(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewConv(false);
        setUserSearch("");
        setUserResults([]);
        await loadConversations();
        setSelected(data.data);
      }
    } finally {
      setCreatingConv(false);
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Sessão expirada. Faça login novamente.
      </div>
    );
  }

  return (
    <>
    <div className="h-[calc(100vh-8rem)] flex gap-0 rounded-2xl overflow-hidden border border-gray-200 bg-[#F0EEFF]">
      {/* ── Conversation list ── */}
      <div
        className={`${
          selected ? "hidden md:flex" : "flex"
        } flex-col w-full md:w-72 border-r border-gray-200 flex-shrink-0`}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-[#009CD9]" />
          <h1 className="text-gray-900 font-semibold text-sm flex-1">Mensagens</h1>
          <button
            onClick={() => setShowNewConv(true)}
            className="p-1.5 text-gray-500 hover:text-[#006079] hover:bg-[#006079]/10 rounded-lg transition-colors"
            title="Nova conversa"
          >
            <PenSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa…"
              className="bg-transparent text-sm text-gray-900 placeholder-gray-600 outline-none flex-1 min-w-0"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-50 rounded w-24" />
                    <div className="h-2.5 bg-gray-50 rounded w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <div className="w-14 h-14 bg-[#007A99]/10 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-[#009CD9]" />
              </div>
              <p className="text-gray-400 text-sm">Nenhuma conversa ainda</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const other = otherParticipant(conv, myId);
              const lastMsg = conv.messages[0];
              const isActive = selected?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-[#006079]/15 border-r-2 border-[#007A99]"
                      : "hover:bg-[#006079]/10"
                  }`}
                >
                  <Avatar user={other} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {other.firstName} {other.lastName}
                      </span>
                      {lastMsg && (
                        <span className="text-[11px] text-gray-600 flex-shrink-0">
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {lastMsg.senderId === myId ? "Você: " : ""}
                        {lastMsg.body}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Message thread ── */}
      <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 bg-[#007A99]/10 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[#009CD9]" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold">Selecione uma conversa</p>
              <p className="text-gray-500 text-sm mt-1">
                Escolha uma conversa à esquerda para começar
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
              <button
                className="md:hidden text-gray-400 hover:text-gray-900 transition-colors p-1"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar user={otherParticipant(selected, myId)} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {otherParticipant(selected, myId).firstName}{" "}
                  {otherParticipant(selected, myId).lastName}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#007A99] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <User className="w-10 h-10 text-gray-700" />
                  <p className="text-gray-500 text-sm">
                    Início da conversa — diga olá!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === myId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!isMine && <Avatar user={msg.sender} size="sm" />}
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? "bg-[#006079] text-white rounded-tr-sm"
                            : "bg-gray-50 text-gray-100 rounded-tl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-[#009CD9]" : "text-gray-500"
                          } text-right`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem… (Enter para enviar)"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-600 outline-none resize-none max-h-32 py-1"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                  className="w-8 h-8 bg-[#006079] hover:bg-[#007A99] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {sending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-gray-900" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* New Conversation Modal */}
    {showNewConv && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNewConv(false)} />
        <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Nova conversa</h2>
            <button onClick={() => setShowNewConv(false)} className="text-gray-400 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                placeholder="Buscar usuário por nome..."
                className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none flex-1"
              />
              {userSearching && (
                <div className="w-3.5 h-3.5 border-2 border-[#007A99] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {userResults.length === 0 && userSearch.trim() && !userSearching && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum usuário encontrado</p>
              )}
              {userResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startConversation(u.id)}
                  disabled={creatingConv}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#006079]/10 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

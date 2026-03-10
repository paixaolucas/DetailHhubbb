"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Zap, Car, Wrench, Gauge } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Como fazer o diagnóstico OBD2 em casa?",
  "Quais são os sintomas de correia dentada gasta?",
  "Como calcular a potência de um motor turbo?",
  "Dicas para setup de suspensão para pista",
  "Diferença entre óleo 5W30 e 5W40",
  "Como montar uma comunidade automotiva?",
];

export default function AutoAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const userMsg: Message = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: nextMessages, sessionId }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Erro: ${data.error ?? "Falha ao obter resposta"}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro de conexão. Tente novamente." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 7rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Auto AI
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
              Especializado em Automóveis
            </span>
          </h1>
          <p className="text-gray-400 text-sm">Diagnóstico, manutenção, tuning e muito mais</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {/* Icon */}
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 relative">
              <Car className="w-10 h-10 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">Como posso ajudar com seu veículo?</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">
              Sou especializado em diagnóstico automotivo, mecânica, tuning, performance e gestão de comunidades.
            </p>

            {/* Suggestion grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-xs bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2.5 rounded-xl transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white/10 text-gray-100 rounded-tl-sm border border-white/10"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="mt-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre diagnóstico, mecânica, tuning..."
          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/30"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      <p className="text-xs text-gray-600 text-center mt-2 flex-shrink-0">
        Auto AI pode cometer erros. Verifique informações críticas com um mecânico.
      </p>
    </div>
  );
}

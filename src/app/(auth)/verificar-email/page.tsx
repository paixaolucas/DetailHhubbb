"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { LogoType } from "@/components/ui/logo";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const email = searchParams.get("email") ?? "";

  const [inputEmail, setInputEmail] = useState(email);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputEmail || sending) return;
    setSending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Link inválido ou expirado</h1>
        <p className="text-gray-400">
          O link de verificação não é válido ou já foi usado. Solicite um novo abaixo.
        </p>
        <form onSubmit={handleResend} className="space-y-3 mt-6">
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="Seu email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:border-[#009CD9]/50"
          />
          {sent ? (
            <p className="text-green-400 text-sm text-center">Novo link enviado! Verifique sua caixa de entrada.</p>
          ) : (
            <button
              type="submit"
              disabled={sending}
              className="btn-premium w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Reenviar link de verificação
            </button>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-[#006079]/20 rounded-full flex items-center justify-center mx-auto">
        <Mail className="w-8 h-8 text-[#009CD9]" />
      </div>
      <h1 className="text-2xl font-bold text-[#EEE6E4]">Confirme seu email</h1>
      <p className="text-gray-400 max-w-sm mx-auto">
        Enviamos um link de verificação para o seu email.
        Clique no link para ativar sua conta.
      </p>

      {sent ? (
        <div className="flex items-center justify-center gap-2 text-green-400 text-sm mt-4">
          <CheckCircle className="w-4 h-4" />
          Novo link enviado! Verifique sua caixa de entrada.
        </div>
      ) : (
        <form onSubmit={handleResend} className="space-y-3 mt-6">
          <p className="text-gray-500 text-sm">Não recebeu? Reenviar para:</p>
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="Seu email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none focus:border-[#009CD9]/50"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 border border-white/10 hover:border-[#009CD9]/40 text-gray-300 hover:text-[#EEE6E4] py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Reenviar link
          </button>
        </form>
      )}

      <p className="text-gray-500 text-xs pt-4">
        Lembre de verificar a pasta de spam.
      </p>

      <Link href="/login" className="block text-gray-500 hover:text-gray-400 text-sm transition-colors pt-2">
        Voltar para o login →
      </Link>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <LogoType height={28} variant="light" />
          </Link>
        </div>
        <div className="glass-card p-8">
          <Suspense fallback={<div className="h-48 animate-pulse bg-white/5 rounded-xl" />}>
            <VerificarEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Logo, LogoType } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ocorreu um erro. Tente novamente.");
        return;
      }
      if (data._dev?.resetLink) {
        setDevResetLink(data._dev.resetLink);
      }
      setSent(true);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6">
      <Link href="/" className="flex items-center mb-8">
        <LogoType height={26} variant="light" />
      </Link>

      <div className="w-full max-w-md glass-card p-8">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#EEE6E4]">Email enviado!</h2>
            <p className="text-gray-400">
              Enviamos um link de recuperação para <span className="text-[#EEE6E4] font-medium">{email}</span>.
              Verifique sua caixa de entrada.
            </p>
            {devResetLink && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-left">
                <p className="text-yellow-400 text-xs font-semibold mb-1">DEV — Link de reset:</p>
                <Link href={devResetLink} className="text-[#009CD9] text-xs break-all hover:underline">
                  {devResetLink}
                </Link>
              </div>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[#009CD9] hover:text-[#007A99] text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-[#006079]/10 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#009CD9]" />
              </div>
              <h2 className="text-2xl font-bold text-[#EEE6E4] mb-2">Recuperar senha</h2>
              <p className="text-gray-400 text-sm">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-[#007A99] focus:border-[#009CD9] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#006079]/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-[#EEE6E4] text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

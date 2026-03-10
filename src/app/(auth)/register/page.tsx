"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Star, Users, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PasswordStrength } from "@/components/ui/password-strength";

type Role = "INFLUENCER_ADMIN" | "COMMUNITY_MEMBER";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const errs: Record<string, string> = {};
          for (const d of data.details) {
            if (d.path?.[0]) errs[d.path[0]] = d.message;
          }
          setFieldErrors(errs);
        } else {
          setError(data.error ?? "Erro ao criar conta");
        }
        return;
      }

      if (data.data?.tokens?.accessToken) {
        localStorage.setItem("detailhub_access_token", data.data.tokens.accessToken);
        localStorage.setItem("detailhub_refresh_token", data.data.tokens.refreshToken);
      }
      if (data.data?.user) {
        localStorage.setItem("detailhub_user_role", data.data.user.role ?? selectedRole ?? "COMMUNITY_MEMBER");
        localStorage.setItem("detailhub_user_name", `${data.data.user.firstName} ${data.data.user.lastName}`.trim());
        localStorage.setItem("detailhub_user_email", data.data.user.email);
        if (data.data.user.id) {
          localStorage.setItem("detailhub_user_id", data.data.user.id);
        }
      }

      const planId = searchParams.get("plan");
      const community = searchParams.get("community");

      if (planId) {
        try {
          const checkoutRes = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.data?.tokens?.accessToken}`,
            },
            body: JSON.stringify({ planId }),
          });
          const checkoutData = await checkoutRes.json();
          if (checkoutData.data?.url) {
            window.location.href = checkoutData.data.url;
            return;
          }
        } catch {}
        router.push(community ? `/community/${community}` : "/dashboard");
      } else if (community) {
        router.push(`/community/${community}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  const roles: { id: Role; icon: React.ElementType; label: string; desc: string; features: string[] }[] = [
    {
      id: "INFLUENCER_ADMIN",
      icon: Star,
      label: "Criador de Conteúdo",
      desc: "Crie comunidades, monetize e gerencie membros",
      features: ["Crie suas próprias comunidades", "Publique cursos e lives", "Receba pagamentos via Stripe", "Analytics avançado"],
    },
    {
      id: "COMMUNITY_MEMBER",
      icon: Users,
      label: "Membro / Entusiasta",
      desc: "Acesse comunidades automotivas premium",
      features: ["Acesse cursos e conteúdos", "Participe de lives ao vivo", "Use o marketplace", "IA Mecânica exclusiva"],
    },
  ];

  return (
    <div className="min-h-screen bg-chrome-900 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <Logo size="md" />
        <span className="text-white font-bold text-lg">DetailHub</span>
      </Link>

      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > s
                    ? "bg-green-500 text-white"
                    : step === s
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-gray-500"
                }`}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 2 && <div className={`h-px w-16 ${step > s ? "bg-blue-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card">
          {step === 1 ? (
            /* Step 1: Role selection */
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Como você vai usar o DetailHub?</h2>
                <p className="text-gray-400">Escolha seu perfil para personalizar sua experiência.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {roles.map(({ id, icon: Icon, label, desc, features }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedRole(id)}
                    className={`text-left p-6 rounded-xl border-2 transition-all ${
                      selectedRole === id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      selectedRole === id ? "bg-blue-500/20" : "bg-white/5"
                    }`}>
                      <Icon className={`w-6 h-6 ${selectedRole === id ? "text-blue-400" : "text-gray-400"}`} />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">{label}</h3>
                    <p className="text-gray-400 text-sm mb-4">{desc}</p>
                    <ul className="space-y-2">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${selectedRole === id ? "text-blue-400" : "text-gray-600"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!selectedRole}
                onClick={() => setStep(2)}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30"
              >
                Continuar
              </button>
            </div>
          ) : (
            /* Step 2: Form */
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Criar sua conta</h2>
                <p className="text-gray-400">
                  {selectedRole === "INFLUENCER_ADMIN" ? "Conta de Criador de Conteúdo" : "Conta de Membro"}
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                        fieldErrors.firstName ? "border-red-500/50" : "border-white/10 hover:border-white/20"
                      }`}
                      placeholder="João"
                      autoComplete="given-name"
                    />
                    {fieldErrors.firstName && <p className="mt-1 text-xs text-red-400">{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Sobrenome</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                        fieldErrors.lastName ? "border-red-500/50" : "border-white/10 hover:border-white/20"
                      }`}
                      placeholder="Silva"
                      autoComplete="family-name"
                    />
                    {fieldErrors.lastName && <p className="mt-1 text-xs text-red-400">{fieldErrors.lastName}</p>}
                  </div>
                </div>

                {(["email", "password", "confirmPassword"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      {field === "email" ? "Email" : field === "password" ? "Senha" : "Confirmar senha"}
                    </label>
                    <input
                      type={field === "email" ? "email" : "password"}
                      required
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                        fieldErrors[field] ? "border-red-500/50" : "border-white/10 hover:border-white/20"
                      }`}
                      placeholder={field === "email" ? "seu@email.com" : "••••••••"}
                      autoComplete={field === "email" ? "email" : "new-password"}
                    />
                    {fieldErrors[field] && <p className="mt-1 text-xs text-red-400">{fieldErrors[field]}</p>}
                    {field === "password" && <PasswordStrength password={form.password} />}
                  </div>
                ))}

                <div className="pt-1 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar conta grátis"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    ← Voltar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterFormContent />
    </Suspense>
  );
}

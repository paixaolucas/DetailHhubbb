"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Car, Bot, Video, ShoppingBag, Trophy, Users, CheckCircle } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

const STEPS = [
  {
    icon: Users,
    title: "Assine a plataforma",
    desc: "R$708/ano (R$59/mês) — acesso a todas as comunidades, cursos, lives e muito mais.",
    cta: { label: "Assinar agora", href: "/dashboard/assinar" },
    color: "text-[#009CD9]",
    bg: "bg-[#006079]/10",
  },
  {
    icon: Car,
    title: "Explore as comunidades",
    desc: "Dezenas de comunidades automotivas premium com conteúdo exclusivo.",
    cta: { label: "Ver comunidades", href: "/communities" },
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Bot,
    title: "Use a IA Mecânica",
    desc: "Diagnostique problemas, tire dúvidas e crie conteúdo com IA especializada.",
    cta: { label: "Abrir Auto AI", href: "/dashboard/ai" },
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

const INCLUDED = [
  "Todas as comunidades automotivas",
  "Conteúdo em módulos ilimitado",
  "Lives & streaming ao vivo",
  "Marketplace premium",
  "Auto AI — IA Mecânica",
  "Leaderboard e badges",
];

export default function BoasVindasPage() {
  const [firstName, setFirstName] = useState("Detailer");

  useEffect(() => {
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (name) setFirstName(name.split(" ")[0]);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-sm text-green-400 mb-2">
          <CheckCircle className="w-4 h-4" />
          Conta criada com sucesso!
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#EEE6E4] leading-tight">
          Bem-vindo, {firstName}! 👋
        </h1>
        <p className="text-gray-400 text-lg">
          Você está a um passo de acessar a maior plataforma automotiva do Brasil.
        </p>
      </div>

      {/* Subscription highlight */}
      <div className="relative glass-card p-8 border-[#006079]/40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#006079]/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#009CD9]/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#006079]/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#009CD9]" />
            </div>
            <div>
              <p className="text-[#EEE6E4] font-bold">Detailer&apos;HUB Anual</p>
              <p className="text-gray-400 text-sm">Uma assinatura. Acesso a tudo.</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-black text-[#EEE6E4]">R$708<span className="text-gray-400 text-sm font-normal">/ano</span></p>
              <p className="text-gray-500 text-xs">R$59/mês no plano anual</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/assinar"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-[#006079]/30 active:scale-[0.98]"
          >
            Assinar agora <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-center text-xs text-gray-500 mt-3">
            Pagamento seguro via Stripe. Cancele quando quiser.
          </p>
        </div>
      </div>

      {/* What you can do */}
      <div>
        <h2 className="text-lg font-bold text-[#EEE6E4] mb-4">O que você vai encontrar</h2>
        <div className="space-y-3">
          {STEPS.map(({ icon: Icon, title, desc, cta, color, bg }) => (
            <div key={title} className="glass-card p-5 flex items-start gap-4 hover:border-white/20 transition-all group">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#EEE6E4] font-semibold text-sm mb-0.5">{title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
              <Link
                href={cta.href}
                className="flex items-center gap-1 text-xs text-[#009CD9] hover:text-[#009CD9] font-medium flex-shrink-0 transition-colors"
              >
                {cta.label}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Skip */}
      <div className="text-center">
        <Link
          href="/inicio"
          className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
        >
          Explorar o início primeiro →
        </Link>
      </div>
    </div>
  );
}

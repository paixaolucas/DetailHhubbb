"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Car, CheckCircle } from "lucide-react";
import { CommunityThumbnail } from "@/components/community/CommunityThumbnail";

const featuredCommunities = [
  {
    slug: "barba-crew",
    name: "Barba Crew",
    primaryColor: "#006079",
    bannerUrl: "/photos/barba-thumb.png",
  },
  {
    slug: "corujao-detailing",
    name: "Corujão Detailing",
    primaryColor: "#009CD9",
    bannerUrl: "/photos/corujao-thumb.png",
  },
  {
    slug: "no-mel",
    name: "No Mel",
    primaryColor: "#FCB749",
    bannerUrl: "/photos/neto-thumb.png",
  },
  {
    slug: "garagem-do-gimenez",
    name: "Garagem Gimenez",
    primaryColor: "#C0392B",
    bannerUrl: null,
  },
  {
    slug: "sala-do-gigi",
    name: "Sala do Gigi",
    primaryColor: "#007A99",
    bannerUrl: null,
  },
];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 25, y: 20 }); // % values, initial position

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y });
  }

  function handleMouseLeave() {
    setMouse({ x: 25, y: 20 }); // reset to default
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-[#1A1A1A] pt-24 pb-32"
    >
      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Mouse-tracked glow orb */}
      <div
        className="pointer-events-none absolute w-[600px] h-[600px] rounded-full bg-[#006079]/35 blur-[100px]"
        style={{
          left: `${mouse.x}%`,
          top: `${mouse.y}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 0.6s cubic-bezier(0.25,0.46,0.45,0.94), top 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      />

      {/* Secondary smaller orb — offset slightly for depth */}
      <div
        className="pointer-events-none absolute w-80 h-80 rounded-full bg-[#009CD9]/20 blur-[80px]"
        style={{
          left: `${mouse.x + 8}%`,
          top: `${mouse.y + 5}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 0.9s cubic-bezier(0.25,0.46,0.45,0.94), top 0.9s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      />

      {/* Static bottom-right orb */}
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Animated bottom-left orb */}
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#007A99]/10 rounded-full blur-3xl pointer-events-none animate-breathe" />

      <div className="container mx-auto px-4 text-center relative">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 bg-[#006079]/10 border border-[#007A99]/30 rounded-full px-4 py-1.5 text-sm text-[#009CD9] mb-8 animate-fade-in"
          style={{ animationDelay: "0ms" }}
        >
          <Car className="w-4 h-4" />
          Para detailers que sabem executar e querem cobrar o que merecem
        </div>

        {/* Headline */}
        <h1
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <span className="text-[#EEE6E4]">O YouTube é sua vitrine.</span>
          <br />
          <span className="bg-gradient-to-r from-[#009CD9] via-[#007A99] to-[#006079] bg-clip-text text-transparent animate-gradient-x">
            O Detailer&apos;HUB é a sua casa.
          </span>
        </h1>

        <p
          className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          Aprenda com Barba, Corujão, Gimenez e outros referências da estética automotiva.
          Precificação, técnica e comunidade ativa — por{" "}
          <span className="text-[#EEE6E4] font-semibold">R$79/mês</span>.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/register"
            className="flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] hover:from-[#007A99] hover:to-[#009CD9] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transition-shadow duration-300 hover:shadow-xl hover:shadow-[#006079]/30 hover:animate-pulse-glow active:scale-95 w-full sm:w-auto justify-center"
          >
            Começar agora <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#preco"
            className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-[#EEE6E4] px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-white/5 w-full sm:w-auto justify-center"
          >
            Ver planos
          </Link>
        </div>

        {/* Trust indicators */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-6 mt-12 flex-wrap animate-fade-in"
          style={{ animationDelay: "450ms" }}
        >
          {["R$79/mês. Acesso a tudo.", "Setup em 5 minutos", "Cancele quando quiser"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-gray-500 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {item}
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div
          className="relative mt-16 max-w-3xl mx-auto animate-slide-up"
          style={{ animationDelay: "500ms" }}
        >
          <div style={{ perspective: "1200px" }}>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl shadow-[#006079]/20 border border-white/10"
              style={{ transform: "rotateX(8deg) rotateY(-1deg)" }}
            >
              {/* Window chrome */}
              <div className="bg-white/5 px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white/5 rounded-full h-5 text-[10px] text-gray-400 flex items-center px-3">
                  detailerhub.com/dashboard
                </div>
              </div>
              {/* Content */}
              <div className="bg-[#1A1A1A] p-4 grid grid-cols-5 gap-2">
                {featuredCommunities.map((c) => (
                  <div key={c.slug} className="bg-white/5 rounded-xl overflow-hidden shadow-sm border border-white/10">
                    <CommunityThumbnail
                      bannerUrl={c.bannerUrl}
                      primaryColor={c.primaryColor}
                      name={c.name}
                      className="!aspect-auto h-20 w-full"
                    />
                    <div className="p-2 space-y-1.5">
                      <div className="h-2 bg-white/10 rounded w-3/4" />
                      <div className="h-2 bg-white/10 rounded w-1/2" />
                      <div className="h-5 rounded-lg mt-2" style={{ backgroundColor: `${c.primaryColor}22` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow below */}
          <div className="absolute inset-x-16 bottom-0 h-12 bg-[#006079]/20 blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}

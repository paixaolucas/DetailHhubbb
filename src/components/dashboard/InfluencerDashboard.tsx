"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users, TrendingUp, DollarSign, Activity, Star, BookOpen, PlayCircle, Bot, Trophy, Settings,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getInfluencerHealth, getInfluencerHealthEmoji } from "@/lib/points";
import { STORAGE_KEYS } from "@/lib/constants";
import { getGreeting } from "@/lib/greeting";

interface InfluencerSummary {
  mrr: number;
  mrrGrowth: number;
  activeMembers: number;
  totalRevenue: number;
  revenueGrowth: number;
  churnRate: number;
}

interface TimeSeriesPoint {
  date: string;
  revenue: number;
}

const chartStyle = {
  cartesianGrid: { strokeDasharray: "3 3", stroke: "rgba(0,0,0,0.06)" },
  xAxis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  yAxis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#1A1A1A",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: "#EEE6E4",
    },
  },
};

function StatsCard({
  title, value, growth, prefix = "", suffix = "", icon: Icon, iconColor = "text-[#009CD9]", iconBg = "bg-[#007A99]/10",
}: {
  title: string; value: number | string; growth?: number;
  prefix?: string; suffix?: string; icon: React.ElementType;
  iconColor?: string; iconBg?: string;
}) {
  const isPositive = (growth ?? 0) >= 0;
  return (
    <div className="glass-card p-4 sm:p-6 hover:border-[#009CD9]/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl sm:text-2xl font-bold text-[#EEE6E4]">
          {prefix}{typeof value === "number" ? value.toLocaleString("pt-BR") : value}{suffix}
        </p>
        {growth !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function LiveIndicator({ lastUpdated }: { lastUpdated: Date | null }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {lastUpdated
        ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
        : "Ao vivo"}
    </div>
  );
}

interface CommunityStats {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  memberCount: number;
  postCount: number;
  spaces: { id: string; name: string; slug: string }[];
}

interface RecentMember {
  id: string;
  createdAt: string;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
}

export function InfluencerDashboard({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<InfluencerSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<CommunityStats | null>(null);
  const [members, setMembers] = useState<RecentMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [influencerScore, setInfluencerScore] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    fetch("/api/dashboard/influencer-summary", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.data.summary);
          setTimeSeries(d.data.timeSeries ?? []);
          setLastUpdated(new Date());
          if (d.data.communities?.length > 0) setCommunity(d.data.communities[0]);
          setMembers(d.data.members ?? []);
          setInfluencerScore(d.data.influencerScore ?? 0);
        }
      })
      .catch(console.error)
      .finally(() => { setLoading(false); setMembersLoading(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, 60_000);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-6 space-y-3"><div className="h-4 bg-white/10 rounded w-24" /><div className="h-7 bg-white/10 rounded w-32" /></div>)}
      </div>
    </div>
  );

  const firstName = userName.split(" ")[0] || "Criador";
  const greeting = getGreeting(firstName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#009CD9]/10 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-[#009CD9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#EEE6E4]">{greeting}</h1>
            <p className="text-gray-400 text-sm">Visão geral da sua comunidade automotiva</p>
          </div>
        </div>
        <LiveIndicator lastUpdated={lastUpdated} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Meu MRR" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-[#009CD9]" iconBg="bg-[#007A99]/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-[#009CD9]" iconBg="bg-[#009CD9]/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      {(() => {
        const health = getInfluencerHealth(influencerScore);
        const healthEmoji = getInfluencerHealthEmoji(health);
        const healthColor =
          health === "Saudável" ? "text-green-400 border-green-500/20 bg-green-500/10" :
          health === "Atenção"  ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" :
                                   "text-red-400 border-red-500/20 bg-red-500/10";
        const memberCount = summary?.activeMembers ?? community?.memberCount ?? 0;
        const mrrProjection = memberCount * 79;
        const ppScore = Math.min(100, Math.round((influencerScore / 100) * 60 + (Math.min(memberCount, 50) / 50) * 40));
        return (
          <div className="glass-card p-5 border-[#007A99]/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#EEE6E4] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#009CD9]" /> Caixa de Performance
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${healthColor}`}>
                {healthEmoji} {health}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center"><p className="text-2xl font-bold text-[#EEE6E4]">{influencerScore}</p><p className="text-xs text-gray-400 mt-0.5">Score atual</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-[#EEE6E4]">{ppScore}</p><p className="text-xs text-gray-400 mt-0.5">PP Score</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-[#EEE6E4]">{memberCount}</p><p className="text-xs text-gray-400 mt-0.5">Membros opt-in</p></div>
              <div className="text-center"><p className="text-lg font-bold text-green-400">R${mrrProjection.toLocaleString("pt-BR")}</p><p className="text-xs text-gray-400 mt-0.5">MRR estimado</p></div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Score de saúde</span><span>{influencerScore}/100+</span></div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${health === "Saudável" ? "bg-gradient-to-r from-green-600 to-green-400" : health === "Atenção" ? "bg-gradient-to-r from-yellow-600 to-yellow-400" : "bg-gradient-to-r from-red-600 to-red-400"}`}
                  style={{ width: `${Math.min(100, influencerScore)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-6">Receita nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="inflRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009CD9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#009CD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.cartesianGrid} />
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v: string) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v: number) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#009CD9" strokeWidth={2} fill="url(#inflRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-[#EEE6E4] mb-3">Acesso Rápido</h2>
            <div className="space-y-1">
              {[
                { label: "Minhas Comunidades", href: "/dashboard/communities", icon: Users },
                { label: "Criar Conteúdo", href: "/dashboard/content", icon: BookOpen },
                { label: "Agendar Live", href: "/dashboard/live", icon: PlayCircle },
                { label: "Auto AI", href: "/dashboard/ai", icon: Bot },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#006079]/10 transition-colors text-sm text-gray-400 hover:text-[#EEE6E4] font-medium">
                  <Icon className="w-4 h-4 text-[#009CD9]" />{label}
                </Link>
              ))}
            </div>
          </div>
          <div className="glass-card border-[#007A99]/20 p-5 bg-gradient-to-br from-[#006079]/10 to-[#009CD9]/5">
            <div className="w-8 h-8 bg-[#007A99]/20 rounded-lg flex items-center justify-center mb-3">
              <Bot className="w-4 h-4 text-[#009CD9]" />
            </div>
            <p className="font-semibold text-[#EEE6E4] text-sm mb-1">Auto AI</p>
            <p className="text-gray-400 text-xs mb-3">Crie conteúdo, diagnostique veículos e estratégias com IA</p>
            <Link href="/dashboard/ai" className="bg-[#006079]/30 hover:bg-[#006079]/50 transition-colors text-[#009CD9] text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
              Acessar →
            </Link>
          </div>
        </div>
      </div>

      {community && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              {community.logoUrl ? (
                <Image src={community.logoUrl} alt={community.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#006079] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {community.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-[#EEE6E4] text-sm truncate">{community.name}</p>
                <p className="text-xs text-gray-400">{community.memberCount ?? 0} membros · {community.postCount ?? 0} posts</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Ver Feed", href: `/community/${community.slug}/feed`, icon: Activity, color: "text-[#006079] bg-[#006079]/10 border-[#009CD9]/20" },
                { label: "Configurações", href: `/dashboard/communities/${community.id}/settings`, icon: Settings, color: "text-gray-400 bg-white/5 border-white/10" },
                { label: "Canais", href: `/dashboard/communities/${community.id}/spaces`, icon: BookOpen, color: "text-[#006079] bg-[#006079]/10 border-[#009CD9]/20" },
                { label: "Broadcast", href: `/dashboard/communities/${community.id}/settings?tab=broadcast`, icon: Trophy, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link key={href} href={href} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${color}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />{label}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#EEE6E4]">Membros Recentes</h2>
              <Link href={`/dashboard/communities/${community.id}/settings?tab=members`} className="text-xs text-[#007A99] hover:text-[#006079] font-medium transition-colors">
                Ver todos →
              </Link>
            </div>
            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-white/10 rounded w-1/3" />
                      <div className="h-2.5 bg-white/10 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum membro ainda.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const name = `${m.user.firstName} ${m.user.lastName}`;
                  const initials = `${m.user.firstName[0] ?? ""}${m.user.lastName[0] ?? ""}`.toUpperCase();
                  const joined = new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#006079]/10 transition-colors">
                      {m.user.avatarUrl ? (
                        <Image src={m.user.avatarUrl} alt={name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#006079]/10 flex items-center justify-center text-xs font-bold text-[#006079] flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#EEE6E4] truncate">{name}</p>
                        <p className="text-xs text-gray-400">Entrou em {joined}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

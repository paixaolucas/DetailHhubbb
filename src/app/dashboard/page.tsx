"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  PlayCircle,
  ShoppingBag,
  Star,
  Shield,
  BarChart2,
  Package,
  Bot,
  Trophy,
  Settings,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { CommunityThumbnail } from "@/components/community/CommunityThumbnail";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Bom dia, ${firstName}!`;
  if (hour >= 12 && hour < 18) return `Boa tarde, ${firstName}!`;
  return `Boa noite, ${firstName}!`;
}

// ─── StatsCard ────────────────────────────────────────────────────────────────

function StatsCard({
  title,
  value,
  growth,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconColor = "text-[#009CD9]",
  iconBg = "bg-[#007A99]/10",
}: {
  title: string;
  value: number | string;
  growth?: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}) {
  const isPositive = (growth ?? 0) >= 0;
  return (
    <div className="glass-card p-4 sm:p-6 hover:border-[#009CD9]/20 transition-all group">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm font-medium text-gray-500 leading-tight">{title}</p>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl sm:text-2xl font-bold text-[#EEE6E4]">
          {prefix}
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          {suffix}
        </p>
        {growth !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs sm:text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chart theme ──────────────────────────────────────────────────────────────

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

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-white/10 rounded w-24" />
              <div className="w-10 h-10 bg-white/10 rounded-xl" />
            </div>
            <div className="h-7 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="h-4 bg-white/10 rounded w-40" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-white/10 rounded" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
        <div className="glass-card p-6 space-y-3">
          <div className="h-4 bg-white/10 rounded w-28" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    fetch("/api/analytics/platform", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setSummary(d.data.summary); setTimeSeries(d.data.timeSeries ?? []); }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">Painel Administrativo</h1>
          <p className="text-gray-400 text-sm">Visão geral da plataforma Detailer'HUB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="MRR da Plataforma" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-[#009CD9]" iconBg="bg-[#007A99]/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-[#009CD9]" iconBg="bg-[#009CD9]/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-4 sm:p-6 overflow-x-auto">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-6">Receita nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009CD9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#009CD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.cartesianGrid} />
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#009CD9" strokeWidth={2} fill="url(#adminRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Ver comunidades", href: "/dashboard/communities", icon: Users, color: "text-[#009CD9] bg-[#007A99]/10" },
              { label: "Gerenciar usuários", href: "/dashboard/usuarios", icon: Shield, color: "text-red-400 bg-red-500/10" },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2, color: "text-[#009CD9] bg-[#009CD9]/10" },
              { label: "Marketplace", href: "/dashboard/marketplace", icon: ShoppingBag, color: "text-green-400 bg-green-500/10" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#006079]/10 transition-colors border border-white/10 hover:border-[#009CD9]/20">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.split(" ")[1]}`}>
                  <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                </div>
                <span className="text-sm font-medium text-gray-400">{label}</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INFLUENCER DASHBOARD ─────────────────────────────────────────────────────

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

function InfluencerDashboard({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<CommunityStats | null>(null);
  const [members, setMembers] = useState<RecentMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    Promise.all([
      fetch("/api/analytics/influencer", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([analyticsData, mineData]) => {
        if (analyticsData.success) {
          setSummary(analyticsData.data.summary);
          setTimeSeries(analyticsData.data.timeSeries ?? []);
        }
        if (mineData.success && mineData.data?.length > 0) {
          const c = mineData.data[0];
          setCommunity(c);
          // Load recent members
          setMembersLoading(true);
          fetch(`/api/communities/${c.id}/members?pageSize=5`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((d) => { if (d.success) setMembers(d.data ?? []); })
            .catch(console.error)
            .finally(() => setMembersLoading(false));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const firstName = userName.split(" ")[0] || "Criador";
  const greeting = getGreeting(firstName);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#009CD9]/10 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-[#009CD9]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">{greeting}</h1>
          <p className="text-gray-400 text-sm">Visão geral da sua comunidade automotiva</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Meu MRR" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-[#009CD9]" iconBg="bg-[#007A99]/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-[#009CD9]" iconBg="bg-[#009CD9]/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
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
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#009CD9" strokeWidth={2} fill="url(#inflRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick access */}
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
                  <Icon className="w-4 h-4 text-[#009CD9]" />
                  {label}
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

      {/* Community management panel */}
      {community && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Community overview */}
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
                { label: "Ver Feed", href: `/community/${community.slug}/feed`, icon: Activity, color: "text-[#006079] bg-[#006079]/10 border-[#009CD9]/20 hover:bg-[#006079]/10" },
                { label: "Configurações", href: `/dashboard/communities/${community.id}/settings`, icon: Settings, color: "text-gray-400 bg-white/5 border-white/10 hover:bg-white/10" },
                { label: "Canais", href: `/dashboard/communities/${community.id}/spaces`, icon: BookOpen, color: "text-[#006079] bg-[#006079]/10 border-[#009CD9]/20 hover:bg-[#006079]/10" },
                { label: "Broadcast", href: `/dashboard/communities/${community.id}/settings?tab=broadcast`, icon: Trophy, color: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${color}`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent members */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#EEE6E4]">Membros Recentes</h2>
              <Link
                href={`/dashboard/communities/${community.id}/settings?tab=members`}
                className="text-xs text-[#007A99] hover:text-[#006079] font-medium transition-colors"
              >
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

// ─── MEMBER DASHBOARD ─────────────────────────────────────────────────────────

interface CommunityCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  memberCount: number;
}

function CommunityCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="h-32 bg-white/10" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
    </div>
  );
}

function MemberDashboardInner({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0] || "Aluno";
  const greeting = getGreeting(firstName);
  const [communities, setCommunities] = useState<CommunityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPlatform, setHasPlatform] = useState<boolean | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbLoading, setLbLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Assinatura confirmada! Bem-vindo à plataforma.");
      router.replace("/dashboard");
    } else if (payment === "canceled") {
      toast.error("Pagamento cancelado. Tente novamente se quiser.");
      router.replace("/dashboard");
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/communities?published=true", { headers }).then((r) => r.json()),
      fetch("/api/platform-membership/me", { headers }).then((r) => r.json()),
    ])
      .then(([commData, platformData]) => {
        if (commData.success) setCommunities(commData.communities ?? []);
        setHasPlatform(platformData.data?.hasMembership === true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard?limit=5")
      .then((r) => r.json())
      .then((d) => { if (d.success) setLeaderboard(d.data ?? []); })
      .catch(console.error)
      .finally(() => setLbLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px] sm:min-h-[200px]">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
        <div className="absolute inset-0 bg-[url('/photos/barba-thumb.png')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
        {/* Geometric accents */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#006079]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#009CD9]/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-[#007A99]/0 via-[#007A99]/40 to-[#007A99]/0" />
        {/* Content */}
        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[#009CD9] text-xs font-semibold uppercase tracking-widest mb-2">Detailer'HUB — Plataforma Automotiva</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">{greeting}</h1>
            <p className="text-white/50 text-sm">Explore as comunidades automotivas da plataforma</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3 text-center">
              <p className="text-white font-black text-2xl">{communities.length}</p>
              <p className="text-white/50 text-xs mt-0.5">comunidades</p>
            </div>
          </div>
        </div>
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#007A99]/0 via-[#007A99]/60 to-[#007A99]/0" />
      </div>

      {/* Main layout: communities + leaderboard side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Communities — 2/3 */}
        <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#EEE6E4]">Comunidades</h2>
          {hasPlatform && <span className="text-sm text-gray-400">{communities.length} disponíveis</span>}
        </div>
        {loading || hasPlatform === null ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="h-52 bg-white/10" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                  <div className="h-9 bg-white/10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasPlatform ? (
          <div className="glass-card border-[#007A99]/30 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#007A99]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#EEE6E4] mb-1">Acesso à plataforma</h3>
                <p className="text-gray-400 text-sm">Assine e acesse todas as comunidades automotivas premium</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {["Todas as comunidades", "Lives exclusivas", "Conteúdo ilimitado", "Auto AI"].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400 font-bold">✓</span>
                  {benefit}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-3xl font-bold text-[#EEE6E4]">R$ 837</span>
                <span className="text-gray-400 text-sm">/ano</span>
              </div>
              <Link
                href="/dashboard/assinar"
                className="bg-[#006079] hover:bg-[#007A99] transition-colors text-white font-semibold px-6 py-3 rounded-xl text-sm"
              >
                Assinar agora →
              </Link>
            </div>
            {/* Blurred community previews */}
            {communities.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-3">Comunidades disponíveis com assinatura:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {communities.slice(0, 3).map((community) => (
                    <div key={community.id} className="glass-card overflow-hidden opacity-60 blur-[2px] pointer-events-none select-none">
                      <CommunityThumbnail
                        bannerUrl={community.bannerUrl}
                        primaryColor={community.primaryColor}
                        name={community.name}
                        aspectRatio="video"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : communities.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400 text-sm mb-3">Nenhuma comunidade disponível no momento.</p>
            <Link href="/dashboard/assinar" className="text-[#009CD9] hover:text-[#009CD9] text-sm font-medium transition-colors">
              Ver plano de assinatura →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/community/${community.slug}/feed`}
                className="glass-card overflow-hidden card-hover hover:border-[#009CD9]/20 transition-all duration-300 group block"
              >
                {/* Thumbnail with member badge */}
                <div className="relative">
                  <CommunityThumbnail
                    bannerUrl={community.bannerUrl}
                    primaryColor={community.primaryColor}
                    name={community.name}
                    aspectRatio="video"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white/90 text-xs px-2.5 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    <span>{community.memberCount.toLocaleString("pt-BR")}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    {community.logoUrl ? (
                      <Image src={community.logoUrl} alt={community.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: community.primaryColor }}>
                        {community.name.charAt(0)}
                      </div>
                    )}
                    <h3 className="font-bold text-[#EEE6E4] text-sm leading-tight">{community.name}</h3>
                  </div>
                  {community.shortDescription && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">{community.shortDescription}</p>
                  )}
                  <div
                    className="w-full py-2 rounded-xl text-xs font-semibold text-white text-center transition-opacity group-hover:opacity-90"
                    style={{ backgroundColor: community.primaryColor }}
                  >
                    Acessar comunidade →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>

        {/* Leaderboard — 1/3 */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#009CD9]" />
              <h2 className="text-xl font-bold text-[#EEE6E4]">Ranking</h2>
            </div>
            <a href="/dashboard/leaderboard" className="text-sm text-[#009CD9] hover:text-[#009CD9] font-medium transition-colors">
              Ver completo →
            </a>
          </div>
          <div className="glass-card divide-y divide-gray-100 sticky top-4">
            {lbLoading ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-4 bg-white/10 rounded" />
                    <div className="w-9 h-9 bg-white/10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 bg-white/10 rounded w-32" />
                      <div className="h-2.5 bg-white/10 rounded w-16" />
                    </div>
                    <div className="w-14 h-4 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhum ranking ainda. Participe das comunidades para ganhar pontos!
              </div>
            ) : (
              leaderboard.map((entry, idx) => {
                const name = entry.user
                  ? `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim()
                  : "Usuário";
                const initials = name
                  .split(" ")
                  .slice(0, 2)
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase();
                const rankBg =
                  idx === 0
                    ? "bg-yellow-500/10 text-yellow-600"
                    : idx === 1
                    ? "bg-gray-400/10 text-gray-500"
                    : idx === 2
                    ? "bg-orange-500/10 text-orange-500"
                    : "bg-white/10 text-gray-400";
                return (
                  <div key={entry.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBg}`}>
                      {idx + 1}
                    </span>
                    {entry.user?.avatarUrl ? (
                      <Image src={entry.user.avatarUrl} alt={name} width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#EEE6E4] truncate">{name}</p>
                      <p className="text-xs text-gray-400">Nível {entry.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#007A99]">{entry.totalPoints.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-gray-400">pts</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PARTNER DASHBOARD ────────────────────────────────────────────────────────

function PartnerDashboard({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0] || "Parceiro";
  const greeting = getGreeting(firstName);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#EEE6E4]">{greeting}</h1>
          <p className="text-gray-400 text-sm">Gerencie seus produtos e acompanhe suas vendas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Produtos Ativos" value={3} icon={Package} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Vendas este mês" value={47} growth={12.5} icon={TrendingUp} iconColor="text-[#009CD9]" iconBg="bg-[#007A99]/10" />
        <StatsCard title="Receita do mês" value={1840} prefix="R$ " growth={8.2} icon={DollarSign} iconColor="text-[#009CD9]" iconBg="bg-[#009CD9]/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Meus Produtos</h2>
          <div className="space-y-3">
            {[
              { name: "Pack Templates de Diagnóstico", sales: 127, price: "R$ 47", rating: 4.8 },
              { name: "Ebook: Motor Turbo do Zero", sales: 89, price: "R$ 27", rating: 4.6 },
              { name: "Mentoria: Tuning Profissional", sales: 12, price: "R$ 297", rating: 5.0 },
            ].map((product) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#EEE6E4]">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} vendas · ⭐ {product.rating}</p>
                </div>
                <span className="text-sm font-semibold text-[#009CD9]">{product.price}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/meus-produtos" className="mt-4 block text-center text-sm text-[#009CD9] hover:text-[#009CD9] font-medium transition-colors">
            Gerenciar produtos →
          </Link>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Adicionar produto", href: "/dashboard/meus-produtos", icon: Package },
              { label: "Ver vendas recentes", href: "/dashboard/vendas", icon: TrendingUp },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
              { label: "Configurações", href: "/dashboard/settings", icon: Activity },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#006079]/10 transition-colors text-sm text-gray-400 hover:text-[#EEE6E4] font-medium border border-white/10 hover:border-[#009CD9]/20">
                <Icon className="w-4 h-4 text-[#009CD9]" />
                {label}
                <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (!storedRole) {
      router.replace("/login");
      return;
    }
    setRole(storedRole);
    setUserName(localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "");
  }, [router]);

  if (!role) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-[3px] border-[#007A99] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  switch (role) {
    case "SUPER_ADMIN": return <AdminDashboard />;
    case "INFLUENCER_ADMIN": return <InfluencerDashboard userName={userName} />;
    case "COMMUNITY_MEMBER": return <Suspense fallback={<DashboardSkeleton />}><MemberDashboardInner userName={userName} /></Suspense>;
    case "MARKETPLACE_PARTNER": return <PartnerDashboard userName={userName} />;
    default: {
      router.replace("/login");
      return null;
    }
  }
}

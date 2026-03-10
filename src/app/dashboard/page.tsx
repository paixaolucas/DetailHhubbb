"use client";

import { Suspense, useEffect, useState } from "react";
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
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── StatsCard ────────────────────────────────────────────────────────────────

function StatsCard({
  title,
  value,
  growth,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconColor = "text-violet-400",
  iconBg = "bg-violet-500/10",
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
    <div className="glass-card p-6 hover:border-violet-200 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900">
          {prefix}
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          {suffix}
        </p>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      color: "#111827",
    },
  },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-7 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
        <div className="glass-card p-6 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-28" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl" />
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
    const token = localStorage.getItem("detailhub_access_token");
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
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-400 text-sm">Visão geral da plataforma DetailHub</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="MRR da Plataforma" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-violet-400" iconBg="bg-violet-500/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-purple-400" iconBg="bg-purple-500/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6 overflow-x-auto">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Receita nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.cartesianGrid} />
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#adminRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Ver comunidades", href: "/dashboard/communities", icon: Users, color: "text-violet-400 bg-violet-500/10" },
              { label: "Gerenciar usuários", href: "/dashboard/usuarios", icon: Shield, color: "text-red-400 bg-red-500/10" },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2, color: "text-purple-400 bg-purple-500/10" },
              { label: "Marketplace", href: "/dashboard/marketplace", icon: ShoppingBag, color: "text-green-400 bg-green-500/10" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 transition-colors border border-gray-100 hover:border-violet-200">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.split(" ")[1]}`}>
                  <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                </div>
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <ArrowUpRight className="w-4 h-4 text-gray-600 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INFLUENCER DASHBOARD ─────────────────────────────────────────────────────

function InfluencerDashboard({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) return;
    fetch("/api/analytics/influencer", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setSummary(d.data.summary); setTimeSeries(d.data.timeSeries ?? []); } })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  const firstName = userName.split(" ")[0] || "Criador";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName}!</h1>
            <p className="text-gray-400 text-sm">Desempenho das suas comunidades automotivas</p>
          </div>
        </div>
        <Link
          href="/dashboard/communities/new"
          className="hidden sm:flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/30"
        >
          + Nova Comunidade
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Meu MRR" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-violet-400" iconBg="bg-violet-500/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-purple-400" iconBg="bg-purple-500/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Receita nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="inflRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.cartesianGrid} />
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#inflRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Acesso Rápido</h2>
            <div className="space-y-1">
              {[
                { label: "Minhas Comunidades", href: "/dashboard/communities", icon: Users },
                { label: "Criar Conteúdo", href: "/dashboard/content", icon: BookOpen },
                { label: "Agendar Live", href: "/dashboard/live", icon: PlayCircle },
                { label: "Auto AI", href: "/dashboard/ai", icon: Bot },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-violet-50 transition-colors text-sm text-gray-600 hover:text-gray-900 font-medium">
                  <Icon className="w-4 h-4 text-violet-400" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card border-violet-500/20 p-5 bg-gradient-to-br from-violet-600/10 to-purple-600/5">
            <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center mb-3">
              <Bot className="w-4 h-4 text-violet-400" />
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">Auto AI</p>
            <p className="text-gray-400 text-xs mb-3">Crie conteúdo, diagnostique veículos e estratégias com IA</p>
            <Link href="/dashboard/ai" className="bg-violet-600/30 hover:bg-violet-600/50 transition-colors text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
              Acessar →
            </Link>
          </div>
        </div>
      </div>
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
      <div className="h-32 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

function MemberDashboardInner({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0] || "Aluno";
  const [communities, setCommunities] = useState<CommunityCard[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) { setLoading(false); return; }

    fetch("/api/communities?published=true", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCommunities(d.data ?? []); })
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
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-transparent border border-violet-500/20 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-transparent pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Bem-vindo, {firstName}!</h1>
          <p className="text-gray-400">Explore as comunidades automotivas da plataforma</p>
        </div>
      </div>

      {/* Communities grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comunidades</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <CommunityCardSkeleton key={i} />)}
          </div>
        ) : communities.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-500 text-sm mb-3">Nenhuma comunidade disponível no momento.</p>
            <Link href="/dashboard/assinar" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
              Ver plano de assinatura →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/community/${community.slug}/feed`}
                className="glass-card overflow-hidden hover:border-violet-200 transition-all group block"
              >
                {/* Banner */}
                <div
                  className="h-32 relative flex-shrink-0"
                  style={{
                    background: community.bannerUrl
                      ? undefined
                      : `linear-gradient(135deg, ${community.primaryColor}40 0%, ${community.primaryColor}10 100%)`,
                  }}
                >
                  {community.bannerUrl && (
                    <img
                      src={community.bannerUrl}
                      alt={community.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Logo overlay */}
                  <div className="absolute bottom-3 left-4">
                    {community.logoUrl ? (
                      <img
                        src={community.logoUrl}
                        alt={community.name}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-gray-200 shadow-lg"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-gray-200"
                        style={{ backgroundColor: community.primaryColor }}
                      >
                        {community.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors truncate">
                      {community.name}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                  {community.shortDescription && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{community.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Users className="w-3 h-3" />
                    <span>{community.memberCount.toLocaleString("pt-BR")} membros</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Platform Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-gray-900">Ranking da Plataforma</h2>
          </div>
          <a href="/dashboard/leaderboard" className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Ver completo →
          </a>
        </div>
        <div className="glass-card divide-y divide-gray-100">
          {lbLoading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-4 bg-gray-200 rounded" />
                  <div className="w-9 h-9 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 bg-gray-200 rounded w-32" />
                    <div className="h-2.5 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="w-14 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhum ranking disponível ainda. Participe das comunidades para ganhar pontos!
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
                  : "bg-gray-100 text-gray-400";
              return (
                <div key={entry.userId} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBg}`}>
                    {idx + 1}
                  </span>
                  {entry.user?.avatarUrl ? (
                    <img
                      src={entry.user.avatarUrl}
                      alt={name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400">Nível {entry.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-violet-500">
                      {entry.totalPoints.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PARTNER DASHBOARD ────────────────────────────────────────────────────────

function PartnerDashboard({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0] || "Parceiro";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName}!</h1>
          <p className="text-gray-400 text-sm">Gerencie seus produtos e acompanhe suas vendas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Produtos Ativos" value={3} icon={Package} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Vendas este mês" value={47} growth={12.5} icon={TrendingUp} iconColor="text-violet-400" iconBg="bg-violet-500/10" />
        <StatsCard title="Receita do mês" value={1840} prefix="R$ " growth={8.2} icon={DollarSign} iconColor="text-purple-400" iconBg="bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Meus Produtos</h2>
          <div className="space-y-3">
            {[
              { name: "Pack Templates de Diagnóstico", sales: 127, price: "R$ 47", rating: 4.8 },
              { name: "Ebook: Motor Turbo do Zero", sales: 89, price: "R$ 27", rating: 4.6 },
              { name: "Mentoria: Tuning Profissional", sales: 12, price: "R$ 297", rating: 5.0 },
            ].map((product) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} vendas · ⭐ {product.rating}</p>
                </div>
                <span className="text-sm font-semibold text-violet-400">{product.price}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/meus-produtos" className="mt-4 block text-center text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Gerenciar produtos →
          </Link>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Adicionar produto", href: "/dashboard/meus-produtos", icon: Package },
              { label: "Ver vendas recentes", href: "/dashboard/vendas", icon: TrendingUp },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
              { label: "Configurações", href: "/dashboard/settings", icon: Activity },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-violet-50 transition-colors text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-100 hover:border-violet-200">
                <Icon className="w-4 h-4 text-violet-400" />
                {label}
                <ArrowUpRight className="w-4 h-4 text-gray-600 ml-auto" />
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
    const storedRole = localStorage.getItem("detailhub_user_role");
    if (!storedRole) {
      router.replace("/login");
      return;
    }
    setRole(storedRole);
    setUserName(localStorage.getItem("detailhub_user_name") ?? "");
  }, [router]);

  if (!role) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
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

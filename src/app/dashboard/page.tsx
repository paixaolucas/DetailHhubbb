"use client";

import { useEffect, useState } from "react";
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
  Zap,
  CheckCircle2,
  Clock,
  BarChart2,
  Package,
  Car,
  Gauge,
  Wrench,
  Bot,
} from "lucide-react";
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
  iconColor = "text-blue-400",
  iconBg = "bg-blue-500/10",
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
    <div className="glass-card p-6 hover:border-white/20 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-white">
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
  cartesianGrid: { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" },
  xAxis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  yAxis: { tick: { fontSize: 11, fill: "#6b7280" }, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: "#1f2937",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: "#f9fafb",
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
    const token = localStorage.getItem("autoclub_access_token");
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
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-gray-400 text-sm">Visão geral da plataforma AutoClub Pro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="MRR da Plataforma" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-purple-400" iconBg="bg-purple-500/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6 overflow-x-auto">
          <h2 className="text-base font-semibold text-white mb-6">Receita nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.cartesianGrid} />
              <XAxis dataKey="date" {...chartStyle.xAxis} tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis {...chartStyle.yAxis} tickFormatter={(v) => `R$${v}`} />
              <Tooltip {...chartStyle.tooltip} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#adminRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Ver comunidades", href: "/dashboard/communities", icon: Users, color: "text-blue-400 bg-blue-500/10" },
              { label: "Gerenciar usuários", href: "/dashboard/usuarios", icon: Shield, color: "text-red-400 bg-red-500/10" },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2, color: "text-purple-400 bg-purple-500/10" },
              { label: "Marketplace", href: "/dashboard/marketplace", icon: ShoppingBag, color: "text-green-400 bg-green-500/10" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.split(" ")[1]}`}>
                  <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                </div>
                <span className="text-sm font-medium text-gray-300">{label}</span>
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
    const token = localStorage.getItem("autoclub_access_token");
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
            <h1 className="text-2xl font-bold text-white">Olá, {firstName}!</h1>
            <p className="text-gray-400 text-sm">Desempenho das suas comunidades automotivas</p>
          </div>
        </div>
        <Link
          href="/dashboard/communities/new"
          className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          + Nova Comunidade
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Meu MRR" value={summary?.mrr ?? 0} growth={summary?.mrrGrowth} prefix="R$ " icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Membros Ativos" value={summary?.activeMembers ?? 0} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard title="Receita Total" value={summary?.totalRevenue ?? 0} growth={summary?.revenueGrowth} prefix="R$ " icon={TrendingUp} iconColor="text-purple-400" iconBg="bg-purple-500/10" />
        <StatsCard title="Churn Rate" value={summary?.churnRate ?? 0} suffix="%" icon={Activity} iconColor="text-orange-400" iconBg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-6">Receita nos últimos 30 dias</h2>
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
            <h2 className="text-sm font-semibold text-white mb-3">Acesso Rápido</h2>
            <div className="space-y-1">
              {[
                { label: "Minhas Comunidades", href: "/dashboard/communities", icon: Users },
                { label: "Criar Conteúdo", href: "/dashboard/content", icon: BookOpen },
                { label: "Agendar Live", href: "/dashboard/live", icon: PlayCircle },
                { label: "Auto AI", href: "/dashboard/ai", icon: Bot },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white font-medium">
                  <Icon className="w-4 h-4 text-blue-400" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card border-blue-500/20 p-5 bg-gradient-to-br from-blue-600/10 to-cyan-600/5">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <p className="font-semibold text-white text-sm mb-1">Auto AI</p>
            <p className="text-gray-400 text-xs mb-3">Crie conteúdo, diagnostique veículos e estratégias com IA</p>
            <Link href="/dashboard/ai" className="bg-blue-600/30 hover:bg-blue-600/50 transition-colors text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
              Acessar →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MEMBER DASHBOARD ─────────────────────────────────────────────────────────

const COURSE_COLORS = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500"];

function MemberDashboard({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0] || "Aluno";
  const [learningData, setLearningData] = useState<any>(null);
  const [lives, setLives] = useState<any[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("autoclub_access_token");
    const userId = localStorage.getItem("autoclub_user_id");
    if (!token || !userId) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/users/me/learning", { headers }).then((r) => r.json()),
      fetch("/api/live-sessions?status=SCHEDULED&limit=2", { headers }).then((r) => r.json()),
      fetch(`/api/users/${userId}/certificates`, { headers }).then((r) => r.json()),
    ])
      .then(([ld, lv, certs]) => {
        if (ld.success) setLearningData(ld.data);
        if (lv.success) setLives((lv.data?.sessions ?? lv.data ?? []).slice(0, 2));
        if (certs.success) setCertCount((certs.data ?? []).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = learningData?.stats ?? {};
  const communities: any[] = (learningData?.communities ?? []).slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Car className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo, {firstName}!</h1>
          <p className="text-gray-400 text-sm">Continue sua jornada automotiva</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Aulas Concluídas", value: String(stats.completedLessons ?? 0), icon: CheckCircle2, color: "text-green-400 bg-green-500/10" },
          { label: "Horas Estudadas", value: `${stats.hoursWatched ?? 0}h`, icon: Clock, color: "text-blue-400 bg-blue-500/10" },
          { label: "Comunidades", value: String(stats.totalCommunities ?? 0), icon: Users, color: "text-purple-400 bg-purple-500/10" },
          { label: "Certificados", value: String(certCount), icon: Star, color: "text-yellow-400 bg-yellow-500/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(" ")[1]}`}>
              <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Continuar Aprendendo</h2>
            <Link href="/dashboard/meu-aprendizado" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Ver tudo →
            </Link>
          </div>
          {communities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Nenhuma comunidade ainda. Explore o marketplace!</p>
          ) : (
            <div className="space-y-5">
              {communities.map((c, idx) => {
                const firstModule = c.modules?.[0];
                return (
                  <div key={c.communityId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{c.communityName}</p>
                        <p className="text-xs text-gray-500">{firstModule?.title ?? "—"}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-400">{c.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${COURSE_COLORS[idx % COURSE_COLORS.length]} rounded-full`} style={{ width: `${c.progress}%` }} />
                    </div>
                    <Link href="/dashboard/meu-aprendizado" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Continuar aula →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Próximas Lives</h2>
              <Link href="/dashboard/lives" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {lives.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma live agendada.</p>
              ) : (
                lives.map((live) => (
                  <div key={live.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PlayCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{live.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(live.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-5 bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border-blue-500/20">
            <ShoppingBag className="w-6 h-6 mb-2 text-blue-400" />
            <p className="font-semibold text-white text-sm mb-1">Marketplace</p>
            <p className="text-gray-400 text-xs mb-3">Cursos, kits, ferramentas e muito mais</p>
            <Link href="/dashboard/marketplace" className="bg-blue-600/30 hover:bg-blue-600/50 transition-colors text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
              Explorar →
            </Link>
          </div>
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
          <h1 className="text-2xl font-bold text-white">Olá, {firstName}!</h1>
          <p className="text-gray-400 text-sm">Gerencie seus produtos e acompanhe suas vendas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Produtos Ativos" value={3} icon={Package} iconColor="text-green-400" iconBg="bg-green-500/10" />
        <StatsCard title="Vendas este mês" value={47} growth={12.5} icon={TrendingUp} iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        <StatsCard title="Receita do mês" value={1840} prefix="R$ " growth={8.2} icon={DollarSign} iconColor="text-purple-400" iconBg="bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Meus Produtos</h2>
          <div className="space-y-3">
            {[
              { name: "Pack Templates de Diagnóstico", sales: 127, price: "R$ 47", rating: 4.8 },
              { name: "Ebook: Motor Turbo do Zero", sales: 89, price: "R$ 27", rating: 4.6 },
              { name: "Mentoria: Tuning Profissional", sales: 12, price: "R$ 297", rating: 5.0 },
            ].map((product) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} vendas · ⭐ {product.rating}</p>
                </div>
                <span className="text-sm font-semibold text-blue-400">{product.price}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/meus-produtos" className="mt-4 block text-center text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Gerenciar produtos →
          </Link>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Adicionar produto", href: "/dashboard/meus-produtos", icon: Package },
              { label: "Ver vendas recentes", href: "/dashboard/vendas", icon: TrendingUp },
              { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
              { label: "Configurações", href: "/dashboard/settings", icon: Activity },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white font-medium border border-white/5 hover:border-white/10">
                <Icon className="w-4 h-4 text-blue-400" />
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

  useEffect(() => {
    setRole(localStorage.getItem("autoclub_user_role") ?? "INFLUENCER_ADMIN");
    setUserName(localStorage.getItem("autoclub_user_name") ?? "");
  }, []);

  if (!role) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  switch (role) {
    case "SUPER_ADMIN": return <AdminDashboard />;
    case "INFLUENCER_ADMIN": return <InfluencerDashboard userName={userName} />;
    case "COMMUNITY_MEMBER": return <MemberDashboard userName={userName} />;
    case "MARKETPLACE_PARTNER": return <PartnerDashboard userName={userName} />;
    default: return <InfluencerDashboard userName={userName} />;
  }
}

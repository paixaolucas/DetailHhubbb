import * as React from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "chrome"
  | "admin"
  | "influencer"
  | "member"
  | "partner"
  | "live"
  | "premium";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  success: "bg-green-500/20 text-green-300 border border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  destructive: "bg-red-500/20 text-red-300 border border-red-500/30",
  info: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  chrome: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  admin: "bg-red-600/20 text-red-400 border border-red-500/30",
  influencer: "bg-purple-600/20 text-purple-400 border border-purple-500/30",
  member: "bg-blue-600/20 text-blue-400 border border-blue-500/30",
  partner: "bg-green-600/20 text-green-400 border border-green-500/30",
  live: "bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse",
  premium: "bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-300 border border-yellow-500/30",
};

export function Badge({ variant = "default", dot = false, className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const roleMap: Record<string, { label: string; variant: BadgeVariant }> = {
    SUPER_ADMIN: { label: "Super Admin", variant: "admin" },
    INFLUENCER_ADMIN: { label: "Influencer", variant: "influencer" },
    COMMUNITY_MEMBER: { label: "Membro", variant: "member" },
    MARKETPLACE_PARTNER: { label: "Parceiro", variant: "partner" },
  };

  const roleInfo = roleMap[role] ?? { label: role, variant: "chrome" as BadgeVariant };

  return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
}

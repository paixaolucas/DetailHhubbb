"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  growth?: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  iconColor?: string;
  description?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  growth,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconColor = "text-[#009CD9]",
  description,
  loading = false,
}: StatsCardProps) {
  const isPositive = (growth ?? 0) >= 0;

  if (loading) {
    return (
      <div className="glass-card p-6 space-y-3 animate-pulse">
        <div className="flex justify-between">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="w-10 h-10 bg-white/10 rounded-xl" />
        </div>
        <div className="h-8 bg-white/10 rounded w-20" />
        <div className="h-3 bg-white/10 rounded w-16" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 hover:border-[#007A99]/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform bg-[#006079]/15`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-[#EEE6E4]">
          {prefix}
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          {suffix}
        </p>
        {growth !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
}

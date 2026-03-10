"use client";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface BadgeGridProps {
  badges: Badge[];
  earnedBadgeIds: string[];
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <div
      title={`${badge.name}${earned ? "" : " (não conquistado)"}\n${badge.description}`}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-default select-none ${
        earned
          ? "bg-white/5 border-white/15 hover:bg-white/10"
          : "bg-white/[0.02] border-white/5"
      }`}
    >
      {/* Icon circle */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
          earned ? "opacity-100 shadow-lg" : "opacity-30 grayscale"
        }`}
        style={{
          backgroundColor: earned ? `${badge.color}25` : "rgba(255,255,255,0.05)",
          boxShadow: earned ? `0 0 16px ${badge.color}30` : "none",
        }}
      >
        <span>{badge.icon}</span>
      </div>

      {/* Name */}
      <p
        className={`text-xs font-semibold text-center leading-tight ${
          earned ? "text-white" : "text-gray-600"
        }`}
      >
        {badge.name}
      </p>

      {/* Earned indicator */}
      {earned && (
        <span className="text-[10px] text-green-400 font-medium">Conquistado</span>
      )}
    </div>
  );
}

export function BadgeGrid({ badges, earnedBadgeIds }: BadgeGridProps) {
  const earnedSet = new Set(earnedBadgeIds);

  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        Nenhum badge disponível ainda.
      </div>
    );
  }

  // Sort: earned first, then alphabetical
  const sorted = [...badges].sort((a, b) => {
    const aEarned = earnedSet.has(a.id) ? 0 : 1;
    const bEarned = earnedSet.has(b.id) ? 0 : 1;
    if (aEarned !== bEarned) return aEarned - bEarned;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {sorted.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} earned={earnedSet.has(badge.id)} />
      ))}
    </div>
  );
}

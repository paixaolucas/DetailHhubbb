"use client";

interface LevelProgressProps {
  points: number;
  level: number;
  totalEarned: number;
}

// Points required to reach each level (index = level)
const LEVEL_THRESHOLDS = [0, 0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000];

function getLevelThreshold(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) {
    // Beyond level 10: each level requires 1000 more points
    return 5000 + (level - 10) * 1000;
  }
  return LEVEL_THRESHOLDS[level] ?? 0;
}

function getNextLevelThreshold(level: number): number {
  return getLevelThreshold(level + 1);
}

function getProgressToNextLevel(points: number, level: number): number {
  const currentThreshold = getLevelThreshold(level);
  const nextThreshold = getNextLevelThreshold(level);
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 100;
  const progress = ((points - currentThreshold) / range) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

const LEVEL_COLORS: Record<number, string> = {
  1: "from-gray-500 to-gray-400",
  2: "from-green-600 to-green-400",
  3: "from-violet-600 to-violet-400",
  4: "from-purple-600 to-purple-400",
  5: "from-yellow-600 to-yellow-400",
  6: "from-orange-600 to-orange-400",
  7: "from-red-600 to-red-400",
  8: "from-pink-600 to-pink-400",
  9: "from-indigo-600 to-indigo-400",
  10: "from-yellow-500 to-amber-300",
};

function getLevelColor(level: number): string {
  return LEVEL_COLORS[Math.min(level, 10)] ?? LEVEL_COLORS[10];
}

export function LevelProgress({ points, level, totalEarned }: LevelProgressProps) {
  const progress = getProgressToNextLevel(points, level);
  const nextThreshold = getNextLevelThreshold(level);
  const currentThreshold = getLevelThreshold(level);
  const pointsInLevel = points - currentThreshold;
  const pointsNeeded = nextThreshold - currentThreshold;
  const levelColor = getLevelColor(level);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      {/* Level display */}
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${levelColor} flex items-center justify-center flex-shrink-0 shadow-lg`}
        >
          <span className="text-gray-900 font-bold text-lg">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-gray-900 font-bold text-lg">Nível {level}</p>
            <span className="text-xs text-gray-500">→ Nível {level + 1}</span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {points.toLocaleString("pt-BR")} pts acumulados
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-900">{progress}%</p>
          <p className="text-xs text-gray-500">progresso</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${levelColor} transition-all duration-700`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-600">
          <span>{pointsInLevel.toLocaleString("pt-BR")} pts</span>
          <span>{pointsNeeded.toLocaleString("pt-BR")} pts para próximo nível</span>
        </div>
      </div>

      {/* Total earned */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-500">Total ganho</p>
        <p className="text-sm font-semibold text-violet-400">
          +{totalEarned.toLocaleString("pt-BR")} pts
        </p>
      </div>
    </div>
  );
}

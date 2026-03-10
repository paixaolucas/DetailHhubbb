"use client";

// =============================================================================
// ReactionBar — compact emoji reaction buttons for post cards and post detail
// Props: postId, reactions (counts by type), userReactions, onReact callback
// =============================================================================

interface ReactionBarProps {
  postId: string;
  reactions: Record<string, number>;
  userReactions: string[];
  onReact: (type: string) => void;
}

const REACTION_EMOJIS: { type: string; emoji: string; label: string }[] = [
  { type: "like",   emoji: "👍", label: "Curtir"   },
  { type: "fire",   emoji: "🔥", label: "Fire"     },
  { type: "clap",   emoji: "👏", label: "Palmas"   },
  { type: "heart",  emoji: "❤️", label: "Coração"  },
  { type: "rocket", emoji: "🚀", label: "Foguete"  },
];

export default function ReactionBar({
  postId,
  reactions,
  userReactions,
  onReact,
}: ReactionBarProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap" aria-label="Reações">
      {REACTION_EMOJIS.map(({ type, emoji, label }) => {
        const count = reactions[type] ?? 0;
        const active = userReactions.includes(type);
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            title={label}
            aria-pressed={active}
            className={[
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all select-none",
              active
                ? "bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30"
                : "bg-white border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700",
            ].join(" ")}
          >
            <span className="text-sm leading-none">{emoji}</span>
            {count > 0 && (
              <span className={active ? "text-violet-300" : "text-gray-500"}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

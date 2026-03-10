"use client";

interface PasswordStrengthProps {
  password: string;
}

interface Criterion {
  label: string;
  test: (p: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { label: "8+ caracteres", test: (p) => p.length >= 8 },
  { label: "Letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Número", test: (p) => /\d/.test(p) },
  { label: "Caractere especial", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function getScore(password: string): number {
  return CRITERIA.filter((c) => c.test(password)).length;
}

const LEVELS = [
  { label: "Muito fraca", color: "bg-red-500", textColor: "text-red-400" },
  { label: "Fraca", color: "bg-orange-500", textColor: "text-orange-400" },
  { label: "Razoável", color: "bg-yellow-500", textColor: "text-yellow-400" },
  { label: "Boa", color: "bg-violet-500", textColor: "text-violet-400" },
  { label: "Forte", color: "bg-green-500", textColor: "text-green-400" },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const score = getScore(password);
  const level = LEVELS[Math.min(score, LEVELS.length - 1)];
  const filled = score;
  const total = CRITERIA.length;

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < filled ? level.color : "bg-gray-50"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className={`text-xs font-medium ${level.textColor}`}>{level.label}</p>

      {/* Checklist */}
      <ul className="space-y-0.5">
        {CRITERIA.map((c) => {
          const ok = c.test(password);
          return (
            <li key={c.label} className={`text-xs flex items-center gap-1.5 ${ok ? "text-green-400" : "text-gray-500"}`}>
              <span>{ok ? "✓" : "○"}</span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

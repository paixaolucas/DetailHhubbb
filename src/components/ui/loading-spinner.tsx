import { Logo } from "@/components/ui/logo";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "full";
  text?: string;
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  if (size === "full") {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Logo size="xl" />
          <div className="absolute inset-0 rounded-2xl border-2 border-violet-500/50 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg">DetailHub</p>
          {text && <p className="text-gray-400 text-sm mt-1">{text}</p>}
        </div>
      </div>
    );
  }

  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className={`flex items-center justify-center ${size === "lg" ? "h-64" : "p-4"}`}>
      <div
        className={`${sizes[size]} border-violet-500 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}

export function PageLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">{text}</p>
      </div>
    </div>
  );
}

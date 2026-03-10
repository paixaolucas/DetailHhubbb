import * as React from "react";

type ButtonVariant = "default" | "ghost" | "outline" | "destructive" | "chrome" | "success";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40",
  ghost:
    "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  outline:
    "border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-100 bg-transparent",
  destructive:
    "bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 hover:text-red-300",
  chrome:
    "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white border border-gray-200",
  success:
    "bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-4 text-base rounded-xl",
  icon: "p-2.5 rounded-xl",
};

export function Button({
  variant = "default",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

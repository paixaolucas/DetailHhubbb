import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-600"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-white border rounded-xl px-4 py-3
            text-gray-900 placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-500/50 focus:ring-red-500/30" : "border-gray-200 hover:border-violet-200"}
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = "", id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full bg-white border border-gray-200 rounded-xl px-4 py-3
          text-gray-900 placeholder-gray-400
          transition-all duration-200 resize-none
          focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
          hover:border-violet-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-red-500/50" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({ label, error, className = "", id, children, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`
          w-full bg-white border border-gray-200 rounded-xl px-4 py-3
          text-gray-900
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
          hover:border-violet-200
          ${error ? "border-red-500/50" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

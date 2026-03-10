import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "glow";
  children: React.ReactNode;
}

interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ variant = "glass", className = "", children, ...props }: CardProps) {
  const variants = {
    glass: "bg-white backdrop-blur-md border border-gray-200",
    solid: "bg-white border border-gray-200",
    glow: "bg-white backdrop-blur-md border border-violet-500/30 shadow-lg shadow-violet-500/10",
  };

  return (
    <div
      className={`rounded-xl ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: CardSectionProps) {
  return (
    <div className={`p-6 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: CardSectionProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }: CardSectionProps) {
  return (
    <p className={`text-sm text-gray-400 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: CardSectionProps) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: CardSectionProps) {
  return (
    <div
      className={`p-6 pt-0 flex items-center ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

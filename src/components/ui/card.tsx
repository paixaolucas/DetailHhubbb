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
    glass: "bg-white/5 backdrop-blur-md border border-white/10",
    solid: "bg-white/5 border border-white/10",
    glow: "bg-white/5 backdrop-blur-md border border-[#009CD9]/30 shadow-lg shadow-[#006079]/10",
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
    <h3 className={`text-lg font-semibold text-[#EEE6E4] ${className}`} {...props}>
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

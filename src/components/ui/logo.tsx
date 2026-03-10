interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const PX: Record<string, number> = { sm: 28, md: 32, lg: 40, xl: 56 };

export function Logo({ size = "md", className = "" }: LogoProps) {
  const px = PX[size];
  const iconPx = px * 0.6;

  return (
    <div
      className={`bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.75" />
        {/* Center hub */}
        <circle cx="12" cy="12" r="2.5" fill="white" />
        {/* Top spoke (270°) */}
        <line x1="12" y1="9.5" x2="12" y2="2.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        {/* Bottom-right spoke (30°) */}
        <line x1="14.17" y1="13.25" x2="20.23" y2="16.75" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        {/* Bottom-left spoke (150°) */}
        <line x1="9.83" y1="13.25" x2="3.77" y2="16.75" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}

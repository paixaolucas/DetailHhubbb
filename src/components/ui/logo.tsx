interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const PX: Record<string, number> = { sm: 28, md: 32, lg: 40, xl: 56 };

export function Logo({ size = "md", className = "" }: LogoProps) {
  const px = PX[size];
  const iconPx = px * 0.65;

  return (
    <div
      className={`bg-gradient-to-br from-[#006079] to-[#009CD9] rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left figure */}
        <circle cx="7.5" cy="5.5" r="2.2" fill="white" />
        <path d="M5.3 9.5C5.3 8.4 6.2 7.5 7.5 7.5C8.8 7.5 9.7 8.4 9.7 9.5V14.5C9.7 14.8 9.5 15 9.2 15H5.8C5.5 15 5.3 14.8 5.3 14.5V9.5Z" fill="white" />

        {/* Right figure */}
        <circle cx="16.5" cy="5.5" r="2.2" fill="white" />
        <path d="M14.3 9.5C14.3 8.4 15.2 7.5 16.5 7.5C17.8 7.5 18.7 8.4 18.7 9.5V14.5C18.7 14.8 18.5 15 18.2 15H14.8C14.5 15 14.3 14.8 14.3 14.5V9.5Z" fill="white" />

        {/* H crossbar */}
        <rect x="9.2" y="10.5" width="5.6" height="2.2" rx="0.5" fill="white" />

        {/* H left leg extension */}
        <rect x="6.2" y="14.5" width="3" height="4" rx="0.5" fill="white" />

        {/* H right leg extension */}
        <rect x="14.8" y="14.5" width="3" height="4" rx="0.5" fill="white" />
      </svg>
    </div>
  );
}

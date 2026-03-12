import Image from "next/image";

interface CommunityThumbnailProps {
  bannerUrl?: string | null;
  primaryColor?: string;
  name: string;
  className?: string;
  aspectRatio?: "video" | "square";
}

export function CommunityThumbnail({
  bannerUrl,
  primaryColor = "#7C3AED",
  name,
  className = "",
  aspectRatio = "video",
}: CommunityThumbnailProps) {
  const aspectClass = aspectRatio === "video" ? "aspect-video" : "aspect-square";

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
      {bannerUrl ? (
        <Image src={bannerUrl} alt={name} fill className="object-cover object-center" />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}66 100%)`,
            }}
          />
          <div className="absolute inset-0 dot-pattern" />
        </>
      )}
      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <p className="text-white font-semibold text-sm leading-tight truncate">{name}</p>
      </div>
    </div>
  );
}

import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://detail-hhubbb-eight.vercel.app";

  const communities = await db.community.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });

  const listings = await db.marketplaceListing.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/communities`, lastModified: new Date() },
    { url: `${baseUrl}/marketplace`, lastModified: new Date() },
    ...communities.map((c) => ({
      url: `${baseUrl}/community/${c.slug}`,
      lastModified: c.updatedAt,
    })),
    ...listings.map((l) => ({
      url: `${baseUrl}/marketplace/${l.slug}`,
      lastModified: l.updatedAt,
    })),
  ];
}

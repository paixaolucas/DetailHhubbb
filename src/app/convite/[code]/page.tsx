import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

interface Props {
  params: { code: string };
}

export default async function ConvitePage({ params }: Props) {
  const code = params.code?.toUpperCase();

  // Validate the referral code belongs to an influencer
  const referrer = await db.user.findUnique({
    where: { referralCode: code },
    select: {
      id: true,
      firstName: true,
      influencerProfile: {
        select: { id: true, displayName: true },
      },
    },
  });

  // If code doesn't exist or doesn't belong to an influencer, just redirect to register
  if (!referrer || !referrer.influencerProfile) {
    redirect("/register");
  }

  // Set cookie so it persists through the register flow
  const cookieStore = cookies();
  cookieStore.set("detailhub_ref", code, {
    httpOnly: false, // needs to be read by client JS during register
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect(`/register?ref=${code}`);
}

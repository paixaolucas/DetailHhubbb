"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssinarPremiumPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/assinar");
  }, [router]);
  return null;
}

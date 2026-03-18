"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";

interface PlanCheckoutButtonProps {
  planId: string;
  communitySlug: string;
  primaryColor: string;
}

export function PlanCheckoutButton({ planId, communitySlug, primaryColor }: PlanCheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
    if (!token) {
      router.push(`/register?community=${communitySlug}&plan=${planId}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        router.push(`/register?community=${communitySlug}&plan=${planId}`);
      }
    } catch {
      router.push(`/register?community=${communitySlug}&plan=${planId}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full py-3 rounded-xl font-semibold text-[#EEE6E4] text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
      style={{ backgroundColor: primaryColor }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Aguarde...
        </>
      ) : (
        "Assinar agora"
      )}
    </button>
  );
}

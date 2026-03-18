"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface BuyButtonProps {
  listingId: string;
  price: number;
  title: string;
}

export function BuyButton({ listingId, price, title }: BuyButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar compra");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleBuy}
        disabled={isLoading}
        className="bg-[#006079] hover:bg-[#007A99] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-lg hover:shadow-[#007A99]/30 active:scale-95 flex items-center gap-1.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Aguarde...
          </>
        ) : (
          "Comprar"
        )}
      </button>
      {error && <p className="text-red-400 text-xs max-w-[140px] text-right">{error}</p>}
    </div>
  );
}

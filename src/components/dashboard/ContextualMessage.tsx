"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { MessageContext, ContextualMessage as IContextualMessage } from "@/lib/copy/contextual-messages";
import { pickMemberMessage, pickInfluencerMessage } from "@/lib/copy/contextual-messages";
import { UserRole } from "@prisma/client";

export function ContextualMessage({ firstName }: { firstName: string }) {
  const [message, setMessage] = useState<IContextualMessage | null>(null);

  useEffect(() => {
    apiClient<MessageContext>("/api/dashboard/context")
      .then((d) => {
        if (!d.success || !d.data) return;
        const ctx = d.data;
        const msg =
          ctx.role === UserRole.INFLUENCER_ADMIN
            ? pickInfluencerMessage(ctx, firstName)
            : pickMemberMessage(ctx, firstName);
        setMessage(msg);
      })
      .catch(() => {});
  }, [firstName]);

  if (!message) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8 px-1">
      <p className="flex-1 min-w-0 font-titillium text-[26px] leading-snug font-black text-[#EEE6E4]">
        {message.text}
      </p>
      {message.cta && (
        <Link
          href={message.cta.href}
          className="flex-shrink-0 text-xs font-semibold text-[#009CD9] bg-[#006079]/20 hover:bg-[#006079]/30 border border-[#009CD9]/20 px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          {message.cta.label} &rarr;
        </Link>
      )}
    </div>
  );
}

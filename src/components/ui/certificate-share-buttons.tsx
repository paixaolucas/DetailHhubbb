"use client";

import { useState } from "react";
import { Linkedin, Copy, Check } from "lucide-react";

export function CertificateShareButtons() {
  const [copied, setCopied] = useState(false);

  function shareLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <button
        onClick={shareLinkedIn}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold rounded-xl transition-all"
      >
        <Linkedin className="w-4 h-4" />
        Compartilhar no LinkedIn
      </button>
      <button
        onClick={copyLink}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
          copied
            ? "bg-green-600 text-white"
            : "bg-white/5 hover:bg-[#006079]/10 border border-white/10 text-gray-400 hover:text-[#EEE6E4]"
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}

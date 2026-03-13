import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DetailHub",
    template: "%s | DetailHub",
  },
  description:
    "A plataforma premium para comunidades automotivas. Conecte-se, aprenda e cresça com os melhores entusiastas de automóveis do Brasil.",
  keywords: [
    "comunidade automotiva",
    "carros",
    "automóveis",
    "curso de mecânica",
    "tuning",
    "racing",
    "influencer automotivo",
  ],
  openGraph: {
    title: "DetailHub",
    description: "A plataforma premium para comunidades automotivas",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "DetailHub",
    description: "A plataforma premium para comunidades automotivas",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

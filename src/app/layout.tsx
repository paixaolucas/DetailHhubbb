import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-titillium",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Detailer'HUB",
    template: "%s | Detailer'HUB",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
    title: "Detailer'HUB",
    description: "A plataforma premium para comunidades automotivas",
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://detail-hhubbb-eight.vercel.app",
    siteName: "Detailer'HUB",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://detail-hhubbb-eight.vercel.app"}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "Detailer'HUB — Comunidades automotivas premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Detailer'HUB",
    description: "A plataforma premium para comunidades automotivas",
    images: [`${process.env.NEXT_PUBLIC_APP_URL ?? "https://detail-hhubbb-eight.vercel.app"}/og-default.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${titillium.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

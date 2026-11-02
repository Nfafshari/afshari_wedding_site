import type { Metadata } from "next";
import { Lora, Geist_Mono, Pinyon_Script, Cormorant_Garamond, Herr_Von_Muellerhoff, Montserrat } from "next/font/google";
import { Viewport } from "next";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";

import "./globals.css";

// Body and interface text: paragraphs, tables, forms, buttons.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400"
});

const herrVon = Herr_Von_Muellerhoff({
  variable: "--font-herr-von",
  subsets: ["latin"],
  weight: "400"
});

// Headings, titles and stat numbers (the type @utility classes in globals.css).
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

// Guest site text: paragraphs, nav, small capitals and buttons (the planner keeps Lora).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Piper & Nathen | September 11, 2027",
  description: "Join us as we celebrate our wedding on September 11, 2027.",
  formatDetection: { telephone: false } // prevent iOS from detecting telephone to stop safari from wrapping it in an a tag
};

// adjust viewport for dialogs on mobile
export const viewport: Viewport = {
  interactiveWidget: 'resizes-content',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${geistMono.variable} ${pinyon.variable} ${herrVon.variable} ${cormorant.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col">
        <SidebarProvider>
          <main className="flex-1 min-w-0">
            {children}
          </main>
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </SidebarProvider>
      </body>
    </html>
  );
}

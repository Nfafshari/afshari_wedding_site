import type { Metadata } from "next";
import { Geist, Geist_Mono, Pinyon_Script, IM_Fell_Great_Primer, Herr_Von_Muellerhoff } from "next/font/google";

import Header from "@/components/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavSidebar } from "@/components/nav-sidebar";
import Footer from "@/components/footer";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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

const imFellGreat = IM_Fell_Great_Primer({
  variable: "--font-im-fell",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "Piper & Nathen | September 11, 2027",
  description: "Join us as we celebrate our wedding on September 11, 2027.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pinyon.variable} ${herrVon.variable} ${imFellGreat.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col">
        <SidebarProvider>
          <NavSidebar />
          <main>
            <Header />
            {children}
            <Footer />
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { AuthInitializer } from "@/components/auth-initializer";
import { ThemeInitializer } from "@/components/theme-initializer";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "WhatsApp CRM",
  description: "Multi-tenant WhatsApp CRM for Indian SMBs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans min-h-screen antialiased`}
      >
        <Providers>
          <ThemeInitializer />
          <AuthInitializer />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

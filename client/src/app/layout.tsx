import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { AppProviders } from "@/app/providers";
import { ThemeSync } from "@/components/theme-sync";
import "./globals.css";

const roboto = localFont({
  src: "../fonts/Roboto.ttf",
  weight: "100 900",
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "CV Builder",
  description: "Create and manage CVs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{const theme=localStorage.getItem("cv-builder-theme");if(theme==="light"||theme==="dark"||theme==="system")document.documentElement.dataset.theme=theme}catch{}` }} />
      </head>
      <body className={roboto.variable}>
        <AppProviders>
          <ThemeSync />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

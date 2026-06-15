import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Peritum — Boletim Informativo TCE-MA",
  description: "Boletim Informativo — Movimentação Processual e Diário do TCE-MA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-ink-50`}>
        {children}
      </body>
    </html>
  );
}

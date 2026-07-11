import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novam Shop — Sua loja, do seu jeito",
  description: "Crie um catálogo profissional e transforme conversas no WhatsApp em pedidos organizados.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

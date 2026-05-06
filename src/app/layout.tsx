import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Lanchonete Familia",
    template: "%s | Lanchonete Familia",
  },
  description:
    "Burgers artesanais, sucos e combinacoes caprichadas para pedir no site ou no WhatsApp.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

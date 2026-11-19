import type { Metadata } from "next";
import { Barlow, Chivo_Mono } from "next/font/google";
import "./globals.css";

const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-barlow" });
const chivo = Chivo_Mono({ subsets: ["latin"], variable: "--font-chivo" });

export const metadata: Metadata = {
  title: "Datasheet studio · Wren Instruments",
  description: "Edit a sensor board’s data, check the live datasheet, and download a print-ready PDF.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${chivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}

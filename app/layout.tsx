import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gowtham Subramaniam — Mechanical Engineer",
  description: "Senior Mechanical Engineer with 9+ years of experience in IVD medical devices, cartridge and instrument development, and R&D at Abbott Laboratories.",
  keywords: ["mechanical engineer", "IVD", "medical devices", "Abbott", "San Diego", "polymer", "DMA", "viscoelasticity"],
  authors: [{ name: "Gowtham Subramaniam" }],
  openGraph: {
    title: "Gowtham Subramaniam — Mechanical Engineer",
    description: "Senior Mechanical Engineer specialising in IVD medical device development at Abbott Laboratories.",
    url: "https://www.gowthamsubramaniam.com",
    siteName: "Gowtham Subramaniam",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
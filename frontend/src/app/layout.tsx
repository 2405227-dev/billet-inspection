import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "AI Billet Inspection & Audit Platform | NIT Raipur",
  description: "Non-contact AI industrial vision, dimensional metrology, defect segmentation, OCR traceability, and cryptographically verified audit platform for steel billets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

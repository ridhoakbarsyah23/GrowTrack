import type { Metadata } from "next";
import { PublicFooter } from "./components/PublicFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowTrack",
  description: "Career growth system for promotion readiness and job readiness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <PublicFooter />
      </body>
    </html>
  );
}

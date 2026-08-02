import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathly AI",
  description: "AI Career Companion for personalized career assessment, skill gap analysis, and roadmaps.",
  icons: {
    icon: [{ url: "/brand/pathly-favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/brand/pathly-favicon.svg"],
    apple: [{ url: "/brand/pathly-logo-mark.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full" data-scroll-behavior="smooth">{children}</body>
    </html>
  );
}

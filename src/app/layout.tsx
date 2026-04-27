import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AICodeStudio — Next-Generation AI-Powered IDE",
  description: "Open-source AI-powered IDE with OpenClaw & Hermes integration, GitHub connectivity, and Monaco Editor. Build the future of coding.",
  keywords: ["AICodeStudio", "IDE", "AI", "OpenClaw", "Hermes", "GitHub", "Monaco Editor", "VSCode", "Open Source", "Code Editor"],
  authors: [{ name: "AICodeStudio Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AICodeStudio — Next-Generation AI-Powered IDE",
    description: "Open-source AI-powered IDE with OpenClaw & Hermes integration",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AICodeStudio",
    description: "Next-Generation AI-Powered IDE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0d1117] text-[#e6edf3]`}
      >
        {children}
      </body>
    </html>
  );
}

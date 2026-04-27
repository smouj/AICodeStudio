import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0e14",
}

export const metadata: Metadata = {
  title: "AICodeStudio — AI-Powered IDE",
  description: "Next-generation open-source AI-powered IDE with OpenClaw & Hermes integration, GitHub connectivity, and Monaco Editor. Install as a desktop application.",
  keywords: ["AICodeStudio", "IDE", "AI", "OpenClaw", "Hermes", "GitHub", "Monaco Editor", "VSCode", "Open Source", "PWA", "Code Editor", "Desktop App"],
  authors: [{ name: "AICodeStudio Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "AICodeStudio — AI-Powered IDE",
    description: "Next-generation open-source AI-powered IDE. Install as a desktop app.",
    type: "website",
    images: [{ url: "/social-banner.svg", width: 1280, height: 640 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AICodeStudio",
    description: "Next-Generation AI-Powered IDE",
    images: ["/social-banner.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AICodeStudio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

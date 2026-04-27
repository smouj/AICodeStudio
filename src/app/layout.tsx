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
  themeColor: "#080c12",
}

export const metadata: Metadata = {
  title: "AICodeStudio — AI-Powered IDE",
  description: "Next-generation open-source AI-powered IDE with OpenClaw & Hermes integration, GitHub connectivity, Monaco Editor, and PWA desktop installation. Code smarter, faster, with AI by your side.",
  keywords: [
    "AICodeStudio", "IDE", "AI", "OpenClaw", "Hermes", "GitHub", "Monaco Editor",
    "VSCode", "Open Source", "PWA", "Code Editor", "Desktop App", "Web IDE",
    "AI Code Assistant", "TypeScript", "Next.js"
  ],
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
    description: "Next-generation open-source AI-powered IDE. Install as a desktop app. Code smarter with AI.",
    type: "website",
    url: "https://smouj.github.io/AICodeStudio",
    images: [{ url: "/social-banner.svg", width: 1280, height: 640, alt: "AICodeStudio Banner" }],
    siteName: "AICodeStudio",
  },
  twitter: {
    card: "summary_large_image",
    title: "AICodeStudio — AI-Powered IDE",
    description: "Next-Generation AI-Powered IDE. Open Source. Installable. AI-First.",
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
        <meta name="application-name" content="AICodeStudio" />
        <meta name="msapplication-TileColor" content="#080c12" />
        <meta name="msapplication-starturl" content="/" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoreTax - Sistem Manajemen Pajak",
  description: "Sistem manajemen pajak modern yang efisien dan mudah digunakan untuk administrasi perpajakan Indonesia.",
  keywords: ["CoreTax", "Pajak", "Tax Management", "Indonesia", "Perpajakan", "SPT", "NPWP"],
  authors: [{ name: "CoreTax Team" }],
  openGraph: {
    title: "CoreTax - Sistem Manajemen Pajak",
    description: "Sistem manajemen pajak modern yang efisien dan mudah digunakan",
    url: "https://coretax.id",
    siteName: "CoreTax",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoreTax - Sistem Manajemen Pajak",
    description: "Sistem manajemen pajak modern yang efisien dan mudah digunakan",
  },
  icons: {
    icon: [
      { url: "/coretax-logo.png" },
      { url: "/favicon.png" }
    ],
    apple: "/coretax-logo.png",
    shortcut: "/coretax-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json?v=1" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CoreTax" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/coretax-logo.png?v=1" type="image/png" />
        <link rel="apple-touch-icon" href="/coretax-logo.png?v=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <script src="/cache-bust.js" async></script>
      </body>
    </html>
  );
}

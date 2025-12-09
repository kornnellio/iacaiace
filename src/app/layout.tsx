import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { auth } from "@/lib/auth/authOptions";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { AnnouncementBar } from "@/components/shared/AnnouncementBar";
import Script from "next/script";

import "@fontsource/fjalla-one/400.css";
import "@fontsource/source-sans-pro/400.css";
import "@fontsource/source-sans-pro/600.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "iaCaiace.ro",
  description: "iaCaiace.ro",
  icons: {
    icon: "/square_logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        {/* Google Ads Global Site Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-16886522730"
          strategy="afterInteractive"
        />
        <Script id="google-ads-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16886522730');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} bg-gray-50 ${geistMono.variable} antialiased`}
      >
        <AnnouncementBar />
        <CartProvider>
          <AuthProvider session={session}>
            <Toaster />
            <CookieConsent />
            {children}
          </AuthProvider>
        </CartProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { MainLayout } from "@/components/layout/MainLayout";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GridTrade - Decentralized Grid Trading Protocol",
  description:
    "Maximize your trading profits with automated grid trading strategies on-chain",
  keywords: [
    "grid trading",
    "defi",
    "decentralized",
    "crypto",
    "trading",
    "blockchain",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-4JNLLH80NH"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4JNLLH80NH');
          `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        <Web3Provider>
          <MainLayout>{children}</MainLayout>
        </Web3Provider>
      </body>
    </html>
  );
}

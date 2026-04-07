import ErudaInit from './eruda-init';
import UserProviderWrapper from './user-provider';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Material Web Typography setup
import { styles as typescaleStyles } from '@material/web/typography/md-typescale-styles.js';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StatVision - Basketball Analytics",
  description: "Advanced basketball analytics platform for players and teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/material-symbols.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <UserProviderWrapper>
          <ErudaInit />
          {children}
        </UserProviderWrapper>
      </body>
    </html>
  );
}

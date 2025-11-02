import Header from '@/components/Header';
import ErudaInit from './eruda-init';
import UserProviderWrapper from './user-provider';
import SideNav from '@/components/SideNav';
import BottomNav from '@/components/BottomNav';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { styles as typescaleStyles } from '@material/web/typography/md-typescale-styles.js';

if (typeof window !== 'undefined') {
  document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
}

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
                    <SideNav />
                    <div className="main-content-wrapper">
                      {children}
                    </div>
                    <BottomNav />        </UserProviderWrapper>
      </body>
    </html>
  );
}
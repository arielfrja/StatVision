/* eslint-disable */
import ErudaInit from './eruda-init';
import UserProviderWrapper from './user-provider';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
      <body className={`${inter.variable} antialiased`}>
        <link rel="stylesheet" href="/material-symbols.css" />
        <UserProviderWrapper>
          <ErudaInit />
          {children}
        </UserProviderWrapper>
      </body>
    </html>
  );
}

import ClientProviders from './client-providers';
import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

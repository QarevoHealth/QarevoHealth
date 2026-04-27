import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qarevo Health",
  description: "Telemedicine Platform",
  icons: {
    icon: "/brand/qarevo-icon.png",
    apple: "/brand/qarevo-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-white font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

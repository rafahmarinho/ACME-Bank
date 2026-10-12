import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { BankProvider } from "@/components/bank-provider";
import "./globals.css";

const geistSans = Manrope({
  variable: "--font-acme",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACME Bank | Your money, in motion",
  description:
    "ACME Bank digital banking workspace. Simulated accounts, payments, and cards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <BankProvider>{children}</BankProvider>
      </body>
    </html>
  );
}

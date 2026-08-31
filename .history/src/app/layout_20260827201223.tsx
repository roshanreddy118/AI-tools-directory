import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Tools Directory - Discover the Best AI Tools",
  description:
    "Search and discover AI tools across categories. Compare pricing, features, and find the perfect AI tool for your needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* Background gradient */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gray-950" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}

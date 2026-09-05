import type { Metadata } from "next";
import "./globals.css";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "魚ログ",
  description: "ダイビングで実際に出会った魚を写真と一緒に記録する魚ログ",
  icons: {
    icon: "/uolog-logo.png",
    apple: "/uolog-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <Header />
        <main className="pb-24 md:pb-10">{children}</main>
        <BottomNavigation />
      </body>
    </html>
  );
}

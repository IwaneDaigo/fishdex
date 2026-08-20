import type { Metadata } from "next";
import "./globals.css";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "魚図鑑 / FishDex",
  description: "ダイビングで実際に出会った魚を集めるMY魚図鑑"
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

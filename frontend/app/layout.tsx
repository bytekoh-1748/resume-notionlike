import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blockfolio — 블록형 이력서 편집기",
  description: "블록을 자유롭게 배치하고 발행하는 로컬 우선 이력서 스튜디오",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

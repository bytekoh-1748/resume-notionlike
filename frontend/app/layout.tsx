import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blockfolio — 이력서·포트폴리오 빌더",
  description: "이력서, 포트폴리오, 자기소개서를 블록으로 만들고 연결하는 로컬 문서 스튜디오",
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

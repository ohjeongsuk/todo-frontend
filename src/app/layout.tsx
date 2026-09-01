import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";

import { Providers } from "./Providers";

import "./globals.css";

// Pretendard는 Google Fonts에 없으므로 next/font/google을 쓸 수 없다.
// .woff2를 저장소에 넣고 next/font/local로 자체 호스팅한다.
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920", // Variable 폰트의 가변 weight 범위
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Segoe UI",
    "Apple SD Gothic Neo",
    "Malgun Gothic",
    "sans-serif",
  ],
});

// 코드 블록(Tiptap의 pre·code)에만 쓰는 고정폭 폰트
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Todo List",
    template: "%s | Todo List",
  },
  description: "할 일을 기록하고 정리하는 개인용 Todo 서비스",
};

// 다크 모드를 OS 설정으로만 전환하므로 브라우저 UI에도 같은 신호를 준다
export const viewport: Viewport = {
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        {/* 토스트는 OS 다크 설정을 따른다. class 전략을 쓰지 않으므로 theme="system"이다 */}
        <Toaster theme="system" position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

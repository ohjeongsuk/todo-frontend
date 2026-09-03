import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import { ThemeToaster } from "@/components/layout/ThemeToaster";

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

// 라이트·다크 양쪽을 지원한다는 신호를 브라우저 기본 UI(스크롤바 등)에도 준다
export const viewport: Viewport = {
  colorScheme: "light dark",
};

/**
 * 첫 페인트 전에 테마를 확정하는 스크립트 (PRD F-33: "첫 로드 시 색이 번쩍이지 않는다").
 *
 * <head>의 동기 스크립트라 body가 그려지기 전에 실행된다. 저장된 선택이 없으면 OS 설정을
 * 읽어 light/dark 중 하나로 확정하므로, data-theme이 비어 있는 채로 칠해지는 프레임이 없다.
 * 번들 밖에서 실행되므로 useTheme.ts의 THEME_STORAGE_KEY를 import할 수 없다 —
 * 키 문자열이 양쪽에 각각 박혀 있으니 한쪽만 바꾸면 조용히 어긋난다.
 */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("todo_theme");var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // 서버는 테마를 알 수 없으므로 light로 렌더하고 위 스크립트가 즉시 교정한다.
    // 그 교정이 곧 서버 HTML과의 불일치이므로 suppressHydrationWarning이 필요하다.
    <html
      lang="ko"
      data-theme="light"
      suppressHydrationWarning
      className={`${pretendard.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <ThemeToaster />
      </body>
    </html>
  );
}

/**
 * 로그인·가입 화면의 레이아웃.
 *
 * 공통 헤더를 두지 않는다. 아직 인증되지 않아 닉네임을 알 수 없다.
 * (main) 그룹과 갈라놓은 이유가 이것이다.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}

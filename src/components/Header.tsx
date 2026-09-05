import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-foam/85 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black tracking-normal text-abyss">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uolog-logo.png" alt="" className="h-10 w-10 rounded-full object-contain" />
          <span>魚ログ</span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <Link className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white" href="/dex">
            MY図鑑
          </Link>
          <Link className="rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-soft" href="/identify">
            魚を登録する
          </Link>
        </nav>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";

const messages = ["魚を探しています...", "模様を確認しています...", "候補を絞り込んでいます..."];

export function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % messages.length), 1400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-lg bg-abyss p-6 text-center text-white shadow-soft">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-reef" />
      <p className="font-black">{messages[index]}</p>
      <p className="mt-2 text-sm text-white/70">AIによる推定結果を準備しています。</p>
    </div>
  );
}

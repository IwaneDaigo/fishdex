"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translateAuthError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const action =
        mode === "login"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });
      const { error } = await action;
      if (error) {
        setMessage(translateAuthError(error.message));
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? translateAuthError(error.message) : "認証に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-5 shadow-soft">
      <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "login" ? "bg-abyss text-white" : "text-slate-600"}`}
          onClick={() => setMode("login")}
        >
          ログイン
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "signup" ? "bg-abyss text-white" : "text-slate-600"}`}
          onClick={() => setMode("signup")}
        >
          新規登録
        </button>
      </div>
      <label className="block text-sm font-bold text-slate-700">
        メールアドレス
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="block text-sm font-bold text-slate-700">
        パスワード
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3"
          type="password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {message ? <p className="rounded-lg bg-coral/10 p-3 text-sm font-bold text-coral">{message}</p> : null}
      <button className="w-full rounded-full bg-coral px-5 py-3 font-bold text-white shadow-soft disabled:opacity-60" disabled={loading}>
        {loading ? "送信中..." : mode === "login" ? "ログインする" : "登録する"}
      </button>
    </form>
  );
}

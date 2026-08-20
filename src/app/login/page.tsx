import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="shell py-8">
      <section className="mx-auto max-w-md">
        <p className="text-sm font-black tracking-[0.16em] text-kelp">FISHDEX ACCOUNT</p>
        <h1 className="mt-3 text-3xl font-black text-abyss">ログイン</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          ダイビングで出会った魚だけを、あなた専用の図鑑に記録します。
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </div>
  );
}

import { ResultClient } from "./ResultClient";

export default function IdentifyResultPage() {
  return (
    <div className="shell py-8">
      <section className="mx-auto max-w-2xl">
        <p className="text-sm font-black tracking-[0.16em] text-kelp">AI RESULT</p>
        <h1 className="mt-3 text-3xl font-black text-abyss">AI判定結果</h1>
        <div className="mt-6">
          <ResultClient />
        </div>
      </section>
    </div>
  );
}

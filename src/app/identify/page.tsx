import { IdentifyForm } from "./IdentifyForm";

export default function IdentifyPage() {
  return (
    <div className="shell py-8">
      <section className="mx-auto max-w-2xl">
        <p className="text-sm font-black tracking-[0.16em] text-kelp">ADD ENCOUNTER</p>
        <h1 className="mt-3 text-3xl font-black text-abyss">魚を登録する</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          写真と撮影情報をもとにAIが候補を出します。図鑑への登録は、あなたが確認してから行います。
        </p>
        <div className="mt-6">
          <IdentifyForm />
        </div>
      </section>
    </div>
  );
}

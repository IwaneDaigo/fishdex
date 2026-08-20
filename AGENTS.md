# FishDex 開発ルール

- TypeScriptを使用する。
- `any` の乱用は禁止する。
- UIテキストは基本的に日本語にする。
- APIキーをクライアントへ露出させない。
- Supabase RLSを有効化する。
- Geminiの返答を信用せずZodで検証する。
- Gemini判定をユーザー確認なしで図鑑へ確定登録しない。
- ビジネスロジックとUIを可能な限り分離する。
- 変更後はlint/typecheck/test/buildを実行する。
- 将来の機能を先回りして過剰実装しない。

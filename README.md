# 魚ログ

ダイビング中に実際に出会った魚を、写真・撮影情報・AI魚種候補と一緒に集めるMVPです。AI判定は候補表示までで、図鑑登録は必ずユーザー確認後に行います。

## 技術スタック

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth / PostgreSQL / Storage
- Gemini API（サーバー側REST呼び出し）
- Zod
- Vitest

## 必要環境

- Node.js 20以上
- Supabase project
- Gemini API key

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` に以下を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.7-flash
USE_GEMINI_MOCK=true
```

`USE_GEMINI_MOCK=true` の場合、Gemini APIキーがなくても固定の魚種候補を返します。本番では `USE_GEMINI_MOCK=false` とし、`GEMINI_API_KEY` を設定してください。MVPの通常動作では `SUPABASE_SERVICE_ROLE_KEY` は未設定でも動きます。

Geminiを有効化する場合:

```bash
GEMINI_API_KEY=<Google AI Studioで作成したAPIキー>
GEMINI_MODEL=gemini-3.7-flash
USE_GEMINI_MOCK=false
```

Gemini APIが429/5xxを返した場合は短いリトライを行い、それでも失敗すると写真を保存したまま手入力用の候補を返します。

## Supabase設定

Supabase CLIを使う場合:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

SQL Editorで適用する場合は、`supabase/migrations/202608200001_create_fishdex_mvp.sql` を実行してください。

作成される主なリソース:

- `profiles`
- `fish_species`
- `encounters`
- `user_fish_dex`
- Storage bucket `encounter-photos`
- RLS policies
- RPC `register_fish_encounter`

Storageの保存パスは `{userId}/{uuid}.{extension}` です。RLS/Storage policyにより、ユーザーは自分のフォルダ配下のみ操作できます。

## 開発コマンド

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Cloudflare Sites向けの `npm run build` とは別に、自前サーバーでは以下を使います。

```bash
npm run build:server
npm run start
```

## VPS / Docker デプロイ

自前サーバーへ公開する場合は、Docker Compose + Nginx の構成を用意しています。

```bash
cp .env.example .env.production
docker compose up -d --build
```

詳しい手順は `docs/deploy-vps.md` を参照してください。

## ディレクトリ構成

```text
src/app                 App Router pages and API routes
src/components          共通UI
src/lib/gemini          Gemini client, schema, identify service
src/lib/supabase        Supabase clients and storage helpers
src/lib/encounters      登録ロジック
src/lib/fish            魚種名の正規化
supabase/migrations     DB/RLS/Storage/RPC migration
```

## MVPフロー

1. `/login` でメール・パスワード認証
2. `/identify` で写真と撮影情報を入力
3. `/api/identify` がStorageへ写真保存し、サーバー側からGeminiへ判定依頼
4. `/identify/result` で最大3候補を確認・修正
5. `/api/encounters` がRPCで魚種解決、遭遇記録作成、MY図鑑更新
6. 初遭遇なら `NEW SPECIES!`、再遭遇なら遭遇回数更新
7. `/dex` と `/dex/[speciesId]` でMY図鑑と遭遇履歴を表示

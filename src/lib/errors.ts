import { z } from "zod";

export function toUserMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0];
    const fieldName = firstIssue?.path.join(".");
    if (fieldName) {
      return `入力内容を確認してください。「${fieldName}」の形式が正しくありません。`;
    }

    return "入力内容を確認してください。数値や文字数が正しい範囲に収まっている必要があります。";
  }

  const message = errorMessage(error);
  return translateKnownError(message) ?? fallback;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return String(error ?? "");
}

export function translateKnownError(message: string) {
  const lower = message.toLowerCase();

  if (!message) return null;
  if (lower.includes("column reference") && lower.includes("ambiguous")) {
    return "データベース関数の列名が重複しています。最新のSQLをSupabaseに再適用してください。";
  }
  if (lower.includes("violates row-level security")) {
    return "このデータを操作する権限がありません。ログイン状態を確認してください。";
  }
  if (lower.includes("jwt") || lower.includes("session")) {
    return "ログイン状態を確認してください。もう一度ログインすると解決する場合があります。";
  }
  if (lower.includes("duplicate key")) {
    return "同じデータがすでに登録されています。";
  }
  if (lower.includes("invalid input syntax") || lower.includes("invalid timestamp")) {
    return "入力された日付や数値の形式が正しくありません。";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "ネットワーク接続に失敗しました。通信状態を確認してもう一度試してください。";
  }
  if (lower.includes("gemini_api_key")) {
    return "Gemini APIキーが設定されていません。mock modeを有効にするか、APIキーを設定してください。";
  }
  if (lower.includes("gemini returned an empty response")) {
    return "AIから空の返答が返りました。時間をおいてもう一度試してください。";
  }

  return null;
}

export function translateAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (lower.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。受信メールを確認してください。";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "このメールアドレスはすでに登録されています。ログインを試してください。";
  }
  if (lower.includes("password") && lower.includes("characters")) {
    return "パスワードは必要な文字数を満たしていません。";
  }
  if (lower.includes("rate limit")) {
    return "短時間に試行回数が多すぎます。少し待ってからもう一度試してください。";
  }

  return translateKnownError(message) ?? "認証に失敗しました。入力内容を確認してください。";
}

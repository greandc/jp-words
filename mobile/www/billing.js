// mobile/www/billing.js
// =======================================
// 広告削除（Ad-free）用の「なんちゃって課金」ロジック
// - 本番では Google Play Billing に置き換える前提
// =======================================

const LS_KEY_REMOVE_ADS = "jpVocab.removeAds.purchased";

/**
 * 初期化（今は何もしない）
 * - boot.js から一度だけ呼ばれている前提
 */
export async function initBilling() {
  // ここは後で Google Play Billing の初期化を入れる想定
  console.log("[billing] initBilling (dummy)");
}

/**
 * 広告削除を購入済みかどうか
 * - true なら全画面広告を出さない
 */
export function isAdRemoved() {
  try {
    return localStorage.getItem(LS_KEY_REMOVE_ADS) === "1";
  } catch {
    return false;
  }
}

/**
 * 「広告削除」を購入する処理（今はダミー）
 * - 本番ではここで Billing の purchase フローを実行
 */
export async function purchaseRemoveAds() {
  if (isAdRemoved()) {
    return true;
  }

  const ok = window.confirm(
    "Buy Ad-free option?\n\n※ 今はテスト用のダミーです（実際には課金されません）。"
  );
  if (!ok) return false;

  try {
    localStorage.setItem(LS_KEY_REMOVE_ADS, "1");
  } catch {}

  console.log("[billing] purchased remove-ads (dummy)");
  return true;
}

/**
 * 購入を復元する処理（今はダミー）
 * - 将来、サーバー or Billing 履歴から確認する想定
 */
export async function restorePurchase() {
  // 今は「ローカルに 1 が入っていたら購入済み扱い」にするだけ
  if (isAdRemoved()) {
    return true;
  }

  // 将来用のダミー
  alert("Restore Purchase is not implemented yet.\n(placeholder)");
  return false;
}

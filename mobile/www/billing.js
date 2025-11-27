// mobile/www/billing.js
// 課金まわりの仮実装（まだ Play Billing なし）

// 起動時に呼ばれる初期化
export async function initBilling() {
  console.log("[billing] init (stub)");
  // まだ何もしない
}

// 広告解除済みかどうか
export function isAdRemoved() {
  // まだ課金を実装していないので、常に「未購入」
  return false;
}

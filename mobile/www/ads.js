// mobile/www/ads.js
console.log("[ads] src = v1");

function isNative() {
  try {
    return !!window.Capacitor?.isNativePlatform?.() &&
           window.Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
}

let admob = null;
let initialized = false;

// ======== インタースティシャル用 ========

// AdMob のインタースティシャル広告ユニット ID
const INTERSTITIAL_AD_ID = "ca-app-pub-3807814255813325/9462103809";

let interstitialReady   = false;
let interstitialLoading = false;

// AdMob プラグインを取得（initBannerAds の中で一度だけ呼ばれている想定）
function ensureAdmobPlugin() {
  if (admob) return admob;
  try {
    admob = window.Capacitor?.Plugins?.AdMob || null;
  } catch (_) {
    admob = null;
  }
  return admob;
}

// インタースティシャルを事前ロード
async function loadInterstitialIfNeeded() {
  if (!isNative()) return;
  if (interstitialLoading || interstitialReady) return;

  const p = ensureAdmobPlugin();
  if (!p || !initialized) return;

  interstitialLoading = true;
  try {
    console.log("[ads] prepare interstitial");
    // ※ @capacitor-community/admob を想定
    await p.prepareInterstitial({
      adId: INTERSTITIAL_AD_ID,
      // isTesting: true,   // 本番前にテストしたいならコメント外す
    });
    interstitialReady = true;
  } catch (e) {
    console.error("[ads] prepareInterstitial error", e);
    interstitialReady = false;
  } finally {
    interstitialLoading = false;
  }
}

// テスト終了時に呼ぶ用：Lv5 以降で 2 回に 1 回だけ表示
import { isAdRemoved } from "../billing.js"; // 仮

export async function maybeShowTestInterstitial(level) {
  // ★ 課金済みなら即終了
  if (isAdRemoved()) return;

  // ここから先は今のロジックのまま

  try {
    if (!isNative()) return;

    const p = ensureAdmobPlugin();
    if (!p || !initialized) return;

    // Lv5 未満は広告ナシ
    if (level < 5) {
      // ついでに次回用にロードだけしておく
      loadInterstitialIfNeeded();
      return;
    }

    // 何回テストを終えたかをローカルに保存しておく
    const key = "jpVocab.ads.testCount";
    let cnt = Number(localStorage.getItem(key) || "0");
    cnt += 1;
    localStorage.setItem(key, String(cnt));

    // 奇数回 → 広告なし（でも次回用にロード）
    if (cnt % 2 === 1) {
      loadInterstitialIfNeeded();
      return;
    }

    // 偶数回 → 広告を出す（準備できてなければロードしてから）
    if (!interstitialReady) {
      await loadInterstitialIfNeeded();
    }

    if (!interstitialReady) {
      // 準備失敗ならあきらめる
      return;
    }

    console.log("[ads] show interstitial");
    await p.showInterstitial();
    interstitialReady = false;

    // 見終わったあとに次回分をロード
    loadInterstitialIfNeeded();
  } catch (e) {
    console.error("[ads] maybeShowTestInterstitial error", e);
    interstitialReady = false;
  }
}


/**
 * アプリ起動時に 1 回だけ呼ぶ
 */
export async function initBannerAds() {
  if (!isNative()) {
    console.log("[ads] not native, skip");
    return;
  }

  const plugins = window.Capacitor?.Plugins || window.Capacitor?.plugins;
  if (!plugins?.AdMob) {
    console.log("[ads] AdMob plugin not found");
    return;
  }
  admob = plugins.AdMob;

  if (initialized) return;
  initialized = true;

  try {
    // AdMob 初期化
    await admob.initialize();

    // そのままバナーを表示（常時表示）
    await showMainBanner();
  } catch (err) {
    console.log("[ads] init error", err);
  }
}

/**
 * 画面下にメインのバナーを表示
 */
export async function showMainBanner() {
  if (!admob) return;

  try {
    await admob.showBanner({
      // あなたのバナー広告ユニット ID
      adId: "ca-app-pub-3807814255813325/2540761791",
      adSize: "ADAPTIVE_BANNER",          // = BannerAdSize.BANNER
      position: "BOTTOM_CENTER", // = BannerAdPosition.BOTTOM_CENTER
      margin: 0,
      // isTesting: true,  // テスト ID を使うならこっちは false のままでOK
    });

    // 「バナー広告スペース（仮）」の文字は消しておく
    document.querySelectorAll(".banner-slot").forEach((el) => {
      if (!el.dataset.adBound) {
        el.textContent = "";
        el.dataset.adBound = "1";
      }
    });
  } catch (err) {
    console.log("[ads] showBanner error", err);
  }
}

/**
 * 必要ならバナーを隠す用（今は使わなくてOK）
 */
export async function hideBanner() {
  if (!admob) return;
  try {
    await admob.hideBanner();
  } catch (err) {
    console.log("[ads] hideBanner error", err);
  }
}

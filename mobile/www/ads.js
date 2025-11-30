// mobile/www/ads.js (修正版)
console.log("[ads] src = v2-fixed");

function isNative() {
  try {
    return !!window.Capacitor?.isNativePlatform?.() &&
           window.Capacitor.isNativePlatform();
  } catch (e) { return false; }
}

let admob = null;
let initialized = false;

// ======== インタースティシャル (ここは変更なし) ========
const INTERSTITIAL_AD_ID = "ca-app-pub-3940256099942544/1033173712";

let interstitialReady   = false;
let interstitialLoading = false;

function ensureAdmobPlugin() {
  if (admob) return admob;
  try {
    admob = window.Capacitor?.Plugins?.AdMob || null;
  } catch (_) { admob = null; }
  return admob;
}

async function loadInterstitialIfNeeded() {
  if (!isNative() || interstitialLoading || interstitialReady) return;
  const p = ensureAdmobPlugin();
  if (!p || !initialized) return;
  interstitialLoading = true;
  try {
    console.log("[ads] prepare interstitial");
    await p.prepareInterstitial({ adId: INTERSTITIAL_AD_ID });
    interstitialReady = true;
  } catch (e) {
    console.error("[ads] prepareInterstitial error", e);
    interstitialReady = false;
  } finally {
    interstitialLoading = false;
  }
}

import { isAdRemoved } from "../billing.js";

export async function maybeShowTestInterstitial(level) {
  if (isAdRemoved()) return;
  try {
    if (!isNative()) return;
    const p = ensureAdmobPlugin();
    if (!p || !initialized) return;
    if (level < 5) {
      loadInterstitialIfNeeded();
      return;
    }
    const key = "jpVocab.ads.testCount";
    let cnt = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(cnt));
    if (cnt % 2 === 1) {
      loadInterstitialIfNeeded();
      return;
    }
    if (!interstitialReady) await loadInterstitialIfNeeded();
    if (!interstitialReady) return;
    console.log("[ads] show interstitial");
    await p.showInterstitial();
    interstitialReady = false;
    loadInterstitialIfNeeded();
  } catch (e) {
    console.error("[ads] maybeShowTestInterstitial error", e);
    interstitialReady = false;
  }
}

/**
 * アプリ起動時に 1 回だけ呼ぶ（初期化だけする）
 */
export async function initBannerAds() {
  if (!isNative()) return console.log("[ads] not native, skip");
  if (initialized) return;

  const p = ensureAdmobPlugin();
  if (!p) return console.log("[ads] AdMob plugin not found");

  try {
    console.log("[ads] AdMob initializing...");
    await p.initialize();
    initialized = true;
    console.log("[ads] AdMob initialized!");

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★ ここにあった showMainBanner() の呼び出しを削除しました！ ★
    // ★ これで、起動時に勝手にバナーが表示されることはなくなります 
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

  } catch (err) {
    console.log("[ads] init error", err);
  }
}

/**
 * 画面下にメインのバナーを表示
 * (バナーが必要なページが、自分のタイミングで呼ぶ)
 */
export async function showMainBanner() {
  if (isAdRemoved()) return; // 課金済みは表示しない
  if (!initialized || !isNative()) return;
  const p = ensureAdmobPlugin();
  if (!p) return;

  try {
    console.log("[ads] showMainBanner called");
    await p.showBanner({
      
      adId: "ca-app-pub-3807814255813325/2540761791",
      adSize: "ADAPTIVE_BANNER",
      position: "BOTTOM_CENTER",
      margin: 0,
    });
  } catch (err) {
    console.error("[ads] showBanner error", err);
  }
}

/**
 * バナーを非表示にする
 * (ページ遷移の直前に呼ぶ)
 */
export async function hideBanner() {
  if (!initialized || !isNative()) return;
  const p = ensureAdmobPlugin();
  if (!p) return;

  try {
    console.log("[ads] hideBanner called");
    await p.hideBanner();
  } catch (err) {
    console.error("[ads] hideBanner error", err);
  }
}

/**
 * バナーを完全に破棄する
 * (ページ遷移の直前に呼ぶ、hideより確実)
 */
export async function destroyBanner() {
  if (!initialized || !isNative()) return;
  const p = ensureAdmobPlugin();
  if (!p) return;

  try {
    console.log("[ads] destroyBanner called");
    // @capacitor-community/admob v5から、hide/removeが統合された
    await p.removeBanner();
  } catch (err) {
    // 古いバージョン用のフォールバック
    if (/hidebanner/i.test(err.message || '')) {
       try { await p.hideBanner(); } catch(e2) { console.error("[ads] fallback hide error", e2); }
    } else {
       console.error("[ads] destroyBanner error", err);
    }
  }
}
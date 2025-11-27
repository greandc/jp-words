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
      adSize: "BANNER",          // = BannerAdSize.BANNER
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

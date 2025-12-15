// app/public/boot.js
// === Native（Capacitor）では Service Worker を無効化 ===
(async () => {
  const isNative =
    !!window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform();

  if (!isNative) return;

  if (!("serviceWorker" in navigator)) return;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    // 念のためキャッシュも削除
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    console.log("[SW] unregistered on native");
  } catch (e) {
    console.log("[SW] unregister failed:", e);
  }
})();

import './main.js?v=20251102';
import * as ViewNumbers  from "./numbers/view.js";
import * as ViewHira     from "./hiragana/view.js";
import * as ViewKata     from "./katakana/view.js";
import { initBannerAds } from "./ads.js";
import { initBilling } from "../billing.js";

(async () => {
  try {
    await initBilling();
  } catch (e) {
    console.error("[billing] init error", e);
  }
})();

try {
  initBannerAds();
} catch (e) {
  console.error("[ads] initBannerAds error", e);
}







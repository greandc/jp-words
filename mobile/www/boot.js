// app/public/boot.js
import './main.js?v=20251102';
import * as ViewNumbers  from "./numbers/view.js";
import * as ViewHira     from "./hiragana/view.js";
import * as ViewKata     from "./katakana/view.js";
import { initBannerAds } from "./ads.js";



if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}





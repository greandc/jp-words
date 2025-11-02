// app/public/boot.js
import './main.js?v=${window.APP_VER}';   // ← public から 1つ上(app/) の main.js を読む

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}





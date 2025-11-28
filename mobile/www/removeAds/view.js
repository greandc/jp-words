// mobile/www/removeAds/view.js
import { t } from "../i18n.js";
import { isAdRemoved, purchaseRemoveAds, restorePurchase } from "../billing.js";

/**
 * Remove Ads 画面
 * - Menu1 から deps.goto("removeAds") で遷移してくる想定
 */
export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "screen";

  const purchased = isAdRemoved();

  div.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      padding:24px 16px;
      box-sizing:border-box;
      text-align:center;
      gap:20px;
    ">
      <div>
        <h1 style="margin:0 0 12px;font-size:1.7rem;">
          ${t("removeAds.title") || "Remove Ads"}
        </h1>
        <p style="margin:0 0 4px;font-size:.95rem;color:#374151;">
          ${
            t("removeAds.desc1") ||
            "Remove full-screen ads and enjoy JP-Words without interruptions."
          }
        </p>
        <p style="margin:0;font-size:.9rem;color:#6b7280;">
          ${
            t("removeAds.desc2") ||
            "One-time purchase. Ad-free is valid for this device."
          }
        </p>
      </div>

      <div style="width:100%;max-width:420px;display:flex;flex-direction:column;gap:12px;">

        <button
          id="btnPurchase"
          class="btn btn-removeads"
          style="width:100%;padding:14px 0;font-size:1rem;"
        >
          ${
            purchased
              ? t("removeAds.purchased") || "Ads already removed ✅"
              : t("removeAds.purchaseBtn") || "Purchase Ad-free"
          }
        </button>

        <button
          id="btnRestore"
          class="btn"
          style="width:100%;padding:10px 0;font-size:.9rem;background:#e5e7eb;border-color:#d1d5db;color:#374151;"
        >
          ${t("removeAds.restore") || "Restore Purchase"}
        </button>

        <button
          id="btnBack"
          class="btn"
          style="width:100%;padding:12px 0;font-size:1rem;margin-top:8px;"
        >
          ${t("common.back") || "Back"}
        </button>

      </div>

      <p style="margin-top:8px;font-size:.8rem;color:#9ca3af;">
        ${
          t("removeAds.note") ||
          "※ This is a test implementation. In the release version, payment will be handled by Google Play / App Store."
        }
      </p>
    </div>
  `;

  el.appendChild(div);

  const btnPurchase = div.querySelector("#btnPurchase");
  const btnRestore  = div.querySelector("#btnRestore");
  const btnBack     = div.querySelector("#btnBack");

  // すでに購入済みなら購入ボタンは押せないように
  if (purchased) {
    btnPurchase.disabled = true;
  }

  btnPurchase.addEventListener("click", async () => {
    const ok = await purchaseRemoveAds();
    if (ok) {
      alert(t("removeAds.done") || "Ads have been removed on this device.");
      btnPurchase.textContent =
        t("removeAds.purchased") || "Ads already removed ✅";
      btnPurchase.disabled = true;
    }
  });

  btnRestore.addEventListener("click", async () => {
    const ok = await restorePurchase();
    if (ok) {
      alert(
        t("removeAds.restored") ||
          "Purchase restored. Ads will be removed on this device."
      );
    }
  });

  btnBack.addEventListener("click", () => {
    deps.goto?.("menu1");
  });
}

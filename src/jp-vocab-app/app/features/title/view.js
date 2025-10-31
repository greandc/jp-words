// app/features/title/view.js
import { t } from "../../i18n.js";

export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <div style="min-height:72vh;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center">
        <img src="./assets/GreandC_Logo.png" alt="GreandC" 
             style="width:min(62vw,280px);height:auto;object-fit:contain;" />
        <div style="margin-top:16px;color:#94a3b8;letter-spacing:.18em;font-weight:700;">
          ${t("title.tap")}
        </div>
      </div>
    </div>
  `;
  el.appendChild(div);

  // どこをタップしてもメニューへ
  div.addEventListener("click", () => deps.goto?.("menu1"));
}

export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <div style="padding:20px">
      <h2>カタカナ</h2>
      <p>準備中です。</p>
      <button class="btn" id="back">Back</button>
    </div>`;
  el.appendChild(div);
  div.querySelector("#back").addEventListener("click", ()=> deps.goto?.("menu1"));
}

// app/features/results/view.js
export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h1>Results</h1>
    <p>Here is your score (temporary).</p>
    <button class="btn" id="toMenu">Back to Menu</button>
    <button class="btn" id="toQuiz">Next Quiz</button>
  `;
  el.appendChild(div);

  div.querySelector("#toMenu").addEventListener("click", () => deps.goto?.("menu"));
  div.querySelector("#toQuiz").addEventListener("click", () => deps.goto?.("quiz"));
}

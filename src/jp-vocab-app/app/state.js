// app/state.js
export function createState() {
  return {
    selection: {
      range: null, // e.g. "21-40"
      set: null,   // 1..20
      mode: null,  // "practice" | "test"
    },
  };
}

export function setRange(state, range) {
  state.selection.range = range;   // 例: "21-40"
  // 上位が変わったら下位はリセット
  state.selection.set = null;
  state.selection.mode = null;
}

export function setSet(state, n) {
  state.selection.set = n;         // 例: 5
  state.selection.mode = null;
}

export function setMode(state, mode) {
  state.selection.mode = mode;     // "practice" or "test"
}

// 例: range="21-40", set=5 → 21 + 5 - 1 = 25
export function computeAbsoluteLevel(state) {
  const r = state.selection.range;
  const s = state.selection.set;
  if (!r || !s) return null;
  const start = parseInt(r.split("-")[0], 10);
  return start + s - 1;
}

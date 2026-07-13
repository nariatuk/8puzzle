"use strict";
/* A*ソルバーの単体テスト（Node.js用・開発時検証スクリプト） */

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function neighbors(index) {
  const col = index % 3, row = Math.floor(index / 3);
  const list = [];
  if (row > 0) list.push(index - 3);
  if (row < 2) list.push(index + 3);
  if (col > 0) list.push(index - 1);
  if (col < 2) list.push(index + 1);
  return list;
}

/* マンハッタン距離ヒューリスティック */
function manhattan(b) {
  let d = 0;
  for (let i = 0; i < 9; i++) {
    const v = b[i];
    if (v === 0) continue;
    const gi = v - 1; // 完成形での位置
    d += Math.abs(i % 3 - gi % 3) + Math.abs(Math.floor(i / 3) - Math.floor(gi / 3));
  }
  return d;
}

/* 最小ヒープ（優先度付きキュー） */
class MinHeap {
  constructor() { this.a = []; }
  push(item) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

/* A*探索。動かすプレート番号の配列（最短手順）を返す */
function solve(start) {
  const startKey = start.join("");
  const goalKey = GOAL.join("");
  if (startKey === goalKey) return [];

  const open = new MinHeap();
  const gScore = new Map();      // key -> g値
  const cameFrom = new Map();    // key -> [親key, 動かしたプレート番号]

  gScore.set(startKey, 0);
  open.push({ f: manhattan(start), g: 0, key: startKey });

  while (open.size) {
    const cur = open.pop();
    if (cur.key === goalKey) {
      // 経路復元
      const moves = [];
      let k = cur.key;
      while (k !== startKey) {
        const [pk, tile] = cameFrom.get(k);
        moves.push(tile);
        k = pk;
      }
      return moves.reverse();
    }
    if (cur.g > gScore.get(cur.key)) continue; // 古いエントリはスキップ

    const b = cur.key.split("").map(Number);
    const empty = b.indexOf(0);
    for (const ni of neighbors(empty)) {
      const nb = b.slice();
      nb[empty] = nb[ni];
      nb[ni] = 0;
      const nk = nb.join("");
      const ng = cur.g + 1;
      if (ng < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, ng);
        cameFrom.set(nk, [cur.key, b[ni]]);
        open.push({ f: ng + manhattan(nb), g: ng, key: nk });
      }
    }
  }
  return null; // 到達不能（正規シャッフルでは発生しない）
}

/* ---- 検証 ---- */
function applyMoves(board, moves) {
  const b = board.slice();
  for (const tile of moves) {
    const from = b.indexOf(tile);
    const empty = b.indexOf(0);
    if (!neighbors(empty).includes(from)) throw new Error("不正な手: " + tile);
    b[empty] = tile;
    b[from] = 0;
  }
  return b;
}

function randomShuffle(times) {
  const b = GOAL.slice();
  let prevEmpty = -1;
  for (let k = 0; k < times; k++) {
    const empty = b.indexOf(0);
    const cands = neighbors(empty).filter(i => i !== prevEmpty);
    const pick = cands[Math.floor(Math.random() * cands.length)];
    b[empty] = b[pick];
    b[pick] = 0;
    prevEmpty = empty;
  }
  return b;
}

let ok = 0;
console.time("ランダム100件");
for (let t = 0; t < 100; t++) {
  const start = randomShuffle(200);
  const moves = solve(start);
  const result = applyMoves(start, moves);
  if (result.join("") !== GOAL.join("")) throw new Error("解けていない: " + start);
  ok++;
}
console.timeEnd("ランダム100件");
console.log(`ランダムシャッフル100件: 全${ok}件で完成形に到達`);

/* 最難関の配置（最短31手が必要とされる状態）*/
const hardest = [8, 6, 7, 2, 5, 4, 3, 0, 1];
console.time("最難関31手");
const hm = solve(hardest);
console.timeEnd("最難関31手");
const hr = applyMoves(hardest, hm);
console.log(`最難関配置: ${hm.length}手（期待値31手）→ ${hr.join("") === GOAL.join("") ? "完成形に到達" : "失敗"}`);

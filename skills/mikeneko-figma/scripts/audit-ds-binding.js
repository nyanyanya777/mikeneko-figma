/*
 * audit-ds-binding.js — テキストスタイル/変数バインドの機械監査スクリプト
 * =====================================================================
 * 実行環境: Figma MCP の use_figma（Plugin API を実行できる JS 環境）
 *
 * 目的: 「明言された中核要件＝全テキストをテキストスタイルに丸ごとバインド／
 *        全fill・strokeを変数バインド（テキスト色も含む）」を、LLMの自己申告でなく
 *        機械で検証する。姉妹 audit-structure.js は F-CMP-5 で "TEXTは対象外" と
 *        明記しており、テキストのスタイル/色バインドはどの機械監査にも無かった＝この穴を塞ぐ。
 *
 * なぜ要るか（事故）: 実装ワーカーが「専用サイズ段が無い」等を理由に、テキストを
 *   生フォント据え置き・"色だけ/サイズだけ" の部分バインドにして完了させ、
 *   規約/スクショ/レビュアーが全緑で素通り→ユーザー激怒（繰り返し発生）。
 *   → 判断の余地ゼロの決定論ゲートで、部分バインド・未バインド・生値を1件でも残せば不合格にする。
 *
 * 使い方:
 *   1) /figma-use をロードした上で、このファイルの中身を丸ごと use_figma の code に貼る。
 *   2) 対象指定（どちらか）:
 *      - 下の TARGET_NODE_IDS にルートノードIDを書く   例: ["123:456"]
 *      - もしくは実行前に globalThis.targetNodeIds = ["..."] を定義
 *      - 両方空なら figma.currentPage 全体を走査
 *   3) 出力(return):
 *      {
 *        pass: boolean,                 // violations.length === 0
 *        violations: [{ruleId,nodeId,nodeName,detail}],
 *        stats: { textsScanned, textsBound, textsUnbound,
 *                 fillsRaw, strokesRaw, textFillsRaw, skippedInstanceRoots }
 *      }
 *
 * 検出ルール（default-deny）:
 *   BIND-TEXT-1 unbound-text-style : TEXT の textStyleId が空（未バインド）。
 *       ★重要: Figmaは textStyleId 適用後に fontSize/fontName/lineHeight/letterSpacing 等を
 *       手動上書きすると **即スタイルをデタッチして textStyleId を空文字にする**（実測確認済み）。
 *       つまり "フォントだけ/サイズだけ手動一致" や "スタイル適用後にサイズだけ変更" は
 *       すべてここで捕まる（丸ごとバインドでない＝不合格）。
 *       mixed（複数セグメント）の場合はセグメント毎に textStyleId を見て、1つでも空セグメントが
 *       あれば未バインドとして本ルールで不合格。全セグメントが各々フルにスタイル束ねなら許容（pass）。
 *   BIND-TEXT-3 raw-text-fill      : TEXT の可視SOLID文字色が、変数にも塗りスタイルにも
 *       バインドされていない（生hex）。判定は必ずセグメントの paintレベル
 *       （seg.fills[i].boundVariables.color / seg.fillStyleId）で行う。node.fills/
 *       node.boundVariables 依存は range-bound を取りこぼし正当な色を誤検出するため使わない。
 *   BIND-FILL   raw-fill           : 非INSTANCE・非TEXTノードの可視SOLID fill が未バインド（生値）。
 *   BIND-STROKE raw-stroke         : 同上を stroke で。
 *
 * スコープ規律: INSTANCE の内部は当該コンポーネントの責務なので降りない
 *   （instanceノード自体の fill/stroke overフライドも判定しない）。
 *   よって「自分が手組みした器・テキスト」だけが監査対象になる。
 *
 * ⚠️ 実Figma初回は小さな frame で試走し、textStyleId / boundVariables /
 *    fillStyleId / figma.mixed / getStyledTextSegments の実挙動を確認すること。
 *    実測時: node 123:456(pass) / 789:12(fail 数百件) と、スタイル適用後の
 *    サイズ/フォント/字間上書き（→textStyleId空）で BIND-TEXT-1 捕捉を実ノードで検証済み。
 */

const TARGET_NODE_IDS = []; // 例: ["123:456"]

function rgbToHex(c) {
  const h = (v) => Math.round((v || 0) * 255).toString(16).padStart(2, "0");
  return "#" + h(c.r) + h(c.g) + h(c.b);
}

const violations = [];
const stats = {
  textsScanned: 0, textsBound: 0, textsUnbound: 0,
  fillsRaw: 0, strokesRaw: 0, textFillsRaw: 0, skippedInstanceRoots: 0,
};

function push(ruleId, node, detail) {
  violations.push({ ruleId, nodeId: node.id, nodeName: node.name, detail });
}

// 可視SOLID paint（fills/strokes）がバインド済みか（変数 or スタイル）。非TEXT器用。
function paintsRaw(node, prop) {
  const paints = node[prop];
  if (!Array.isArray(paints) || paints.length === 0) return;
  const styleId = prop === "fills" ? node.fillStyleId : node.strokeStyleId;
  if (typeof styleId === "string" && styleId !== "") return; // ノード全体にスタイル
  const bound = (node.boundVariables && node.boundVariables[prop]) || null; // index→alias
  paints.forEach((p, i) => {
    if (!p || p.visible === false) return;
    if (p.type !== "SOLID") return; // 生hex色だけ対象（グラデ/画像は別責務）
    if (bound && bound[i]) return;                          // node単位の変数バインド
    if (p.boundVariables && p.boundVariables.color) return; // paint単位の変数バインド（setBoundVariableForPaint）
    if (prop === "fills") stats.fillsRaw++; else stats.strokesRaw++;
    push(prop === "fills" ? "BIND-FILL" : "BIND-STROKE", node,
      `${prop}[${i}] 生値 ${rgbToHex(p.color)} が未バインド`);
  });
}

// テキストの文字色（fill）の生値監査。
// ★テキスト色のバインドは node.fills でなく「セグメントの paintレベル
//   （seg.fills[i].boundVariables.color）」に出る。node.fills / node.boundVariables 依存は
//   range-bound（同一変数の区間バインドで fills が mixed にならない等）を取りこぼし、
//   正当にバインドされた色を誤検出(false-positive)する。よって常に getStyledTextSegments で
//   paint 単位に判定する（node-level bind / range bind / mixed / 生色 の全ケースを実測検証済み）。
function checkTextFills(node) {
  if (typeof node.fillStyleId === "string" && node.fillStyleId !== "") return; // ノード全体に塗りスタイル
  const chars = (node.characters || "").slice(0, 12);
  let segs = [];
  try {
    segs = node.getStyledTextSegments(["fills", "fillStyleId"]);
  } catch (e) {
    // 取得不能時は判定不能。このゲートの目的（生色を絶対に通さない＝default-deny）に従い
    // fail-closed で不合格にする（安全側。dormantな稀ケースだが穴を残さない）。
    stats.textFillsRaw++;
    push("BIND-TEXT-3", node, `テキスト色 判定不能(getStyledTextSegments失敗)・fail-closed: "${chars}"`);
    return;
  }
  for (const seg of segs) {
    if (typeof seg.fillStyleId === "string" && seg.fillStyleId !== "") continue; // 区間に塗りスタイル
    for (const p of (seg.fills || [])) {
      if (!p || p.visible === false || p.type !== "SOLID") continue;
      if (p.boundVariables && p.boundVariables.color) continue; // paint単位の変数バインド
      stats.textFillsRaw++;
      push("BIND-TEXT-3", node, `テキスト色 生値 ${rgbToHex(p.color)} 未バインド: "${chars}"`);
    }
  }
}

function visit(node) {
  if (node.type === "TEXT") {
    stats.textsScanned++;
    const sid = node.textStyleId;
    if (sid === figma.mixed) {
      // セグメント毎に textStyleId を確認。1つでも空なら未バインド、全て束ねなら許容。
      let segs = [];
      try { segs = node.getStyledTextSegments(["textStyleId"]); } catch (e) {}
      const anyUnbound = segs.length === 0 || segs.some((s) => !s.textStyleId);
      if (anyUnbound) {
        stats.textsUnbound++;
        push("BIND-TEXT-1", node, `一部セグメント未バインド(mixed): "${(node.characters || "").slice(0, 16)}"`);
      } else {
        stats.textsBound++; // 複数スタイルだが全セグメントfullバインド＝許容
      }
    } else if (typeof sid !== "string" || sid === "") {
      stats.textsUnbound++;
      let f = null, sz = null;
      try {
        const seg = node.getStyledTextSegments(["fontName", "fontSize"]);
        if (seg[0]) { f = seg[0].fontName; sz = seg[0].fontSize; }
      } catch (e) {}
      push("BIND-TEXT-1", node,
        `未バインド: "${(node.characters || "").slice(0, 16)}" font=${f ? f.family + "/" + f.style : "?"} size=${sz}`);
    } else {
      stats.textsBound++;
    }
    checkTextFills(node); // 文字色の生値も監査
    return;
  }
  if (node.type === "INSTANCE") { stats.skippedInstanceRoots++; return; }

  if ("fills" in node) paintsRaw(node, "fills");
  if ("strokes" in node) paintsRaw(node, "strokes");

  if ("children" in node) for (const c of node.children) visit(c);
}

const roots = [];
const ids = (typeof globalThis !== "undefined" && Array.isArray(globalThis.targetNodeIds) && globalThis.targetNodeIds.length)
  ? globalThis.targetNodeIds : TARGET_NODE_IDS;
if (ids && ids.length) {
  for (const id of ids) {
    const n = await figma.getNodeByIdAsync(id);
    if (n) roots.push(n);
  }
} else {
  for (const c of figma.currentPage.children) roots.push(c);
}

for (const r of roots) visit(r);

return { pass: violations.length === 0, violations, stats };

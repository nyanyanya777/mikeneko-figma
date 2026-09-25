/*
 * audit-ds-binding.js — テキストスタイル/変数バインドの機械監査スクリプト
 * =====================================================================
 * 実行環境: Figma MCP の use_figma（Plugin API を実行できる JS 環境）
 *
 * 目的: 「明言された中核要件＝全テキストをテキストスタイルに丸ごとバインド／
 *        全fill・strokeを変数バインド（テキスト色も含む）／auto-layoutの
 *        spacing・padding／cornerRadius／effectも変数バインド」を、LLMの
 *        自己申告でなく機械で検証する。姉妹 audit-structure.js は F-CMP-5 で
 *        "TEXTは対象外" と明記しており、テキストのスタイル/色バインドは
 *        どの機械監査にも無かった＝この穴を塞ぐ。spacing/radius/effectの
 *        機械監査も同様に穴だった（デザインチェック強化・「1. 機械層」）。
 *
 * なぜ要るか（事故）: 実装ワーカーが「専用サイズ段が無い」等を理由に、テキストを
 *   生フォント据え置き・"色だけ/サイズだけ" の部分バインドにして完了させ、
 *   規約/スクショ/レビュアーが全緑で素通り→ユーザー激怒（繰り返し発生）。
 *   → 判断の余地ゼロの決定論ゲートで、部分バインド・未バインド・生値を1件でも残せば不合格にする。
 *   同様に、余白・角丸・エフェクトの生値混在（変数化されたコンポーネントの隣に生pxのフレームを
 *   置く等）もスクショと印象語のレビューではすり抜けていた。
 *
 * 使い方:
 *   1) /figma-use をロードした上で、このファイルの中身を丸ごと use_figma の code に貼る。
 *   2) 対象指定（どちらか）:
 *      - 下の TARGET_NODE_IDS にルートノードIDを書く   例: ["123:456"]
 *      - もしくは実行前に globalThis.targetNodeIds = ["..."] を定義
 *      - 両方空なら figma.currentPage 全体を走査
 *   3) 監査範囲の絞り込み（任意・違反の報告だけを絞る。走査自体とfactsは変えない）:
 *      - 下の TARGET_IDS に「今回触ったノードのid」を書くと、そのid以外のノードで
 *        見つかった違反は結果から除外される（既存の負債スコープ外に合わせる用途）。
 *        例: ["123:500","123:520"]
 *      - もしくは実行前に globalThis.touchedNodeIds = ["..."] を定義
 *      - 空なら従来どおり走査範囲全体の違反をすべて報告する（既存呼び出しはこれ）
 *   4) 出力(return):
 *      {
 *        pass: boolean,                 // violations.length === 0 かつ 1件以上走査した
 *        violations: [{ruleId,nodeId,nodeName,detail}],
 *        stats: { textsScanned, textsBound, textsUnbound,
 *                 fillsRaw, strokesRaw, textFillsRaw, skippedInstanceRoots,
 *                 spaceRaw, radiusRaw, effectsRaw, nodesScanned },
 *        facts: [{                      // ルート直下の FRAME ごと。判定役(Fable)に渡す数字。
 *          frameId, frameName,
 *          surfaceFillVarCount, surfaceFillVarNames,   // fillにバインドされた変数のうちsurface/background/bgを名前に含む種類数
 *          textStyleVarietyCount,                      // 使われているtextStyleIdの種類数
 *          siblingAutoLayoutSpacing: [{nodeId,nodeName,vars:[{key,varName}]}], // auto-layoutコンテナごとのspacing/padding変数名
 *          primaryElementCount, primaryElements: [{nodeId,nodeName}], // primary処理の操作要素(INSTANCE)の数と名前
 *        }]
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
 *   BIND-SPACE  raw-spacing        : layoutMode が HORIZONTAL/VERTICAL のノードの
 *       itemSpacing・paddingLeft/Right/Top/Bottom が変数バインドされていない（生値）。
 *       counterAxisSpacing は layoutWrap==="WRAP" のときだけ見る（WRAPしないなら未使用値のため対象外）。
 *       値が 0・null・undefined はスキップ（余白なし=判定対象外）。
 *       primaryAxisAlignItems==="SPACE_BETWEEN" のときは itemSpacing が実質無効な設定値なのでスキップ。
 *   BIND-RADIUS raw-radius         : cornerRadius が変数バインドされていない（生値）。
 *       0 はスキップ。cornerRadius が figma.mixed の場合は topLeftRadius 等4隅を個別に判定し、
 *       0 でない隅ごとに boundVariables[コーナー名] を確認する。
 *   BIND-EFFECT raw-effect         : effects が空でなく、effectStyleId も空で、
 *       可視 effect ごとに boundVariables.effects[i] が無ければ違反（影の生値混在を検出）。
 *
 *   raw:/abs: 等の宣言例外による免除は入れない（audit-structure.js の F-CMP-5/F-QLT-5 と同じ方針＝
 *   「宣言例外でもバインドは必須」。名前prefixで免除される機械監査はこのファイルには無い）。
 *
 * スコープ規律: INSTANCE の内部は当該コンポーネントの責務なので降りない
 *   （instanceノード自体の fill/stroke/spacing/radius/effect オーバーライドも判定しない）。
 *   よって「自分が手組みした器・テキスト」だけが監査対象になる。
 *
 * facts は違反ではなく、判定役(Fable)が見た目の質を数字で確認するための補助データ。
 *   TARGET_IDS の絞り込みは violations にのみ効き、facts はルート直下FRAME全体で計算する
 *   （姉妹画面と比べる・段数が効いているかを見るには周辺文脈が要るため）。
 *
 * ⚠️ 実Figma初回は小さな frame で試走し、textStyleId / boundVariables /
 *    fillStyleId / figma.mixed / getStyledTextSegments の実挙動を確認すること。
 *    実測時: node 123:456(pass) / 789:12(fail 数百件) と、スタイル適用後の
 *    サイズ/フォント/字間上書き（→textStyleId空）で BIND-TEXT-1 捕捉を実ノードで検証済み。
 *    BIND-SPACE/BIND-RADIUS/BIND-EFFECT/facts は追加分・実Figma未実測（机上実装。
 *    モックFigmaグローバルでのNode単体テストのみ実施。boundVariables のキー名
 *    （itemSpacing/paddingLeft.../cornerRadius/topLeftRadius.../effects）と
 *    figma.variables.getVariableByIdAsync の実挙動は初回試走で必ず確認すること）。
 */

const TARGET_NODE_IDS = []; // 例: ["123:456"]
const TARGET_IDS = []; // 今回触ったノードのid。例: ["123:500"]。空なら従来どおり全違反を報告

function rgbToHex(c) {
  const h = (v) => Math.round((v || 0) * 255).toString(16).padStart(2, "0");
  return "#" + h(c.r) + h(c.g) + h(c.b);
}

const violations = [];
const stats = {
  textsScanned: 0, textsBound: 0, textsUnbound: 0,
  fillsRaw: 0, strokesRaw: 0, textFillsRaw: 0, skippedInstanceRoots: 0,
  spaceRaw: 0, radiusRaw: 0, effectsRaw: 0, nodesScanned: 0,
};

// TARGET_IDS（今回触ったノード）による違反レポートの絞り込み。空なら絞り込まない。
const _touchedIds =
  (typeof globalThis !== "undefined" && Array.isArray(globalThis.touchedNodeIds) && globalThis.touchedNodeIds.length)
    ? globalThis.touchedNodeIds : TARGET_IDS;
const touchedSet = (_touchedIds && _touchedIds.length) ? new Set(_touchedIds) : null;

function push(ruleId, node, detail) {
  if (touchedSet && !touchedSet.has(node.id)) return; // 監査範囲外（今回触っていない）は報告しない
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

// spacing系の値が「判定対象外（余白なし）」かどうか。0/null/undefinedはスキップ。
function isSkippableSpacingValue(v) {
  return v === 0 || v === null || v === undefined;
}

// BIND-SPACE: auto-layoutのitemSpacing/padding*/counterAxisSpacingの変数バインド監査。
function checkSpaceBinding(node) {
  const mode = node.layoutMode;
  if (mode !== "HORIZONTAL" && mode !== "VERTICAL") return;
  const bound = node.boundVariables || {};

  // itemSpacing（SPACE_BETWEENは実質無効な設定値なのでスキップ）
  if (node.primaryAxisAlignItems !== "SPACE_BETWEEN" && !isSkippableSpacingValue(node.itemSpacing)) {
    if (!(bound.itemSpacing && bound.itemSpacing.id)) {
      stats.spaceRaw++;
      push("BIND-SPACE", node, `itemSpacing 生値 ${node.itemSpacing} が未バインド`);
    }
  }

  // padding系
  for (const key of ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"]) {
    const val = node[key];
    if (isSkippableSpacingValue(val)) continue;
    if (!(bound[key] && bound[key].id)) {
      stats.spaceRaw++;
      push("BIND-SPACE", node, `${key} 生値 ${val} が未バインド`);
    }
  }

  // counterAxisSpacing（WRAP時のみ見る）
  if (node.layoutWrap === "WRAP" && !isSkippableSpacingValue(node.counterAxisSpacing)) {
    if (!(bound.counterAxisSpacing && bound.counterAxisSpacing.id)) {
      stats.spaceRaw++;
      push("BIND-SPACE", node, `counterAxisSpacing 生値 ${node.counterAxisSpacing} が未バインド`);
    }
  }
}

// BIND-RADIUS: cornerRadius（mixedなら4隅個別）の変数バインド監査。0はスキップ。
function checkRadiusBinding(node) {
  if (!("cornerRadius" in node)) return;
  const bound = node.boundVariables || {};
  const cr = node.cornerRadius;
  if (typeof cr === "number") {
    if (cr === 0) return;
    if (!(bound.cornerRadius && bound.cornerRadius.id)) {
      stats.radiusRaw++;
      push("BIND-RADIUS", node, `cornerRadius 生値 ${cr} が未バインド`);
    }
    return;
  }
  if (typeof figma !== "undefined" && cr === figma.mixed) {
    const corners = [
      ["topLeftRadius", node.topLeftRadius],
      ["topRightRadius", node.topRightRadius],
      ["bottomLeftRadius", node.bottomLeftRadius],
      ["bottomRightRadius", node.bottomRightRadius],
    ];
    for (const [key, val] of corners) {
      if (typeof val !== "number" || val === 0) continue;
      if (!(bound[key] && bound[key].id)) {
        stats.radiusRaw++;
        push("BIND-RADIUS", node, `${key} 生値 ${val} が未バインド(mixed)`);
      }
    }
  }
}

// BIND-EFFECT: effectStyleIdが空で、可視effectごとにboundVariables.effects[i]が無ければ違反。
function checkEffectBinding(node) {
  if (!("effects" in node) || !Array.isArray(node.effects) || node.effects.length === 0) return;
  if (typeof node.effectStyleId === "string" && node.effectStyleId !== "") return; // ノード全体にeffectスタイル
  const boundEffects = (node.boundVariables && node.boundVariables.effects) || null;
  node.effects.forEach((e, i) => {
    if (!e || e.visible === false) return;
    // 変数は effect ごとの boundVariables（color/radius/spread/offsetX/offsetY）に個別に付く。
    // どれか1つだけ変数でも他が生値なら違反（色だけ変数・radius生値のシャドウを通さない）。
    const bv = Object.assign({}, (boundEffects && boundEffects[i]) || {}, e.boundVariables || {});
    const unbound = [];
    if (e.color && !bv.color) unbound.push("color");
    if (typeof e.radius === "number" && e.radius !== 0 && !bv.radius) unbound.push("radius");
    if (typeof e.spread === "number" && e.spread !== 0 && !bv.spread) unbound.push("spread");
    if (e.offset && typeof e.offset.x === "number" && e.offset.x !== 0 && !bv.offsetX) unbound.push("offsetX");
    if (e.offset && typeof e.offset.y === "number" && e.offset.y !== 0 && !bv.offsetY) unbound.push("offsetY");
    if (unbound.length === 0) return;
    stats.effectsRaw++;
    push("BIND-EFFECT", node, `effects[${i}]${e.type ? "(" + e.type + ")" : ""} の ${unbound.join("/")} が未バインド`);
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
  stats.nodesScanned++;
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
  checkSpaceBinding(node);
  checkRadiusBinding(node);
  checkEffectBinding(node);

  if ("children" in node) for (const c of node.children) visit(c);
}

// ===== facts: 判定役(Fable)に渡す数字。ルート直下のFRAMEごとに計算する。 =====
const SURFACE_NAME_RE = /surface|background|bg/i;
const varNameCache = new Map();

async function getVarName(id) {
  if (!id) return null;
  if (varNameCache.has(id)) return varNameCache.get(id);
  let name = null;
  try {
    if (figma.variables && typeof figma.variables.getVariableByIdAsync === "function") {
      const v = await figma.variables.getVariableByIdAsync(id);
      name = v ? v.name : null;
    } else if (figma.variables && typeof figma.variables.getVariableById === "function") {
      const v = figma.variables.getVariableById(id);
      name = v ? v.name : null;
    }
  } catch (e) {
    name = null;
  }
  varNameCache.set(id, name);
  return name;
}

async function collectFillVarNames(node, surfaceVarNames) {
  const paints = node.fills;
  if (!Array.isArray(paints)) return;
  const boundArr = (node.boundVariables && node.boundVariables.fills) || null;
  for (let i = 0; i < paints.length; i++) {
    const p = paints[i];
    if (!p || p.visible === false || p.type !== "SOLID") continue;
    let varId = null;
    if (boundArr && boundArr[i] && boundArr[i].id) varId = boundArr[i].id;
    else if (p.boundVariables && p.boundVariables.color && p.boundVariables.color.id) varId = p.boundVariables.color.id;
    if (!varId) continue;
    const name = await getVarName(varId);
    if (name && SURFACE_NAME_RE.test(name)) surfaceVarNames.add(name);
  }
}

async function collectFrameFacts(frame) {
  const surfaceVarNames = new Set();
  const textStyleIds = new Set();
  const siblingAutoLayoutSpacing = [];
  const primaryElements = [];

  const stack = [frame];
  while (stack.length) {
    const node = stack.pop();

    if (node.type === "TEXT") {
      const sid = node.textStyleId;
      if (typeof figma !== "undefined" && sid === figma.mixed) {
        try {
          const segs = node.getStyledTextSegments(["textStyleId"]);
          for (const s of segs) if (s.textStyleId) textStyleIds.add(s.textStyleId);
        } catch (e) {}
      } else if (typeof sid === "string" && sid !== "") {
        textStyleIds.add(sid);
      }
      continue; // TEXTは子を持たない・surface集計の対象外
    }

    if (node.type === "INSTANCE") {
      let props = node.variantProperties || null;
      if (!props && node.componentProperties) {
        props = {};
        for (const k in node.componentProperties) {
          const entry = node.componentProperties[k];
          if (entry && typeof entry.value !== "undefined") props[k] = entry.value;
        }
      }
      if (props) {
        for (const key in props) {
          const val = props[key];
          if (typeof val === "string" && /primary/i.test(val)) {
            primaryElements.push({ nodeId: node.id, nodeName: node.name });
            break;
          }
        }
      }
      if ("fills" in node) await collectFillVarNames(node, surfaceVarNames);
      continue; // INSTANCE内部には降りない
    }

    if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
      const bound = node.boundVariables || {};
      const spacingKeys = ["itemSpacing", "paddingLeft", "paddingRight", "paddingTop", "paddingBottom"];
      if (node.layoutWrap === "WRAP") spacingKeys.push("counterAxisSpacing");
      const vars = [];
      for (const key of spacingKeys) {
        const bv = bound[key];
        if (bv && bv.id) {
          const name = await getVarName(bv.id);
          vars.push({ key, varName: name || bv.id });
        }
      }
      siblingAutoLayoutSpacing.push({ nodeId: node.id, nodeName: node.name, vars });
    }

    if ("fills" in node) await collectFillVarNames(node, surfaceVarNames);

    if ("children" in node) for (const c of node.children) stack.push(c);
  }

  return {
    frameId: frame.id,
    frameName: frame.name,
    surfaceFillVarCount: surfaceVarNames.size,
    surfaceFillVarNames: Array.from(surfaceVarNames),
    textStyleVarietyCount: textStyleIds.size,
    siblingAutoLayoutSpacing,
    primaryElementCount: primaryElements.length,
    primaryElements,
  };
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

const facts = [];
for (const r of roots) {
  if (r.type === "FRAME") facts.push(await collectFrameFacts(r));
}

return { pass: violations.length === 0 && stats.nodesScanned > 0, violations, stats, facts };

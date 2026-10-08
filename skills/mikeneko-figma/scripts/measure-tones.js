/*
 * measure-tones.js — 成果物の「濃さ・太さ・線の強さ・余白」を数えるスクリプト（読み取り専用）
 * =====================================================================
 * 実行環境: Figma MCP の use_figma（Plugin API を実行できる JS 環境）。何も書き込まない。
 *
 * 目的（F-QLT-10）: 面の色・線の色・文字の色と太さ・余白を、感覚でなく値で並べる。
 *   見本側の値は姉妹スクリプト measure-reference.js（ブラウザで実行）で取り、
 *   この出力と同じ場所どうしを突き合わせる。手順は
 *   skills/figma-design-create/references/tone-measure.md。
 *
 * 使い方:
 *   1) /figma-use をロードした上で、このファイルの中身を丸ごと use_figma の code に貼る。
 *   2) 対象指定（どちらか）:
 *      - 下の TARGET_NODE_IDS に画面フレームのIDを書く   例: ["123:456"]
 *      - もしくは実行前に globalThis.targetNodeIds = ["..."] を定義
 *      - 両方空なら何もせず error を返す（ページ全体を黙って走査しない）
 *   3) 出力(return): { roots: [{ id, name, size, surfaces, lines, texts, darkFills, spacing, heights }] }
 *      - surfaces: 面の「色×変数」ごとの { color, onWhite, variable, nodes, area, examples }（面積の大きい順・上位14件）
 *      - lines:    線の「色×変数×kind」ごとの { color, onWhite, variable, kind, nodes, examples }（件数の多い順・上位14件）
 *                  kind = "row"（表の行）/ "control"（ボタン・入力欄など操作部品）/ "structure"（それ以外＝面の境目や枠）
 *      - texts:    文字の { size, weight, style, color, variable, nodes, examples }（件数の多い順・上位24件）
 *                  weight は数値（400, 500 …。見本側の measure-reference.js と同じ単位）、style は "Regular" などの名前
 *      - darkFills: 明るさ 0.2 未満の塗り面（黒いボタン・黒いバーの見落とし用・上位12件）
 *      variable は、その色がバインドされている変数名。null は変数にバインドされていない値
 *      （生の値か、スタイル経由。F-QLT-5 の合否は audit-ds-binding.js で見る）。
 *      onWhite は、半透明の色を白地に重ねたときの実効色（不透明なら出さない）。
 *      - spacing: 余白。部品（INSTANCE）の内側は数えず、画面を組んでいる箱（auto-layout のフレーム）だけを見る
 *          values:         「gap か padding × 値 × 変数」ごとの { prop, value, variable, nodes, examples }（件数の多い順・上位20件）
 *                          nodes は、gap は箱の数、padding は辺の数（上下左右を1つずつ数える）
 *          boxes:          箱ごとの内側余白「上/右/下/左」の件数（上位10件。見本側の density.paddings と同じ形）
 *          offScale:       変数に結びついていない値のうち、SPACING_STEP の倍数でないもの（下の定数。0 にすると出さない）
 *                          バインド監査の前に見る下調べ用。変数に結びついていない余白の合否は audit-ds-binding.js の BIND-SPACE が決める
 *                          （監査の範囲に入っている箱は、監査を通ったあとは空になる。範囲の外の既存の値は残る）。
 *                          変数に結びついた値は、4 の倍数でなくても出さない
 *          nearPairs:      2px 以内で並んでいる紛らわしい値の組（例: 14 と 16）。各値の件数と変数名つき。
 *                          両方とも変数に結びついている組は、DS の正規の段なので出さない
 *          sameNameDiffer: 同じ名前の箱なのに、内側余白か間隔が違う組（先頭12件と総数。総称的な名前と raw: / abs: で始まる名前は除く。
 *                          子が1つで間隔の無い箱は、内側余白だけで比べる）
 *          asymmetric:     左右、または上下の内側余白が違う箱（先頭10件と総数。意図したものかを見る）
 *      - heights: 部品の高さ。{ rows, controls, others } に分けて返す（各 { name, height, nodes }。件数の多い順・各上位8件。密度を見本と比べる用）
 *                 どれも INSTANCE の高さ＝部品が決めている値。見本と差があっても画面側で上書きせず、部品の variant を選び直すか、
 *                 部品の改修として相談する（tone-measure.md §6）
 *
 * 実績: 面・線・文字を色ごとに数える部分は、実案件の画面で同じ処理を流して使っている。
 *   変数名の取得（variable）、祖先の部品名での kind 判定、別ページの読み込み（loadAsync）、余白と部品の高さ
 *   （spacing / heights）を足したこの版は、Figma の木を模したデータで動作を確かめただけで、実Figmaでは未実測。
 *   初めて使うファイルでは、小さいフレーム1つで試走する。
 *
 * 注意:
 *   - 非表示のノードと、非表示の祖先を持つノードは数えない。
 *   - kind の判定はノード名の正規表現（下の ROW_RE / CONTROL_RE）。線を持つノード自身と、その祖先の INSTANCE の名前を見る。
 *     キットの命名に合わせて書き換える。
 *   - 色の不透明度が 1 未満のときは "@0.20" のように併記する。ノード自体の opacity、線の太さは見ない。
 *   - 塗りの矩形で引いた区切り線は、線でなく面に数える。
 *   - 余白は構造の値（padding / itemSpacing）で、描画上の見え方（文字の上下の空き、中心軸のずれ）までは分からない。
 *     揃えは、レビューで描画か絶対座標を測って確かめる（tone-measure.md の「確かめる」）。
 *   - 子が1つの箱と、primaryAxisAlignItems が SPACE_BETWEEN の箱の間隔は数えない（見た目に効かないため）。
 */

// ===== 対象指定（ここを書き換えるか globalThis.targetNodeIds を使う） =====
const TARGET_NODE_IDS = []; // 例: ["123:456"]
// ===== 線の分類（ノード名で判定。ファイルの命名に合わせて書き換える） =====
const ROW_RE = /^(Table \/ (Head|Cell)|Table ?Row|Row|List ?Item)/i;
const CONTROL_RE = /^(Button|Badge|Input|InputGroup|Select|Date Picker|Pagination|Checkbox|Radio|Switch|Tabs?|Toggle|Chip)/i;
// ===== 余白の分類 =====
const SPACING_STEP = 4; // この倍数でない余白を offScale に出す。0 で無効
const GENERIC_NAME_RE = /^(Frame|Flex|Div|Group|Auto ?layout|Container|Row|Column|Stack|Wrapper|Content|Section)( ?\d+)?$|^(raw|abs):/i; // 同名比較から外す名前（総称的な名前と、例外コードの名前）
const r1 = (v) => Math.round((v || 0) * 10) / 10; // 15.999 のような端数を丸める

const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const label = (p) => hex(p.color) + (p.opacity !== undefined && p.opacity < 1 ? "@" + p.opacity.toFixed(2) : "");

const onWhite = (p) => (p.opacity !== undefined && p.opacity < 1
  ? hex({ r: 1 + (p.color.r - 1) * p.opacity, g: 1 + (p.color.g - 1) * p.opacity, b: 1 + (p.color.b - 1) * p.opacity })
  : undefined);
const VAR_CACHE = {};
async function varById(id) {
  try {
    if (!id) return null;
    if (!(id in VAR_CACHE)) {
      const v = await figma.variables.getVariableByIdAsync(id);
      VAR_CACHE[id] = v ? v.name : null;
    }
    return VAR_CACHE[id];
  } catch (e) {
    return null;
  }
}
async function varName(paint) {
  const b = paint.boundVariables && paint.boundVariables.color;
  return b && b.id ? varById(b.id) : null;
}
async function spaceVar(node, prop) {
  const b = node.boundVariables && node.boundVariables[prop];
  return b && b.id ? varById(b.id) : null;
}
function insideInstance(node, root) {
  let p = node.parent;
  while (p && p.id !== root.parent.id) {
    if (p.type === "INSTANCE") return true;
    p = p.parent;
  }
  return false;
}
function lineKind(node, root) {
  let p = node, first = true;
  while (p && p.id !== root.parent.id) {
    if (first || p.type === "INSTANCE") {
      if (ROW_RE.test(p.name)) return "row";
      if (CONTROL_RE.test(p.name)) return "control";
    }
    first = false;
    p = p.parent;
  }
  return "structure";
}
function visibleUnder(node, root) {
  let p = node;
  while (p && p.id !== root.parent.id) {
    if (p.visible === false) return false;
    p = p.parent;
  }
  return true;
}
function bump(map, key, init, name) {
  if (!map[key]) map[key] = Object.assign({ nodes: 0, examples: [] }, init);
  map[key].nodes++;
  if (map[key].examples.length < 3 && !map[key].examples.includes(name)) map[key].examples.push(name);
  return map[key];
}

const ids = (typeof globalThis !== "undefined" && Array.isArray(globalThis.targetNodeIds) && globalThis.targetNodeIds.length)
  ? globalThis.targetNodeIds : TARGET_NODE_IDS;
if (!ids || !ids.length) return { error: "TARGET_NODE_IDS が空です。測る画面フレームのIDを指定してください。" };

const out = [];
for (const id of ids) {
  const root = await figma.getNodeByIdAsync(id);
  if (!root) { out.push({ id, error: "node not found" }); continue; }
  if (root.type === "PAGE" || root.type === "DOCUMENT") { out.push({ id, error: "画面フレームのIDを指定してください（ページやドキュメントは測らない）" }); continue; }
  let pg = root;
  while (pg && pg.type !== "PAGE") pg = pg.parent;
  if (pg && typeof pg.loadAsync === "function") await pg.loadAsync(); // 別ページのノードでも子を読めるようにする
  const surfaces = {}, lines = {}, texts = {}, dark = {};
  const space = {}, byName = {}, asym = [], heights = {}, boxSigs = {};
  let asymTotal = 0;
  for (const n of [root, ...root.findAll(() => true)]) {
    if (!visibleUnder(n, root)) continue;
    const short = (n.name || "").slice(0, 24);
    if (n.type === "TEXT") {
      const f = n.fills !== figma.mixed && n.fills.length && n.fills[0].type === "SOLID" ? n.fills[0] : null;
      const style = n.fontName === figma.mixed ? "mixed" : n.fontName.style;
      const weight = n.fontWeight === figma.mixed ? "mixed" : n.fontWeight;
      const size = n.fontSize === figma.mixed ? "mixed" : n.fontSize;
      const color = f ? label(f) : "mixed";
      const variable = f ? await varName(f) : null;
      bump(texts, size + "|" + weight + "|" + color + "|" + variable, { size, weight, style, color, variable }, (n.characters || "").slice(0, 12));
      continue;
    }
    // ---- 余白と部品の高さ
    const inInst = insideInstance(n, root);
    if (n.type === "INSTANCE") {
      const kind = ROW_RE.test(n.name) ? "row" : CONTROL_RE.test(n.name) ? "control" : "other";
      if (kind !== "other" || !inInst) bump(heights, kind + "|" + short + "|" + Math.round(n.height), { kind, name: short, height: Math.round(n.height) }, short);
    } else if (!inInst && (n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL")) {
      const pad = { paddingTop: r1(n.paddingTop), paddingRight: r1(n.paddingRight), paddingBottom: r1(n.paddingBottom), paddingLeft: r1(n.paddingLeft) };
      const padSig = [pad.paddingTop, pad.paddingRight, pad.paddingBottom, pad.paddingLeft].join("/");
      if (padSig !== "0/0/0/0") boxSigs[padSig] = (boxSigs[padSig] || 0) + 1;
      for (const [prop, value] of Object.entries(pad)) {
        if (!value) continue;
        const variable = await spaceVar(n, prop);
        bump(space, "padding|" + value + "|" + variable, { prop: "padding", value, variable }, short);
      }
      const kids = (n.children || []).filter((c) => c.visible !== false);
      const gap = kids.length >= 2 && n.primaryAxisAlignItems !== "SPACE_BETWEEN" ? r1(n.itemSpacing) : null;
      if (gap) bump(space, "gap|" + gap + "|" + (await spaceVar(n, "itemSpacing")), { prop: "gap", value: gap, variable: await spaceVar(n, "itemSpacing") }, short);
      if (!GENERIC_NAME_RE.test(n.name || "")) {
        const g = byName[n.name] = byName[n.name] || { pads: {}, gaps: {}, count: 0 };
        g.count++;
        g.pads[padSig] = (g.pads[padSig] || 0) + 1;
        if (gap !== null) g.gaps[gap] = (g.gaps[gap] || 0) + 1; // 間隔の無い箱（子が1つ等）は、内側余白だけで比べる
      }
      if (pad.paddingLeft !== pad.paddingRight || pad.paddingTop !== pad.paddingBottom) {
        asymTotal++;
        if (asym.length < 10) asym.push({ name: short, id: n.id, padding: padSig });
      }
    }
    if ("fills" in n && n.fills !== figma.mixed) {
      for (const f of n.fills) {
        if (f.type !== "SOLID" || f.visible === false || (f.opacity !== undefined && f.opacity < 0.02)) continue;
        if (n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION") continue; // アイコンは面に数えない
        const area = Math.round((n.width || 0) * (n.height || 0));
        const variable = await varName(f);
        const e = bump(surfaces, label(f) + "|" + variable, { color: label(f), onWhite: onWhite(f), variable, area: 0 }, short);
        e.area += area;
        if (lum(f.color) < 0.2 && (f.opacity === undefined || f.opacity > 0.5)) bump(dark, label(f) + "|" + short, { color: label(f), name: short, size: Math.round(n.width) + "x" + Math.round(n.height) }, short);
      }
    }
    if ("strokes" in n && n.strokes.length && n.type !== "VECTOR" && n.type !== "BOOLEAN_OPERATION") {
      const s = n.strokes[0];
      if (s.type !== "SOLID" || s.visible === false || (s.opacity !== undefined && s.opacity < 0.02)) continue;
      const kind = lineKind(n, root);
      const variable = await varName(s);
      bump(lines, label(s) + "|" + kind + "|" + variable, { color: label(s), onWhite: onWhite(s), variable, kind }, short);
    }
  }
  const list = (m, by) => Object.values(m).sort(by);
  const spaceVals = list(space, (a, b) => b.nodes - a.nodes);
  const nearPairs = [];
  for (const prop of ["gap", "padding"]) {
    const byVal = {};
    for (const v of spaceVals.filter((x) => x.prop === prop)) {
      const e = byVal[v.value] = byVal[v.value] || { value: v.value, nodes: 0, variables: [], raw: 0 };
      e.nodes += v.nodes;
      if (v.variable) e.variables.push(v.variable); else e.raw += v.nodes;
    }
    const vs = Object.values(byVal).sort((a, b) => a.value - b.value);
    for (let i = 0; i + 1 < vs.length; i++) {
      if (vs[i + 1].value - vs[i].value > 2) continue;
      if (vs[i].raw === 0 && vs[i + 1].raw === 0) continue; // 両方とも変数＝DS の正規の段
      nearPairs.push({ prop, pair: [vs[i], vs[i + 1]] });
    }
  }
  const differing = Object.entries(byName).filter(([, g]) => Object.keys(g.pads).length > 1 || Object.keys(g.gaps).length > 1);
  const sameNameDiffer = differing
    .map(([name, g]) => ({ name: name.slice(0, 32), boxes: g.count, paddings: g.pads, gaps: g.gaps }))
    .slice(0, 12);
  const hk = (kind) => list(heights, (a, b) => b.nodes - a.nodes).filter((h) => h.kind === kind).slice(0, 8).map(({ name, height, nodes }) => ({ name, height, nodes }));
  out.push({
    id: root.id,
    name: root.name,
    size: Math.round(root.width) + "x" + Math.round(root.height),
    surfaces: list(surfaces, (a, b) => b.area - a.area).slice(0, 14),
    lines: list(lines, (a, b) => b.nodes - a.nodes).slice(0, 14),
    texts: list(texts, (a, b) => b.nodes - a.nodes).slice(0, 24),
    darkFills: list(dark, (a, b) => b.nodes - a.nodes).slice(0, 12),
    spacing: {
      values: spaceVals.slice(0, 20),
      boxes: Object.entries(boxSigs).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([padding, nodes]) => ({ padding, nodes })),
      offScale: SPACING_STEP ? spaceVals.filter((v) => !v.variable && v.value % SPACING_STEP !== 0).slice(0, 12) : [],
      nearPairs,
      sameNameDiffer,
      sameNameDifferTotal: differing.length,
      asymmetric: asym,
      asymmetricTotal: asymTotal,
    },
    heights: { rows: hk("row"), controls: hk("control"), others: hk("other") },
  });
}
return { roots: out };

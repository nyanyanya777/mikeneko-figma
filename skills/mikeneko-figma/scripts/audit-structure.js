/*
 * audit-structure.js — Figmaデザイン構造ルールの機械監査スクリプト
 * =====================================================================
 * 実行環境: Figma MCP の use_figma（Plugin API を実行できる JS 環境）
 *
 * 目的: LLM の自己申告監査を置き換え、構造ルール違反を機械検出する。
 *
 * 使い方:
 *   1) /figma-use スキルをロードした上で、このファイルの中身を丸ごと
 *      use_figma の code に貼って実行する（コードは async 文脈で実行され、
 *      await / return が使える前提。最後の return 値がツール結果になる）。
 *   2) 対象の指定（どちらか）:
 *      - 下の TARGET_NODE_IDS 配列に監査したいルートノードIDを書く
 *          例: const TARGET_NODE_IDS = ["123:456", "789:12"];
 *      - もしくは実行前に globalThis.targetNodeIds = ["123:456"] を定義しておく
 *      - 両方とも空なら figma.currentPage 全体を走査する
 *   3) 出力: return 値 兼 console.log で以下の JSON を返す。
 *      {
 *        violations: [{ ruleId, nodeId, nodeName, detail }, ...],
 *        stats: { scanned, skipped, byRule: { "F-STR-1": n, ... },
 *                 styledInstances, styledTotal, instanceRatio: "n/m",
 *                 fcmp5Skipped, declaredExceptions: [{ruleId,id,name}, ...],
 *                 fcmp6Clusters, fcmp6DeclaredExceptions: [{id,name}, ...] },
 *        fcmp5: { green: boolean, reason: string },  // F-CMP-5のみfail-closed
 *        pageCheck: { green: boolean, reason: string } // F-PAGE-*のfail-closed（globalThis.expectedPageId未指定ならgreen=true）
 *      }
 *
 * ⚠️ 初回は小さな frame（数十ノード程度）で試走せよ。currentPage 全走査は
 *    大きいファイルではタイムアウト/低速になり得る。
 * ⚠️ 追加当初は実Figmaファイル未検証（机上実装）。API名（特に
 *    getNodeByIdAsync / getStyledTextSegments / getRangeFontSize / mixed 周り）
 *    の実挙動は初回試走で必ず確認し、必要なら修正すること。
 * ⚠️ F-CMP-5 / F-QLT-5(部分) の追加分も同じく実Figma未実測
 *    （机上実装。ロジックはモックJSONで単体検証済みだが、boundVariables /
 *    cornerRadius mixed / effects の実挙動は初回試走で必ず確認すること）。
 *
 * 検出ルール:
 *   F-STR-1 spacerSuspects        : auto-layout親の子で、fills/strokesが実質無し
 *                                   かつ子無しの FRAME/RECTANGLE、または
 *                                   /spacer|space|gap|blank|dummy/i 名
 *   F-STR-2 nonAutoLayout         : FRAME/COMPONENT/INSTANCE 直下にあり、
 *                                   子が2つ以上なのに layoutMode==='NONE' の frame系
 *   F-QLT-3 smallText             : fontSize < 14 の TEXT（mixedは最小値で判定）
 *   F-CMP-2 fakeComponentSuspects : INSTANCE でないのにローカルコンポーネント名
 *                                   または一般部品名を名乗る FRAME/GROUP
 *   F-QLT-2 contrastRisks         : TEXT の SOLID fill 色 × 最近傍 SOLID 塗り祖先の
 *                                   背景色で WCAG コントラスト比を計算（best-effort）。
 *                                   fontSize >= 18.66px（≒14pt。bold14pt以上相当の
 *                                   近似も兼ねる）は <3、それ以外は <4.5 をフラグ。
 *                                   グラデ/画像 fill は skipped として集計。
 *   F-CMP-5 styledNonInstance     : 視覚スタイル（可視fill / 可視stroke / 可視effect /
 *                                   cornerRadius>0。mixedは個別radiusで判定）を直接
 *                                   持つ非INSTANCE・非COMPONENT(_SET)のシェイプ系
 *                                   ノード（FRAME/GROUP/RECTANGLE/ELLIPSE/VECTOR/
 *                                   LINE/POLYGON/STAR/BOOLEAN_OPERATION）は
 *                                   default-deny で違反。
 *                                   TEXTはF-CMP-5対象外（テキストスタイル/変数バインド
 *                                   はF-QLT系の責務）。
 *                                   例外は名前prefix raw:/abs: の宣言のみ
 *                                   （stats.declaredExceptions に記録。台帳との
 *                                   N=N突合は外側工程の責務）。INSTANCE配下は判定・
 *                                   集計から除外（mainComponent側の責務・分母から
 *                                   除外）。COMPONENT/COMPONENT_SET配下も同様に除外
 *                                   （マスター内部はfigma-component-designゲートの
 *                                   責務）。このルールのみ fail-closed:
 *                                   判定スキップ1件でも fcmp5.green=false。
 *                                   ルート解決失敗・children列挙失敗もfcmp5Skippedに
 *                                   計上し、走査0件（scanned===0）は無条件で
 *                                   green=false（走査0件=不合格）。
 *   F-QLT-5 (部分)                : raw:/abs:宣言例外ノードでも、fillが変数バインド
 *                                   （boundVariables.fills）されていなければ違反
 *                                   （宣言例外でもraw値は不可）。boundVariablesが
 *                                   取得不能な構造なら skipped に計上して深追いしない。
 *   F-PAGE-1 pageMismatch         : EXPECTED_PAGE_ID 指定時、rootの所属pageが一致しない
 *   F-PAGE-2 hiddenAncestor        : rootまたはその祖先に visible===false が1件でもある
 *   F-PAGE-3 degenerateBounds      : root.absoluteBoundingBoxがnull、またはwidth/height<=0
 *   F-CMP-6 duplicateFrameClusters: 非INSTANCE配下・非COMPONENT(_SET)配下の FRAME /
 *                                   GROUP について（SOT F-CMP-6逐語「フレーム/グループ」
 *                                   に一致。GROUP拡張はF-CMP-6の複製集計のみで、
 *                                   F-STR系など他検査の対象は変えない）、シグネチャ=
 *                                   （正規化した自ノード名）＋（直下children の
 *                                   type:name 列）を生成し、同一シグネチャの出現数を
 *                                   集計。未宣言ノード数と同一children構成のraw:宣言
 *                                   済み例外数の合算 >=2 のクラスタをF-CMP-6違反として
 *                                   報告（violations の nodeId=代表node-id、detail に
 *                                   出現数と全出現位置の node-id。未宣言1件+raw:例外
 *                                   >=1件も閾値割れさせず未宣言側を違反として報告）。
 *                                   raw: 命名ノードは宣言済み例外として集計から除外し
 *                                   （一覧は stats.fcmp6DeclaredExceptions、台帳との
 *                                   突合は外側工程の責務）、直下children構成が一致する
 *                                   クラスタが違反になった場合は detail に除外件数を
 *                                   注記（raw:リネームで自ノード名は一致し得ないため
 *                                   children構成のみで照合）。
 *                                   INSTANCE配下は mainComponent 由来の自動複製、
 *                                   COMPONENT_SET内は variant 同士が同名同構成になる
 *                                   設計のため、いずれも違反に数えない。
 *                                   2コピー則のゲート配線（入口SOT F-CMP-6）。
 *                                   実Figma未実測（机上実装・初回試走必須）。
 *
 * 実装方針:
 *   - 非同期API対応（documentAccess: dynamic-page でも動くよう getNodeByIdAsync 使用。
 *     現ページのみの走査なら figma.loadAllPagesAsync は不要）
 *   - ノード単位 try/catch。失敗は skipped に集計して全体を止めない
 *   - 深い再帰はスタック配列による反復走査（コールスタック溢れ防止）
 */

// ===== 対象指定（ここを書き換えるか globalThis.targetNodeIds を使う） =====
const TARGET_NODE_IDS = []; // 例: ["123:456"]

const SPACER_NAME_RE = /spacer|space|gap|blank|dummy/i;
// F-CMP-5: 判定対象のシェイプ系ノードtype（TEXTは対象外＝F-QLT系の責務）
const FCMP5_SHAPE_TYPES = [
  "FRAME", "GROUP", "RECTANGLE", "ELLIPSE", "VECTOR", "LINE", "POLYGON", "STAR",
  "BOOLEAN_OPERATION",
];
// F-CMP-5: 宣言例外の名前prefix（台帳とのN=N突合は外側工程の責務）
const FCMP5_EXCEPTION_NAME_RE = /^(raw|abs):/i;
// F-CMP-6: 複製クラスタ集計から除外する宣言済み例外（raw:命名のみ。abs:は複製の免罪符でない）
const FCMP6_EXCEPTION_NAME_RE = /^raw:/i;
const GENERIC_COMPONENT_NAME_RE =
  /^(button|input|textfield|textarea|badge|card|chip|tab|tabs|toast|snackbar|checkbox|radio|switch|toggle|select|dropdown|avatar|tooltip|modal|dialog|tag|icon|iconbutton|label|divider|breadcrumb|pagination|stepper|accordion|listitem|menu|menuitem)$/i;

// ---- 色ユーティリティ（WCAG相対輝度・コントラスト比） ----
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLuminance(rgb) {
  return (
    0.2126 * srgbToLinear(rgb.r) +
    0.7152 * srgbToLinear(rgb.g) +
    0.0722 * srgbToLinear(rgb.b)
  );
}
function contrastRatio(a, b) {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
// alpha付き前景を背景に合成
function blendOver(fg, alpha, bg) {
  const a = typeof alpha === "number" ? alpha : 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  };
}
function fmtColor(rgb) {
  const h = (v) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return "#" + h(rgb.r) + h(rgb.g) + h(rgb.b);
}

// fills/strokes 配列から「見えている塗り」を分類する
// 戻り: { solid: {color,opacity} | null, hasNonSolidVisible: boolean, hasAnyVisible: boolean }
function classifyPaints(paints) {
  const out = { solid: null, hasNonSolidVisible: false, hasAnyVisible: false };
  if (!paints || paints === figma.mixed || !Array.isArray(paints)) {
    // mixed は「実質無し」とは扱わない（best-effort: 不明扱い）
    if (paints === figma.mixed) out.hasAnyVisible = true;
    return out;
  }
  for (const p of paints) {
    if (!p || p.visible === false) continue;
    if (typeof p.opacity === "number" && p.opacity === 0) continue;
    out.hasAnyVisible = true;
    if (p.type === "SOLID") {
      // 最後（配列末尾＝最前面）を優先
      out.solid = { color: p.color, opacity: typeof p.opacity === "number" ? p.opacity : 1 };
    } else {
      out.hasNonSolidVisible = true;
    }
  }
  return out;
}

// TEXTノードの最小fontSizeを取得（mixed対応）。取得不能ならthrow
function getMinFontSize(node) {
  const fs = node.fontSize;
  if (fs !== figma.mixed) return fs;
  // mixed: セグメントAPIを試し、だめなら getRangeFontSize で1文字ずつ
  try {
    const segs = node.getStyledTextSegments(["fontSize"]);
    if (segs && segs.length) return Math.min(...segs.map((s) => s.fontSize));
  } catch (e) {
    /* fall through */
  }
  const n = node.characters.length;
  let min = Infinity;
  for (let i = 0; i < n; i++) {
    const s = node.getRangeFontSize(i, i + 1);
    if (typeof s === "number" && s < min) min = s;
  }
  if (!isFinite(min)) throw new Error("fontSize unresolvable");
  return min;
}

// ---- F-CMP-5: 視覚スタイル検出 ----
// 可視fill / 可視stroke / 可視effect / cornerRadius>0 のいずれかで styled。
// cornerRadius が figma.mixed（非number）の場合は個別radiusプロパティで判定。
// 戻り: { styled: boolean, kinds: string[], indeterminate: boolean }
//   indeterminate=true は「styledでない」と断定できない（radius mixedかつ個別
//   radiusも取得不能）ケース。呼び出し側で fail-closed のスキップに計上する。
function detectVisualStyle(node) {
  const kinds = [];
  let indeterminate = false;
  const fillCls = classifyPaints("fills" in node ? node.fills : null);
  if (fillCls.hasAnyVisible) kinds.push("fill");
  const strokeCls = classifyPaints("strokes" in node ? node.strokes : null);
  if (strokeCls.hasAnyVisible) kinds.push("stroke");
  if (
    "effects" in node &&
    Array.isArray(node.effects) &&
    node.effects.some((e) => e && e.visible !== false)
  ) {
    kinds.push("effect");
  }
  if ("cornerRadius" in node) {
    if (typeof node.cornerRadius === "number") {
      if (node.cornerRadius > 0) kinds.push("cornerRadius");
    } else {
      // figma.mixed 等の非number → 個別radiusプロパティで判定
      const radii = [
        node.topLeftRadius,
        node.topRightRadius,
        node.bottomLeftRadius,
        node.bottomRightRadius,
      ].filter((v) => typeof v === "number");
      if (radii.some((v) => v > 0)) {
        kinds.push("cornerRadius(mixed)");
      } else if (radii.length === 0 && kinds.length === 0) {
        // mixedなのに個別radiusも読めない＝styled判定不能
        indeterminate = true;
      }
    }
  }
  return { styled: kinds.length > 0, kinds, indeterminate };
}

// 最近傍の「SOLID塗りを持つ祖先」の色を探す。
// 戻り: {color} | {skippedReason} | null(見つからず=PAGEまで到達)
function findNearestSolidBg(node) {
  let cur = node.parent;
  while (cur && cur.type !== "PAGE" && cur.type !== "DOCUMENT") {
    if ("fills" in cur) {
      const cls = classifyPaints(cur.fills);
      if (cls.solid) return { color: cls.solid.color, opacity: cls.solid.opacity };
      if (cls.hasNonSolidVisible) return { skippedReason: "ancestor bg is gradient/image" };
      // 見える塗りが無い祖先は透過なのでさらに上へ
    }
    cur = cur.parent;
  }
  return null;
}

async function auditStructure(rootIds) {
  const violations = [];
  const stats = {
    scanned: 0,
    skipped: 0,
    byRule: {},
    // ---- F-CMP-5 集計 ----
    styledInstances: 0, // styledなINSTANCE数（分子）
    styledTotal: 0, // styledな判定対象ノード総数（分母。INSTANCE配下は除外）
    fcmp5Skipped: 0, // F-CMP-5判定でスキップしたノード数（1件でも fcmp5.green=false）
    declaredExceptions: [], // raw:/abs: 宣言例外（違反ではない。台帳突合は外側工程）
    // ---- F-CMP-6 集計 ----
    fcmp6Clusters: 0, // 違反クラスタ数（未宣言数+同構成raw:例外数の合算>=2）
    fcmp6DeclaredExceptions: [], // raw:命名で集計から除外したFRAME（台帳突合は外側工程）
  };
  const skippedDetails = []; // デバッグ用（statsには件数のみ）
  const addViolation = (ruleId, node, detail) => {
    violations.push({ ruleId, nodeId: node.id, nodeName: node.name, detail });
    stats.byRule[ruleId] = (stats.byRule[ruleId] || 0) + 1;
  };
  const addSkipped = (node, reason) => {
    stats.skipped++;
    skippedDetails.push({ nodeId: node && node.id, reason });
  };

  // ---- ルート解決 ----
  let roots = [];
  let pageCheckUnresolvedRoot = false; // F-PAGE fail-closed: root解決不能/遡上失敗を追跡
  // dynamic-page ドキュメントで getNodeByIdAsync が全ページ解決できるようにする
  try {
    await figma.loadAllPagesAsync();
  } catch (e) {
    /* fail-soft: 取得できないドキュメント種別もあるため無視 */
  }
  const EXPECTED_PAGE_ID =
    (typeof globalThis !== "undefined" && globalThis.expectedPageId) || null;
  const ids =
    (Array.isArray(rootIds) && rootIds.length && rootIds) ||
    (typeof globalThis !== "undefined" &&
      Array.isArray(globalThis.targetNodeIds) &&
      globalThis.targetNodeIds.length &&
      globalThis.targetNodeIds) ||
    null;
  if (ids) {
    for (const id of ids) {
      try {
        const n = await figma.getNodeByIdAsync(id);
        if (n) roots.push(n);
        else {
          // ルート解決失敗もF-CMP-5のfail-closed対象（未走査分の素通り防止）
          stats.fcmp5Skipped++;
          pageCheckUnresolvedRoot = true; // F-PAGE fail-closed: 未解決rootはpageCheckも不合格に
          addSkipped(null, "root node not found: " + id);
        }
      } catch (e) {
        stats.fcmp5Skipped++;
        pageCheckUnresolvedRoot = true;
        addSkipped(null, "getNodeByIdAsync failed: " + id + " " + e);
      }
    }
  } else {
    roots = [figma.currentPage];
  }
  // 実効の測定範囲を記録する。summary の roots: はこれを使う——
  // モジュール定数 TARGET_NODE_IDS だけを見ると、globalThis.targetNodeIds 経由で
  // 限定走査したときに「currentPage全体を見た」と誤った痕跡が残り、範囲を偽装できる
  // （roots: を足した目的＝範囲の事後突合そのものが無効化される。実測で発覚）。
  stats.rootIds = ids && ids.length ? ids.slice() : ["currentPage"];

  // ---- F-PAGE-1/2/3: ページ所属・可視性・bounds検査（追加。既存ロジックには波及させない） ----
  // ⚠️ 追加当初は実Figma未検証（机上実装。loadAllPagesAsync / parent遡上 /
  //    absoluteBoundingBox の実挙動は初回試走で必ず確認すること）。
  // pageCheckUnresolvedRoot はルート解決段（上）で宣言済み。ここでは遡上失敗時に追記でtrue化する。
  for (const root of roots) {
    // F-PAGE-1: root自身を含めPAGEまで遡り、所属pageを特定（root自身がPAGE型のケースも拾う）
    try {
      let cur = root;
      let page = null;
      while (cur) {
        if (cur.type === "PAGE") {
          page = cur;
          break;
        }
        cur = cur.parent;
      }
      if (EXPECTED_PAGE_ID) {
        if (!page) {
          pageCheckUnresolvedRoot = true;
          addSkipped(root, "F-PAGE-1: PAGE祖先まで遡上できずページ所属を確定できない");
        } else if (page.id !== EXPECTED_PAGE_ID) {
          addViolation(
            "F-PAGE-1",
            root,
            "expected page " + EXPECTED_PAGE_ID + " but node is on " + page.id + " (" + page.name + ")"
          );
        }
      }
    } catch (e) {
      pageCheckUnresolvedRoot = true;
      addSkipped(root, "F-PAGE-1: page遡上失敗: " + e);
    }

    // F-PAGE-2: root及び全祖先の visible===false を検査
    try {
      let cur = root;
      let hiddenFound = false;
      while (cur) {
        if ("visible" in cur && cur.visible === false) {
          hiddenFound = true;
          break;
        }
        cur = cur.parent;
      }
      if (hiddenFound) {
        addViolation("F-PAGE-2", root, "hidden ancestor makes node invisible to user");
      }
    } catch (e) {
      addSkipped(root, "F-PAGE-2: 祖先可視性遡上失敗: " + e);
    }

    // F-PAGE-3: absoluteBoundingBox の退化検査
    try {
      const bb = "absoluteBoundingBox" in root ? root.absoluteBoundingBox : null;
      if (!bb || bb.width <= 0 || bb.height <= 0) {
        addViolation("F-PAGE-3", root, "degenerate/zero bounds");
      }
    } catch (e) {
      addSkipped(root, "F-PAGE-3: absoluteBoundingBox取得失敗: " + e);
    }
  }

  // ---- 反復走査（スタック配列） ----
  const localComponentNames = new Set(); // F-CMP-2用: 走査範囲内のCOMPONENT名
  const frameGroupCandidates = []; // F-CMP-2用: 後段判定
  const fcmp6Sigs = new Map(); // F-CMP-6用: シグネチャ → {childSig, nodes:[{id,name}]}
  // raw:宣言例外はリネームで自ノード名が変わりフルシグネチャは一致し得ないため、
  // クラスタへの注記は直下children構成（childSig）のみで照合する。
  // ただし childSig が空文字（=子を持たないFRAME/GROUP）は「構成が同じ」の証拠として
  // 弱すぎ、無関係な単独ノード同士が偶然一致して合算2件=違反になる偽陽性を生むため
  // 合算対象から外す（オフライン実走で実測）。
  const fcmp6ExceptionsByChildSig = new Map(); // childSig → 件数

  // スタック要素は { node, inInstance, inComponent }。inInstance は「INSTANCE配下か」、
  // inComponent は「COMPONENT/COMPONENT_SET配下か」のフラグで、いずれも
  // F-CMP-5 の判定・集計除外にのみ使う（他の検出の走査範囲は従来どおり変えない）。
  // マスターComp内部のstyledノードは figma-component-design のゲートの責務であり、
  // F-CMP-5（完成フレーム側のinstance実体）の違反・分母に計上しない。
  const stack = roots.map((n) => ({ node: n, inInstance: false, inComponent: false }));
  while (stack.length) {
    const entry = stack.pop();
    const node = entry.node;
    const inInstance = entry.inInstance;
    const inComponent = entry.inComponent;
    let children = null;
    try {
      children = "children" in node ? node.children : null;
    } catch (e) {
      // children列挙失敗＝配下が未走査のまま残る → F-CMP-5のfail-closed対象
      stats.fcmp5Skipped++;
      addSkipped(node, "children access failed: " + e);
    }
    if (children) {
      const childInInstance = inInstance || node.type === "INSTANCE";
      const childInComponent =
        inComponent || node.type === "COMPONENT" || node.type === "COMPONENT_SET";
      for (const c of children)
        stack.push({ node: c, inInstance: childInInstance, inComponent: childInComponent });
    }
    if (node.type === "PAGE" || node.type === "DOCUMENT") continue;

    stats.scanned++;

    // ---- F-CMP-5 styledNonInstance（default-deny・fail-closed） ----
    // INSTANCE配下は判定対象外（mainComponent側の責務・分母から除外）。
    // COMPONENT/COMPONENT_SET 自体と**その配下**も判定対象外（マスター内部は
    // figma-component-design ゲートの責務・分母から除外）。TEXTも対象外。
    // 自前 try/catch: ここでの失敗は fcmp5Skipped に計上し、既存検出には波及させない。
    if (
      !inInstance &&
      !inComponent &&
      (node.type === "INSTANCE" || FCMP5_SHAPE_TYPES.indexOf(node.type) !== -1)
    ) {
      try {
        const style = detectVisualStyle(node);
        if (style.styled) {
          stats.styledTotal++;
          if (node.type === "INSTANCE") {
            stats.styledInstances++;
          } else if (FCMP5_EXCEPTION_NAME_RE.test(node.name || "")) {
            // 宣言例外: 違反ではない（台帳とのN=N突合は外側工程の責務）
            stats.declaredExceptions.push({
              ruleId: "F-CMP-5",
              id: node.id,
              name: node.name,
            });
            // F-QLT-5(部分): 宣言例外でもfillのraw値（変数バインド無し）は不可
            if (style.kinds.indexOf("fill") !== -1) {
              try {
                if (
                  "boundVariables" in node &&
                  node.boundVariables &&
                  typeof node.boundVariables === "object"
                ) {
                  const bv = node.boundVariables.fills;
                  const bound = Array.isArray(bv) ? bv.length > 0 : !!bv;
                  if (!bound) {
                    addViolation(
                      "F-QLT-5",
                      node,
                      "raw:/abs:宣言例外だがfillが変数バインドされていない（宣言例外でもraw値は不可）"
                    );
                  }
                } else {
                  // boundVariablesが取得不能な構造 → 無理せずスキップ（fail-soft）
                  addSkipped(node, "F-QLT-5: boundVariables取得不能のためfillバインド未確認");
                }
              } catch (e) {
                addSkipped(node, "F-QLT-5: boundVariables確認失敗: " + e);
              }
            }
          } else {
            addViolation(
              "F-CMP-5",
              node,
              "スタイル付き非INSTANCE（instance化 or 台帳宣言raw:/abs:が必要）: " +
                style.kinds.join(", ")
            );
          }
        } else if (style.indeterminate) {
          stats.fcmp5Skipped++;
          addSkipped(
            node,
            "F-CMP-5: styled判定不能（cornerRadius mixedかつ個別radius取得不能）"
          );
        }
      } catch (e) {
        stats.fcmp5Skipped++;
        addSkipped(node, "F-CMP-5: 判定失敗: " + e);
      }
    }

    // ---- F-CMP-6 duplicateFrameClusters 収集（判定は走査後） ----
    // 対象は非INSTANCE配下・非COMPONENT(_SET)配下のFRAME/GROUP（SOT逐語「フレーム/
    // グループ」）。GROUPはlayoutMode等を持たないが本ブロックはchildrenの型と名前
    // しか読まないため安全。GROUP拡張は本集計のみ＝F-STR系など他検査には波及させない。
    // INSTANCE配下はmainComponent由来の自動複製、COMPONENT_SET内はvariant同士が
    // 同名同構成になる設計のため、いずれも「生複製」でなく違反に数えない。
    // 自前try/catch: 失敗はskippedに計上し他の検出に波及させない（fail-soft）。
    if ((node.type === "FRAME" || node.type === "GROUP") && !inInstance && !inComponent) {
      try {
        if (children === null) {
          // children読み取り失敗ノードは誤クラスタ防止のためシグネチャ生成しない
          addSkipped(node, "F-CMP-6: children未取得のためシグネチャ生成不可");
        } else {
          const selfName = String(node.name || "").trim().toLowerCase();
          const childSig = (children || [])
            .map((c) => c.type + ":" + String(c.name || "").trim().toLowerCase())
            .join("|");
          const sig = selfName + "||" + childSig;
          if (FCMP6_EXCEPTION_NAME_RE.test(node.name || "")) {
            // raw:宣言済み例外: 集計から除外（台帳とのN=N突合は外側工程の責務）
            stats.fcmp6DeclaredExceptions.push({ id: node.id, name: node.name });
            // childSigが空（子なし）の例外は合算に使わない（偽陽性源。上の注参照）
            if (childSig !== "") {
              fcmp6ExceptionsByChildSig.set(
                childSig,
                (fcmp6ExceptionsByChildSig.get(childSig) || 0) + 1
              );
            }
          } else {
            if (!fcmp6Sigs.has(sig)) fcmp6Sigs.set(sig, { childSig: childSig, nodes: [] });
            fcmp6Sigs.get(sig).nodes.push({ id: node.id, name: node.name });
          }
        }
      } catch (e) {
        addSkipped(node, "F-CMP-6: シグネチャ生成失敗: " + e);
      }
    }

    try {
      // ---- コンポーネント名収集（F-CMP-2の照合元） ----
      if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
        localComponentNames.add(String(node.name).trim().toLowerCase());
      }

      const parent = node.parent;
      const parentIsAutoLayout =
        parent &&
        "layoutMode" in parent &&
        parent.layoutMode &&
        parent.layoutMode !== "NONE";

      // ---- F-STR-1 spacerSuspects ----
      if (parentIsAutoLayout) {
        const isFrameOrRect = node.type === "FRAME" || node.type === "RECTANGLE";
        const nameHit = SPACER_NAME_RE.test(node.name || "");
        let invisibleEmpty = false;
        if (isFrameOrRect) {
          const fillCls = classifyPaints("fills" in node ? node.fills : null);
          const strokeCls = classifyPaints("strokes" in node ? node.strokes : null);
          const noChildren = !("children" in node) || node.children.length === 0;
          invisibleEmpty =
            !fillCls.hasAnyVisible && !strokeCls.hasAnyVisible && noChildren;
        }
        if (invisibleEmpty || (nameHit && (isFrameOrRect || node.type === "GROUP"))) {
          addViolation(
            "F-STR-1",
            node,
            invisibleEmpty
              ? "auto-layout親の子: 塗り/線なし・子なしの" + node.type + "（スペーサー疑い。gap/paddingで表現せよ）"
              : "auto-layout親の子: spacer系命名 (" + node.name + ")"
          );
        }
      }

      // ---- F-STR-2 nonAutoLayout ----
      if (
        (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") &&
        parent &&
        (parent.type === "FRAME" || parent.type === "COMPONENT" || parent.type === "INSTANCE") &&
        "children" in node &&
        node.children.length >= 2 &&
        "layoutMode" in node &&
        node.layoutMode === "NONE"
      ) {
        addViolation(
          "F-STR-2",
          node,
          "子" + node.children.length + "個のネストframeが layoutMode=NONE（auto-layout化を検討）"
        );
      }

      // ---- F-QLT-3 smallText ----
      if (node.type === "TEXT") {
        try {
          const minFs = getMinFontSize(node);
          if (minFs < 14) {
            addViolation("F-QLT-3", node, "fontSize=" + minFs + " (<14px下限)");
          }
        } catch (e) {
          addSkipped(node, "fontSize resolve failed: " + e);
        }
      }

      // ---- F-CMP-2 候補収集（判定は走査後） ----
      if ((node.type === "FRAME" || node.type === "GROUP") && node.name) {
        frameGroupCandidates.push({ id: node.id, name: node.name });
      }

      // ---- F-QLT-2 contrastRisks（best-effort） ----
      if (node.type === "TEXT") {
        const fillCls = classifyPaints(node.fills);
        if (fillCls.hasNonSolidVisible && !fillCls.solid) {
          addSkipped(node, "text fill is gradient/image (contrast skipped)");
        } else if (fillCls.solid) {
          const bg = findNearestSolidBg(node);
          if (bg && bg.skippedReason) {
            addSkipped(node, bg.skippedReason + " (contrast skipped)");
          } else if (bg && bg.color) {
            let minFs;
            try {
              minFs = getMinFontSize(node);
            } catch (e) {
              minFs = null;
            }
            if (minFs != null) {
              const textColor = blendOver(
                fillCls.solid.color,
                fillCls.solid.opacity,
                bg.color
              );
              const ratio = contrastRatio(textColor, bg.color);
              // 18.66px ≒ 14pt。bold14pt以上相当（WCAG large text）の近似を兼ねる
              const threshold = minFs >= 18.66 ? 3 : 4.5;
              if (ratio < threshold) {
                addViolation(
                  "F-QLT-2",
                  node,
                  "contrast " + ratio.toFixed(2) + " < " + threshold +
                    " (text " + fmtColor(textColor) + " on bg " + fmtColor(bg.color) +
                    ", fontSize " + minFs + ")"
                );
              }
            } else {
              addSkipped(node, "contrast: fontSize unresolvable");
            }
          }
          // bg===null（PAGEまで塗り祖先なし）は判定不能なのでフラグしない
        }
      }
    } catch (e) {
      addSkipped(node, "node processing failed: " + e);
    }
  }

  // ---- F-CMP-2 fakeComponentSuspects（後段判定） ----
  for (const cand of frameGroupCandidates) {
    try {
      const norm = String(cand.name).trim().toLowerCase();
      const matchesLocal = localComponentNames.has(norm);
      const matchesGeneric = GENERIC_COMPONENT_NAME_RE.test(norm);
      if (matchesLocal || matchesGeneric) {
        violations.push({
          ruleId: "F-CMP-2",
          nodeId: cand.id,
          nodeName: cand.name,
          detail:
            "INSTANCEでないFRAME/GROUPが部品名を名乗る (" +
            (matchesLocal ? "ローカルコンポーネント名と一致" : "一般部品名に一致") +
            ")。本物のコンポーネントのインスタンスに置換せよ",
        });
        stats.byRule["F-CMP-2"] = (stats.byRule["F-CMP-2"] || 0) + 1;
      }
    } catch (e) {
      stats.skipped++;
    }
  }

  // ---- F-CMP-6 duplicateFrameClusters（後段判定） ----
  // 同一シグネチャ（正規化ノード名＋直下childrenのtype:name列）の複製を1クラスタ=
  // 1violationで報告（nodeId=代表node-id、detailに出現数・全出現位置）。
  for (const entry of fcmp6Sigs) {
    try {
      const cluster = entry[1];
      const nodes = cluster.nodes;
      const exCount = fcmp6ExceptionsByChildSig.get(cluster.childSig) || 0;
      // 挙動変更(後日): 2複製の片方だけraw:改名すると未宣言側が1件となり閾値
      // 割れで素通りしたため、同一children構成のraw:宣言済み例外を複製数に合算して
      // 2コピー則を判定する（未宣言>=1かつ合算>=2なら未宣言側を違反として報告）。
      if (nodes.length < 1 || nodes.length + exCount < 2) continue;
      stats.fcmp6Clusters++;
      violations.push({
        ruleId: "F-CMP-6",
        nodeId: nodes[0].id,
        nodeName: nodes[0].name,
        detail:
          "同名/同構成FRAME/GROUPの複製クラスタ ×" + nodes.length +
          "（2コピー則: コンポ化 or raw:宣言が必要）。出現位置: " +
          nodes.map((n) => n.id).join(", ") +
          (exCount > 0
            ? "／同構成のraw:宣言済み例外" + exCount + "件は集計除外" +
              (nodes.length < 2
                ? "（未宣言側は例外との合算で2コピー則超過=違反）"
                : "")
            : ""),
      });
      stats.byRule["F-CMP-6"] = (stats.byRule["F-CMP-6"] || 0) + 1;
    } catch (e) {
      stats.skipped++;
    }
  }

  // ---- F-CMP-5 分数出力＋fail-closed判定 ----
  // instanceRatio: styledなノードのうちINSTANCEの割合（分母はINSTANCE配下除く）
  stats.instanceRatio = stats.styledInstances + "/" + stats.styledTotal;
  // 他ルールはfail-soft集計のままだが、F-CMP-5のみfail-closed:
  // 違反0件 かつ F-CMP-5判定スキップ0件 かつ 走査1件以上 のときだけ green。
  const fcmp5ViolationCount = stats.byRule["F-CMP-5"] || 0;
  let fcmp5;
  if (stats.scanned === 0) {
    // 走査0件（ルート解決失敗・空ページ等）での素通り禁止
    fcmp5 = { green: false, reason: "走査0件=不合格（fail-closed）" };
  } else if (fcmp5ViolationCount === 0 && stats.fcmp5Skipped === 0) {
    fcmp5 = {
      green: true,
      reason:
        "F-CMP-5違反0件・未判定0件（styled instance比 " + stats.instanceRatio + "）",
    };
  } else {
    const reasons = [];
    if (fcmp5ViolationCount > 0) {
      reasons.push("F-CMP-5違反" + fcmp5ViolationCount + "件");
    }
    if (stats.fcmp5Skipped > 0) {
      reasons.push("未判定" + stats.fcmp5Skipped + "件=不合格（fail-closed）");
    }
    fcmp5 = { green: false, reason: reasons.join("、") };
  }

  // ---- F-PAGE-* fail-closed判定 ----
  let pageCheck;
  if (!EXPECTED_PAGE_ID) {
    pageCheck = { green: true, reason: "expectedPageId未指定のためpage所属検査はスキップ" };
  } else {
    const fpage1Count = stats.byRule["F-PAGE-1"] || 0;
    if (fpage1Count > 0 || pageCheckUnresolvedRoot) {
      const reasons = [];
      if (fpage1Count > 0) reasons.push("F-PAGE-1違反" + fpage1Count + "件");
      if (pageCheckUnresolvedRoot) reasons.push("root未解決あり=不合格（fail-closed）");
      pageCheck = { green: false, reason: reasons.join("、") };
    } else {
      pageCheck = { green: true, reason: "F-PAGE-1違反0件・root解決失敗0件" };
    }
  }

  return { violations, stats, fcmp5, pageCheck };
}

// ===== エントリポイント =====
const result = await auditStructure(TARGET_NODE_IDS);
console.log(JSON.stringify(result, null, 2));

// ---- コンポ化ゲート用の定型サマリー行 ----
// visual-gate-stop.sh の構造分岐が、use_figma の tool_result 本文にこの行が
// 出ていることを「監査を実際に走らせた証拠」として機械照合する。応答に復唱する
// だけでは実行痕跡にならないよう、必ずスクリプト実行時にしか出ない形で出力する。
// **重要**: use_figma は console.log の出力をエージェントに返さない（公式 figma-use
// スキルの明文）。よってサマリー行は必ず**戻り値 result.summary にも載せる**——
// console.log だけに置くと tool_result に何も出ず、ゲートが恒久的に空転する。
//   cmd    = F-CMP-5 + F-CMP-6 の違反件数（コンポ化ゲートの合否そのもの）
//   fcmp5  = F-CMP-5 の fail-closed 判定（未判定1件でも fail）
//   dup    = F-CMP-6 の複製クラスタ数
//   raw    = raw:/abs: 宣言済み例外の件数（台帳とのN=N突合は外側工程の責務）
//   scanned/skipped = 走査件数と判定不能件数（skipped>0 は不合格材料）
{
  const cmpCount =
    (result.stats.byRule["F-CMP-5"] || 0) + (result.stats.byRule["F-CMP-6"] || 0);
  const rawCount =
    (result.stats.declaredExceptions || []).length +
    (result.stats.fcmp6DeclaredExceptions || []).length;
  // roots: 測定範囲を summary 自体に焼く。フックは「渡されたnode-idが本当に成果物か」を
  // 検証できないので、範囲が痕跡に残らないと「無害な1ノードだけ渡して cmp:0 を作る」
  // 自己申告の抜け道がノーガードになる。roots を出しておけば、報告の測定範囲を
  // 作成/置換リストと事後にN=N突合できる（ds-editの逆差分監査と同じ型）。
  // 実効ルート（stats.rootIds）から作る。TARGET_NODE_IDS だけを見ると
  // globalThis.targetNodeIds 経由の限定走査を "currentPage" と誤表示する。
  // 件数が多いときは先頭30件＋残件数に丸める（N=N突合の情報は保ちつつ肥大を防ぐ）。
  const rootIdList = Array.isArray(result.stats.rootIds)
    ? result.stats.rootIds
    : ["currentPage"];
  const rootsLabel =
    rootIdList.length > 30
      ? rootIdList.slice(0, 30).join(",") + ",+" + (rootIdList.length - 30) + "-more"
      : rootIdList.join(",");
  const summaryLine =
    "F-CMP-AUDIT cmp:" + cmpCount +
    " fcmp5:" + (result.fcmp5.green ? "pass" : "fail") +
    " dup:" + (result.stats.fcmp6Clusters || 0) +
    " raw:" + rawCount +
    " scanned:" + (result.stats.scanned || 0) +
    " skipped:" + (result.stats.skipped || 0) +
    " roots:" + rootsLabel;
  console.log(summaryLine);

  // summary は返却JSONの**先頭キー**に置く。末尾に置くと、違反が多い大ページで
  // 返却が切り詰められたときに真っ先に消え、「監査は走ったのにゲートが立たず恒久
  // ブロック」になる。あわせて violations は上位N件にcapし、全件数は別フィールドで返す
  // （切り詰め自体を起こしにくくする）。console.log 側は全文のまま。
  // capは**発見順でなくルール優先度順**で切る。発見順のままだと、件数の多い
  // F-QLT-3(小文字)/F-QLT-2(コントラスト)が枠を食い潰し、本ゲートの主対象である
  // F-CMP-6(複製)/F-CMP-5(生フレーム)が1件も返らないことが実測で起きた
  // （実ファイル数千ノード規模: dup:12 なのに返却60件中F-CMP-6が0件）。
  const RULE_PRIORITY = {
    // F-QLT-5 は「raw:/abs: 宣言例外なのにfillが変数バインドされていない」＝
    // F-CMP-5の逃がし弁の健全性検査なので、構造系と同格で前に置く（件数の多い
    // F-QLT-2/3 と一緒に末尾へ落とすとnodeIdが返らなくなる）
    "F-CMP-6": 0, "F-CMP-5": 1, "F-QLT-5": 2, "F-CMP-2": 3,
    "F-STR-1": 4, "F-STR-2": 5,
    "F-PAGE-1": 6, "F-PAGE-2": 7, "F-PAGE-3": 8,
    "F-QLT-2": 9, "F-QLT-3": 10,
  };
  const prio = (v) => {
    const p = RULE_PRIORITY[v && v.ruleId];
    return typeof p === "number" ? p : 99;
  };
  const CAP = 60;
  const total = result.violations.length;
  const sorted = result.violations.slice().sort((a, b) => prio(a) - prio(b));
  return {
    summary: summaryLine,
    fcmp5: result.fcmp5,
    pageCheck: result.pageCheck,
    stats: result.stats,
    violationsTotal: total,
    violationsTruncated: total > CAP,
    violationsByRule: result.stats.byRule,
    violations: total > CAP ? sorted.slice(0, CAP) : sorted,
  };
}

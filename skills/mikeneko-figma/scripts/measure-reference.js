/*
 * measure-reference.js — 見本プロダクトの「濃さ・太さ・線の強さ・余白」を実物から取るスクリプト（読み取り専用）
 * =====================================================================
 * 実行環境: ブラウザ操作ツールの JavaScript 実行（見本プロダクトの画面を開いたページの中で動かす）。
 *           ページには何も書き込まない。ログインが要る画面は、依頼者が開いている画面か公開のデモで行う。
 *
 * 目的（F-QLT-10）: 見本を眺めて真似るのでなく、面・線・文字・余白の値を取る。成果物側の値は
 *   姉妹スクリプト measure-tones.js（Figma で実行）で取り、同じ場所どうしを突き合わせる。
 *   手順は skills/figma-design-create/references/tone-measure.md。
 *
 * 使い方:
 *   1) 見本の画面を、成果物と同じ種類の画面（一覧なら一覧）で、ライト表示・幅1440前後で開く。
 *   2) このファイルの中身を丸ごと JavaScript 実行ツールに渡す（最後の式の値が結果になる）。
 *      ツールが「return で返す」形式なら、末尾の式を return に変える。
 *   3) 出力: { viewport, unparsed, surfaces, lines, texts, controls, nav, density }
 *      - unparsed: 色の書式を読めなかった件数（oklch・lab・display-p3 など）。0 でなければ、その分は面・線に入っていない
 *      - surfaces: 背景色ごとの { color, area, examples }（面積の大きい順）
 *      - lines:    枠線の色ごとの { color, onWhite, count, examples }
 *                  半透明の色（rgba）は onWhite に白地へ重ねたときの実効色を出す
 *                  border のほか、box-shadow で引いた 1px の線（ぼかし0・広がり1px）も数える。outline は数えない
 *      - texts:    文字の { size, weight, color, count, examples }（件数の多い順）
 *      - controls: ボタン類の { text, background, color, border, radius, weight, height }
 *      - nav:      nav 要素の中の項目の { text, background, color, weight, size, icon }
 *      - density:  余白と密度。どれも「値ごとの件数」（多い順・上位6〜8件）
 *          rowHeights:     表の行・リスト項目の高さ（nav / aside の中の項目は除く）
 *          controlHeights: ボタン・入力欄の高さ
 *          navItemHeights: ナビ項目の高さ
 *          paddings:       枠か背景を持つ箱（カード、パネル）の内側余白「上/右/下/左」
 *          gaps:           flex / grid の箱の間隔（CSS の gap だけ。margin で空けている作りは出ない）
 *          sidebarWidth:   縦長の nav（または aside）の幅。無ければ null
 *
 * 実績: Web の製品デモ画面で実行して値が取れることを確認済み（density を含む）。
 *
 * 注意:
 *   - 取るのは段階（何段あるか、各段の明るさ・太さ）。色相・書体・ブランド色・画面の要素は写さない。
 *   - 画面に見えている範囲だけを数える（スクロール外は数えない）。iframe と shadow DOM の中は見ない。
 *   - examples と text には画面の文字が最大20字入る。依頼者がログインしている画面で測ると、
 *     氏名などが結果に残る。公開のデモで測るか、結果を貼る前に消す。
 */
(() => {
  const vw = innerWidth, vh = innerHeight;
  const parse = (s) => {
    let m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(s);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    m = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/.exec(s);
    if (m) return { r: m[1] * 255, g: m[2] * 255, b: m[3] * 255, a: m[4] === undefined ? 1 : +m[4] };
    return null;
  };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const onWhite = (c) => hex({ r: 255 + (c.r - 255) * c.a, g: 255 + (c.g - 255) * c.a, b: 255 + (c.b - 255) * c.a });
  const show = (s) => { const c = parse(s); return c ? (c.a < 1 ? hex(c) + "@" + c.a.toFixed(2) : hex(c)) : s; };
  const bump = (map, key, init, ex) => {
    if (!map[key]) map[key] = Object.assign({ count: 0, examples: [] }, init);
    map[key].count++;
    if (ex && map[key].examples.length < 3 && !map[key].examples.includes(ex)) map[key].examples.push(ex);
    return map[key];
  };
  const tag = (e) => (e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0].slice(0, 24) : ""));
  const surfaces = {}, lines = {}, texts = {};
  let unparsed = 0;
  const transparent = (s) => !s || s === "transparent" || s === "rgba(0, 0, 0, 0)";
  for (const e of [document.documentElement, document.body, ...document.querySelectorAll("body *")]) {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    const s = getComputedStyle(e);
    if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) continue;
    const bg = parse(s.backgroundColor);
    if (!bg && !transparent(s.backgroundColor)) unparsed++;
    if (bg && bg.a > 0.02) {
      const k = show(s.backgroundColor);
      const o = bump(surfaces, k, { color: k, onWhite: bg.a < 1 ? onWhite(bg) : undefined, area: 0 }, tag(e));
      o.area += Math.round(Math.min(r.width, vw) * Math.min(r.height, vh));
    }
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(s["border" + side + "Width"]) <= 0 || s["border" + side + "Style"] === "none") continue;
      const c = parse(s["border" + side + "Color"]);
      if (!c && !transparent(s["border" + side + "Color"])) unparsed++;
      if (!c || c.a <= 0.02) continue;
      const k = show(s["border" + side + "Color"]);
      bump(lines, k, { color: k, onWhite: c.a < 1 ? onWhite(c) : undefined }, tag(e));
      break;
    }
    // box-shadow で引いた線: 「色 0px 0px 0px 1px」（ぼかし0・広がり1px、inset も可）
    const sh = /(rgba?\([^)]+\)|color\([^)]+\))\s+0px\s+0px\s+0px\s+1px/.exec(s.boxShadow || "");
    if (sh) { const c = parse(sh[1]); if (c && c.a > 0.02) { const k = show(sh[1]); bump(lines, k, { color: k, onWhite: c.a < 1 ? onWhite(c) : undefined }, tag(e) + "(shadow)"); } }
    const own = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (own) {
      const k = [s.fontSize, s.fontWeight, show(s.color)].join("|");
      bump(texts, k, { size: s.fontSize, weight: s.fontWeight, color: show(s.color) }, own.slice(0, 20));
    }
  }
  const controls = [...document.querySelectorAll("button, a[role=button], input, select")]
    .filter((b) => { const r = b.getBoundingClientRect(); return r.width > 20 && r.top >= 0 && r.top < vh && !b.closest("nav"); })
    .slice(0, 30)
    .map((b) => { const s = getComputedStyle(b); return { text: (b.innerText || b.getAttribute("aria-label") || b.placeholder || "").trim().slice(0, 16), background: show(s.backgroundColor), color: show(s.color), border: parseFloat(s.borderTopWidth) > 0 ? show(s.borderTopColor) : "none", radius: s.borderRadius, weight: s.fontWeight, height: Math.round(b.getBoundingClientRect().height) }; });
  const nav = [...document.querySelectorAll("nav a, nav button, aside a, aside button")]
    .filter((a) => a.getBoundingClientRect().height > 0)
    .slice(0, 20)
    .map((a) => { const s = getComputedStyle(a); const t = [...a.querySelectorAll("*")].find((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || a; const ts = getComputedStyle(t); const svg = a.querySelector("svg"); return { text: (a.innerText || "").trim().slice(0, 16), background: show(s.backgroundColor), color: show(ts.color), weight: ts.fontWeight, size: ts.fontSize, icon: svg ? show(getComputedStyle(svg).color) : null }; });
  // ---- 余白と密度
  const tally = (arr, n) => { const m = {}; for (const v of arr) m[v] = (m[v] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count })); };
  const inView = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw; };
  const px = (v) => Math.round(parseFloat(v) || 0);
  const rowHeights = tally([...document.querySelectorAll("tr, [role=row], li")].filter((e) => !e.closest("nav, aside")).filter(inView).map((e) => Math.round(e.getBoundingClientRect().height)).filter((h) => h >= 20 && h <= 120), 6);
  const boxes = [], gaps = [];
  for (const e of document.querySelectorAll("body *")) {
    if (!inView(e)) continue;
    const s = getComputedStyle(e), r = e.getBoundingClientRect();
    if (/flex|grid/.test(s.display) && e.children.length >= 2) {
      const g = px(/row/.test(s.flexDirection) || /grid/.test(s.display) ? s.columnGap : s.rowGap);
      if (g > 0) gaps.push(g);
    }
    if (r.width < 160 || r.height < 60) continue;
    const bg = parse(s.backgroundColor), hasBorder = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0 || /0px 0px 0px 1px/.test(s.boxShadow || "");
    if (!hasBorder && !(bg && bg.a > 0.02)) continue;
    const pad = [px(s.paddingTop), px(s.paddingRight), px(s.paddingBottom), px(s.paddingLeft)];
    if (pad.some((v) => v > 0)) boxes.push(pad.join("/"));
  }
  const side = [...document.querySelectorAll("nav, aside")].find((e) => { const r = e.getBoundingClientRect(); return r.height >= vh * 0.6 && r.width < vw * 0.4 && r.width > 0; }); // 上部のナビバーをサイドバーと取り違えない
  const density = {
    rowHeights,
    controlHeights: tally(controls.map((c) => c.height), 6),
    navItemHeights: tally([...document.querySelectorAll("nav a, nav button, aside a, aside button")].filter(inView).map((a) => Math.round(a.getBoundingClientRect().height)), 4),
    paddings: tally(boxes, 8),
    gaps: tally(gaps, 8),
    sidebarWidth: side ? Math.round(side.getBoundingClientRect().width) : null,
  };
  const list = (m, by) => Object.values(m).sort(by);
  return JSON.stringify({
    viewport: vw + "x" + vh,
    unparsed,
    surfaces: list(surfaces, (a, b) => b.area - a.area).slice(0, 12),
    lines: list(lines, (a, b) => b.count - a.count).slice(0, 10),
    texts: list(texts, (a, b) => b.count - a.count).slice(0, 20),
    controls,
    nav,
    density,
  });
})()

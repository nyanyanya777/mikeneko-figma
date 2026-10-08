# 作り方の型（部品のキーと小さな関数で画面を組む）

**いつ読むか**: 工程5（実装）に入るとき。色や太さを後からまとめて直すときにも読む。

[figma-design-create](../SKILL.md) の詳しい手順。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。`use_figma` の作法そのものは `figma-use`。

**この型の実績**: 「部品をキーで読み込み、小さな関数で auto-layout の箱を入れ子にして1画面を組み、流し直せる1本のスクリプトにする」やり方は、実案件で製品画面を作って動かしている。下のコードのうち、変数とテキストスタイルへのバインドを関数に入れた部分は、その案件では使っておらず、実Figmaでは未実測。初めて使うファイルでは、小さいフレーム1つで試してから本番の画面に進む。

## 1. 1画面=流し直せる1本のスクリプト

- 1画面を1本のスクリプトで組む。流し直すと同じものができる形にする。
- 直すときは、できた画面のノードを手で1つずつ触らず、スクリプトを直して流し直す。手で直した箇所は、次に流し直したときに消える。
- **依頼者に見せたあとは、流し直す前に確かめる。** 依頼者が Figma 上で触った箇所も消えるので、見せたあとの修正は in-place（対象ノードだけを直す）を基本にする。ただし、最初の1画面の方向確認（F-PRC-14）で直すときは、依頼者が Figma 上で触っていないことを確かめたうえで、スクリプトを直して流し直す（残りの画面でも同じスクリプトと関数を使うため）。
- **配線（工程6）のあとに流し直したら、工程6をやり直す。** ルートを置き換えると node-id が変わり、そのフレームに張った reaction と、他のフレームからの遷移先が消える。配線リストN＝reaction N を取り直し、F-CMP-7 の run3 の `TARGET_NODE_IDS`・`roots:` と F-PLC-5 の事後確認も新しい id で行う。
- 流し直すときに置き換えてよいのは、このセッションで自分が作った成果物ルートだけ。**作ったルートの node-id を控えておき、id で指定して置き換える**（名前の一致で消さない。既存のフレームには触れない＝F-PLC-2）。
- 配置先のページは、対象の node-id から事前に特定し、作ったあとに所属ページを取り直して一致を確かめる（F-PLC-5）。`use_figma` は呼び出しのたびにページの文脈が先頭ページに戻るので、スクリプトの中でページを id で取り、そこへ明示的に入れる（下のコードの `PAGE_ID`）。
- 骨格→中身→文言の順に書き足していき、流すたびに `get_screenshot` で描画を見る（鉄則8・9）。配線は別の段（工程6）。

## 2. 部品はキーで読み込む

- 工程2の棚卸しで、使うコンポーネントセットとアイコンのキーを控える。スクリプトの先頭でまとめて読み込む。
- バリアントは名前で引く。見つからなければ例外を投げて止める（黙って別の部品で代用しない。エラー文に、そのセットにあるバリアント名を数件入れておくと原因がすぐ分かる）。
- 同じファイルにあるローカルの部品は `getNodeByIdAsync` で取る。
- 部品の文言やアイコンの有無は `setProperties` で渡す。部品の中の色や大きさを生の値で上書きしない（[ds](ds.md)「変数・スタイル必須ルール」）。
- 部品の中の仮のアイコン枠は、実際のアイコンに差し替える（F-CMP-1）。見つからないアイコンは警告に積む。

## 3. 小さな関数を先に用意する

同じ指定を何度も書かないために、次の関数をスクリプトの先頭に置く。**関数の引数には、変数とスタイルしか渡せないようにする**（色の hex や、余白・角丸の px を引数に取らない。例外は `add` に渡す幅と高さの固定値だけ）。生の値を書けない形にしておくのが、F-QLT-5 を守るいちばん確実な方法。

塗りや角丸を持つ箱は、それだけで F-CMP-5 の対象になる（スタイルを持つ非 INSTANCE）。下の `box` は、塗りか角丸を渡すときに `raw` のコードを必須にし、ノード名を `raw:<コード>` にする。コードは台帳に宣言したものだけを使い（[exceptions](exceptions.md)）、宣言していない箱は部品にしてから instance で置く。画面のルートは塗りを持たない箱にして `{オブジェクト}/{ビュー種別}/{状態}` の名前をつけ（[pages](pages.md)。逆監査が名前で突合する）、背景色は、その中に置く `raw:shell-region` の箱に持たせる。

```js
// ---- 読み込み（キーは工程2の棚卸しで控えたもの）
const PAGE_ID = "<配置先ページの id>"; // 工程0・1で、対象の node-id から特定したページ
const SET_KEYS  = { button: "<key>", badge: "<key>", tableHead: "<key>", tableCell: "<key>" };
const ICON_KEYS = { Download: "<key>", Users: "<key>" };
const warn = [];
const SET = {}, ICON = {};
for (const [k, key] of Object.entries(SET_KEYS)) SET[k] = await figma.importComponentSetByKeyAsync(key);
for (const [k, key] of Object.entries(ICON_KEYS)) {
  try { ICON[k] = await figma.importComponentByKeyAsync(key); } catch (e) { warn.push("icon " + k); }
}
const variant = (set, name) => {
  const c = SET[set].children.find((c) => c.name === name);
  if (!c) throw new Error("variant not found: " + set + " / " + name + " :: " + SET[set].children.slice(0, 6).map((c) => c.name).join(" ; "));
  return c;
};

// ---- 変数とテキストスタイル（名前で引く。無ければ止まる＝無断で作らない・鉄則5）
const VARS = {}, DUP = new Set();
for (const v of await figma.variables.getLocalVariablesAsync()) { if (VARS[v.name]) DUP.add(v.name); VARS[v.name] = v; }
const V = (name) => {
  if (!VARS[name]) throw new Error("variable not found: " + name);
  if (DUP.has(name)) throw new Error("variable name is not unique across collections: " + name); // 同名が複数あるときは id で引く
  return VARS[name];
};
const STYLES = {};
for (const s of await figma.getLocalTextStylesAsync()) STYLES[s.name] = s;
const paint = (varName) => figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V(varName));

// ---- 箱: auto-layout だけを作る（F-STR-1/2）。余白・角丸・色は変数名で受ける（F-QLT-5）
//      塗りか角丸を持つ箱は F-CMP-5 の対象。台帳に宣言した raw コードが無ければ作らない
function box(dir, o = {}) {
  if ((o.fill || o.radius) && !o.raw) throw new Error("styled box needs a declared raw code (F-CMP-5): " + (o.name || ""));
  const f = figma.createAutoLayout(dir); // use_figma の環境が用意している関数
  f.name = o.raw ? "raw:" + o.raw : (o.name || "Flex");
  f.fills = o.fill ? [paint(o.fill)] : [];
  if (o.gap) f.setBoundVariable("itemSpacing", V(o.gap));
  if (o.pad) for (const side of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) f.setBoundVariable(side, V(o.pad));
  if (o.radius) for (const c of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) f.setBoundVariable(c, V(o.radius));
  if (o.align) f.counterAxisAlignItems = o.align;
  if (o.justify) f.primaryAxisAlignItems = o.justify;
  return f;
}
// ---- 入れる: 幅と高さの決め方を必ず両方指定する。数値=固定、"HUG"=中身に合わせる、"FILL"=いっぱいに広げる
function add(parent, child, w, h) {
  if (w === undefined || h === undefined) throw new Error("add() needs both w and h: " + child.name);
  parent.appendChild(child); // FILL は親に入れたあとでないと設定できない
  const wrapText = child.type === "TEXT" && w !== "HUG" && h === "HUG";
  if (wrapText) child.textAutoResize = "HEIGHT"; // 折り返す文字: 幅を決めて高さを中身に合わせる。sizing より先に設定する
  if (typeof w === "number" || typeof h === "number") child.resize(typeof w === "number" ? w : child.width, typeof h === "number" ? h : child.height);
  child.layoutSizingHorizontal = typeof w === "number" ? "FIXED" : w;
  if (!wrapText) child.layoutSizingVertical = typeof h === "number" ? "FIXED" : h;
  return child;
}
// ---- 文字: テキストスタイルを丸ごと当て、色は変数（部分バインドにしない）
async function T(str, styleName, colorVar) {
  const s = STYLES[styleName]; if (!s) throw new Error("text style not found: " + styleName);
  const t = figma.createText();
  await figma.loadFontAsync(s.fontName);
  await t.setTextStyleIdAsync(s.id);
  t.characters = str; t.fills = [paint(colorVar)]; t.name = str.slice(0, 24);
  return t;
}
// ---- 部品: instance を作り、文言とアイコンはプロパティで渡す
function button(text, variantName, props = {}) {
  const b = variant("button", variantName).createInstance();
  b.setProperties(Object.assign({ "<Button Text のプロパティ名>": text }, props));
  return b;
}

// ---- 置き場所: ページを id で取り、そこへ明示的に入れる（F-PLC-5）。作ったルートの id と所属ページを返す
const page = await figma.getNodeByIdAsync(PAGE_ID);        // 工程0・1で特定したページ
await figma.setCurrentPageAsync(page);
const root = box("VERTICAL", { name: "<オブジェクト>/<ビュー種別>/<状態>" }); // ルートは塗りなし。背景は中の raw:shell-region の箱に持たせる
page.appendChild(root);
// ... ここで root の中身を組む ...
return { rootId: root.id, pageId: root.parent.id, warn };
```

- プロパティ名（`Button Text#37:10` のような id つきの名前）は、部品ごと・ファイルごとに違う。棚卸しで `componentPropertyDefinitions` を読んで控える。
- 変数やスタイルが別ファイルのライブラリにあるときは、キーで読み込む（`importVariableByKeyAsync`／`importStyleByKeyAsync`）。
- DS が無いファイルでは、先に primitive と semantic の変数を定義してからこの関数を使う（[ds](ds.md)「DS不在ファイル」）。

## 4. キットに無い部分

- キットや DS に無い要素（独自のカード、吹き出しなど）を、生の箱と文字のまま画面に置かない。先に部品にしてから instance で置く（[figma-component-design](../../../skills/figma-component-design/SKILL.md)。`new-comp:` 票）。
- 同じ形を2回置くなら、2つ目を置く前に部品にする（F-CMP-6）。
- 部品にしないものは `raw:<コード>` で宣言し、ノード名も `raw:<コード>` にする（[exceptions](exceptions.md)）。

## 5. スクリプトの戻り値

- 作ったルートの node-id、警告（見つからなかった部品・アイコン）、置いた要素の件数を返す。
- 作ったルートの所属ページの id も返し、事前に特定したページと一致するか確かめる（F-PLC-5）。
- 警告が1件でも残っていれば、その段は完了にしない。
- 件数は、設計マッピング表との突合に使う（[mapping](mapping.md)「N突合の定義」）。

## 6. サンプルの値

- `placeholder:` の値（人名、件数、日付、金額）は、全画面で同じ題材・同じ人物・同じ件数にそろえる。一覧の件数と詳細の内訳が合う、同じ人が別の画面で別の部署にならない、日付の前後が合う。
- 題材と語は req か existing から取る。足りない値だけを `placeholder:` とし、最終報告で全件を挙げる（[provenance](provenance.md)）。
- 意味のない仮文や、根拠のない数字で画面を埋めない。

## 7. 色や太さを後からまとめて直すとき

- バインド済みなら、変数の値を変える（数か所で済み、全画面に効く）。新しい段が要るなら、変数の追加をエスカレーションする（鉄則5）。
- 既存の変数の値を変えるのは、影響範囲（その変数を使っている画面）を示して承認を取ってから。今回足した変数は自由に変えてよい。
- バインドされていない箇所が残っているファイルを直すときは、ノードを手で1つずつ直さず、**ノード名と現在の値で対象を絞るスクリプト**で直す。
  - 対象は、自分の成果物ルートの配下か、依頼された範囲の配下だけ。メインコンポーネントは触らない（F-CMP-3）。instance の中の色を生の値で上書きしない（[ds](ds.md)「コンポーネント絡み」）。部品の枠や文字を変えたいときは、変数の値か、部品の改修票（[figma-component-design](../../../skills/figma-component-design/SKILL.md)）で行う。
  - 対象を分ける: 面の境目やカードの枠（構造の線）／表の行の線／ボタンや入力欄など操作部品の枠は、別の段として扱う。名前の正規表現で分類する。
  - スクリプトは、分類ごとの変更件数を返す。0件の分類があれば、名前の条件が合っていない。
  - 直す前と直したあとの描画を並べて見る。境目の画素の値を取って、狙った値になったか確かめる。
  - そのあとで `audit-ds-binding.js` を流し、生の値を残さない（直した値を変数にバインドする）。
- 何をどの値に合わせるかは [tone-measure](tone-measure.md)。

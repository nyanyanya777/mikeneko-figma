# property 軸の設計（Variant／Boolean／Text／Instance Swap）

**いつ読むか**: オーダー2（property 軸の設計）で読む。軸の選び方、組合せ総数の事前計算、バリアント軸の切り方、Boolean・Instance Swap・Text の各 property の作り方。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## property軸の設計判断フロー（最重要）

「この差分は Variant か Boolean か Text か Instance Swap か」を毎差分ごとに以下で決める。

### Variant 軸に入れる条件（**全部**満たすときだけ）
- 値が**有限の列挙**（Default / Filled / Error / Disabled、S / M / L 等）
- 他の軸と**意味的に独立しない**（state が変わると padding や色など複数ノードが連動して変わる）
- そのコンポにとって**最上位の見た目分類**

### Boolean property（Visibility bind）にする条件
- 「**ある / ない**」で切替えたい slot（helper text / leading icon / trailing icon / action button / divider / badge）
- 他の軸と**直交**している（state がどれでも helper の有無は独立に効くべき）
- → Variant に混ぜると `state(5) × hasHelper(2) = 10` バリアントになり、軸を増やすたびに倍々に膨らむ。Boolean で分離すれば軸は state(5) のままで helper 有無は Boolean 1 個で済む。

### Text property にする条件
- そのノードの**中身の文字列が使うたびに変わる**（label / placeholder / helper / error message）
- 複数 variant の同じ意味の text ノードに**同じ text property を bind**して使い回す。
- 意味の違うノードに使い回さない（label と helper を同 property にしない）。

### Instance Swap property にする条件
- そのスロットの**子コンポーネント自体が差し替わる**（icon / avatar / button）
- `preferredValues` で**許可候補を絞る**（任意のコンポが入ると DS が崩れる）
- 1コンポ内に**最大3個まで**（consumer側の component picker が地獄になる）

### 判断早見

| 差分の種類 | 使うべき property |
|---|---|
| 全体state（色・枠・padding が連動して変わる） | Variant |
| size（複数寸法が一斉に変わる） | Variant |
| theme（light/dark） | Variant ではなく **Variable mode** で吸収 |
| helper / icon / action の有無 | Boolean Visibility |
| ラベル / メッセージ文字列 | Text |
| 中に入るアイコン / ボタン本体 | Instance Swap |
| 「枠だけ消したい」など見た目1ノードの ON/OFF | Boolean Visibility |
| **子要素の部分state**（NumberStepperの-/+個別disabled、Paginationの次/前個別非活性 等） | **nested instance の variant を `exposedInstances` 経由で外から制御**（この資料の「ランタイムロジック由来の部分state」） |
| 数値・通貨フォーマット文字列 | Text property（フォーマットは呼び出し側責務） |

### ランタイムロジック由来の部分state（複合コンポの典型）
NumberStepper / Pagination / Rating / Slider 等の「**ランタイムロジックが個別子要素のstateを決める**」ケース:

- 全体stateを Variant にし、**子要素の disabled は子コンポの variant property を外から制御** で表現
- nested instance の variant property を外から触るには、main側で **`exposedInstances` 登録** + consumer側で `setProperties({ '子IconButton#hash': 'state=Disabled' })`
- 部分stateを Boolean で持つのは**最終手段**（軸が増え組合せ爆発）
- ロジック側で値が変わる前提なので「全property組合せ」テストにはこの軸を掛けない → 代わりに**min/標準/max の3点で別途検証**

### 組合せ総数の事前計算（**Variant軸決めた直後に必ず**・正本）
**本体組合せ = `Variant軸 × Boolean軸`** だけを掛ける。**Text property と Instance Swap property は掛けない**（端値テストは別グリッド）。
`state(5) × size(3) × showHelper(2) × showLeading(2) × showTrailing(2) = 240`
- < 20：全件目視可
- 20〜100：全件目視を強く推奨
- 100〜：**設計を疑う**。Boolean を Variant に持ち上げていないか、size を別コンポにできないか、theme を Variable mode に逃せないか再検討

**ランタイムロジック由来の部分state（nested control）も掛けない**（min/標準/max の3点で別途検証）。掛け算で爆発させない。

### hover/focus/pressed の扱い
- Variant に入れる場合、value は CSS pseudo と **1:1 対応** で命名（`Hover` / `Focus` / `Pressed`）。`MouseOver` 等は実装翻訳で詰む。
- ホバー/フォーカスは実装側のみで表現する場合は **Variant化しない**（過剰設計）。

## バリアント軸の切り方

- 1軸目: **state**（Default / Hover / Focus / Filled / Error / Disabled のうち必要なもの**だけ**）
- 2軸目: **size**（必要なら）。サイズで構造が大きく変わるなら**別コンポ**にする。
- 3軸目: **mode**（できれば Variable mode で吸収。Variant軸にはしない方が良い）
- 命名: `state=Default`、`state=Error`。value は **PascalCase**（揺れ禁止：`Default / default / state-default` のような混在禁止）。
- 軸名はファイル内で統一（`state` を `status` と混在させない）。
- **`Default` variant を ComponentSet の先頭に配置**：`createInstance()` は最初の child を返すため、意図した default を先頭にする。

## Boolean / Visibility slot trick

「ある/ない」スロットの標準手順。

1. 該当ノード（helper text frame、leading icon、trailing icon、action）を**全 variant に同じ階層で配置**する。
2. Component properties に Boolean property を `addComponentProperty('showHelper', 'BOOLEAN', true)` で追加。**戻り値の `propId` は `name#hash` 形式**（例：`showHelper#12:0`）。**この propId を必ず保存**。
3. **追加直後に `componentPropertyDefinitions` を再取得して照合**（重複時の suffix で名前が変わる）。
4. **全 variant の該当ノード**の `componentPropertyReferences = { visible: propId }` で bind。**bind値は propId 文字列**、`visible: true/false` を直接書くと bind でなく固定値になる（bind種別の完全表・型整合の正本は→[plugin-api](plugin-api.md) §Plugin API 仕様の落とし穴＞componentPropertyReferences）。
5. **1 variant でも bind 漏れがあるとその variant では切替不可**。レビュー段で全variantの bind 状況を全件確認。
6. **default 値は既存挙動互換に**。新規なら最頻ケースに合わせる。Boolean default を `false` にすると既存インスタンスで隠れて見た目変化→事故。
7. 非表示時に親 frame の auto-layout がきれいに詰まることを確認（HUG なら自動、FIXED なら詰まらず空きが残る）。

### Nested instance（exposedInstances）
- ネストインスタンス内の property を外から触る場合は、main 側で **`exposedInstances`** に登録する。忘れると「外から制御できない」と詰む。
- consumer側で `setProperties` が効かない bug の典型原因。

## Instance Swap property

- 子に入る instance を差替え可能にする property。
- `preferredValues` で**候補を絞る**（許可コンポを限定）。任意のコンポが入ると DS が崩れる。
- 典型用途：Icon swap、Button swap、Avatar swap。
- main 内の **default instance** は最頻ケースの実体を入れる。空 frame をプレースホルダにしない。
- **`component.key` は publish 後に確定**。未publishのコンポを `preferredValues` の key 指定するときは publish 順序を計画。
- bind は `mainComponent` キーにのみ可（型整合の正本は→[plugin-api](plugin-api.md) §Plugin API 仕様の落とし穴＞componentPropertyReferences）。

## Text property

- text ノードの文字列を property として外出し。
- **複数 variant の同じ意味の text ノード**に同じ text property を bind（label を Default / Filled / Error の3 variant の label ノードに同 property で bind）。
- placeholder / label / helper / error など意味ごとに別 property に分ける。1つの property に混在させない。
- bind 値は `characters` で `propId`（string）を指定（型整合の正本は→[plugin-api](plugin-api.md) §Plugin API 仕様の落とし穴＞componentPropertyReferences）。

### 数値・通貨・日付などフォーマット文字列の扱い
- Text property の型は `STRING` のみ。**数値は呼び出し側でformatして渡す**前提（コンポは表示のみ）。
- prefix/suffix（「￥」「個」）は **別 Text property** で持つ。1つに混ぜない（再利用性が落ちる）。
- prefix の有無切替は Boolean Visibility + 固定ノードでも可。
- format の責務はコンポ外（description に「呼び出し側が formatNumber して characters bind」と明記）。

### 同一コンポを違うコンテキストで使う場合の幅整合
（NumberStepper を「99まで」と「99,999まで」両方で使うなど。Tag / Badge / Chip でも頻出）
- HUG だけだとコンテキスト間で幅がブレる。
- **解1（推奨）**: value 表示部に `minWidth` を設定し HUG（短い時もある程度の幅を確保）
- **解2**: `width` を Variant軸にしない（爆発の温床）。代わりに consumer 側で親 frame の幅を FIXED にして子を FILL
- **解3**: 「Compact / Wide」を**別コンポ**にする（構造が大きく違うなら）

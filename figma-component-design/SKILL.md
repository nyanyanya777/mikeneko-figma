---
name: figma-component-design
description: Use when designing a NEW Figma Component (atom/molecule) or doing a major property-axis overhaul on an existing one — choosing Variant vs Boolean vs Text vs Instance Swap axes, deciding HUG/FILL/FIXED for auto-layout, designing slot toggles, binding variables/styles. Enforces axis-orthogonality, dead-space-free sizing, full-combinatorial testing, and impact review on existing usages. Light tweaks belong in figma-ds-edit; whole-screen composition belongs in figma-design-create; raw plugin API calls belong in figma-use.
---

# Figma コンポーネント設計の作業標準

**TL;DR**: 新規Figmaコンポーネント（atom/molecule）の構造とproperty軸を設計する／既存コンポのproperty軸を大改修するときに発火。Variant／Boolean／Text／Instance Swapの軸選択・HUG/FILL/FIXED・slotトグル・Variable/Styleバインドを、軸直交・デッドスペースゼロ・全組合せテスト・既存波及レビューまで通し、**設計したコンポ本体＋全組合せテスト並べ＋既存影響レポート**を数値付きで出力する。

## 適用範囲と境界

姉妹スキル: `figma-ds-edit`（既存DS編集・軽い改修）／ `figma-design-create`（画面新規作成・画面/オブジェクト全体のOOUI設計）／ `figma-use`（プラグインAPI実行のお作法）。本スキルは **コンポーネント本体の構造とproperty軸を新規設計する**、または既存コンポの **property軸／sizing の大改修** をするときだけ使う。

- **やる**: 新規Component（atom/molecule）の軸設計・構造・slot・バインド、既存コンポのproperty軸大改修。
- **やらない**: 軽いテキスト／色差し替え等は `figma-ds-edit` 側。画面・フロー・複数セクションの新規作成は `figma-design-create`。生のPlugin API呼び出しのお作法は `figma-use`。画面・オブジェクト全体のOOUI設計（コレクション⇄シングル・モードレス判定）は `figma-design-create`（本コンポスキルでは決めない）。

### 新規追加 vs 既存改修 vs 旧置換のフロー分岐（前方確定）
**§標準オーダー0「用途と需要の確定」時に必ず明示**。以降の章（特に §既存使用箇所への影響レビュー・3段移行・Publish前スクショ比較）の適用範囲が変わる。

| 種別 | 既存影響レビュー | 3段移行 | Publish前スクショ比較 |
|---|---|---|---|
| **新規追加**（純粋に新コンポを足す） | 不要 | 不要 | 不要 |
| **旧置換**（旧Xをdeprecate→新Yに移行） | **必須** | **必須**（旧残置→新追加→consumer移行→旧削除） | 最低5箇所 |
| **既存改修**（既存コンポのproperty軸/sizing変更等） | **必須** | rename/sizing変更時は必須 | 最低5箇所 |

新規追加時に「既存影響レビュー」を機械的に回さない（時間の無駄）。**旧置換は新規追加+既存改修の最高警戒バージョン**として扱う。

## 鉄則（不可侵原則・最優先・全工程共通）

1. **Sizing は意図して選ぶ**。各 frame の primaryAxis / counterAxis sizing mode について「なぜ HUG / FIXED / FILL か」を1行で言えないなら設計していない。
2. **直交する軸を Variant で掛けない**。state × showHelper を両方Variantにするとバリアント数が爆発する。直交軸は Boolean property で分離。
3. **Variant は最大3軸まで**（state / size / mode 程度）。それ以上欲しくなったら Boolean か別コンポへ分割。
4. **「ある/ない」スロットは Boolean Visibility で切る**。helper / leading icon / trailing icon / action 等を別variantで作らない。
5. **テキスト差替は Text property、子差替は Instance Swap property**。Variantで吸収しようとしない。
6. **内側はオートレイアウト**。絶対配置（layoutPositioning=ABSOLUTE）はoverlayバッジ等の最後の手段のみ（AL計算から除外される）。コンポーネント内部にも隙間専用の空ノード（Spacer＝無記名・無paint・無子で幅/高さだけの間隔埋めノード）を置かない。slot間/要素間の余白は itemSpacing・padding・Boolean Visibility で畳む空き（HUGなら自動で詰まる）で表現する。Spacer禁止は画面だけでなくコンポにも適用される（原則の正典は入口 mikeneko-figma 構造系）。
7. **色・タイポ・spacing・radius・effect は全て Variable / Style バインド**。生値（hex直書き、px直書き）禁止。
8. **デッドスペースは設計失敗のサイン**。primary=FIXED で content より大きい値を取って下に余白が残る、counter方向に空きが出る、はやり直し（**TextField 9pxデッドスペース事件の構造的禁止**。詳細→§オートレイアウト設計＞デッドスペース禁止）。
9. **property命名はファイル内で統一**。`property=Value` 厳守。Variant valueに **`=`/`,`/`/` を含めるとパースエラー**で全壊。Boolean は `showXxx` をファイル内で統一。
10. **Component description に用途・推奨state・非推奨パターン・既知の制約を書く**。使う側が迷ったら設計の負け。
11. **全property組合せでテストして初めて完成**。サンプリングで済ませない。
12. **既存使用箇所への波及確認なしに公開しない**。default値・variant名・sizing の変更はインスタンスを壊す。
13. **共有ライブラリのPublish→Apply UpdatesはPlugin APIから自動化不能**。スキルの完了条件に「Publish済み」を入れない（ユーザー手動操作で完結）。
14. **報告は正直に**。「全N組合せ通った」「未テストM件残った」「既存画面K件に影響、うちJ件はスクショ比較済」を数字で書く。

## 標準オーダー（0→8）

0. **用途と需要の確定〔委譲不可・自分〕**。どの画面のどのスロットで使うか、既存コンポでは何故ダメか、を文章化。同名/類似コンポの存在を inventory で確認（重複作成防止）。新規追加/既存改修/旧置換のどれかを宣言（→§適用範囲と境界＞フロー分岐）。
   - **OOUIスコープ注記**: このコンポは **どのオブジェクトのどのビュー断片（行 / カード / フィールド / chip）か** を一言で言えること。画面・オブジェクト全体のOOUI設計（コレクション⇄シングル・モードレス判定）はここで決めず `figma-design-create` に委ねる。stepper／進捗コンポを“部品として作る”こと自体は正当だが、それが**画面レベルのウィザードを駆動する用途なら本設計でなく design-create へ差し戻す**。ウィザードの段順序やフロー状態をコンポに焼き込まない。
   - **成果物の配置先**を確定（→§成果物の配置先）。
1. **既存DSの確認**。命名規則、使われている Variable / Text Style、Boolean property の命名慣行（`show` vs `has` vs `with`）を inventory。**ファイル内既存に従う**。
2. **property軸の設計**（後述：判断フロー）。軸の数と組合せ総数を**先に掛け算**。100超えは設計を疑う。
3. **構造設計**。auto-layout 方向 / sizing / padding / gap / slot 位置をスケッチ。デッドスペースが出ない sizing を逆算。
4. **ユーザー承認ゲート〔委譲不可・自分〕**。共有資産を触る前に「軸設計 / 構造 / 命名 / 組合せ総数」をユーザー提示。承認なしで実装着手しない。
5. **実装（書き込み・段階）**。順序: ① 基本構造（auto-layout + sizing）→ ② 1個目の variant 完成 → ③ `combineAsVariants` でセット化 → ④ 各 variant を展開 → ⑤ Variable/Text Style バインド → ⑥ Boolean / Text / Instance Swap property を `addComponentProperty` で追加 → ⑦ 各 variant の対応ノードに **同一propId** で bind。各段でスクショ自己確認。
6. **全property組合せテスト**（後述）。専用「テスト並べフレーム」を作り get_screenshot で全件目視。
7. **既存使用箇所への影響レビュー**。検索 → スクショ前後比較 → 互換性のないものは default 値で吸収するか旧 variant 残置で猶予。
8. **報告**。組合せ件数、テスト結果、影響件数、未対応事項、Publishの所在（master file側で作業しているか）を数値で。

## チーム編成

レジェンド: ①〜＝ロール、0→8＝標準オーダー工程。

- **マネージャー（委譲不可・全工程のゲート）**: ゲート（軸数3超え、組合せ数爆発、Variable未バインド、既存影響未確認、`remote: true` ファイルで作業しようとしているのを止める）。＝オーダー0（用途確定）・オーダー4（承認）＋各段の停止権。
- **① 偵察（=オーダー1）**: 既存DS / 命名規則 / 変数の inventory。
- **② 設計（=オーダー2,3）**: property軸と構造、sizing 方針、組合せ総数の事前計算。
- **③ 実装（=オーダー5）**: Figma 上でコンポ生成・property bind。
- **④ レビュー（敵対的）（=オーダー6,7）**: 全組合せスクショと既存使用箇所のスクショ比較。

並列OK=①④。直列=②→③。

## ゲート一覧

委譲不可・承認・テスト・影響レビュー・完了条件の一元索引。詳細手順は各§本文に残す（ここは索引のみ・加算的）。

| ゲート | 発火タイミング | 合格基準 | 詳細§ |
|---|---|---|---|
| 用途・需要確定〔委譲不可・自分〕 | オーダー0 | 用途・既存不採用理由・同名/類似の不在確認・新規/改修/旧置換の宣言・OOUIスコープ注記・配置先が揃う | §標準オーダー0 / §適用範囲と境界 |
| 軸設計マネージャーゲート〔委譲不可〕 | オーダー2直後 | Variant軸≤3、組合せ総数を掛け算で明示、100超は再設計、直交軸をVariantに掛けていない | §property軸の設計判断フロー |
| ユーザー承認〔委譲不可・自分〕 | オーダー4（共有資産を触る前） | 軸設計／構造／命名／組合せ総数をユーザー提示し承認取得 | §標準オーダー4 |
| 全property組合せテスト | オーダー6 | 本体組合せ全件＋Boolean 2^N全件＋Text端値＋Instance Swap端値＋親幅3点＋reset＋light/darkを目視、破綻0 | §全property組合せテスト |
| 既存影響レビュー（旧置換・既存改修のみ） | オーダー7 | 使用箇所全列挙、default非破壊、rename3段移行、sizing変更は前後スクショ最低5箇所 | §既存使用箇所への影響レビュー |
| Variable/Styleバインド監査 | オーダー5/6 | 色・タイポ・spacing・radius・effectが全てバインド、生値0（light/darkで露呈確認） | §変数・スタイル必須ルール |
| 完了条件（Publishは含めない） | オーダー8 | 組合せ件数／テスト結果／影響件数／未対応を数値報告。**「Publish済み」を完了条件に入れない**（Plugin API自動化不能・ユーザー手動操作で完結） | §共有ライブラリ（Publish）特性 |

## 詳細・判断基準

内部は「設計判断 → 検証手順 → 実装注意」の順。実装直前専用の低レベルAPI詳細（Plugin API落とし穴）は末尾へ隔離。

### property軸の設計判断フロー（最重要）

「この差分は Variant か Boolean か Text か Instance Swap か」を毎差分ごとに以下で決める。

#### Variant 軸に入れる条件（**全部**満たすときだけ）
- 値が**有限の列挙**（Default / Filled / Error / Disabled、S / M / L 等）
- 他の軸と**意味的に独立しない**（state が変わると padding や色など複数ノードが連動して変わる）
- そのコンポにとって**最上位の見た目分類**

#### Boolean property（Visibility bind）にする条件
- 「**ある / ない**」で切替えたい slot（helper text / leading icon / trailing icon / action button / divider / badge）
- 他の軸と**直交**している（state がどれでも helper の有無は独立に効くべき）
- → Variant に混ぜると `state(5) × hasHelper(2) = 10` バリアントになり、軸を増やすたびに倍々に膨らむ。Boolean で分離すれば軸は state(5) のままで helper 有無は Boolean 1 個で済む。

#### Text property にする条件
- そのノードの**中身の文字列が使うたびに変わる**（label / placeholder / helper / error message）
- 複数 variant の同じ意味の text ノードに**同じ text property を bind**して使い回す。
- 意味の違うノードに使い回さない（label と helper を同 property にしない）。

#### Instance Swap property にする条件
- そのスロットの**子コンポーネント自体が差し替わる**（icon / avatar / button）
- `preferredValues` で**許可候補を絞る**（任意のコンポが入ると DS が崩れる）
- 1コンポ内に**最大3個まで**（consumer側の component picker が地獄になる）

#### 判断早見

| 差分の種類 | 使うべき property |
|---|---|
| 全体state（色・枠・padding が連動して変わる） | Variant |
| size（複数寸法が一斉に変わる） | Variant |
| theme（light/dark） | Variant ではなく **Variable mode** で吸収 |
| helper / icon / action の有無 | Boolean Visibility |
| ラベル / メッセージ文字列 | Text |
| 中に入るアイコン / ボタン本体 | Instance Swap |
| 「枠だけ消したい」など見た目1ノードの ON/OFF | Boolean Visibility |
| **子要素の部分state**（NumberStepperの-/+個別disabled、Paginationの次/前個別非活性 等） | **nested instance の variant を `exposedInstances` 経由で外から制御**（後述：ランタイムロジック由来の部分state） |
| 数値・通貨フォーマット文字列 | Text property（フォーマットは呼び出し側責務） |

#### ランタイムロジック由来の部分state（複合コンポの典型）
NumberStepper / Pagination / Rating / Slider 等の「**ランタイムロジックが個別子要素のstateを決める**」ケース:

- 全体stateを Variant にし、**子要素の disabled は子コンポの variant property を外から制御** で表現
- nested instance の variant property を外から触るには、main側で **`exposedInstances` 登録** + consumer側で `setProperties({ '子IconButton#hash': 'state=Disabled' })`
- 部分stateを Boolean で持つのは**最終手段**（軸が増え組合せ爆発）
- ロジック側で値が変わる前提なので「全property組合せ」テストにはこの軸を掛けない → 代わりに**min/標準/max の3点で別途検証**

#### 組合せ総数の事前計算（**Variant軸決めた直後に必ず**・正本）
**本体組合せ = `Variant軸 × Boolean軸`** だけを掛ける。**Text property と Instance Swap property は掛けない**（端値テストは別グリッド）。
`state(5) × size(3) × showHelper(2) × showLeading(2) × showTrailing(2) = 240`
- < 20：全件目視可
- 20〜100：全件目視を強く推奨
- 100〜：**設計を疑う**。Boolean を Variant に持ち上げていないか、size を別コンポにできないか、theme を Variable mode に逃せないか再検討

**ランタイムロジック由来の部分state（nested control）も掛けない**（min/標準/max の3点で別途検証）。掛け算で爆発させない。

#### hover/focus/pressed の扱い
- Variant に入れる場合、value は CSS pseudo と **1:1 対応** で命名（`Hover` / `Focus` / `Pressed`）。`MouseOver` 等は実装翻訳で詰む。
- ホバー/フォーカスは実装側のみで表現する場合は **Variant化しない**（過剰設計）。

### オートレイアウト設計

#### sizing mode の選び方
各 frame について primary / counter 両方を以下から選び、選択理由を残す。

- **HUG (AUTO)**：中身の高さ / 幅で決まる。中身が伸縮する方向には基本これ。
- **FILL (STRETCH)**：親の残り領域を埋める。横幅を親に合わせたい子はこれ。
- **FIXED**：寸法を固定。**親の指定された外形寸法**にだけ使う。中身に対しては使わない。

#### API の混在禁止
- 新API `layoutSizingHorizontal` / `layoutSizingVertical` と旧API `primaryAxisSizingMode` / `counterAxisSizingMode` を**混在させない**。**新API に統一**。
- `resize()` を呼ぶと sizing mode が静かに FIXED に戻る。resize 後に sizing を再設定する。

#### 既定パターン（迷ったらこれ）
- **コンテナ**：AL VERTICAL / primary=**HUG** / counter=**FIXED**（設計幅）or **FILL**（親追従）
- **行スロット**：AL HORIZONTAL / primary=**FILL** / counter=**HUG**
- **可変表示の子**（helper / message / icon row）：flex の子として `layoutSizingHorizontal=FILL`, `layoutSizingVertical=HUG`、表示有無は Boolean Visibility

#### HUG が効かない事故
- **HUG親 + 全FIXED子** は HUG が無効化される。子のsizingを先に決めてから親をHUGに、順序が逆だと後で resize して静かに FIXED に戻る。
- **入れ子コンポーネントの sizing 継承**：内側コンポがFIXED幅で外側がHUGの場合、外側が内側に固定される。**内側はFILL、外側がHUG** が基本則。

#### デッドスペース禁止（**TextField事件の制度的再発防止**・正本）
- primary=FIXED で content より大きい値を入れると **下/右に常時余白** が残る。これが起きたら primary=HUG にする。
- 例：TextField で `primary=FIXED 109px` だが content は 100px → 9px のデッドスペース。helper を Boolean visible にし、container を primary=HUG に直すと、helper 有無で 72 / 100 が自然に出る。
- （鉄則8・§やってはいけない の「TextField事件」はこの正本を指す）
- （本節は画面側 design-create §8(h)『auto-layout厳守逆監査』とds-editのauto-layout観点が参照するコンポ内部の機械則・正本。Spacer/デッドスペースの構造判定基準はここに集約し、各スキルは→ポインタで参照する。）

#### itemSpacing と alignment の衝突
- `itemSpacing = "AUTO"` (space-between) は `primaryAxisAlignItems` を**上書き**する。同時指定は直感に反するので、どちらかに統一。

#### textAutoResize の設定
- `WIDTH_AND_HEIGHT`（HUG扱い）／`HEIGHT`（FILL幅）／`NONE`（固定）。AL内のテキストは**意図して選ぶ**。未設定で「テキストが折り返さない」事故。

#### 絶対配置を使ってよい唯一のケース
- overlay バッジ、フォーカスリング外側など、**親のレイアウトに影響を与えてはいけない装飾**のみ（`layoutPositioning=ABSOLUTE`はAL計算から除外）。
- 伸縮するコンテンツ（helper / error / dropdown）を absolute にしない。flex 子 + visibility で切る。

#### min / max を使う場面
- ボタンの最小幅、メッセージの折返し上限、スライダーの最小トラック長など、**中身が極端な値でも壊れない**ための保険。理由なく付けない。

### バリアント軸の切り方

- 1軸目: **state**（Default / Hover / Focus / Filled / Error / Disabled のうち必要なもの**だけ**）
- 2軸目: **size**（必要なら）。サイズで構造が大きく変わるなら**別コンポ**にする。
- 3軸目: **mode**（できれば Variable mode で吸収。Variant軸にはしない方が良い）
- 命名: `state=Default`、`state=Error`。value は **PascalCase**（揺れ禁止：`Default / default / state-default` のような混在禁止）。
- 軸名はファイル内で統一（`state` を `status` と混在させない）。
- **`Default` variant を ComponentSet の先頭に配置**：`createInstance()` は最初の child を返すため、意図した default を先頭にする。

### Boolean / Visibility slot trick

「ある/ない」スロットの標準手順。

1. 該当ノード（helper text frame、leading icon、trailing icon、action）を**全 variant に同じ階層で配置**する。
2. Component properties に Boolean property を `addComponentProperty('showHelper', 'BOOLEAN', true)` で追加。**戻り値の `propId` は `name#hash` 形式**（例：`showHelper#hash`）。**この propId を必ず保存**。
3. **追加直後に `componentPropertyDefinitions` を再取得して照合**（重複時の suffix で名前が変わる）。
4. **全 variant の該当ノード**の `componentPropertyReferences = { visible: propId }` で bind。**bind値は propId 文字列**、`visible: true/false` を直接書くと bind でなく固定値になる（bind種別の完全表・型整合の正本は→§Plugin API 仕様の落とし穴＞componentPropertyReferences）。
5. **1 variant でも bind 漏れがあるとその variant では切替不可**。レビュー段で全variantの bind 状況を全件確認。
6. **default 値は既存挙動互換に**。新規なら最頻ケースに合わせる。Boolean default を `false` にすると既存インスタンスで隠れて見た目変化→事故。
7. 非表示時に親 frame の auto-layout がきれいに詰まることを確認（HUG なら自動、FIXED なら詰まらず空きが残る）。

#### Nested instance（exposedInstances）
- ネストインスタンス内の property を外から触る場合は、main 側で **`exposedInstances`** に登録する。忘れると「外から制御できない」と詰む。
- consumer側で `setProperties` が効かない bug の典型原因。

### Instance Swap property

- 子に入る instance を差替え可能にする property。
- `preferredValues` で**候補を絞る**（許可コンポを限定）。任意のコンポが入ると DS が崩れる。
- 典型用途：Icon swap、Button swap、Avatar swap。
- main 内の **default instance** は最頻ケースの実体を入れる。空 frame をプレースホルダにしない。
- **`component.key` は publish 後に確定**。未publishのコンポを `preferredValues` の key 指定するときは publish 順序を計画。
- bind は `mainComponent` キーにのみ可（型整合の正本は→§Plugin API 仕様の落とし穴＞componentPropertyReferences）。

### Text property

- text ノードの文字列を property として外出し。
- **複数 variant の同じ意味の text ノード**に同じ text property を bind（label を Default / Filled / Error の3 variant の label ノードに同 property で bind）。
- placeholder / label / helper / error など意味ごとに別 property に分ける。1つの property に混在させない。
- bind 値は `characters` で `propId`（string）を指定（型整合の正本は→§Plugin API 仕様の落とし穴＞componentPropertyReferences）。

#### 数値・通貨・日付などフォーマット文字列の扱い
- Text property の型は `STRING` のみ。**数値は呼び出し側でformatして渡す**前提（コンポは表示のみ）。
- prefix/suffix（「￥」「個」）は **別 Text property** で持つ。1つに混ぜない（再利用性が落ちる）。
- prefix の有無切替は Boolean Visibility + 固定ノードでも可。
- format の責務はコンポ外（description に「呼び出し側が formatNumber して characters bind」と明記）。

#### 同一コンポを違うコンテキストで使う場合の幅整合
（NumberStepper を「99まで」と「99,999まで」両方で使うなど。Tag / Badge / Chip でも頻出）
- HUG だけだとコンテキスト間で幅がブレる。
- **解1（推奨）**: value 表示部に `minWidth` を設定し HUG（短い時もある程度の幅を確保）
- **解2**: `width` を Variant軸にしない（爆発の温床）。代わりに consumer 側で親 frame の幅を FIXED にして子を FILL
- **解3**: 「Compact / Wide」を**別コンポ**にする（構造が大きく違うなら）

### 変数・スタイル必須ルール

- **色**：fill / stroke は全て Color Variable bind。state ごとに違う色は Variable の alias / mode で吸収するか variant ごとに別 Variable を bind。
- **タイポ**：Text Style 必須。font size / weight / line height を生値で指定しない。
- **spacing / padding / gap**：Number Variable bind 推奨（DS で定義があれば必須）。
- **radius**：Number Variable bind。
- **effect**（shadow / blur）：Effect Style bind。
- **theme（light/dark）**：Variant軸にせず Variable mode で吸収。
- インスタンス内部での生値上書きは禁止。差分はすべて property 経由 or variant 経由で表現。

### 全property組合せテスト

#### 事前計算
軸を決めた直後に **総数を掛け算で書く**（規模別の閾値・本体組合せの定義は正本→§property軸の設計判断フロー＞組合せ総数の事前計算）：
`state(5) × size(2) × showHelper(2) × showLeading(2) × showTrailing(2) = 80`

#### テスト並べフレーム（**4グリッドに分割、掛け算で爆発させない**）

| グリッド | 対象 | 並べ方 |
|---|---|---|
| **A. 本体組合せ** | Variant軸 × Boolean全パターン | 横軸=主Variant軸、縦軸=副Variant×Boolean全組合せ |
| **B. Text端値** | 「代表variant1つ」× 全端値 | 空文字 / 1字 / 想定最大長 / +α / CJK / RTL / 絵文字 |
| **C. Instance Swap端値** | 「代表variant1つ」× 全候補 | 最も縦に大きい instance と 最も小さい instance |
| **D. 親frame幅** | 「代表variant1つ」× resize 3点 | 最小 / 標準 / 最大 |

各グリッドは独立フレーム。**A×B×C×D を1枚にしない**。

#### グリッドAのレイアウト規範
- 横軸: 主 Variant 軸（例: `state` を横に `Default / Disabled`）
- 縦軸: 副 Variant 軸 × Boolean 全組合せ
- **各セル下に property組合せをTextラベルで表示**（`state=Default | size=S | showHelper=true`）← レビュワーエージェントに渡すとき必須
- セル間は最低 24px gap（境界混在防止）
- フレーム title に総組合せ数（`NumberStepper 全組合せ (16件)`）

#### 異常検出基準
レイアウト破綻（はみ出し / 詰まりすぎ / デッドスペース / 縦中心ズレ / 折返し暴発）を 1 件でも見つけたら **軸設計か sizing 設計を見直す**。個別パッチで隠さない。

#### Boolean 全パターン
N 個の Boolean があれば 2^N 通り。N=3 なら 8 通り。**全部出す**。「典型3パターンだけ」は NG。

#### Text 端値
- 空文字 / 1 字 / 想定最大長 / 想定最大長 +α（折返し起きる長さ）
- 多言語想定があるなら CJK / 英数 / アラビア（RTL）も。
- 絵文字込みでテスト（行高ズレの典型原因）。

#### Instance Swap 端値
- 候補の中で**最も縦に大きい** instance と **最も小さい** instance の両方を入れて並べる。
- **異autolayoutへの差し替え**で親のHUGが暴れないか確認。

#### 親frame幅テスト
- 最小 / 標準 / 最大の3点で必ず resize 確認。FILL が効いていない事故をここで検出。

#### Reset all overrides テスト
- override で成立してる「設計上のごまかし」を発見する手段。reset 後に意図通りの default 表示になることを確認。

#### Light/Dark mode テスト（Variable bind の検証）
- 両モードでスクショ。bind 漏れの hex 直書きがここで露呈。

### 既存使用箇所への影響レビュー（旧置換・既存改修のみ）

property を後から触るとき、または default sizing を変えるときに必須。新規追加時はスキップ可（→§適用範囲と境界＞フロー分岐）。

- **インスタンス検索**：そのコンポを使っている画面を全リストアップ。
- **default 値**：新規 Boolean / Text / Instance Swap property の default は**既存インスタンスが見た目変わらない値**に設定。
- **variant rename は最大警戒**：旧 variant 名をしばらく残し、新名と並行運用。旧→新の移行コメントを description に。**3段移行**（deprecate → 新規追加 → 旧削除）。
- **property delete も破壊的**：bind先が detach、見た目が崩れる。削除前に consumer 側影響範囲調査必須。
- **sizing 変更（FIXED→HUG 等）は全インスタンスの高さ/幅に波及**：受領前に既存画面のスクショ前後比較を**最低5箇所**取って提示。
- 互換が取れないときは「旧コンポを Deprecated タグで残し新コンポを別名で立てる」を選択肢に。

### 成果物の配置先

新規コンポ本体・全組合せテスト並べを **どこに置くか** を着手前に確定する。

- **新規コンポは既存コンポ用Pageの命名規則・原子レベル区分（atom / molecule 等）に揃えて配置**する。独自の置き場所を勝手に作らない。
- **`page-list`（page一覧取得）は Cover しか返さないことがある罠**。空振りを「該当Page無し」と解さず、**全Pageを走査**してから判断（不在を断定して新規作成する前に積極確認）。
- **勝手に新規Pageを作らない**。「別ページに作って」と明示されたときだけ新規Page、node-id指定はin-place。
- **全property組合せの「テスト並べフレーム」は成果物Pageに混在させず、別Page/別領域へ隔離**する（DS/共有コンポ本体はDSページ）。検証用が成果物に紛れないようにする。

### 共有ライブラリ（Publish）特性

- **`remote: true` の master は read-only**：consumer ファイル内のキャッシュ master は編集不能。修正は **master file を直接開いて作業**する。
- **Publish は file 全体単位**：1コンポ修正でも全componentが Publish 対象。差分レビューを必ず確認。
- **Publish → Apply Updates は Figma UI 操作**：Plugin API から自動化不能。スキルの完了条件に「Publish済み」を入れない（ユーザー手動操作で完結）。
- **Component KEY (`component.key`) は publish 後に確定**：未publish は空。instance swap で key 指定するときは publish 順序を計画。

### Component description

実装の最後に必ず設定（Asset panel での発見性に直結）:

- **用途**: どんな画面のどんな役割で使うか（1行）
- **推奨 state**: Default / Filled / Error の使い分け
- **非推奨パターン**: detach 禁止、override での生値上書き禁止 等
- **既知の制約**: Boolean default の挙動、nested instance の制御方法 等
- **関連リンク**: 使い方ドキュメント URL

### Plugin API 仕様の落とし穴（実装時の必読・低レベルAPI隔離）

#### combineAsVariants
- 同一 parent 直下に並んだ **すべてComponent** であること。**Frame 混在不可**。
- 既に ComponentSet 内のものを再 `combineAsVariants` すると **入れ子エラー**。事前に parent 確認。
- variant 名は `property=Value` 形式で命名してから combine。

#### addComponentProperty
- 戻り値の `propId` は **`name#hash` 形式**（例：`showHelper#hash`）。
- 名前が重複すると Figma 側で suffix が付く → **追加直後に再取得して照合**。
- 削除する場合は `deleteComponentProperty(propId)`。bind 先は自動で detach。

#### componentPropertyReferences（bind 種別の完全表・bind型整合の正本）
bind の key は対象により異なる。**`visible` 以外も必須で覚える**。

| bind key | 対象ノード | 必要な property type | 例 |
|---|---|---|---|
| `visible` | 任意ノード（表示有無） | BOOLEAN | `{ visible: 'showHelper#hash' }` |
| `characters` | TextNode の文字列 | TEXT | `{ characters: 'value#hash' }` |
| `mainComponent` | InstanceNode の差替先 | INSTANCE_SWAP | `{ mainComponent: 'icon#hash' }` |
| Variant property名 | nested ComponentSet の variant 選択 | VARIANT（同名同値） | `{ 'state': 'innerState#hash' }` |

##### 型整合（不一致は静かに失敗）
- Boolean property → `visible` のみ bind 可
- Text property → `characters` のみ bind 可
- Instance Swap property → `mainComponent` のみ bind 可
- **外側のBooleanを内側のVariant property(value=Disabled)にbindしたい等の型不一致は不可**。代わりに consumer 側で `setProperties({ '子#hash': 'state=Disabled' })` を呼ぶ、または nested を `exposedInstances` 化して外から制御
- bind 値は**propId 文字列**。`true/false` を直書きすると bind でなく固定値になり、後から property を変えても挙動が変わらない（静かな事故）
- 全 variant の該当ノードに同じ propId で bind が必要（1variantでも漏れると切替不能）

##### 失敗時の典型症状
- `visible` 直書き `true/false` → 固定値化、切替不能
- propId の hash 部分が古い（property再作成後の参照） → bind が消滅
- nested instance に bind したいが `exposedInstances` 未登録 → consumer から触れない

#### nested instance の内部 property を main 側で固定する（外に出さない場合）
NumberStepper の左ボタン内の Icon を「常にMinus」のように内部固定したいとき:
- `exposedInstances` に**入れない**
- main 側で `instance.setProperties({ 'name': 'Minus' })` を一度実行して焼き付け
- **variant 切替で焼き付けが消える事故あり** → 全 variant の同名 nested instance に同じ `setProperties` を実行
- bind ではなく override で固定する点に注意（property 変更で挙動が変わらない＝静的）

#### swapComponent / setProperties
- `swapComponent` は **同一 property 名の override のみ引き継ぐ**。property名変更で override 消失。
- `setProperties` は **1回でまとめて呼ぶ**（連続呼び出しはチラつき＋遅い）。

#### Variant value の禁止文字
- `=`、`,`、`/` を含むとパースエラー（例：`On/Off` を `On,Off` にしただけで全壊）。

#### 既存インスタンスへの property 後追加
- 既存インスタンスに伝播するが、**Boolean default=false** だと visible bind された子が非表示で出現する。default 選定で既存画面が壊れないことを確認。

## やってはいけない

- 直交軸を Variant 軸として掛けてバリアント爆発（`state × showHelper` 等）
- 「ある / ない」を別 variant で作る（Boolean Visibility 不使用）
- primary=FIXED で content より大きい値を入れてデッドスペースを残す（**TextField事件再発**・正本→§オートレイアウト設計＞デッドスペース禁止）
- 伸縮するスロットを `layoutPositioning=ABSOLUTE` で配置する（AL計算から除外される）
- Variable / Style バインドなしで hex / px 直書き
- バリアント命名のゆれ（`Default / default / state-default` 混在）／Variant valueに `=` `,` `/` を含める
- Boolean property を一部 variant にしか bind しない
- bind 値に `propId` 文字列でなく `true/false` を直書きする
- Text property を意味の違うノードに使い回す（label と helper を同 property に）
- nested instance を `exposedInstances` に登録せずに外から制御しようとする
- 既存使用箇所の確認なしに default / variant 名 / sizing を変更
- variant rename を3段移行せず一発で行う
- 全組合せテストをサンプリング（「典型だけ」）で済ます
- 組合せ数を計算せずに軸を増やす
- 旧API (`primaryAxisSizingMode`) と新API (`layoutSizingHorizontal`) を混在させる
- `resize()` 後に sizing mode を再設定し忘れる
- consumer ファイルの remote master を編集しようとする
- スキルの完了条件に「Publish 済み」を入れる（自動化不能）
- 報告で「だいたい通った」と書く（数値で書く）
- 成果物Pageを勝手に新設する／テスト並べフレームを成果物に混在させる（→§成果物の配置先）
- ウィザードの段順序・フロー状態をコンポに焼き込む（画面ウィザード駆動なら design-create へ差し戻す。→§標準オーダー0 OOUIスコープ注記）

## 関連メモリ / 参照

- `figma-use`：プラグインAPI 実行のお作法
- `figma-ds-edit`：既存DS の編集（軽い改修はこちら）
- `figma-design-create`：画面を新規に組む側（画面/オブジェクト全体のOOUI設計・ページ編成はこちら）
- 入口 `mikeneko-figma`：共通禁止事項の正典（SOT）

---
name: figma-component-design
description: Use when designing a NEW Figma Component (atom/molecule) or doing a major property-axis overhaul on an existing one — choosing Variant vs Boolean vs Text vs Instance Swap axes, deciding HUG/FILL/FIXED for auto-layout, designing slot toggles, binding variables/styles. Enforces axis-orthogonality, dead-space-free sizing, full-combinatorial testing, and impact review on existing usages. Light tweaks belong in figma-ds-edit; whole-screen composition belongs in figma-design-create; raw plugin API calls belong in figma-use.
---

# Figma コンポーネント設計の作業標準

**TL;DR**: この本文は流れ・鉄則・合格条件だけを持ち、詳しい手順は `references/` に置く（末尾の索引に、いつ読むかを書いてある。そのオーダーに入るときに読む）。新規Figmaコンポーネント（atom/molecule）の構造とproperty軸を設計する／既存コンポのproperty軸を大改修するときに発火。Variant／Boolean／Text／Instance Swapの軸選択・HUG/FILL/FIXED・slotトグル・Variable/Styleバインドを、軸直交・デッドスペースゼロ・全組合せテスト・既存波及レビューまで通し、**設計したコンポ本体＋全組合せテスト並べ＋既存影響レポート**を数値付きで出力する。

## 適用範囲と境界

姉妹スキル: `figma-ds-edit`（既存DS編集・軽い改修）／ `figma-design-create`（画面新規作成・画面/オブジェクト全体のOOUI設計）／ `figma-use`（プラグインAPI実行のお作法）。本スキルは **コンポーネント本体の構造とproperty軸を新規設計する**、または既存コンポの **property軸／sizing の大改修** をするときだけ使う。

- **やる**: 新規Component（atom/molecule）の軸設計・構造・slot・バインド、既存コンポのproperty軸大改修。
- [figma-design-create](../../skills/figma-design-create/SKILL.md)/[figma-ds-edit](../../skills/figma-ds-edit/SKILL.md)の途中で『DSに無い部品』が判明した場合の**寄り道先**もここ（`new-comp:`票経由。部品完成後に元スキルの工程へ戻す）。
- **やらない**: 軽いテキスト／色差し替え等は `figma-ds-edit` 側。画面・フロー・複数セクションの新規作成は `figma-design-create`。生のPlugin API呼び出しのお作法は `figma-use`。画面・オブジェクト全体のOOUI設計（コレクション⇄シングル・モードレス判定）は `figma-design-create`（本コンポスキルでは決めない）。

### 新規追加 vs 既存改修 vs 旧置換のフロー分岐（前方確定）
**§標準オーダー0「用途と需要の確定」時に必ず明示**。以降の章（特に [impact-review](references/impact-review.md) §既存使用箇所への影響レビュー・3段移行・Publish前スクショ比較）の適用範囲が変わる。

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
6. **内側はオートレイアウト**。絶対配置（layoutPositioning=ABSOLUTE）はoverlayバッジ等の最後の手段のみ（AL計算から除外される）。コンポーネント内部にも隙間専用の空ノード（Spacer＝無記名・無paint・無子で幅/高さだけの間隔埋めノード）を置かない。slot間/要素間の余白は itemSpacing・padding・Boolean Visibility で畳む空き（HUGなら自動で詰まる）で表現する。Spacer禁止は画面だけでなくコンポにも適用される（原則の正典は入口 [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)§構造系 F-STR-1/F-STR-2、コンポ内部のsizing機械則の正典は本スキル）。
7. **生値（hex直書き、px直書き）禁止＝色・タイポ・spacing・radius・effect は全て Variable / Style バインド（F-QLT-5 → [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)§品質系）**。バインド詳細は [variables](references/variables.md) §変数・スタイル必須ルール。
8. **デッドスペースは設計失敗のサイン**。primary=FIXED で content より大きい値を取って下に余白が残る、counter方向に空きが出る、はやり直し（**TextField 9pxデッドスペース事件の構造的禁止**。詳細→[auto-layout](references/auto-layout.md) §オートレイアウト設計＞デッドスペース禁止）。
9. **property命名はファイル内で統一**。`property=Value` 厳守。Variant valueに **`=`/`,`/`/` を含めるとパースエラー**で全壊。Boolean は `showXxx` をファイル内で統一。
10. **Component description に用途・推奨state・非推奨パターン・既知の制約を書く**。使う側が迷ったら設計の負け。
11. **全property組合せでテストして初めて完成**。サンプリングで済ませない。
12. **既存使用箇所への波及確認なしに公開しない**。default値・variant名・sizing の変更はインスタンスを壊す。
13. **共有ライブラリのPublish→Apply UpdatesはPlugin APIから自動化不能**。スキルの完了条件に「Publish済み」を入れない（ユーザー手動操作で完結）。
14. **報告は正直に**。「全N組合せ通った」「未テストM件残った」「既存画面K件に影響、うちJ件はスクショ比較済」を数字で書く。

## 標準オーダー（0→8）

0. **用途と需要の確定〔委譲不可・自分〕**。どの画面のどのスロットで使うか、既存コンポでは何故ダメか、を文章化。同名/類似コンポの存在を inventory で確認（重複作成防止）。新規追加/既存改修/旧置換のどれかを宣言（→§適用範囲と境界＞フロー分岐）。
   - **OOUIスコープ注記**: このコンポは **どのオブジェクトのどのビュー断片（行 / カード / フィールド / chip）か** を一言で言えること。画面・オブジェクト全体のOOUI設計（コレクション⇄シングル・モードレス判定）はここで決めず `figma-design-create` に委ねる。stepper／進捗コンポを“部品として作る”こと自体は正当だが、それが**画面レベルのウィザードを駆動する用途なら本設計でなく design-create へ差し戻す**。ウィザードの段順序やフロー状態をコンポに焼き込まない。[feedback_wireframes_ooui_bound](../../docs/feedback_wireframes_ooui_bound.md)
   - 案件の DESIGN.md があれば読む（好みの記録。F-PRC-13 → [context](../../skills/mikeneko-figma/references/context.md)）。新規部品では、オーダー5で1つ目の variant ができた時点で、代表の使用箇所に置いて依頼者に見せ、方向を確かめてから残りの variant を作る（F-PRC-14）。
   - **成果物の配置先**を確定（→[placement-publish](references/placement-publish.md) §成果物の配置先）。
1. **既存DSの確認**。命名規則、使われている Variable / Text Style、Boolean property の命名慣行（`show` vs `has` vs `with`）を inventory。**ファイル内既存に従う**。
   - **参照ファースト＝REF宣言（F-PRC-11 → [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)§進め方系。新しい見た目の判断を伴うときだけ。property 軸だけの改修は対象外）**: 軸設計（order 2）の前に `lazyweb_search`（このコンポのUIパターン名＋platform、例 "segmented control desktop"）で実参照を1〜3件取得し《クエリ／参照名／なぜ良いか根拠1〜3行＝構造の言語／`[REF:]`タグ》で固定。単体atomでもUIパターン名検索は有効。参照からの要件外要素流用は提案止まり（承認まで実装禁止・F-SRC-2）。
2. **property軸の設計**（→ [property-axes](references/property-axes.md)）。軸の数と組合せ総数を**先に掛け算**。100超えは設計を疑う。
3. **構造設計**。auto-layout 方向 / sizing / padding / gap / slot 位置をスケッチ。デッドスペースが出ない sizing を逆算（→ [auto-layout](references/auto-layout.md)）。
4. **ユーザー承認ゲート〔委譲不可・自分〕**。共有資産を触る前に「軸設計 / 構造 / 命名 / 組合せ総数」をユーザー提示。承認なしで実装着手しない。
5. **実装（書き込み・段階）**。着手の前に [plugin-api](references/plugin-api.md) を読む。順序: ① 基本構造（auto-layout + sizing）→ ② 1個目の variant 完成 → ③ `combineAsVariants` でセット化 → ④ 各 variant を展開 → ⑤ Variable/Text Style バインド → ⑥ Boolean / Text / Instance Swap property を `addComponentProperty` で追加 → ⑦ 各 variant の対応ノードに **同一propId** で bind。各段でスクショ自己確認。
6. **全property組合せテスト**（→ [combination-test](references/combination-test.md)）。専用「テスト並べフレーム」を作り get_screenshot で全件目視。
7. **既存使用箇所への影響レビュー**。検索 → スクショ前後比較 → 互換性のないものは default 値で吸収するか旧 variant 残置で猶予。
   - **業界ベンチマークreportゲート（F-QLT-8 → [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)§品質系。規模が大のとき、または依頼者が求めたときだけ）**: 全組合せテスト並べ（order 6）完成後、本レビューと並走で `lazyweb_generate_report`（**入力=全組合せテスト並べスクショ＋代表使用文脈**）を発火。返る全所見に処分表（(a)修正済み/(b)根拠付き棄却/(c)エスカレ）が付くまで完了不可。**画面ベンチマーク寄りゆえの"単体atomに画面文脈を求める"ノイズ所見は(b)根拠付き棄却で安価に吸収**（棄却根拠例:「本スキルのスコープ外＝画面合成はdesign-createの責務」）。不通時は`lazyweb_health`→1回再試行→だめなら「未実施」と報告して依頼者に判断を仰ぐ（黙って飛ばさない）。
8. **報告**。組合せ件数、テスト結果、影響件数、未対応事項、Publishの所在（master file側で作業しているか）＋**`F-QLT-8: reportURL＋所見N件→fixed x/棄却 y/エスカレ z` 行（F-QLT-8 を行ったとき）**を数値で。**＋F-QLT-9**: 部品作成も Figma への書き込みなので、判定役に全組合せ並べのスクショを見せ、`F-QLT-6 verdict:` と `F-QLT-7 verdict:` の2行を報告に入れる（書式と判定役の条件は [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)§品質系 F-QLT-9）。部品では `MAIN:`/`PRIME:` は「なし」と渡す。F-QLT-7 は、その部品を置く代表画面と、同じ画面にある既存の部品を並べて判定させる。property 軸だけの改修は、採点の代わりに before/after の `regression:` 行でよい。**＋F-CMP-7**: 部品作成もFigma書込なので、最後の書込のあとに `~/.claude/skills/mikeneko-figma/scripts/audit-structure.js` を実走させ `F-CMP-AUDIT cmp:0 fcmp5:pass ...` 行を転記する（Stopフックが実行痕跡を機械照合。マスターComp内部のstyledノードはF-CMP-5の分母外だが、Comp外に作った検証用の並べフレーム等は対象になる）。

## チーム編成

**規模が大のときの編成（F-TEAM-0 → [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)）。** 部品1個の新規設計は通常は中で、メインがオーダー0〜8を通して行い、下の④レビューと判定役（F-QLT-9）を別エージェントに頼む。

レジェンド: ①〜＝ロール、0→8＝標準オーダー工程。

- **マネージャー（委譲不可・全工程のゲート）**: ゲート（軸数3超え、組合せ数爆発、Variable未バインド、既存影響未確認、`remote: true` ファイルで作業しようとしているのを止める）。＝オーダー0（用途確定）・オーダー4（承認）＋各段の停止権。
- **① 偵察（=オーダー1）**: 既存DS / 命名規則 / 変数の inventory。
- **② 設計（=オーダー2,3）**: property軸と構造、sizing 方針、組合せ総数の事前計算。
- **③ 実装（=オーダー5）**: Figma 上でコンポ生成・property bind。
- **④ レビュー（敵対的）（=オーダー6,7）**: 全組合せスクショと既存使用箇所のスクショ比較。

並列OK=①④。直列=②→③。

## ゲート一覧

委譲不可・承認・テスト・影響レビュー・完了条件の一元索引。詳しい手順は `references/` の各資料にある（ここは索引のみ）。

| ゲート | 発火タイミング | 合格基準 | 詳細§ |
|---|---|---|---|
| 用途・需要確定〔委譲不可・自分〕 | オーダー0 | 用途・既存不採用理由・同名/類似の不在確認・新規/改修/旧置換の宣言・OOUIスコープ注記・配置先が揃う | §標準オーダー0 / §適用範囲と境界 |
| 軸設計マネージャーゲート〔委譲不可〕 | オーダー2直後 | Variant軸≤3、組合せ総数を掛け算で明示、100超は再設計、直交軸をVariantに掛けていない | [property-axes](references/property-axes.md) §property軸の設計判断フロー |
| ユーザー承認〔委譲不可・自分〕 | オーダー4（共有資産を触る前） | 軸設計／構造／命名／組合せ総数をユーザー提示し承認取得 | §標準オーダー4 |
| 全property組合せテスト | オーダー6 | 本体組合せ全件＋Boolean 2^N全件＋Text端値＋Instance Swap端値＋親幅3点＋reset＋light/darkを目視、破綻0 | [combination-test](references/combination-test.md) §全property組合せテスト |
| 既存影響レビュー（旧置換・既存改修のみ） | オーダー7 | 使用箇所全列挙、default非破壊、rename3段移行、sizing変更は前後スクショ最低5箇所 | [impact-review](references/impact-review.md) §既存使用箇所への影響レビュー |
| Variable/Styleバインド監査 | オーダー5/6 | 色・タイポ・spacing・radius・effectが全てバインド、生値0（light/darkで露呈確認） | [variables](references/variables.md) §変数・スタイル必須ルール |
| 参照ファースト（REF宣言）〔F-PRC-11〕 | オーダー1（軸設計前）・新しい見た目の判断を伴うとき | `lazyweb_search`で実参照1〜3件、各件にクエリ/参照名/構造語の根拠/`[REF:]`タグ。単体atomでもUIパターン名検索は有効 | [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)§進め方系 F-PRC-11 |
| 業界ベンチマークreport〔F-QLT-8〕 | オーダー6完成後・オーダー7と並走・規模が大のとき、または依頼者が求めたとき | 入力=全組合せ並べスクショ＋代表使用文脈でgenerate→全所見処分表が埋まるまで完了不可。単体atomへの画面文脈ノイズ所見は(b)根拠付き棄却で吸収。不通時は1回再試行し、だめなら「未実施」と報告して依頼者に判断を仰ぐ | [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)§品質系 F-QLT-8 |
| 完了条件（Publishは含めない） | オーダー8 | 組合せ件数／テスト結果／影響件数／未対応を数値報告。**「Publish済み」を完了条件に入れない**（Plugin API自動化不能・ユーザー手動操作で完結） | [placement-publish](references/placement-publish.md) §共有ライブラリ（Publish）特性 |

## 資料の索引（`references/`）

| 資料 | いつ読むか |
|---|---|
| [unit](references/unit.md) | 同じ構造を2回目にコピーしそうなとき。どこまでを1つの部品にするか（2コピー則の単位基準の正本） |
| [placement-publish](references/placement-publish.md) | オーダー0（配置先の確定）・8（Publish の扱い、Component description） |
| [property-axes](references/property-axes.md) | オーダー2。Variant／Boolean／Text／Instance Swap の選び方、組合せ総数の事前計算、各 property の作り方 |
| [auto-layout](references/auto-layout.md) | オーダー3。sizing mode、デッドスペース禁止、絶対配置を使ってよい場合（コンポ内部の sizing の正本） |
| [plugin-api](references/plugin-api.md) | オーダー5の直前に必ず。Plugin API で静かに失敗する箇所 |
| [variables](references/variables.md) | オーダー5。変数とスタイルのバインド |
| [combination-test](references/combination-test.md) | オーダー6。テスト並べフレーム、端値、異常の検出基準 |
| [impact-review](references/impact-review.md) | オーダー7（旧置換・既存改修のときだけ） |
| [donts](references/donts.md) | オーダー8の報告の前。やってはいけないことの一覧 |

## 関連メモリ / 参照

- ``figma-use``：プラグインAPI 実行のお作法
- `[figma-ds-edit](../../skills/figma-ds-edit/SKILL.md)`：既存DS の編集（軽い改修はこちら）
- `[figma-design-create](../../skills/figma-design-create/SKILL.md)`：画面を新規に組む側（画面/オブジェクト全体のOOUI設計・ページ編成はこちら）
- `[feedback_wireframes_ooui_bound](../../docs/feedback_wireframes_ooui_bound.md)`：ワイヤーはオブジェクトのビューに紐づける（OOUIスコープ）
- `[feedback_verify_absence_before_creating](../../docs/feedback_verify_absence_before_creating.md)`：不在を断定して新規作成する前に積極確認
- `[feedback_figma_page_vs_frame](../../docs/feedback_figma_page_vs_frame.md)`：「別ページ」は新規Page
- `[feedback_figma_target_node](../../docs/feedback_figma_target_node.md)`：node-id指定は in-place 編集
- page-list は Cover しか返さない罠・全走査
- Figma が真実、spec は古い前提（正典は実ファイルの現物）
- `[feedback_figma_use_real_components](../../docs/feedback_figma_use_real_components.md)`：実コンポーネント優先、手描き・自作代替しない
- 作業指示には即実行（質問で着手を止めない）
- `[feedback_element_provenance_antibleed](../../docs/feedback_element_provenance_antibleed.md)`：要件にない要素を勝手に足さない（出典default-deny）
- `[feedback_no_ai_arbitrary_colors](../../docs/feedback_no_ai_arbitrary_colors.md)`：生hex 禁止、変数バインド
- ``feedback_figma_component_style``：DS整合のコンポ設計

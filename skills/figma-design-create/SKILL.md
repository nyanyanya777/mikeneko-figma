---
name: figma-design-create
description: Use when CREATING a new screen, flow, or frame in Figma from requirements — drafting fresh UI on top of an existing design system or UI kit (and wiring it to existing flows). Requirements first, no invented copy or elements, variable/style-only styling, OOUI view inventory + page IA declared up front and reverse-audited at the end, tones matched to a measured reference, prototype wiring as its own step. Use when the user says "make a screen / design a new page / build this flow". Hands off edits of existing frames to `figma-ds-edit` and component work to `figma-component-design`.
---

# Figma 新規デザイン作成の作業標準

**TL;DR**: 新しい画面・フロー・フレームを、既存のDSやUIキットの上に要件から起こすときに使う。流れは《要件確定と宣言 → 現物確認と見本の実測 → 棚卸し → 設計とゲート → 一括承認 → 実装 → 配線 → レビュー → 自分の目で最終確認 → 報告》。この本文は流れと合格条件だけを持ち、詳しい手順は `references/` に置く（末尾の索引に、いつ読むかを書いてある。その工程に入るときに読む）。共通ルール（F-*）の正典は [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md) で、ここでは再掲しない。入口は [mikeneko-figma](../../skills/mikeneko-figma/SKILL.md)。

## 適用範囲

- **やる**: 0→1で画面/フレームを起こす作業（新規UIの設計・実装・既存フローへの配線）。
- **やらない**: 既存フレームの改修（文言の追加、行の追加、バリアントの差し替え、バインド是正）は [figma-ds-edit](../../skills/figma-ds-edit/SKILL.md)。新規部品の設計と property 軸の大改修は [figma-component-design](../../skills/figma-component-design/SKILL.md)。体験のE2Eテストは [figma-e2e-test](../../skills/figma-e2e-test/SKILL.md)。`use_figma` の低レベルの作法は `figma-use`。
- **新規と改修が混ざるとき**: 工程0で新規と改修を分けて宣言する。改修分の棚卸しと現物確認は `figma-ds-edit` で並行して行い、結果を工程2の入力にする（二重に走査しない）。工程4の承認は新規分と改修分を1メッセージにまとめ、ds-edit 側で出たエスカレ票もここに束ねる。実装は新規分（このスキル）と改修分（ds-edit）を重ならない領域に分けて進め、同じファイルへ同時に書き込まない。プロトタイプ配線はこのスキルだけが行い、既存フレームへの reaction 追加は改修として工程0の改修対象リストに入れる。工程7・8は新規と改修の両方を対象にする。

## 規模と体制

規模は共通ルールの3段（F-TEAM-0）で宣言する。このスキルでの目安と承認の往復数:

| クラス | 条件 | 段 | 承認の往復 |
|---|---|---|---|
| XS-DS整 | 1画面・要素20未満・DS整備済 | 中 | 1 |
| XS-DS無 | 1画面・要素20未満・DS未定義（ファイルが空） | 中 | 1（短縮ルート。[ds](references/ds.md)「最小要件 × DS不在ルート」。見本にする実在プロダクトも同じ往復で聞く） |
| S | 1〜2画面・要素50未満 | 中 | 1 |
| M | 3〜5画面、または要素100未満 | 中 | 1〜2 |
| L | 6画面以上、要素100以上、または利用者がデータ集合を能動的に操作する画面（並べ替え・絞り込み・行選択・編集） | 大 | 領域別に2〜4 |
| XL | 0→1のファイル＋複数画面＋DSの構築 | 大 | 領域別＋段階別（[ds](references/ds.md)「DS不在ファイル」の順序で進める） |

「一覧」「ダッシュボード」「管理」という語だけで L にしない（静的なリストやウィジェットの並びは S/M）。質問は領域の中では束ね、領域の間では分ける。承認の往復数には、最初の1画面の方向確認を含めない。

- **中・大に共通**: 着手前に DESIGN.md を読み、実物を確かめて「作るもの／合わせるもの／やらないこと」の3行を依頼者に見せる（F-PRC-13）。工程0のうち画面をまたぐ宣言（表A、作成フレームリストの名前、ページIA）は全体ぶんを先に出し、いちばん代表的な1画面だけ、詳細の宣言・承認・実装（工程5まで）を先に通す。依頼者に見せて方向を確かめてから、残りの画面の詳細と実装に進む（F-PRC-14）。3行は工程0の1枚の先頭に置き、同じ往復で見せる。言われたことは、言葉のまま好みの記録に足す。→ [context](../../skills/mikeneko-figma/references/context.md)
- **中**: メインが工程0〜9を通して行う（メインが最上位モデルでないときは工程5・6を `figma-implementer` に委譲。F-TEAM-0）。別の目は、工程7の独立レビュー1体（逆監査の判定もこの担当が行う）と工程8の判定役。
- **大**: Workflow でチームを組む（fan-out の見積もりは [reference_workflow_agent_cap](../../docs/reference_workflow_agent_cap.md)）。メインは工程0・3・4・8・9（要件確定、設計ゲート、承認、最終確認、報告）を持ち、①偵察=工程1 ②棚卸し=工程2 ③設計=工程3の決定 ④実装=工程5 ⑤配線=工程6 ⑥レビュー（複数・全件）=工程7 を割り当てる。読み取り（①②⑥）は並列でよい。書き込み（④⑤）は直列か、重ならない領域に分ける。

## 鉄則（番号は固定）

第1ランク（不可侵・default-deny）は 2・4・13。

1. **要件を先に理解する。** 画面の役割・満たす条件・曖昧な分岐を一文にし、作成フレームリスト・改修対象リスト・遷移配線リストまで宣言する。リスト外は作らない。
2. **要件に無い文言を足さない**（F-SRC-1）。全テキストに出典タグ。`guess:` が3件以上なら、スコープ自体を依頼者に確認する。
3. **判断点は相談する。質問は束ねる。** 曖昧な指示には「最小コア版＋拡張候補リスト」の2点で確認する。
4. **生の値を残さない**（F-QLT-5・F-QLT-1）。例外は、DSが無いファイルで primitive 変数を初めて定義する瞬間だけ（`primitive-def:`）。
5. **新しい変数・スタイル・部品を無断で作らない。** 全ページを走査して無いと確かめ、命名・所在・スコープ・参照元を添えてエスカレーションする。承認まで生の値で進めない。
6. **既存DSの流用を命名の一致で決めない。** 既存の使用箇所を1件以上見て用途が合うか確かめる（State A/B/B'/C）。
7. **発見ファースト**（F-PLC-3）。トークン名・部品・ノードIDはファイルごとに違う。
8. **段を切って作る。** 骨格→セクションの中身→文言の確定→配線の順に進め、各段で描画を自分で見る。流し直すと同じものができるスクリプトで組んでいる場合は1回で通して流してよいが、流すたびに描画を見て、直すのはスクリプト側にする（→作り方の型）。
9. **use_figma の応答を毎回確かめる。** 失敗したらその場で止まり、`get_screenshot` で現状を見て原因を特定してから次へ進む。連投しない。
10. **見た目が部品なら実体も部品**（F-CMP-2・F-CMP-5）。同じ構造を2回目にコピーしようとした時点で手を止め、`new-comp:` 票で部品化に寄り道する（F-CMP-6）。
11. **検証は全件。** 配置した全要素と全配線を、INSTANCE か・mainComponent が想定どおりか・detach されていないか・バインド済みか・reaction が正しいか、で1件ずつ見る。
12. **報告は正直に。** 残課題と未承認の保留を隠さない。
13. **各フレームはオブジェクトのビューとして起こす**（F-OOUI-1〜8）。動詞はモードレスなアクション、種別や期間はプロパティ・状態に畳む。例外は `proc:` の宣言制。

## 標準オーダー（0→9）

- **0. 要件確定〔委譲しない〕** — 規模、作成フレームリスト、改修対象リスト、遷移配線リスト、OOUIビューインベントリ（表A/B。各ビューの `PRIME:` もここで宣言する＝F-OOUI-1）、関係と操作権限（表E/F）、ページIA（表C/D）を1枚にして依頼者の確認を取る。固まるまで着手しない。→ [declarations](references/declarations.md)、[provenance](references/provenance.md)、[pages](references/pages.md)
- **1. 現物確認と見本の実測（読み取り）** — 同じファイル（または実アプリ）の姉妹画面を `get_screenshot`＋`get_metadata` で見る。双子を同定して `TWIN:` を宣言する（空なら実装に進まない。F-QLT-7。既存画面が無いファイルでは、見本にする画面を依頼者に1問聞く）。見本の濃さ・太さ・線の強さ・余白を値で取る（F-QLT-10 → [tone-measure](references/tone-measure.md)）。見本が実アプリ・Web ならここでブラウザで測る。見本が Figma 上の画面のときは、計測に use_figma を使うので、承認後（工程5の最初）に測り、ここでは `get_screenshot` で見るだけにする。今回扱うラベルの候補を全ページのテキストで走査し、既存の表記を確かめる。ファイルが空なら「空でした」の1行でよい。新しい見た目の判断があるなら REF宣言（F-PRC-11）。
- **2. 棚卸し（読み取り）** — 既存の部品・変数・テキストスタイルを全走査で列挙する（`figma-ds-edit` の [棚卸し runbook](../../skills/figma-ds-edit/references/inventory.md) を使う）。合成部品は中を1段開いて、足りない部分が無いか見る。使う部品のキーをここで控える。→ [ds](references/ds.md)
- **3. 設計とゲート判定** — 画面構造、使う部品（ID＋バリアント）、使う変数とテキストスタイル、全テキストの文言と出典、遷移配線リストを設計マッピング表にする。次の6種はエスカレーションとして切り出す: ①新規文言 ②新規変数/スタイル ③新規部品（component 列が4値で埋まらない要素は自動的に `new-comp:` 票） ④既存と異なる扱い ⑤機能必須として足した要素 ⑥OOUI逸脱。大で設計の決定を委譲するときは、双子の実スクショ画像・要件・棚卸し結果・見本の段階表（工程1で測れた分）を渡す（F-PRC-2・F-PRC-7。REF宣言は設計判断用の別ファイルで渡し、実装ワーカー向けの設計書には書かない）。表への落とし込みとゲート判定はメインが行う。DS があるときは、各要素の処遇を `~/.claude/gate/ds/<session_id>.md` に `PLAN:` 行で書く（F-PRC-12。マッピング表の component 列の `ds:` は `reuse:<node-id>`、`new-comp:` は `new-component:<理由>`、`raw:` は `raw:<コード>:<根拠>` に対応する）。→ [mapping](references/mapping.md)、[exceptions](references/exceptions.md)
- **4. 依頼者の一括承認** — 工程3の設計、エスカレーション項目、表A〜F、`proc:`/`cross-object:`/`abs:`/`raw:` の例外と各々の理由1行を、1メッセージで出す（大は領域別）。承認の前に書き込まない。
- **5. 実装（書き込み）** — `/figma-use` に従う。Figma 上の見本をまだ測っていなければ、最初に `measure-tones.js` で測る。→ [build-method](references/build-method.md)、[wiring-review](references/wiring-review.md)。実装の末尾で `scripts/audit-ds-binding.js` を流して pass=true にする（F-QLT-5。red のままレビューに回さない＝F-PRC-9）。実装のあと・配線の前に、OOUI逆監査の1回目（構造項目だけ。判定は工程7の担当）。→ [reverse-audits](references/reverse-audits.md)
- **6. プロトタイプ配線** — 遷移配線リストのとおりに Reaction（On click → Navigate to）を張る専用の段。戻る・キャンセルも張る。リストが空なら「対象なし」で完了。→ [wiring-review](references/wiring-review.md)
- **7. 独立レビュー（読み取り・全件）** — 実装した文脈を持たない別エージェントが、レイアウト・余白と揃え（座標で測る）・文言・バインド・instance 実体・reaction・object/view の整合・ウィザード化の有無を全件で見る。→ [wiring-review](references/wiring-review.md)
- **8. 自分の目で最終確認〔委譲しない〕** — 決定論監査（`audit-ds-binding.js` と `audit-structure.js`）を先に通してから判定役を呼ぶ（F-PRC-9）。use_figma で流すもの（`measure-tones.js`、`audit-ds-binding.js`、run1・run2）はすべて run3 より前に済ませる。
  - (a) 作成フレーム全数を `get_screenshot` で見る (b) 主要 instance を `get_metadata` で確かめる (c) 配線リストN件＝reaction N件 (d) 設計マッピング表の各行が実装と一致（件数は「設計N≦実装N＝レビューN」）
  - (e) 逆差分監査: 実装の全要素を列挙し、宣言に無いものは削除かエスカレ。要素の合格語彙は `user:`／`req:`／`existing:` の3つだけ → [provenance](references/provenance.md)
  - (f) OOUI逆監査の2回目 (g) ページ編成逆監査 (h) auto-layout逆監査 → [reverse-audits](references/reverse-audits.md)。(f)(h) の判定は、実装した文脈を持たない別エージェント（工程7の担当）が行い、メインは出力を宣言と突合する。
  - (i) 重複監査（F-CMP-6）と構造監査（F-CMP-7 の3run）。**セッション最後の use_figma は run3** にする。run1 の範囲は作成先ページ全体（新規Pageに作ったときは既存の姉妹画面のPageも含める）。対象は run2 で自分の成果物ルートの配下と確かめたクラスタだけで、既存の負債はスコープ外として報告にとどめる。
  - (j) 完成度（F-QLT-6）と (k) 既存との一貫性（F-QLT-7）: 作成フレーム全数の実スクショ、機械層の facts、`MAIN:`/`PRIME:` の宣言、好みの記録、宣言した TWIN のスクショ、[tone-measure](references/tone-measure.md) の段階表、判定基準（F-QLT-6 の (a)〜(d) と F-QLT-7）の要約を判定役に渡す（設計マッピング表やリポジトリ全体は渡さない）。verdict の書式は F-QLT-9。
  - (l) 業界ベンチマーク report（F-QLT-8）は、規模が大のときだけ。生成に数分かかることがあるので、最終スクショが確定したらすぐ `lazyweb_generate_report` を発火し、(a)〜(k) と並走で `lazyweb_get_report` をポーリングする。
  - 最後に [donts](references/donts.md) と突き合わせる。
- **9. 正直な報告** — 依頼者に言われて直したことは、DESIGN.md の好みの記録に足してから報告する。作ったもの、使った部品と変数、カバレッジ、未承認の保留、残課題、未確定の文言（`placeholder:`）の全件、短縮ルートを使ったか。`F-QLT-6 verdict:` と `F-QLT-7 verdict:` の2行、`F-CMP-AUDIT cmp:0 fcmp5:pass ...` の行（工程8で実行した出力の転記）、[tone-measure](references/tone-measure.md) の段階表（before→after）。大のときは `F-QLT-8: reportURL＋所見N件→fixed x/棄却 y/エスカレ z` の行。

## 作り方の型（要点）

詳しい手順とコードの型は [build-method](references/build-method.md)。

- 1画面を、流し直すと同じものができる1本のスクリプトで組む。直すときはノードを手で触らず、スクリプトを直して流し直す。
- 部品は、工程2で控えたキーで読み込む。バリアントは名前で引き、見つからなければ止まる（黙って別の部品で代用しない）。
- 箱・文字・ボタン・バッジ・アイコンを置く小さな関数を先に用意し、関数の引数には変数とスタイルしか渡せないようにする（生の値を書けない形にする）。
- スクリプトは、作ったルートの id と、見つからなかった部品・アイコンの警告を返す。警告が残っていれば完了にしない。
- サンプルの値は、全画面で同じ題材・同じ人名・同じ件数にそろえる（一覧の件数と詳細の内訳が合う）。
- 色や太さを後から直すときは、変数の値を変える（今回足した変数は自由に変えてよい。既存の変数の値を変えると既存の全画面に効くので、影響範囲を示して承認を取ってから）。バインドされていない所は、自分の成果物ルートの配下に限り、ノード名と現在の値で対象を絞るスクリプトで直し、変更件数と before/after を確かめる。
- 依頼者に見せたあと、または配線（工程6）のあとは、流し直す前に確かめる。流し直すとノードの id が変わり、手で直した箇所と reaction が消える。

## ゲート一覧

| ゲート | いつ | 合格条件 | 詳しい手順 |
|---|---|---|---|
| 把握の確認と最初の1画面 | 工程0の前・最初の1画面の工程5のあと | 3行を依頼者に見せて直しが無い。代表の1画面を見せて方向が合っている。言われたことが好みの記録にある | F-PRC-13・14・[context](../../skills/mikeneko-figma/references/context.md) |
| 要件確定〔委譲しない〕 | 工程0 | 規模＋3つのリスト＋表A〜Fを1枚にして依頼者の確認 | [declarations](references/declarations.md) |
| 改善量の受入れ〔委譲しない〕 | 工程0（基準）・4〜5（ビルド前） | 改善系の画面は、現状（手数・画面遷移・判断）に対する before→after の削減量が実測で出ること。出なければ他が満点でも不合格。数値の改善を担保しないワイヤーやモックではビルドに進まない | 鉄則1 |
| 双子の同定と見本の実測 | 工程1 | `TWIN:` を宣言（空・DSファイル・種別の不一致は不合格）。見本の段階表がある（Web の見本は工程1、Figma 上の見本は工程5の最初に測る。見本なしで進めると依頼者が決めたときは、F-QLT-10 を未実施として報告する） | F-QLT-7・[tone-measure](references/tone-measure.md) |
| 設計〔委譲しない〕 | 工程3 | マッピング表の全行に出典タグと object/view/modeless-action、component 列が4値で全行埋まる、エスカレ6種を切り出し済み | [mapping](references/mapping.md) |
| 依頼者の一括承認 | 工程4 | 設計＋表A〜F＋例外と理由を1メッセージで承認 | 工程4 |
| OOUI逆監査 | 工程5のあと＋8(f) | 全フレームが表Bへ写像、線形ウィザードのエッジ0、collection⇄single の往復、表E/Fが画面に反映。違反0行 | [reverse-audits](references/reverse-audits.md) |
| 件数の突合 | 工程8(c)(d) | 設計N≦実装N＝レビューN、配線リストN＝reaction N | [mapping](references/mapping.md) |
| instance 実体＋F-CMP-5 | 工程7・8(b) | INSTANCE／mainComponent 一致／detach 無し。スタイルを持つ非 instance は0件（宣言例外は台帳と N=N）。instance 率を分数で報告し、scanned>0 を確かめる。variant の意味が用途と合っている（選択状態を色違いの variant の並置で擬装しない） | [wiring-review](references/wiring-review.md) |
| 逆差分監査 | 工程8(e) | 実装の全要素が宣言済み | [provenance](references/provenance.md) |
| ページ編成逆監査 | 工程8(g) | object→Page 集合の実測で、散在・孤立・帰属・横断の違反0 | [reverse-audits](references/reverse-audits.md) |
| auto-layout逆監査 | 工程8(h) | 全コンテナが auto-layout（例外は `abs:` 宣言と1:1）、無記名の隙間ノード0 | [reverse-audits](references/reverse-audits.md) |
| 構造監査（F-CMP-6・7） | 工程8の最後 | 3run。完了報告に run3 の `F-CMP-AUDIT cmp:0 fcmp5:pass ...` と `roots:` | 共通ルール F-CMP-7 |
| 完成度・一貫性・実施証跡（F-QLT-6・7・9・10） | 工程8(j)(k) | 判定役の verdict 2行と、フレーム×観点の `pass|fail＋根拠` 行。濃さ・太さ・余白の段階が見本と合っていて（部品が決める高さなど、合わせなかった差は理由つきで報告）、同じ種類の箱の余白がそろっている | 共通ルール |
| 業界ベンチマーク（F-QLT-8） | 工程8(l)・大のとき | 全所見に処分 | 共通ルール |

## 資料の索引（`references/`）

| 資料 | いつ読むか |
|---|---|
| [declarations](references/declarations.md) | 工程0。要件の必須項目、表A〜F、データを操作する画面の追加項目、曖昧な指示の扱い |
| [provenance](references/provenance.md) | 工程0・3・8(e)。出典タグ、機能要素の確認リスト、要素の allowlist と逆差分監査 |
| [pages](references/pages.md) | 工程0。ページ編成の決定ルール、Page とフレームの命名 |
| [tone-measure](references/tone-measure.md) | 工程1・7・8。見本と成果物の濃さ・太さ・線の強さ・余白の測り方と合わせ方、揃えを座標で測る方法 |
| [ds](references/ds.md) | 工程2・3。DSの流用判定、変数とスタイル、新規作成のエスカレーション、DSが無いファイル |
| [mapping](references/mapping.md) | 工程3・8。設計マッピング表、件数の突合、遷移配線リスト、状態バリエ |
| [exceptions](references/exceptions.md) | 工程3・4。`proc:`／`abs:`／`raw:` の理由コード |
| [build-method](references/build-method.md) | 工程5。スクリプトの組み方、関数の型、流し直し、仕上げの一括調整 |
| [wiring-review](references/wiring-review.md) | 工程5〜7。段階的作成、プロトタイプ配線、全件レビュー |
| [reverse-audits](references/reverse-audits.md) | 工程5のあと・8(f)(g)(h)。OOUI・ページ編成・auto-layout の逆監査 |
| [donts](references/donts.md) | 工程8の最後。やってはいけないことの一覧 |

関連: [feedback_wireframes_ooui_bound](../../docs/feedback_wireframes_ooui_bound.md) / [feedback_figma_page_vs_frame](../../docs/feedback_figma_page_vs_frame.md) / [feedback_element_provenance_antibleed](../../docs/feedback_element_provenance_antibleed.md) / [feedback_figma_use_real_components](../../docs/feedback_figma_use_real_components.md) / [feedback_verify_absence_before_creating](../../docs/feedback_verify_absence_before_creating.md) / [feedback_no_ai_arbitrary_colors](../../docs/feedback_no_ai_arbitrary_colors.md) / [feedback_css_use_variables](../../docs/feedback_css_use_variables.md) / [feedback_agent_team_delegate_all](../../docs/feedback_agent_team_delegate_all.md) / [feedback_qa_real_user_outcome](../../docs/feedback_qa_real_user_outcome.md) / [reference_figma_ooui_page_gates](../../docs/reference_figma_ooui_page_gates.md)

---
name: figma-ds-edit
description: Use when editing or reviewing ANY Figma design / design-system file — applying text styles & color/typography variables, replacing raw frames with components, restyling, or any multi-step Figma change. Enforces a discover-first, size-tiered workflow (recon → inventory → plan/gate → implement → full-coverage review), file-agnostic variable-binding rules, and manager gates that prevent creating duplicate components or concluding "X doesn't exist" from empty searches.
---

# Figma デザイン/DS 編集の作業標準

**何のスキルか**: Figmaの既存デザイン/DSファイルを編集・レビューする作業標準。
**いつ発火するか**: テキストスタイル・色/タイポ変数の適用、生フレーム→コンポーネント差し替え、リスタイル、その他あらゆる多段Figma変更・レビューのとき。
**何を出力するか**: 発見ファーストで棚卸し→計画→実装→全件レビューを経た、生値ゼロ・instance実体保証・スコープ厳守の編集と、正直なカバレッジ報告。

Figmaの編集・レビューはこの手順・基準で回す。**誰が手を動かすかは規模で決める（F-TEAM-0→正本は入口）**: 小はメインが実装まで行い、別の目は工程6の判定役だけ（工程5の独立レビューは省く）。中はメインが実装まで行い、別の目は工程5の独立レビューと工程6の判定役。大はチームに委譲し、**メインはマネジメント（割当・ゲート判定・全件カバレッジ確認・完了可否）**を握る。メインが最上位モデルでないときは、小・中でも実装を委譲する。

この本文は流れ・鉄則・合格条件だけを持ち、詳しい手順は `references/` に置く（末尾の索引に、いつ読むかを書いてある。その工程に入るときに読む）。

**凡例**: F-* は共通ルールのルールID。**規範の正本は [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md) §共通ルールのみ**（本文中の「入口」「正本は入口」は、mikeneko-figma-rules を指す）、本スキルは一行宣言＋固有の運用・検証だけを持つ（規範本文は再掲しない）。番号表記は **丸数字①〜⑥＝ロール／アラビア数字＝工程**。

## 適用範囲と境界

- **やる**: 既存のFigmaデザイン/DSファイルへの **in-place 編集・レビュー**。テキストスタイル/変数の適用、生フレーム→コンポーネント差し替え、リスタイル、多段の編集変更。node-id 指定があればそのノードを書き換える。
- **やらない（姉妹スキルへ委譲）**:
  - 新規画面・フロー・フレームをゼロから起こす → **[figma-design-create](../../skills/figma-design-create/SKILL.md)**。
  - 新規コンポーネント本体の設計・プロパティ軸の大改修 → **[figma-component-design](../../skills/figma-component-design/SKILL.md)**。
  - 画面/フローの「体験」E2Eテスト（達成可否・離脱点の切り分け） → **[figma-e2e-test](../../skills/figma-e2e-test/SKILL.md)**。
- **委譲する判断権限**: OOUI のビュー種別（collection|single）の **新規分類権限**、proc: 例外コードの **新規付与**、オブジェクト関係（表E）・操作権限（表F）の **新規宣言**、本格的な **ページ編成方針** の策定は design-create 側が本ゲート。in-place 編集ではこれらを新規に決めない（既存編成に従う）。
- **新規/既存/旧置換の適用分岐**: 本スキルは **既存資産の in-place 編集が前提**。ゼロからの新規作成・別ページ新設が必要になったら design-create へ振り直す。

## 鉄則（不可侵原則・最優先・全工程共通）
1. **発見ファースト・決め打ち禁止。** トークン名・値・ノードIDはファイルごとに違う。編集前に必ずそのファイルの実体を棚卸ししてから動く。
2. **「Xは存在しない」と断定して新規作成しない（F-PLC-3→正本は入口）。** 固有の積極確認手順は [inventory](references/inventory.md) §棚卸し runbook。
3. **生値を残さない（F-QLT-5→正本は入口。固有運用: [variables](references/variables.md) §色・タイポ変数ルール）。** 直書きのhex・font-size・line-height・font-familyは禁止。すべて変数かテキストスタイル参照。見つけ方・割当は [variables](references/variables.md) §色・タイポ変数ルール。**テキストは名前付きテキストスタイルを"丸ごと"バインド（textStyleId適用）＝フォントだけ/サイズだけ/一部セグメントだけの部分バインド・手動一致・生フォント据え置きは全て不合格（未バインド扱い）。** 専用サイズ段が無くても近い段を当てる（据え置き禁止）、迷えば実装前に相談。決定論監査＝`scripts/audit-ds-binding.js`。[feedback_figma_always_bind_text_style](../../docs/feedback_figma_always_bind_text_style.md)
4. **検証はサンプルでなく全件被覆。** 代表1枚で合格にしない。触った全要素を見る／実体を当たる。未確認を「確認済み」と言わない。
5. **役割で選ぶ、見た目で選ばない（F-QLT-1）。** 「意味/役割→トークン」で割り当てる → [variables](references/variables.md) §色・タイポ変数ルール。
6. **報告は正直に。** 残課題を隠さない。謝辞・先回りの正当化・premise未検証での remedy 約束をしない。確認→事実を直す。
7. **見た目が部品なら実体も部品＝手描き偽装禁止（F-CMP-2→正本は入口）。** 固有運用: 着手前に②棚卸しでDS実体を索引→在れば必ず instance 化。手描きの例外は [inventory](references/inventory.md) §棚卸し runbook の NOT FOUND 基準（全Nページ走査済み）＋エスカレーションのみ（その時も**既定はローカルComp化してから使用**。Comp化しない場合は台帳に`raw:<コード>`＋根拠1行を宣言（例外ノードはノード名を`raw:<コード>`に）=F-CMP-5、→入口§部品系）。検証＝§標準オーダー6 の instance実体監査、事故文脈＝[donts](references/donts.md) §やってはいけない。DSに無い部品のComp化の寄り道先=[figma-component-design](../../skills/figma-component-design/SKILL.md)（票の呼称はdesign-createの`new-comp:`と共通）。
8. **対象範囲にない要素を勝手に足さない＝出典default-deny／アンチブリード／良かれは提案へ（F-SRC-1・F-SRC-2・F-SRC-3→正本は入口）。** 固有の逆向き突合＝[review](references/review.md) §全件レビュー(工程5・6) の逆差分監査。
9. **編集対象は「どのオブジェクトのどのビュー（collection⇄single）か」で捉え、モードレス整合（proc退行禁止）を壊さない（F-OOUI-1〜8→正本は入口）。** 追加/変更要素が他オブジェクトへの参照やロール別の出し分けなら、既存の関係・操作権限と食い違わせない。 同じオブジェクトの操作が画面間で一貫しているのが正。ビュー種別分類・proc:新設は design-create へ委譲（§適用範囲）。[feedback_wireframes_ooui_bound](../../docs/feedback_wireframes_ooui_bound.md)
10. **余白・間隔はauto-layoutのgap/paddingで持つ＝Spacer禁止・全コンテナauto-layout（F-STR-1・F-STR-2→正本は入口。機械判定基準・監査スクリプトも入口F-STR-2）。** 固有運用: 編集・restyle・置換時は間隔を itemSpacing/padding へ移行。実検証＝[review](references/review.md) §全件レビュー(工程5・6) の auto-layout整合観点。
11. **知覚（着手前の現物スクショ確認・完了前の逐語×レンダリング突合）は委譲不可のマネージャー本務。** テキスト報告や監査pass=trueを現物確認の代わりにしない（F-INT-2→入口）。

## 標準オーダー（0→7）
- **0. 前提確定** — URL/node-id・対象範囲・「何を満たせば完了か」を一文にする。曖昧な分岐だけ先に確認する。規模を宣言する（`SIZE:`・F-TEAM-0）。案件の DESIGN.md があれば読む（好みの記録は小でも読む）。中・大は、実物を確かめて3行を依頼者に見せ、刷新なら代表の1画面を先に直して見せる（F-PRC-13・14 → [context](../../skills/mikeneko-figma/references/context.md)）。**node-id 指定は in-place で編集し、複製しない（F-PLC-2）。新しいフレームの配置は、既存のオブジェクト単位の編成に従う（F-PLC-1・F-PLC-4。委譲権限は §適用範囲）。**
- **1. 現物確認と視覚言語の抽出（読み取り）** — 対象の `get_screenshot`＋`get_metadata` を自分で取り、結論より先に実物と構造を見る（before の接地＝F-INT-2）。
  - 既存プロダクトの画面を刷新するときは、姉妹画面（実アプリか既存Figma画面）を視覚の基準として見て言語を抽出し（色の使い所、カード様式、バッジ形状、余白、アプリ枠の有無）、その語彙の中で編集する（F-QLT-7。判定は工程6）。
  - 刷新や、色・太さ・線の強さ・余白を直す編集では、見本と成果物を測る（小の余白の直しは、成果物の中の揃いだけでよい）（F-QLT-10 → [tone-measure](../../skills/figma-design-create/references/tone-measure.md)。Web の見本はここでブラウザで測る。Figma 上の計測は use_figma を使うので、工程3の `PLAN:` 宣言（承認が要るときはそのあと）を済ませた工程4の最初と、工程6の判定の前に行う）。
  - 新しい見た目の判断を伴う編集のときだけ、REF宣言をする（F-PRC-11）。バインド修正などの機械的な編集は対象外。
- **2. 棚卸し（読み取り）** — 既存の部品・変数・テキストスタイルを全走査で列挙する。→ [inventory](references/inventory.md)
- **3. 計画とゲート判定〔委譲しない〕** — 編集を分類し（見出し/本文、既存の差し替え、新規作成が要るもの、インスタンス内部＝触らない）、可逆性でトリアージする。驚く結論は、独立に検証してから採用する。本当に判断が要る分岐だけ、依頼者に確認する。役割とトークンの割り当ては → [variables](references/variables.md)
  - **処遇の割り付けはここで確定する（実装の直前まで先送りしない）**: 工程2の結果と突き合わせ、追加・置換する要素を1つずつ `reuse:<node-id>` / `new-component:<理由>` / `raw:<コード>:<なぜコンポ化しないかの根拠>` の3択に割り付け、`~/.claude/gate/ds/<session_id>.md` に `PLAN:` 行として書く（F-PRC-12。`workskill-gate-pretool.sh` が書き込みの直前に書式を検査する）。`reuse:`/`new-component:` の値に `raw:` を埋め込まない（例外は raw: の票で宣言し、ノード名も `raw:<コード>` にする）。
  - **DSに無い部品が要ると分かったら、ここで [figma-component-design](../../skills/figma-component-design/SKILL.md) へ寄り道する**（`new-component:` 票→部品設計→ID を埋め戻して工程4へ。手描きで代用しない）。
  - 刷新など F-QLT-6 の判定がある編集は、ここで `MAIN: <既存の操作ラベル。無ければ なし>` も宣言する。
- **4. 実装（書き込み）** — `/figma-use` に従う。段を切り、各段で描画を自分で見る。Figma への書き込みは状態を持つので、逐次で行うか、対象ノードが重ならない領域に分ける（同じファイルへ同時に書き込まない）。
  - **実装の末尾で `scripts/audit-ds-binding.js` を流し、pass=true を確かめる**（未バインド・部分バインド・生の値〔色・タイポ・spacing・radius・effect〕が1件でも残れば実装未完で、レビューに回さない。範囲は今回触ったノード）。
  - **委譲するときのブリーフの必須項目（F-PRC-12）**: ①使う DS ライブラリの fileKey ②工程2で見つけた流用候補の node-id ③各要素の処遇（reuse/new-component）。機械強制は `scope-gate-pretool.sh` の ## DS セクションと `workskill-gate-pretool.sh`。
- **5. 独立レビュー（読み取り・全件）** — 規模が中・大のとき。実装した文脈を持たない別エージェントが、範囲を領域に分けて全数を見る。→ [review](references/review.md)
- **6. 自分の目で最終確認〔委譲しない〕** — 決定論監査を先に通してから判定役を呼ぶ（F-PRC-9）。use_figma で流す計測と監査は、すべて (f) の run3 より前に済ませる。
  - (a) 編集した全カード・全要素を全件確認し、件数を突合する（編集N＝確認N）。スクショの見た目が合っているだけで合格にしない。
  - (b) **instance 実体監査**: 部品に見える各要素が `INSTANCE` で、正しい mainComponent を指し、detach されていない。`scripts/audit-structure.js` が機械で見つけるのは偽装の疑い（非INSTANCEが部品名を名乗る）まで。**mainComponent の一致と detach 無しは、手動の `get_metadata` で1件ずつ確かめる。** 見た目が正しくても、FRAME/TEXT の手描きは不合格（F-CMP-2・鉄則7）。F-CMP-5: 自分が追加・置換した範囲に、スタイルを持つ非 instance が0件（宣言した例外を除く）。instance 率を分数で報告する。既存の負債はスコープ外の既知事項のまま（→ [review](references/review.md)「スコープ規律」）。
  - (c) **バインド監査**: `scripts/audit-ds-binding.js` が pass=true（F-QLT-5。フォントだけ・サイズだけの部分バインドも不合格）。
  - (d) 逆差分監査、OOUI・関係と操作権限・auto-layout の整合 → [review](references/review.md)
  - (e) **意図充足**（F-INT-2）: 自分で取った after のスクショで、「依頼者の逐語→観測述語→観測結果」を3列で突合する。監査やレビューの pass を、意図を満たした根拠に使わない。
  - (f) **F-CMP-7 の3run**（run1 複製範囲→run2 親辿り→run3 F-CMP-5）。手順の正本は [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md) の3run表。ds-edit での run1 の範囲は、触った成果物が乗る親コンテナかページ。同じ型の既存クラスタが別のコンテナや別ページにあるなら、そこも含める（比較相手を含まない範囲で測ると run1 が無意味になる）。成果物を含まない既存の負債クラスタは、スコープ外の既知事項として報告する。**セッション最後の use_figma が run3 でないと、Stopフックが必ず BLOCK する。** 判定役は use_figma を使わないので、3run のあとに呼んでよい。判定役に落とされて書き直したら、3run をやり直す。
  - (g) **判定役**（F-QLT-9）: 刷新など新しい視覚判断のある編集は、F-QLT-6（完成度）と F-QLT-7（姉妹画面と並べて同じプロダクトに見えるか）を採点させる。バインド是正・文言など新しい視覚判断のない編集は、採点の代わりに before/after の視覚回帰を判定させ `regression:` 行を残す。色・太さ・線・余白を直した編集は、F-QLT-10 の計測結果も渡す。好みの記録があれば、それも渡す。渡すものと verdict の書式は [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md) の F-QLT-9。
  - (h) 業界ベンチマーク report（F-QLT-8）は、規模が大のとき、または依頼者が求めたときだけ。生成に数分かかることがあるので、最終スクショが決まったらすぐ `lazyweb_generate_report` を発火し、(a)〜(g) と並走でポーリングする。
- **7. 正直な報告** — 依頼者に言われて直したことは、DESIGN.md の好みの記録に足してから報告する。変更点、カバレッジ（対象◯件／確認◯件）、残課題。`F-QLT-6 verdict:` と `F-QLT-7 verdict:` の2行（機械的な編集は `regression:` 行も）、`F-CMP-AUDIT cmp:0 fcmp5:pass ...` の行と `roots:`（工程6で実行した出力の転記）。F-QLT-8 を行ったときは `F-QLT-8: reportURL＋所見N件→fixed x/棄却 y/エスカレ z` の行。色・太さ・線・余白を直したときは段階表（before→after）。最後に [donts](references/donts.md) と突き合わせる。

## チーム編成

**規模が大のときの編成（F-TEAM-0）。** 小・中はメインが工程0〜7を通して行う。別エージェントに頼むのは、小は工程6の判定役（F-QLT-9）だけ、中は下の⑤レビューと判定役。

**レジェンド（丸数字＝ロール／アラビア数字＝工程）**: マネージャー＝工程0・3・6・7のゲート、⑥シンセサイザ＝横断（特定工程に紐づかない）、他ロールの対応工程は各行に併記。

- **マネージャー（自分・委譲不可）**: スコープ確定／驚く結論の検証ゲート／可逆性トリアージ／全件カバレッジ最終確認／完了・コミット可否。判断だけ、ノイジー作業はしない。
- **① 偵察（Recon／読み取り・Explore型）=工程1**: 対象の現物と構造の地固め。
- **② 棚卸し（Inventory・司書／読み取り）=工程2**: 既存資産の積極列挙。検索空振りを不在の証拠にしない係。
- **③ プランナー（設計）=工程3**: ①②→編集計画＋分類＋可逆性トリアージ。成果物をマネージャーがゲート。
- **④ 実装（Implementer／書き込み）=工程4**: use_figma 実行。逐次/領域分割。
- **⑤ レビュー（複数・敵対的／読み取り・全件被覆）=工程5**: 実装者と別。カード/領域単位で割り合計で全件カバー。
- **⑥ シンセサイザ／反省（必要時・横断）**: ファンアウト所見の統合・重複除去。事故時は blameless ポストモーテム（技術/マネジメント観点）。

並列・直列: 並列OK=①②⑤（読み取り）。直列/分割必須=④（書き込み衝突回避）。規模で人数増減。反復×段×並列の総数は事前見積（agent上限超過は失敗・浪費）。

## ゲート一覧

合格条件の索引。共通ルールで決まっているものは、ルールIDだけを書く（正本は [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)）。

| ゲート | いつ | 合格条件 | 詳しい手順 |
|---|---|---|---|
| 計画とゲート判定〔委譲しない〕 | 工程3 | 編集分類と可逆性トリアージが済んでいる。驚く結論は独立に検証済み。`PLAN:` 行が全要素にある | 工程3・鉄則2 |
| 一括承認（判断が要る分岐だけ） | 工程3の末 | 本当に判断が要る分岐だけ依頼者の承認を取る。不可逆な作業を、可逆な作業と同じ軽さで通さない | 工程3 |
| バインド監査〔決定論〕 | 工程4の末・5・6 | `scripts/audit-ds-binding.js` が pass=true。全 TEXT の textStyleId が非空、mixed（部分適用）0、非INSTANCEの見える fill/stroke の生の値0、spacing/radius/effect の生の値0。1件でも不合格なら完了不可 | 工程4・6・鉄則3 |
| 独立レビュー（全件） | 工程5（中・大） | 実装者と別のエージェントが、触った全要素を全数で見る（代表サンプルにしない） | [review](references/review.md) |
| 逆差分監査 | 工程5・6 | 編集後の対象に、依頼に無い要素が増えていない（出典が辿れる。F-SRC-2 の違反0） | [review](references/review.md)・鉄則8 |
| OOUI・関係と操作権限の整合 | 工程5・6 | 追加・変更した要素が、そのビューのオブジェクト構造に属する。モードレスの整合を壊していない。関係・操作権限と食い違わない | [review](references/review.md)・鉄則9 |
| auto-layout の整合 | 工程5・6 | 触った範囲が auto-layout で、Spacer が0。既存の負債はスコープ外の既知事項 | [review](references/review.md)・鉄則10 |
| instance 実体監査＋F-CMP-5 | 工程6(b) | 部品に見える各要素が `INSTANCE`（mainComponent が正しい・detach 無し）。追加・置換した範囲のスタイルを持つ非 instance が0件。instance 率を分数で報告 | 工程6(b)・鉄則7 |
| 完了の件数突合 | 工程6(a) | 編集N＝確認N。各カードをスクショで確認 | 工程6(a) |
| 意図充足〔委譲しない〕 | 工程1（before）・6(e)（after） | 自分で取ったスクショで「逐語→観測述語→観測結果」を3列で突合 | F-INT-1・F-INT-2 |
| 実測（濃さ・太さ・線・余白） | 工程1（Web の見本）・工程4の最初・工程6 | 刷新や、色・太さ・線・余白を直す編集で、見本と成果物の段階表があり、同じ種類の箱の余白がそろっていて、判定役に渡している | F-QLT-10・[tone-measure](../../skills/figma-design-create/references/tone-measure.md) |
| 完成度・一貫性・実施証跡 | 工程6(g)・報告 | 判定役の verdict 2行と、フレーム×観点の `pass|fail＋根拠` 行。機械的な編集は `regression:` 行 | F-QLT-6・F-QLT-7・F-QLT-9 |
| 参照ファースト（REF宣言） | 工程1・新しい見た目の判断を伴う編集だけ | REF宣言がある | F-PRC-11 |
| 重複監査・構造監査 | 工程6(f)・最後の書き込みのあと | 3run。run1 の範囲は比較相手を含む。完了報告に run3 の `F-CMP-AUDIT cmp:0 fcmp5:pass ...` と `roots:` | F-CMP-6・F-CMP-7 |
| 業界ベンチマーク report | 工程6(h)・大のとき、または依頼者が求めたとき | 全所見に処分 | F-QLT-8 |

## 資料の索引（`references/`）

| 資料 | いつ読むか |
|---|---|
| [inventory](references/inventory.md) | 工程2。全ページの走査、部品・変数・テキストスタイルの列挙、NOT FOUND と言える条件 |
| [variables](references/variables.md) | 工程3・4。色とタイポの役割→トークンの割り当て、インスタンス内部の扱い |
| [review](references/review.md) | 工程5・6。逆差分監査、OOUI・関係と操作権限・auto-layout の整合観点、スコープ規律 |
| [donts](references/donts.md) | 工程7の前。やってはいけないことの一覧 |

## 関連メモリ / 参照
入口(ディスパッチャ) [mikeneko-figma](../../skills/mikeneko-figma/SKILL.md) / 共通禁止事項SOT [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md) / [feedback_verify_absence_before_creating](../../docs/feedback_verify_absence_before_creating.md) / [feedback_qa_real_user_outcome](../../docs/feedback_qa_real_user_outcome.md) / [feedback_agent_team_delegate_all](../../docs/feedback_agent_team_delegate_all.md) / [feedback_no_ai_arbitrary_colors](../../docs/feedback_no_ai_arbitrary_colors.md) / [feedback_css_use_variables](../../docs/feedback_css_use_variables.md) / `feedback_figma_component_style` / [feedback_wireframes_ooui_bound](../../docs/feedback_wireframes_ooui_bound.md)

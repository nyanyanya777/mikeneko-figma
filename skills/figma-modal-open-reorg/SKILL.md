---
name: figma-modal-open-reorg
description: 設定/管理画面などの「素置きされたモーダル」を、文脈ごとに独立した"モーダルを開いた状態"（親画面＋背景dim＋中央ダイアログ）に整理し、反復モーダルをバリアント付きコンポーネントに格上げして再利用可能にするFigma作業の手順書。既存デザインで「モーダルがモーダルとして見えない/素のパネルが散在している」ときに、カテゴリ別セクションへ再編する。mikeneko-figmaの下位（既存改修=ds-edit/新規部品=component-design の合わせ技）。
---

# 設定画面のモーダル開・文脈独立化＋コンポーネント化（figma-modal-open-reorg）

**TL;DR**: 素置きモーダルを「親画面clone＋Overlay(dim0.6)＋モーダルinstance中央」の**"モーダル開"合成**に直し、反復モーダルは**バリアント付きコンポーネント**へ格上げして instance で使い回す。**まず1パターンを実証して見え方を承認→座標帯を分けて並行展開→独立レビュー。** 実作業は委譲、メインは分解・割当・ゲート判定。

## 適用範囲

- **やる**: 既存画面群で、モーダル/ダイアログが「素の白パネルで平置き」され文脈が分からない状態を、カテゴリ別の独立セクションに再編し、各モーダルを"モーダルを開いた状態"で見せる。反復モーダルのコンポーネント化＋状態バリアント化。
- **やらない（委譲/別スキル）**: 実装は figma-implementer に委譲。部品の軸設計は figma-component-design、既存への変数/スタイル適用は figma-ds-edit の規律に従う。use_figma は figma-use を前提ロード。
- **前提**: [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md) の共通禁止事項（F-\*）が全工程で効く。原本非破壊が絶対。

## 鉄則（不可侵）

1. **原本非破壊。** 親画面もモーダルも **clone / createInstance のみ**。原本フレーム・マスターコンポーネント・保全物（付箋/参照一覧/パーク済みマスター/ユーザー自作の見本）は**位置も中身も触らない**。消すならインスタンス側で（[feedback_figma_hide_in_instance_not_master](../../docs/feedback_figma_hide_in_instance_not_master.md)）。
2. **見え方が唯一の合否＝"文脈が見える"。** 合成は必ず screenshot で確認し、**親画面が dim 越しに視認できる**（真っ黒でない）こと。真っ黒＝失格。
3. **反復はコンポーネント化、1回きりは素合成。** 2回以上現れるモーダルは component化＋状態はバリアント軸（2コピー則 [feedback_component_unit_two_copy_rule](../../docs/feedback_component_unit_two_copy_rule.md)）。1回きり（例: 完了案内）はコンポ化せず clone で合成。既存に同等コンポがあれば**新規作成せず流用**（不在断定しない・[feedback_verify_absence_before_creating](../../docs/feedback_verify_absence_before_creating.md)）。
4. **発明ゼロ。** モーダルの文言・対象は現物の作図から拾う。出典が無ければ妥当な既定を置き **[推定]** と報告に明記（default-deny、勝手に確定しない）。
5. **見本＝正パターンとは限らない。** ユーザーが指した既存物が「直す対象（不正例）」のこともある。何が正かを取り違えない（現物とユーザー逐語で握る）。

## "モーダル開"合成レシピ（正）

1 モーダル＝1合成フレーム。下から順に3層:
- **① 親画面のclone**（そのカテゴリのフル画面＝Header＋SideMenu＋コンテンツを持つもの）。
- **② Overlay instance（dim暗幕）**: 塗り＝暗色semantic変数バインド＋**paint opacity＝実証(工程2)で承認した dim 値（既定0.6）**、サイズ＝**画面幅×(画面高−ヘッダー高)**、位置 y=+**ヘッダー高**（**ヘッダーは覆わず明るいまま**）。※画面幅・ヘッダー高は工程0で親画面から実測（固有値をスキルに固定しない）。
- **③ モーダル instance を中央配置**: 水平 x=(**画面幅**−モーダル幅)/2、本文域(y=**ヘッダー高**〜画面下)で縦中央。見た目は**モーダルコンポーネント自体のスタイルに従う**（寸法を手順に固定しない）。

**親画面が auto-layout の場合**、② ③ は `layoutPositioning = "ABSOLUTE"` にして浮かせる（レイアウトに飲まれないように）。

## 標準オーダー（0→5）

- **0. 偵察（read-only・委譲）**: カテゴリ一覧と各カテゴリの親画面・モーダル一覧を棚卸し。**「実画面」か「スペック作図SECTION」かを判別**（実画面＝Header/SideMenuを持つ／作図SECTION＝状態やモーダルのraw作図の集合、cloneベースにしない・出典参照のみ）。**複数ブロックが同一画面に載る場合は1カテゴリに畳む**（例: 表示件数・既定の保管場所は「一般」画面上のブロック＝一般1カテゴリ）。目標スタイルの正例が既存にあれば実測でレシピ化。既存コンポーネント（確認/フォーム/オーバーレイ）の有無を search。
- **1. コンポーネント化（委譲・figma-component-design準拠）**: Overlay（dim・変種なし）／ConfirmModal（削除確認: 軸=tone、message/confirmLabel/cancelLabel をText property）／フォーム系（状態が複数なら軸=状態）／単一入力（InputModal: title/placeholder/submit をprops）。**軸は直交・最小・デッドスペース無し・全組合せ検証**。既存部品は流用。clone→createComponentFromNode で見た目保存（内部負債の全再構築はスコープ外と割り切ってよい・正直に申告）。
- **2. 実証（委譲→メイン目視承認）**: **確認系1件＋フォーム系1件**を実際に"モーダル開"合成にして screenshot。親画面が dim 越しに見えることを確認し、必要ならユーザー承認。ここで見え方の正を固定。
- **3. 並行展開（委譲・複数チーム）**: カテゴリを**重ならない座標帯**に割り当て（帯ごとに y を大きく離す）。各チームは自帯のみ、clone/instance で合成、**Overlay opacity は必ず0.6を明示設定**。着地前に screenshot で領域が空かを確認。1カテゴリ=1SECTION＝画面＋モーダル別合成N枚。
- **4. 統合・独立レビュー（委譲）**: 別エージェントで抜き取り検証（②見え方・opacity・INSTANCE維持・原本/マスター/保全物 intact・重なり無し）。指摘は裏取りして是正。
- **5. メイン目視＋正直報告**: 代表セクションを自分の目で確認。[推定]・保留（例: ダイアログでない設定カードはモーダル化しない）を隠さず報告。**完了報告に必須の2種の行**: ①`F-QLT-6 verdict:` / `F-QLT-7 verdict:`（F-QLT-9。judgeはFableのみ）②`F-CMP-AUDIT cmp:0 fcmp5:pass ...`（F-CMP-7。**最後の書込の後**に `~/.claude/skills/mikeneko-figma/scripts/audit-structure.js` を use_figma で実走させ、その出力を転記。復唱では通らずStopフック `visual-gate-stop.sh` が実行痕跡を機械照合）。本スキルは clone を基調とするため **F-CMP-6（2コピー則）の複製クラスタが最も出やすい**——cmp>0はコンポ化するか `raw:<コード>` にリネームして台帳（`~/.claude/gate/ds/<session_id>.md` の `PLAN: <要素名> -> raw:<コード>:<根拠>` 行）に載せてから再走する。

## 落とし穴（1事故=1行）

- **Overlay instance の fill paint-opacity は生成時に 1.0 へドリフトする** → instance ごとに **0.6 を明示設定**し screenshot で確認（真っ黒なら未修正）。
- **スペック作図SECTIONを親画面と誤認しない** → Header/SideMenu を持つ実画面を clone ベースに。作図は文言の出典参照のみ。
- **並行編集は座標帯分離＋clone基調で衝突回避** → マスター同時編集や同一親からの同時move-outはしない（instance生成＝読み取りで共存可）。SectionNode は子の x/y をセクション原点基準で解釈する挙動に注意（絶対座標二重化に注意）。
- **ダイアログchromeの無い"設定カード/完了後状態"はモーダルでない** → dim中央に置くと破綻。画面状態として扱い、モーダル化しない。
- **反復フォームの内部は既存レガシー負債（絶対配置・raw値）を継承しうる** → 再利用可能化（props/状態バリアント）が目的なら可。内部リファクタが要るなら別工程と明言。

## やってはいけない

- 原本/マスター/保全物の移動・改変（鉄則1）。
- 親画面が真っ黒（dim不透明）のまま合格にする（鉄則2）。
- 1回きりモーダルのコンポ化／既存同等品の重複作成（鉄則3）。
- 文言・対象の発明（[推定]明記なしの確定）（鉄則4）。
- ユーザーが指した既存物を無条件に「正」と決めつける（鉄則5）。
- 見え方未承認のまま全カテゴリへ一気展開（オーダー2を飛ばす）。

## 関連

[feedback_figma_verify_structure_not_pixels](../../docs/feedback_figma_verify_structure_not_pixels.md) / [feedback_figma_raw_frame_default_deny](../../docs/feedback_figma_raw_frame_default_deny.md) / [feedback_reviewer_claims_are_inputs_verify](../../docs/feedback_reviewer_claims_are_inputs_verify.md)

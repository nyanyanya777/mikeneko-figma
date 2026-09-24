---
name: mikeneko-figma
description: 自作Figma作業スキルの入口/ディスパッチャ。1問判定で figma-ds-edit / figma-component-design / figma-design-create / figma-e2e-test を1つだけロードし、共通規範（F-*）は [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md) を必ず併読させる。公式プラグインスキルは振り分け対象外。Figma作業の最初に必ずここを通る。
---

# 自作Figmaスキルの入口(公式とは別系統)

**TL;DR**: Figma作業の最初に必ず通る入口=1問で判定し自作スキルを**1つだけ**ロード(覚えるのは `/mikeneko-figma` だけ)。全自作スキルに効く**共通禁止事項の唯一の正典(SOT)は姉妹スキル [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)**——判定してロードしたスキルと合わせて必ず併読する。**公式プラグインのスキル(`figma-use`/`figma-generate-*`/`figma-create-new-file`/`figma-code-connect`/`figma-swiftui` 等)は振り分け対象外**=各自作スキルが必要時に呼ぶ下請け(プラグインAPI層)。他の `figma-*` も全て公式(下請け)扱い。

## 判定(1問で割れる)

| やること | ロードするスキル |
|---|---|
| **既存**に手を入れる(restyle/変数・テキストスタイル適用/生frame→component置換/レビュー) | `figma-ds-edit`(+[mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)) |
| **新規**に**部品1個**を起こす/既存部品のproperty軸・sizingを大改修(variant/boolean/swap軸・slot設計・全組合せテスト) | `figma-component-design`(+[mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)) |
| **新規**に**画面・フロー丸ごと**(要件から既存DSの上に起こす+プロトタイプ配線まで) | `figma-design-create`(+[mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)) |
| **新規サービス**(同じプロダクトに既存画面もDSも無い。参考サービスを調べて DESIGN.md を作る。Figmaには書かない) | `mikeneko-design-md`(出来たら `figma-design-create` へ) |
| **既存**の画面/フローが**実ユーザーの目的を達成できるか検証**(体験E2E・盲目セルフプレイ・設計は直さない) | `figma-e2e-test`(+[mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)) |
| Figmaの画面群をコードへ忠実再現 | `mikeneko-frontend`(正本: `~/.claude/skills/mikeneko-frontend`) |

判定したら、そのスキルの鉄則・標準オーダーに従う。**design-create振り分け時はフレームをいきなり起こさず、ビューインベントリ(オブジェクト×collection/single)とページIA(オブジェクト単位Page)を先に確定**(design-create §0/§3/§8)。

ロード手順の正本: **0** まずここを通る→**1** 判定表で1問→**2** 1つだけロード(グレーは次§)→**3** 公式は振り分けない→**4** [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)は全分岐で常に併読→**5** design-createは宣言先行(前掲)。

## 迷ったときの切り分け(グレーゾーン)

- 既存frameの中身を直す=edit/新しいframe・画面を起こす=design-create。restyle中の既存部品→別DS部品への差し替えもedit(差し替え先はinstance化)。
- design-create途中で「DSに無い部品が要る」と判明=component-designへ寄り道→部品設計後に画面作成へ戻る(手描き偽装で代用しない)。
- 複数該当は対象の単位(既存全体/部品/画面)が一番大きいものを主に、足りない部品だけ寄り道。
- 体験を検証(実ユーザーが目的達成できるか歩く)=e2e-test/構造・DSの正しさレビュー(変数バインド・instance実体・トークン適合)=ds-edit。e2e-testは直さない=修正はds-edit/design-createへハンドオフ。Figma→コード再現だけはmikeneko-frontend(判定表5行目)。

## 関連メモリ / 参照

- 共通規範(F-*)の唯一の正典(SOT): [mikeneko-figma-rules](../../skills/mikeneko-figma-rules/SKILL.md)(最終ゲート対応表・スキル成長規約も含む)
- 姉妹スキル: [figma-ds-edit](../../skills/figma-ds-edit/SKILL.md) / [figma-component-design](../../skills/figma-component-design/SKILL.md) / [figma-design-create](../../skills/figma-design-create/SKILL.md) / [figma-e2e-test](../../skills/figma-e2e-test/SKILL.md)(Figma→コード再現は mikeneko-frontend)

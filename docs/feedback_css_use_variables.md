---
name: feedback_css_use_variables
description: フォントも色もCSS variable/セマンティックトークン経由で指定する、直書きNG
metadata: 
  node_type: memory
  type: feedback
---

実装時のフォント・色指定は必ずvariable経由にする（ユーザー明示指示）。

**Why:** デザイントークンの一元管理が目的。`font-family: "Noto Sans JP"` や 生のhex値・`green-600` のような直書きは、テーマ変更・モード切替・DS更新で取り残される。next/fontは `--font-sans` 変数にフォールバック込みで解決するので、直書きフォールバックを足すのも冗長でNG。

**How to apply:**
- フォント: `font-family: var(--font-sans);` のみ。フォント名の直書き（Inter/Hiragino/Noto…）を残さない・足さない。
- 色: globals.css のセマンティック変数（--primary/--destructive等）と対応Tailwindクラス（bg-primary 等）を使う。Tailwindパレット直（green-600等）やhex直書きはNG。該当するセマンティック変数が無い意味（success等）は **globals.css に変数を定義してから**使う。
- 関連: [feedback_no_ai_arbitrary_colors](../docs/feedback_no_ai_arbitrary_colors.md)（色は根拠から）


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [フォントも色もvariable経由] — font-family直書き/hex/パレット直書きNG、--font-sansとセマンティック変数を使う、無ければglobals.cssに定義してから

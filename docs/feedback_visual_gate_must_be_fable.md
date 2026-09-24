---
name: feedback_visual_gate_must_be_fable
description: 見た目が判定対象のFigma案件でSonnetレビューをFableビジュアル判定の代わりにしない、Fable不可時は最新Opus、実施証跡は完了報告のverdict行＋Stopフックで機械照合
metadata: 
  node_type: memory
  type: feedback
---

見た目の完成度そのものが判定対象の**資料作成**（スライド/レポート等のドキュメント成果物）で、レビューを2回ともSonnetで回し、必須のFableビジュアル判定を一度も実行しないまま進めた。ユーザー曰く同種のスキップは「1日に1回」規模で頻発している。**発生領域はFigmaでなく資料作成**——最初にFigma書込をトリガにした配管を作ったが的外れで、ユーザーの訂正「figmaじゃなくて資料作成で起きた」で張り直した（Figma側の配管も有効なので併存）。

**Why:** ルールは散文としては既に必須だった（mikeneko-figma F-QLT-6/7、F-PRC-8の「未実施＝完了不可」）。それでも飛んだのは、(1)「ビジュアル判定が要る案件か」の判定自体が自己申告で、その自己申告が毎回飛ぶ、(2)構造的レビュー（Sonnet/figma-reviewer）を通すと「レビュー済み」の感覚が生まれ、視覚判定の欠落が自分から見えなくなる——構造的合格は視覚的完成度の代理指標にならない（[feedback_qa_real_user_outcome](../docs/feedback_qa_real_user_outcome.md)と同型）。

**How to apply:**
- **judgeはFableのみ。** 起動できない場合に限り**最新Opus**（`model:"opus"` を明示）で同一手順＝実スクショの画像直渡し・F-QLT-7は宣言TWIN/姉妹画面のスクショ同梱・複数画面は1回に束ねる。`fable-fail:<task-id|エラー原文>` の併記が無い judge:opus は未実施扱い（安い方へ逃げる口実を塞ぐ）。**sonnet/figma-reviewer/自分の目はこの枠を埋めない。**
- **完了報告に必須の2行**: `F-QLT-6 verdict:<fable|opus>/<task-id>/<pass|fail>` と `F-QLT-7 verdict:<fable|opus>/<task-id>/<pass|fail>`。
- **トリガは自己申告でなく機械検出**: Figma書き込みツール（use_figma / generate_figma_design / create_new_file）を1回でも成功させたら発火。書込ゼロのセッションだけが自動免除で、免除宣言の口は無い（fail-closed）。
- **配管**: Stopフック `~/.claude/hooks/visual-gate-stop.sh`（settings.json Stop に登録済み）が、書込検出＋judge起動の完走（tool_result成功）＋verdict行の3点を機械照合してブロックする。書込検出はサブエージェント(isSidechain)内も対象、judge=opusは `fable-fail:` 併記必須、`stop_hook_active` では素通しせずセッション毎5回まで再評価（レビュー指摘を反映した版）。正本ルールは [mikeneko-figma](../skills/mikeneko-figma/SKILL.md) §品質系 **F-QLT-9**。
- **資料作成側の正本＝CLAUDE.md「完了宣言の条件」節の D-QLT-6**（Artifact公開/Drive書込/`.md .html .pptx .tex .pdf`のWrite・Edit/pandoc等の変換コマンドがトリガ。Notionは既存の自動追記と衝突するため意図的にトリガ外、`~/.claude/`配下は構造的除外、除外は閉じた語彙 `doc-visual-exempt:<code|config|memory|skill|plain-text>` のみ、レンダ不能はfail-closed）。judgeへの入力は必ず**実レンダリング画像**でテキスト要約は不可。Figma側はF-QLT-9。同じ `visual-gate-stop.sh` が両分岐を持つ。
- 関連: [feedback_figma_ground_on_sibling_screens](../docs/feedback_figma_ground_on_sibling_screens.md) [feedback_figma_perceive_before_delegate](../docs/feedback_figma_perceive_before_delegate.md) [feedback_figma_verify_structure_not_pixels](../docs/feedback_figma_verify_structure_not_pixels.md) `feedback_subagent_resend_fabrication`

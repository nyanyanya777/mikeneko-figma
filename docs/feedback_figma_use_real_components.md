---
name: feedback_figma_use_real_components
description: Figmaは必ずファイル内の実コンポーネントで組む。着手前にチャットでワイヤーを出して合意してから起こす
metadata: 
  node_type: memory
  type: feedback
---

架空の例（備品貸出アプリ）のFigma作業で、私が既存の実コンポーネントを一切使わず生のframe/text/rectで画面を手描きして怒られた。「なんでFigmaコンポーネント使ってないの一切」「まずここ（＝チャット上）にワイヤー作って」。

**位置づけ:** 「手描き・生フレーム禁止」の一般則の現行正本は **F-CMP-5**（[feedback_figma_raw_frame_default_deny](../docs/feedback_figma_raw_frame_default_deny.md)、正典は [mikeneko-figma](../skills/mikeneko-figma/SKILL.md) 入口スキルの共通禁止事項）。本ファイルの主体は ①**着手前にチャットでワイヤー（ASCII/構造）を出して合意してからFigmaに起こす**原則 ②当該ファイル固有の運用（Utility Componentsページ node 123:456・実コンポーネント名一覧・変数バインドの実手順）。

**Why:** ファイルには実コンポーネントが揃っている（例: Button, Card, Table, Dialog, PageHeader 等）。手描きは見た目が近似でもデザインシステムと乖離し、編集・実装に繋がらない。また、いきなり高精細をFigmaに作ると手戻りが大きい。

**How to apply:**
- **着手前にチャット上でワイヤー（ASCII/構造）を出して合意**してからFigmaに起こす。いきなりFigmaビルドに飛ばない。
- Figmaに起こすときは**必ずファイル内の実コンポーネントのインスタンス**を使い、**デザインシステムを使い回す**（`figma.currentPage`の COMPONENT/COMPONENT_SET を検索→instance化、または importComponentByKeyAsync）。生のcreateFrame/createText/createRectangleで部品を自作しない。新規合成が要る箇所も、実コンポーネント（Badge/Button/Card等）を組み合わせて作る。
- **Figma Variables（トークン）を必ずバインドする**。色・フォント(タイポ)・余白・角丸は base/foreground, base/muted-foreground, base/border, spacing/*, text系 等の変数に紐づける。**生のHEX直書き・生フォント指定は不可**（ユーザー明言:「フォントとか色とか普通に生のやつとかありえない」）。変数解決でダーク化等の不具合が出たら原因を直す（getLocalVariablesAsync/既存ノードのboundVariablesからVariable取得→setBoundVariableForPaint）。
- **レビュー(崩れ/UX)チームのチェック項目に必ず含める**：①実コンポーネントを使っているか ②DSを使い回しているか ③変数(色/フォント/余白)がバインドされているか ④生色/生フォントが残っていないか。
- コンポーネント一覧は「Utility Components」ページ(node 123:456)に集約。色/タイポ変数は既存ノードに get_variable_defs で確認。
- **「完全一致が無ければ手描き可」ではない（再指摘「マジで可能な限りやってね」）**: 近い既存コンポーネントを探して使い回す・組み合わせるのが先。調査エージェントはsearch_design_system（公開ライブラリ）だけでなく**ファイル内ローカルコンポーネント（Utility Componentsページ・独自コンポーネントページ）を必ず両方**洗うこと。Table=Table、PageHeader=PageHeader等が実在するのに「対応物なし」と誤判定した前例あり。
- 関連: [feedback_figma_target_node](../docs/feedback_figma_target_node.md) [feedback_figma_hide_in_instance_not_master](../docs/feedback_figma_hide_in_instance_not_master.md)


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [Figmaは実コンポーネントで・先にチャットでワイヤー] — 手描きNG、着手前にチャットでワイヤー合意してから実コンポーネントで起こす

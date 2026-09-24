---
name: feedback_figma_output
description: FigmaのURLから作業を依頼された場合は、HTMLやローカルファイルではなくFigma上に直接デザインを書き戻す
metadata: 
  node_type: memory
  type: feedback
---
FigmaのURLを共有されてデザイン作業を依頼された場合、原則としてFigma MCPの書き込みツール（generate_figma_design等）でFigma上に直接アウトプットする。HTMLモックやローカルファイル生成は提案しない。

**Why:** ユーザーはFigma上で作業しており、ローカルHTMLで出されても使えない。「Figma MCPを使っているのに何度も言わせるな」と明示的に指摘された。

**How to apply:** figma.com/design URLが会話に含まれ、デザイン作成・変更の依頼があったら、保存場所を確認せずにFigma MCPツールで直接Figmaに書き出す。ローカルファイル案は出さない。


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [Figma作業時の出力先] — Figma URL依頼はFigma上に直接書き戻す、HTMLやローカルファイルで出さない

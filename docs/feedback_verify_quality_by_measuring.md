---
name: feedback_verify_quality_by_measuring
description: 品質主張（コントラスト/フォントサイズ/レスポンシブ/AA）は実測してから言う。ブラウザで数値確認せず「満たしてる」と言わない
metadata: 
  node_type: memory
  type: feedback
---

実装の品質（WCAGコントラスト比、最小フォントサイズ、レスポンシブ＝横はみ出し 等）を「満たしている／対応済み」と報告する前に、**必ずブラウザ等で実測**（DevToolsのコントラスト比、`getComputedStyle`のfontSize、`document.documentElement.scrollWidth` vs `innerWidth`、各幅のスクショ）して**数値で確認**する。エージェントや過去監査の結果を鵜呑みにして言い切らない。

**Why:** ユーザーに何度も「満たしてないのに、なぜ大丈夫と言った?」と過信を指摘された（コントラスト3.17をAA合格と言う／14px未満を見落とす／横はみ出しがあるのにレスポンシブ対応済みと言う、等）。実測せず言い切るとブランドと信頼を損ねる。

**How to apply:** 「AA満たす」「14px以上」「レスポンシブOK」等を言う前に、ライブ（または同一コードのlocalhost）をブラウザで開いて該当値を実測し、数値・スクショで示す。**デプロイ前後の差にも注意**（修正をデプロイし忘れて古い値が残り「直ってない」と言われた実例あり）。[feedback_natural_japanese_copy](../docs/feedback_natural_japanese_copy.md) と同様、確定前のレビュー工程を必ず挟む。


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [品質主張は実測してから] — コントラスト/フォント/レスポンシブ等を「満たしてる」と言う前に必ずブラウザで実測・数値確認。デプロイ忘れにも注意

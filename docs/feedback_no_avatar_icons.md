---
name: feedback_no_avatar_icons
description: プロダクトに実在しない要素（アバター等）をデザインに描き足すな
metadata: 
  node_type: memory
  type: feedback
---

例えば備品貸出アプリ（架空）には**ユーザーのアイコン/アバターが存在しない**。担当者名の横やカードにアバター画像を置いてはいけない。

**Why:** 実プロダクトにアバター/プロフィール画像のUIが無いのに、DSに Avatar コンポーネントがあるからと言ってそれを使うと、実プロダクトに無い要素を捏造することになる（[feedback_element_provenance_antibleed](../docs/feedback_element_provenance_antibleed.md) の出典ゲート違反）。ユーザーは繰り返しこれを指摘した。

**How to apply:** 対象プロダクトのFigma/実装で、人物表現に汎用のAvatarコンポーネントやアイコン円を安易に入れない。実プロダクトにその要素が無いなら、氏名テキストなど実在する表現に留める。既存ビルドに実在しない要素があれば除去する。

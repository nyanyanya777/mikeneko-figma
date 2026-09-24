---
name: feedback_figma_verify_structure_not_pixels
description: FigmaのDS正しさはピクセル/スクショで検証できない。偽フレーム・外付けTEXTラベルは本物と見分け不能なので、レイヤーツリー/ノード種別/コンポーネントプロパティの構造で検証する
metadata:
  node_type: memory
  type: feedback
---

DS適用の「正しさ」は見た目では検証できない。手描きFRAME+TEXTの偽コンポーネントも、ネイティブslotをバイパスした外付けTEXTラベルも、本物のインスタンス/スロットと**ピクセル完全同一**にレンダリングされる。スクショ一致を合格基準にすると構造的欠陥が必ず素通りする。

**Why:** 架空の例（レシピ共有アプリ）のDS版で、実インスタンスは使ったがComp内蔵の`Show Label`/`Label Text`を使わず外付けTEXTでラベルを作った欠陥が、instance実体監査（INSTANCEか/正しいmainComponentか/detach無しか＝identityの確認）を素通り。見た目は完璧なのでユーザーが指摘するまで内部レビューで捕まらず、「何も変わってない」が繰り返し起きた。identity（本物か）は見たが utilization（slotを使い切っているか）を見ていなかった。

**How to apply:**
- 検証は**構造で**行う：レイヤーツリー・ノード種別(INSTANCE)・componentPropertyDefinitions・slot利用状況を開いて確認。スクショの見た目一致だけで合格にしない。
- **slot-bypass検査**を⑥監査に必ず入れる：各インスタンスの提供プロパティ(label/description/icon/link/helper)を列挙→兄弟/親に同役割のTEXT/vectorが無いか走査→在れば**FAIL**（slotをtrueにして外付けを削除）。
- 原則一行：「実インスタンスは必要条件だが十分条件でない。identityでなくutilizationを監査する」。
- 「DS当てた/直した」と言う前に、触った要素を1件ずつ構造で確認。cf. [feedback_verify_absence_before_creating](../docs/feedback_verify_absence_before_creating.md) / [feedback_qa_real_user_outcome](../docs/feedback_qa_real_user_outcome.md)


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [FigmaのDS正しさは構造で検証] — 偽フレーム/外付けTEXTラベルは本物とピクセル同一。スクショ一致で合格にせずレイヤー種別/プロパティ/slot利用を構造確認、⑥にslot-bypass検査

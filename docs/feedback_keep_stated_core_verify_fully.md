---
name: feedback_keep_stated_core_verify_fully
description: ユーザーが明示した中核仕様(例:QRで即時貸出)を自分の判断で外して別物を作るな。user-ownedな分岐を推測で決めない。成果は最後まで自分で検証してから返す
metadata:
  node_type: memory
  type: feedback
---

ユーザーが明言した中核仕様を勝手に外す＝「全く違うものを作る」最大の地雷。実装の細部裁量と、仕様の根幹は別。

**Why:** 備品貸出アプリ（架空）の改修で、ユーザーは複数回のやりとりで繰り返し「**QRで即時貸出**」を中核に置いていた。なのに改修案を作る際、私が「即時貸出の有無」を自分のA/B選択肢として扱い、勝手に片方を捨てて**QR即時貸出を外した別物**を作った→「言ってることと全く違う／先祖返り／もう任せられない」と激怒。`feedback_discuss_user_idea_literally`(勝手に拡大解釈・上乗せして別物にするな)と同型で、今回は逆に**明示済みの要素を削った**バージョン。さらに検証も浅く、半端な成果を返していた。

**How to apply:**
- **ユーザーが一度でも明言した中核仕様（主役の機能・骨格・インタラクションモデル）は、自分の判断で外さない・置換しない**。「画面を簡素化して」等のトリム指示でも、何を残し何を削るかは**ユーザーの決定**。曖昧なら削る前に確認（削除＝戻しにくい・不信を生む）。
- **user-ownedな分岐（中核機能の有無/どの案/何を残すか）を「reasonable guess」で確定しない**。実装の細部(色・間隔・命名)は裁量、仕様の根幹は委譲不可の確認事項。`feedback_verify_absence_before_creating`のゲート判定と同じ重み。
- 直前に同種の確認質問(A/B)を出して**未回答のまま**なら、後続の細かな指示を「片方への同意」と都合よく解釈しない。未回答は未確定。
- **最後まで自分で検証してから返す**：実体(INSTANCE/bind/geometry)＋全状態のスクショを自分の目で通し、約束した要素が全部入っているかを確認。半端な状態で「できた」と言わない。cf. [feedback_qa_real_user_outcome](../docs/feedback_qa_real_user_outcome.md) / [feedback_figma_verify_structure_not_pixels](../docs/feedback_figma_verify_structure_not_pixels.md) / `feedback_discuss_user_idea_literally`
- 謝辞や言い訳を盛らない。非を一行で認め、事実を直す。


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [明示済み中核仕様を外すな・最後まで検証] — ユーザーが明言した骨格(例:QRで即時貸出)を自分の判断で削除/置換しない、user-ownedな分岐を推測確定しない、半端な成果で「できた」と言わず実体＋全状態を自分で通し検証。中核を外して激怒された教訓

---
name: feedback_verify_absence_before_creating
description: 「Xが存在しない」と断定して新規作成する前に、対象を実際に索引できる道具で積極確認すること。検索/一覧の空振りは不在の証拠でない
metadata: 
  node_type: memory
  type: feedback
---

「対象が存在しない」という結論で、共有資産への新規作成など戻しにくい操作を発火させてはいけない。まず**その型を実際に見られる手段で積極確認**する。

**Why:** 備品貸出アプリ（架空）のDS（ページ数の多い本格DS）で、`get_metadata`(nodeId無し→Coverのみ＝浅いルートビューでありページ総数でない)と`search_design_system`(公開ライブラリの変数/スタイルしか索引せずキャンバス上のCOMPONENTを見ない→空が当然)の2つの空振りを足して「コンポーネントが無い」と誤断定。検証せず重複コンポーネントを新規作成し、ユーザー激怒・全面revertになった。「absence of evidence」を「evidence of absence」にすり替えた典型ミス。

**Why(2):** 同じ反射が「能力(capability)軸」でも再発した。レシピ共有アプリ（架空）のDS版画面で、Input/TextareaのインスタンスはちゃんとDS実体を使ったのに、そのComp固有のネイティブslot（`Show Label`/`Label Text`等）を読まず、ラベルを外付けTEXTで手作りした。「存在するか」は確認したが「何を提供するか」を読まなかった。手描き偽装(A)→ライブラリ未走査の誤断定(B)→slot未読(今回)は、層が細かくなっただけの同型ミス＝「システムが既に持つものを探さず自分で作る」反射。cf. [feedback_figma_verify_structure_not_pixels](../docs/feedback_figma_verify_structure_not_pixels.md)

**How to apply:**
- 「Xは存在しない」と言う前に、その型を実際に索引できる道具で最低1回の積極確認（Figmaなら**スクショ1枚**や全ページドリルでCOMPONENT_SETを型で拾う）。空の検索結果を不在の根拠にしない。
- **存在確認だけで止めない＝capability軸も読む**。既存インスタンスを使っていても、ラベル/説明/必須/エラー/アイコン等を手で足す前に、そのComp固有のslot/プロパティ（`Show Label`等）で賄えないか componentPropertyDefinitions を必ず読む。役割が既にslotにあるなら外付け要素で作らない。②棚卸しでプロパティ定義を記録してから計画に入る。
- 驚く主張（DSにコンポーネントが無い等＝定義に反する/ユーザーの前提と矛盾）は検証バーを**上げる**。ハードストップして独立確認してから動く。
- **共有・追加・不可逆な操作（共有DSへのコンポーネント新規作成等）は着手前に「既に在るか」を必ず確認**。可逆で安い作業と同じ軽さで承認しない。
- 調査/実装は委譲してよいが、「結論を事実として受け入れ行動を発火させるゲート判定」は委譲不可＝自分の本務。[feedback_agent_team_delegate_all](../docs/feedback_agent_team_delegate_all.md) でも素通しは禁止。
- 問題報告に「いいご指摘です」等の謝辞・先回りの正当化・premise未検証での remedy 約束をしない。確認→事実を直す、の register で。[feedback_qa_real_user_outcome](../docs/feedback_qa_real_user_outcome.md)


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [不在を断定して新規作成する前に積極確認] — 検索/一覧の空振りは不在の証拠でない、共有資産への作成等は着手前に既存有無を必ず確認。DSにComp無し誤断定で重複作成→激怒の教訓。存在(exists)だけでなくcapability(slot/プロパティ)も読む

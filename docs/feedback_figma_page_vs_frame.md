---
name: feedback_figma_page_vs_frame
description: 「別ページのデザイン」と言われたらFigmaの新規Pageを作成する。同一ページ内の別フレームではない
metadata: 
  node_type: memory
  type: feedback
---
Figma作業で「別ページ」「別のページに作って」と言われたら、Figmaファイル内に**新しいPage（タブ左のページツリーで分かれる単位）**を作って、そこに配置する。同一ページ内に並べて新規フレームを作るのは違う。

**Why:** IA検討やバリエーション提示では、ページを分けて議論を整理したい。同一ページに並べられると既存デザインの横に雑多な案が増えるだけで使えない。「もう任せられない」レベルでストレスを溜めさせた。

**How to apply:** `figma.createPage()` でPageを作成し、`page.appendChild(frame)` で新規ページへフレームを移す／作る。既存ページに横並びで置かない。作成後はそのページを `figma.setCurrentPageAsync()` でアクティブにし、ノードURLを返す。


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [Figmaの「別ページ」は新規Page] — 「別ページに作って」は同一ページ内の新フレームではなく新規Pageを作る

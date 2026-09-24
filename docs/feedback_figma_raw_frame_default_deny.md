---
name: feedback_figma_raw_frame_default_deny
description: 生フレーム部品描画はdefault-denyで禁止(F-CMP-5)。「部品に見えるか」の自己認定で逃げられない構造にした事故教訓
metadata: 
  node_type: memory
  type: feedback
---

架空の例（備品貸出アプリ 備品一覧画面、node 123:456）で、DSにTable/Separator等が実在するのにテーブル一式100超のノード＋divider＋アイコンボタンを非instanceの生フレームで描画する事故。ユーザーの要求は「生フレーム描画を禁止。DSにあるコンポを使い、無ければコンポーネント化してから使う」。

**Why:** ルール(F-CMP-2)は在ったが認定権が違反者本人にあった。①「DSに実体がある部品は」という条件付きルール＝要素を「画面固有レイアウト」と自己分類すれば適用外 ②instance実体監査は「置いたinstanceが本物か」だけ＝instanceゼロなら監査対象空で合格 ③マッピング表component列に値域制約なし ④機械監査は部品名の名前一致のみで「Frame 123」素通り ⑤コンポ化=高コスト・生描き=ノーゲートでインセンティブが逆。

**How to apply:** 後の改定でF-CMP-5新設（正本=[mikeneko-figma](../skills/mikeneko-figma/SKILL.md)入口§部品系）: スタイル付き（可視fill/stroke/effect/cornerRadius>0）非INSTANCEノードはdefault-denyで不合格。合格は instance／無装飾コンテナ／台帳宣言例外`raw:<コード>`（ノード名をraw:コードにリネームして機械照合・N=N突合）のみ。TEXTは対象外(F-QLT系)。design-createはcomponent列4値（ds:/new-comp:/raw:/text）強制＝空欄は設計ゲート不通過、DSに無い部品は`new-comp:`票でfigma-component-designに寄り道してから実装。audit-structure.jsがF-CMP-5を機械検出（instance率分数・走査0件やコンポマスター配下除外を含むfail-closed。未実測・初回試走必須）。関連: `reference_mikeneko_figma_skill_skeleton` [feedback_figma_verify_structure_not_pixels](../docs/feedback_figma_verify_structure_not_pixels.md)


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [生フレーム部品描画はdefault-deny禁止(F-CMP-5)] — 備品一覧（架空の例）をDSにTable実在なのに100超のノード生描きした事故。スタイル付き非INSTANCE=不合格、例外はraw:命名の台帳宣言のみ、component列4値強制＋audit-structure.js機械検出(未実測)

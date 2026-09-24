---
name: feedback_component_unit_two_copy_rule
description: コンポーネント化の単位=2コピー則。同一画面の状態フレーム間コピーも対象、アトミックデザインは語彙で判断基準は本則
metadata: 
  node_type: memory
  type: feedback
---

コンポーネント化の単位についてユーザーが明言した基準: **同一構造の2回目のコピーが発生した時点でコンポーネント化する**。カウントは (i)別画面への複製 (ii)**同一画面（画面A）の状態違いフレームを作るためのコピーも1回と数える** (iii)画面内の繰り返し（テーブル行等）のすべて。

**Why:** 「別画面で再利用されたら」だけを基準にすると、同一画面の状態フレーム量産時のコピーが野放しになり、生フレーム複製がドリフトして同じものを何度も作る。ユーザー逐語「Aの画面とAの画面の状態作る時にコピーするならもうそれはコンポーネント化の方が良くない?」。

**How to apply:** 単位は「複製が同一な最大範囲」（レイアウト差分=余白/divider/並びは境界の外・composition側）。状態はコピーでなくVariant/プロパティ軸で持ち、状態フレームは殻＋プロパティ差し替えで構成。アトミックデザインは層の語彙（atom/molecule/organism、template以上はコンポ化しない）として棚の整理に使い、いつ切るかの判断は2コピー則＋状態軸＋OOUI意味単位で行う。正本=figma-component-design§コンポーネント化の単位基準、design-createに寄り道トリガー（2回目コピー時点でnew-comp:票）を配線済み。初適用例（架空の例、備品貸出アプリ）: 予約ダイアログのフィルタ行が6複製→DSファイル(node 123:456)にSegmentedControl / Item(123:457)・SegmentedControl(123:458)・FilterGroup(123:459)を新設（ページ123:460、description に用途/Tabs使い分け/禁止/出自を記載済み。**Publish状態: 実測でCURRENT=公開済み**(旧記載「未Publish」は解消済み)）。関連: [feedback_figma_raw_frame_default_deny](../docs/feedback_figma_raw_frame_default_deny.md)

**判明した穴**: 本則はメモリ/component-design§にあるがmikeneko-figma入口SOT・最終ゲート・audit-structure.jsのどこにも配線されておらず、F-CMP-5が「無装飾レイアウトコンテナ=合法」とするため**中身がDSインスタンスの生frame複製（サイドバー×6等）が全ゲートを素通り**する。あるファイルの全数調査で9クラスタ放置が発覚。**対策実施済み**: 入口SOTにF-CMP-6追加(2コピー則ゲート配線+意味単位は出現1でもコンポ化既定+raw:弁)、ds-edit工程5/6・design-create§8(i)に配線、audit-structure.jsに複製検出実装(FRAME/GROUP・raw:合算判定)。隔離レビュー「修正後採用」→GROUP検出漏れ・raw:部分宣言閾値割れの2件修正・境界テストgreen。**実ファイル初実走成功**(あるファイル3ページ・skip0)。既知の限界=①親名を変えた複製はすり抜け(シグネチャ=名前+children構成)②RECTANGLE複製は非対象(SOT逐語がフレーム/グループのため)③template級ページ骨格(main/content)の複製も検出するが正本「template以上はcomposition」により非該当トリアージが要る④大ページで返却JSON切詰め⑤入口は圧縮後も予算超過(これ以上はルール削除が必要と判断し負債として残置)。


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [コンポーネント化の単位=2コピー則] — 2回目のコピー発生時点でコンポ化(別画面/同一画面の状態フレーム/画面内繰返し全対象)、単位=複製の最大同一範囲・状態は軸・アトミックデザインは語彙。初適用=DSファイルにSegmentedControl/FilterGroup新設(node 123:456〜459、当時は未Publish)

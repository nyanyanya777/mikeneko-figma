# 参照ファースト（REF宣言）の細目

**いつ読むか**: 規模が中・大で、新しい見た目の判断を伴う作業の着手前（F-PRC-11 に当たるとき）。

[mikeneko-figma-rules](../SKILL.md) の F-PRC-11 の細目。本文から、手順の部分だけをここへ移した（原文のまま）。適用の条件と、REF宣言の4項目（検索クエリ／参照名／なぜ良いかの根拠1〜3行／`[REF:参照名]` タグ）は本文にある。

- 画面・フローを起こす/刷新するときは二段: (1) 作るプロダクトに近い実在サービスを WebSearch で2〜3件（検索語は確定事項から取る。実在プロダクト名と自分が見た画面のURLが要る） (2) 上の `lazyweb_search`。案件に DESIGN.md（`mikeneko-design-md` の成果物）が在れば必ず読む。新規サービスは先に `mikeneko-design-md`。component-design は (2) だけ。
- ヒット0件は、クエリ2本以上の空振り記録＋依頼者への報告で代える。platform は確定事項から取る。
- REF は見た目と配置の参考だけで、視覚の基準（TWIN）でも要素の出典（F-SRC-1）でもない。参照サービスにあるタブや操作を足したくなったら、作らずに依頼者に1問聞き、回答の逐語（user）を出典にする（「承認済み[REF:]」という合格語彙は無い）。REF宣言は設計判断用の別ファイルに置き、実装ワーカーに渡す設計書・ブリーフには REF／参考サービスの語を書かない（`item-provenance-pretool.sh` が止める）。[feedback_verify_absence_before_creating](../../../docs/feedback_verify_absence_before_creating.md) [feedback_element_provenance_antibleed](../../../docs/feedback_element_provenance_antibleed.md)

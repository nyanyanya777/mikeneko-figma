# 既存使用箇所への影響レビュー

**いつ読むか**: オーダー7で読む（旧置換・既存改修のときだけ）。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## 既存使用箇所への影響レビュー（旧置換・既存改修のみ）

property を後から触るとき、または default sizing を変えるときに必須。新規追加時はスキップ可（→[SKILL.md](../SKILL.md) §適用範囲と境界＞フロー分岐）。

- **インスタンス検索**：そのコンポを使っている画面を全リストアップ。
- **default 値**：新規 Boolean / Text / Instance Swap property の default は**既存インスタンスが見た目変わらない値**に設定。
- **variant rename は最大警戒**：旧 variant 名をしばらく残し、新名と並行運用。旧→新の移行コメントを description に。**3段移行**（deprecate → 新規追加 → 旧削除）。
- **property delete も破壊的**：bind先が detach、見た目が崩れる。削除前に consumer 側影響範囲調査必須。
- **sizing 変更（FIXED→HUG 等）は全インスタンスの高さ/幅に波及**：受領前に既存画面のスクショ前後比較を**最低5箇所**取って提示。
- 互換が取れないときは「旧コンポを Deprecated タグで残し新コンポを別名で立てる」を選択肢に。

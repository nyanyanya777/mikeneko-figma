# 変数・スタイル必須ルール

**いつ読むか**: オーダー5（実装）でバインドするときに読む。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## 変数・スタイル必須ルール

- **色**：fill / stroke は全て Color Variable bind。state ごとに違う色は Variable の alias / mode で吸収するか variant ごとに別 Variable を bind。
- **タイポ**：Text Style 必須。font size / weight / line height を生値で指定しない。
- **spacing / padding / gap**：Number Variable bind 推奨（DS で定義があれば必須）。
- **radius**：Number Variable bind。
- **effect**（shadow / blur）：Effect Style bind。
- **theme（light/dark）**：Variant軸にせず Variable mode で吸収。
- インスタンス内部での生値上書きは禁止。差分はすべて property 経由 or variant 経由で表現。

# 全 property 組合せテスト

**いつ読むか**: オーダー6で読む。テスト並べフレームの作り方、端値、異常の検出基準。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## 全property組合せテスト

### 事前計算
軸を決めた直後に **総数を掛け算で書く**（規模別の閾値・本体組合せの定義は正本→[property-axes](property-axes.md) §property軸の設計判断フロー＞組合せ総数の事前計算）：
`state(5) × size(2) × showHelper(2) × showLeading(2) × showTrailing(2) = 80`

### テスト並べフレーム（**4グリッドに分割、掛け算で爆発させない**）

| グリッド | 対象 | 並べ方 |
|---|---|---|
| **A. 本体組合せ** | Variant軸 × Boolean全パターン | 横軸=主Variant軸、縦軸=副Variant×Boolean全組合せ |
| **B. Text端値** | 「代表variant1つ」× 全端値 | 空文字 / 1字 / 想定最大長 / +α / CJK / RTL / 絵文字 |
| **C. Instance Swap端値** | 「代表variant1つ」× 全候補 | 最も縦に大きい instance と 最も小さい instance |
| **D. 親frame幅** | 「代表variant1つ」× resize 3点 | 最小 / 標準 / 最大 |

各グリッドは独立フレーム。**A×B×C×D を1枚にしない**。

### グリッドAのレイアウト規範
- 横軸: 主 Variant 軸（例: `state` を横に `Default / Disabled`）
- 縦軸: 副 Variant 軸 × Boolean 全組合せ
- **各セル下に property組合せをTextラベルで表示**（`state=Default | size=S | showHelper=true`）← レビュワーエージェントに渡すとき必須
- セル間は最低 24px gap（境界混在防止）
- フレーム title に総組合せ数（`NumberStepper 全組合せ (16件)`）

### 異常検出基準
レイアウト破綻（はみ出し / 詰まりすぎ / デッドスペース / 縦中心ズレ / 折返し暴発）を 1 件でも見つけたら **軸設計か sizing 設計を見直す**。個別パッチで隠さない。

### Boolean 全パターン
N 個の Boolean があれば 2^N 通り。N=3 なら 8 通り。**全部出す**。「典型3パターンだけ」は NG。

### Text 端値
- 空文字 / 1 字 / 想定最大長 / 想定最大長 +α（折返し起きる長さ）
- 多言語想定があるなら CJK / 英数 / アラビア（RTL）も。
- 絵文字込みでテスト（行高ズレの典型原因）。

### Instance Swap 端値
- 候補の中で**最も縦に大きい** instance と **最も小さい** instance の両方を入れて並べる。
- **異autolayoutへの差し替え**で親のHUGが暴れないか確認。

### 親frame幅テスト
- 最小 / 標準 / 最大の3点で必ず resize 確認。FILL が効いていない事故をここで検出。

### Reset all overrides テスト
- override で成立してる「設計上のごまかし」を発見する手段。reset 後に意図通りの default 表示になることを確認。

### Light/Dark mode テスト（Variable bind の検証）
- 両モードでスクショ。bind 漏れの hex 直書きがここで露呈。

# オートレイアウト設計（sizing・デッドスペース）

**いつ読むか**: オーダー3（構造設計）で読む。sizing mode の選び方、デッドスペース禁止、絶対配置を使ってよい場合。コンポ内部の sizing の機械則の正本。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## オートレイアウト設計

### sizing mode の選び方
各 frame について primary / counter 両方を以下から選び、選択理由を残す。

- **HUG (AUTO)**：中身の高さ / 幅で決まる。中身が伸縮する方向には基本これ。
- **FILL (STRETCH)**：親の残り領域を埋める。横幅を親に合わせたい子はこれ。
- **FIXED**：寸法を固定。**親の指定された外形寸法**にだけ使う。中身に対しては使わない。

### API の混在禁止
- 新API `layoutSizingHorizontal` / `layoutSizingVertical` と旧API `primaryAxisSizingMode` / `counterAxisSizingMode` を**混在させない**。**新API に統一**。
- `resize()` を呼ぶと sizing mode が静かに FIXED に戻る。resize 後に sizing を再設定する。

### 既定パターン（迷ったらこれ）
- **コンテナ**：AL VERTICAL / primary=**HUG** / counter=**FIXED**（設計幅）or **FILL**（親追従）
- **行スロット**：AL HORIZONTAL / primary=**FILL** / counter=**HUG**
- **可変表示の子**（helper / message / icon row）：flex の子として `layoutSizingHorizontal=FILL`, `layoutSizingVertical=HUG`、表示有無は Boolean Visibility

### HUG が効かない事故
- **HUG親 + 全FIXED子** は HUG が無効化される。子のsizingを先に決めてから親をHUGに、順序が逆だと後で resize して静かに FIXED に戻る。
- **入れ子コンポーネントの sizing 継承**：内側コンポがFIXED幅で外側がHUGの場合、外側が内側に固定される。**内側はFILL、外側がHUG** が基本則。

### デッドスペース禁止（**TextField事件の制度的再発防止**・正本）
- primary=FIXED で content より大きい値を入れると **下/右に常時余白** が残る。これが起きたら primary=HUG にする。
- 例：TextField で `primary=FIXED 109px` だが content は 100px → 9px のデッドスペース。helper を Boolean visible にし、container を primary=HUG に直すと、helper 有無で 72 / 100 が自然に出る。
- （鉄則8・[donts](donts.md) §やってはいけない の「TextField事件」はこの正本を指す）
- （本節は**コンポ内部**のsizing/デッドスペース機械則の正本（入口F-STR-2の委譲どおり）。**画面レベル**のSpacer/auto-layout検出仕様は各スキルのゲート（design-create 工程8(h)『auto-layout厳守逆監査』＝[reverse-audits](../../../skills/figma-design-create/references/reverse-audits.md)／ds-edit全件レビューのauto-layout整合観点）が自前で持つ。）

### itemSpacing と alignment の衝突
- `itemSpacing = "AUTO"` (space-between) は `primaryAxisAlignItems` を**上書き**する。同時指定は直感に反するので、どちらかに統一。

### textAutoResize の設定
- `WIDTH_AND_HEIGHT`（HUG扱い）／`HEIGHT`（FILL幅）／`NONE`（固定）。AL内のテキストは**意図して選ぶ**。未設定で「テキストが折り返さない」事故。

### 絶対配置を使ってよい唯一のケース
- overlay バッジ、フォーカスリング外側など、**親のレイアウトに影響を与えてはいけない装飾**のみ（`layoutPositioning=ABSOLUTE`はAL計算から除外）。
- 伸縮するコンテンツ（helper / error / dropdown）を absolute にしない。flex 子 + visibility で切る。

### min / max を使う場面
- ボタンの最小幅、メッセージの折返し上限、スライダーの最小トラック長など、**中身が極端な値でも壊れない**ための保険。理由なく付けない。

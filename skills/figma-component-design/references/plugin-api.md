# Plugin API 仕様の落とし穴

**いつ読むか**: オーダー5（実装）の直前に必ず読む。combineAsVariants、addComponentProperty、bind の型整合など、静かに失敗する箇所。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## Plugin API 仕様の落とし穴（実装時の必読・低レベルAPI隔離）

### combineAsVariants
- 同一 parent 直下に並んだ **すべてComponent** であること。**Frame 混在不可**。
- 既に ComponentSet 内のものを再 `combineAsVariants` すると **入れ子エラー**。事前に parent 確認。
- variant 名は `property=Value` 形式で命名してから combine。

### addComponentProperty
- 戻り値の `propId` は **`name#hash` 形式**（例：`showHelper#12:0`）。
- 名前が重複すると Figma 側で suffix が付く → **追加直後に再取得して照合**。
- 削除する場合は `deleteComponentProperty(propId)`。bind 先は自動で detach。

### componentPropertyReferences（bind 種別の完全表・bind型整合の正本）
bind の key は対象により異なる。**`visible` 以外も必須で覚える**。

| bind key | 対象ノード | 必要な property type | 例 |
|---|---|---|---|
| `visible` | 任意ノード（表示有無） | BOOLEAN | `{ visible: 'showHelper#12:0' }` |
| `characters` | TextNode の文字列 | TEXT | `{ characters: 'value#12:1' }` |
| `mainComponent` | InstanceNode の差替先 | INSTANCE_SWAP | `{ mainComponent: 'icon#12:2' }` |
| Variant property名 | nested ComponentSet の variant 選択 | VARIANT（同名同値） | `{ 'state': 'innerState#12:3' }` |

#### 型整合（不一致は静かに失敗）
- Boolean property → `visible` のみ bind 可
- Text property → `characters` のみ bind 可
- Instance Swap property → `mainComponent` のみ bind 可
- **外側のBooleanを内側のVariant property(value=Disabled)にbindしたい等の型不一致は不可**。代わりに consumer 側で `setProperties({ '子#hash': 'state=Disabled' })` を呼ぶ、または nested を `exposedInstances` 化して外から制御
- bind 値は**propId 文字列**。`true/false` を直書きすると bind でなく固定値になり、後から property を変えても挙動が変わらない（静かな事故）
- 全 variant の該当ノードに同じ propId で bind が必要（1variantでも漏れると切替不能）

#### 失敗時の典型症状
- `visible` 直書き `true/false` → 固定値化、切替不能
- propId の hash 部分が古い（property再作成後の参照） → bind が消滅
- nested instance に bind したいが `exposedInstances` 未登録 → consumer から触れない

### nested instance の内部 property を main 側で固定する（外に出さない場合）
NumberStepper の左ボタン内の Icon を「常にMinus」のように内部固定したいとき:
- `exposedInstances` に**入れない**
- main 側で `instance.setProperties({ 'name': 'Minus' })` を一度実行して焼き付け
- **variant 切替で焼き付けが消える事故あり** → 全 variant の同名 nested instance に同じ `setProperties` を実行
- bind ではなく override で固定する点に注意（property 変更で挙動が変わらない＝静的）

### swapComponent / setProperties
- `swapComponent` は **同一 property 名の override のみ引き継ぐ**。property名変更で override 消失。
- `setProperties` は **1回でまとめて呼ぶ**（連続呼び出しはチラつき＋遅い）。

### Variant value の禁止文字
- `=`、`,`、`/` を含むとパースエラー（例：`On/Off` を `On,Off` にしただけで全壊）。

### 既存インスタンスへの property 後追加
- 既存インスタンスに伝播するが、**Boolean default=false** だと visible bind された子が非表示で出現する。default 選定で既存画面が壊れないことを確認。

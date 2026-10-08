# やってはいけない（最終の自己点検用）

**いつ読むか**: オーダー8の報告の前に、成果物をこの一覧と突き合わせるときに読む。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

- 直交軸を Variant 軸として掛けてバリアント爆発（`state × showHelper` 等）
- 「ある / ない」を別 variant で作る（Boolean Visibility 不使用）
- primary=FIXED で content より大きい値を入れてデッドスペースを残す（**TextField事件再発**・正本→[auto-layout](auto-layout.md) §オートレイアウト設計＞デッドスペース禁止）
- 伸縮するスロットを `layoutPositioning=ABSOLUTE` で配置する（AL計算から除外される）
- Variable / Style バインドなしで hex / px 直書き（F-QLT-5違反）
- バリアント命名のゆれ（`Default / default / state-default` 混在）／Variant valueに `=` `,` `/` を含める
- Boolean property を一部 variant にしか bind しない
- bind 値に `propId` 文字列でなく `true/false` を直書きする
- Text property を意味の違うノードに使い回す（label と helper を同 property に）
- nested instance を `exposedInstances` に登録せずに外から制御しようとする
- 既存使用箇所の確認なしに default / variant 名 / sizing を変更
- variant rename を3段移行せず一発で行う
- 全組合せテストをサンプリング（「典型だけ」）で済ます
- 組合せ数を計算せずに軸を増やす
- 旧API (`primaryAxisSizingMode`) と新API (`layoutSizingHorizontal`) を混在させる
- `resize()` 後に sizing mode を再設定し忘れる
- consumer ファイルの remote master を編集しようとする
- スキルの完了条件に「Publish 済み」を入れる（自動化不能）
- 報告で「だいたい通った」と書く（数値で書く）
- 成果物Pageを勝手に新設する／テスト並べフレームを成果物に混在させる（→[placement-publish](placement-publish.md) §成果物の配置先）
- ウィザードの段順序・フロー状態をコンポに焼き込む（画面ウィザード駆動なら design-create へ差し戻す。→[SKILL.md](../SKILL.md) §標準オーダー0 OOUIスコープ注記）

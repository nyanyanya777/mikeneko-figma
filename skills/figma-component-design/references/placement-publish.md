# 成果物の配置先・共有ライブラリ（Publish）・Component description

**いつ読むか**: オーダー0で配置先を決めるとき、オーダー8で Publish の扱いと description を書くときに読む。

[figma-component-design](../SKILL.md) の詳しい手順。オーダー番号は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## 成果物の配置先

新規コンポ本体・全組合せテスト並べを **どこに置くか** を着手前に確定する。

- **新規コンポは既存コンポ用Pageの命名規則・原子レベル区分（atom / molecule 等）に揃えて配置**する。独自の置き場所を勝手に作らない。
- **空振り＝不在の証拠でない・不在断定/重複作成禁止（F-PLC-3 → [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)§配置系）**。`page-list` は Cover しか返さないことがある罠、**全Pageを走査**してから判断。[feedback_verify_absence_before_creating](../../../docs/feedback_verify_absence_before_creating.md)
- **配置ページは判定根拠を持って決め、勝手に新規Pageを作らない・node-id指定はin-place（F-PLC-1/F-PLC-2 → [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)§配置系）**。「別ページに作って」と明示されたときだけ新規Page。[feedback_figma_page_vs_frame](../../../docs/feedback_figma_page_vs_frame.md) [feedback_figma_target_node](../../../docs/feedback_figma_target_node.md)
- **全property組合せの「テスト並べフレーム」は成果物Pageに混在させず、別Page/別領域へ隔離**する（DS/共有コンポ本体はDSページ）。検証用が成果物に紛れないようにする。

## 共有ライブラリ（Publish）特性

- **`remote: true` の master は read-only**：consumer ファイル内のキャッシュ master は編集不能。修正は **master file を直接開いて作業**する。
- **Publish は file 全体単位**：1コンポ修正でも全componentが Publish 対象。差分レビューを必ず確認。
- **Publish → Apply Updates は Figma UI 操作**：Plugin API から自動化不能。スキルの完了条件に「Publish済み」を入れない（ユーザー手動操作で完結）。
- **Component KEY (`component.key`) は publish 後に確定**：未publish は空。instance swap で key 指定するときは publish 順序を計画。

## Component description

実装の最後に必ず設定（Asset panel での発見性に直結）:

- **用途**: どんな画面のどんな役割で使うか（1行）
- **推奨 state**: Default / Filled / Error の使い分け
- **非推奨パターン**: detach 禁止、override での生値上書き禁止 等
- **既知の制約**: Boolean default の挙動、nested instance の制御方法 等
- **関連リンク**: 使い方ドキュメント URL

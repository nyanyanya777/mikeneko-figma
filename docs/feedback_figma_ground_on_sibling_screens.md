---
name: feedback_figma_ground_on_sibling_screens
description: 既存プロダクトの画面を作る/刷新するときは姉妹画面を視覚SOTに、DSファイル単独で起こすな・デザイン委譲をSonnetに格下げするな
metadata: 
  node_type: memory
  type: feedback
---

既存プロダクトの画面を新規/刷新するFigmaビルドはUX事故を2つ同時にやらかした。正本ルール＝mikeneko-figma §品質系 F-QLT-7＋§進め方系 F-PRC-7。

**事故（架空の例、備品貸出アプリ 備品詳細）:** DesignSystemファイルの部品/トークンだけを基準に備品詳細を単独で起こし、既存の姉妹画面（備品一覧・返却履歴）の視覚言語（色の使い方・カードの質感）と別物の画面を出力。ユーザーに「元画面から劣化・他画面と別物」と却下された。さらに実装をfigma-implementer（デザイン系＝本来Opus）に `model:"sonnet"` で委譲し格下げしていた。

**Why:** (1)DSファイルは"実装の語彙"であって"見た目の基準"ではない。既存プロダクトには既に確立した視覚言語があり、それが現物=SOT（`feedback_schema_refit_baseline_sot`の設計版）。DS単独で起こすと必ず浮く。(2)"ワイヤーを脱する"名目で既存に無いdeviceを発明したのが決定打。(3)視覚階層・既存言語適合・レイアウト判断はモデル地力が直接効くので、Sonnet格下げが品質を直撃した。

**How to apply:**
- **双子の同定（着手前ハードゲート）**: 「姉妹画面を渡す」だけでは"どの姉妹が正しい双子か"を外すと同じ事故になる（上の事故の構造上の決定打＝本当の双子は"返却履歴"＝サイドバー無しの集中ビューなのに、"一覧画面"＋サイドバー付きを基準にした）。→ 作る画面のOOUIビュー種別（一覧/単一詳細/編集）を要件だけから先に確定し、**同一ビュー種別**の既存画面だけを双子候補にする。**一覧画面は詳細画面の双子に成り得ない（by construction）**、DSファイルのfileKeyはTWIN不適格。同種別ゼロならfail-closedで基準画面を1問。これは新ルール文でなく**配管**として実装済み: figma-design-create §1でTWIN宣言 `TWIN:<fileKey>/<node-id> view=<種別>` を工程1の必須出力にし、**空なら実装委譲に進めない**。完了前の並置目視(§8k)は宣言TWINと同一node-idで行い、有利な比較相手の後付け選択を封じる（＝自己PASS封じ）。正本はmikeneko-figma F-QLT-7。
- 着手前に姉妹画面（実アプリ or 既存Figma画面）を自分の目で見て言語抽出（色の使い所＝アクセントか塗り面か・カード様式・バッジ形状・余白・アプリ枠の有無）。委譲ブリーフに姉妹画面のnode-id/画像パスを渡し「これに揃える・DS単独で起こすな」を明記。
- 完了前に成果を姉妹画面の隣に並べ「同じプロダクトに見えるか」を目視ゲート。並べて別物＝不合格。アクセント色の塗り面転用・既存に無いdevice発明も不合格。
- Figmaのデザイン/実装委譲はデザイン系＝Opus。`model:"sonnet"`を渡さない（「実装委譲=Sonnet」の一般則はデザイン系に適用しない）。
- 関連: [feedback_no_avatar_icons](../docs/feedback_no_avatar_icons.md) [feedback_qa_real_user_outcome](../docs/feedback_qa_real_user_outcome.md) [feedback_verify_quality_by_measuring](../docs/feedback_verify_quality_by_measuring.md)

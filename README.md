# mikeneko-figma

A family of [Claude Code](https://claude.com/claude-code) **skills** for doing real, design-system-faithful Figma work — editing existing files, designing new components, and building whole screens — without the usual failure modes (hand-drawn fakes, raw values, scope creep, cross-project bleed).

公式の Figma プラグインスキル（`figma-use` など、プラグインAPI層）の **上に乗る作業標準** です。何を・どの順で・どんなゲートで進めるかを規律化します。

## 構成

入口の `mikeneko-figma` が「今回やることは何か」を1問で判定し、下の4つから **1つだけ** をロードします。

| スキル | 使うとき |
|---|---|
| **`mikeneko-figma`** | 入口/ディスパッチャ。Figma作業の最初に必ず通る。共通の禁止事項もここに集約 |
| **`figma-ds-edit`** | 既存ファイルの編集・レビュー（restyle / 変数・スタイル適用 / 生frame→component置換） |
| **`figma-component-design`** | 部品を新規に起こす／既存部品の property軸・sizing を大改修 |
| **`figma-design-create`** | 画面・フローを丸ごと新規作成（要件→DSの上に起こす＋プロトタイプ配線） |
| **`figma-e2e-test`** | Figma画面/フローの体験E2Eテスト（実ユーザーがゴールに辿り着けるかを盲目セルフプレイで検証。設計は直さずハンドオフ） |

## 設計思想

- **発見ファースト** — トークン名・ID・値はファイルごとに違う。決め打ちせず実体を棚卸ししてから動く。
- **出典ベースのゲート（default-deny）** — 「勝手に足すな」という意図ベースの禁止は、生成時に違反が本人から見えず効かない。全要素・全コピーに出典（要件／このサービスの参照画面／DS既定）を必須化し、最終に逆差分監査で宣言外の要素を弾く。他案件・記憶からの混入（アンチブリード）を明示的に禁止。
- **構造で検証、ピクセルで合格にしない** — 偽frameや外付けTEXTは本物とスクショ一致する。レイヤー種別・プロパティ・slot利用で instance 実体を確認する。
- **OOUI適合ゲート** — 画面＝オブジェクトのビュー（collection一覧 / single詳細）として起こし、動詞はモードレスなaction（chip / overlay / inline）にする。ビューを宣言→機械的な逆監査で、線形ウィザード退行や動詞フレーム化を構造から検出する（`proc:` 理由コードによる逃がし弁あり）。
- **ページ編成（オブジェクト単位）** — 既定は1オブジェクト=1Page。1画面1ページの散在を防ぎ、最終ゲートで object→Page集合を実測して逆監査する。
- **Spacer禁止/auto-layout厳守も宣言→機械的逆監査ゲート化（design-create §8(h)）** — 余白・間隔は隙間ノードでなく auto-layout の gap/padding で持つ。守れているかは見た目でなく構造（layoutMode/itemSpacing/padding 等）で判定し、`abs:` 理由コードによる逃がし弁を備える。
- **共通スケルトンで等型化** — 5スキルを共通骨格 S0–S9（適用範囲／鉄則／標準オーダー／チーム編成／ゲート一覧／詳細／やってはいけない／関連参照）に揃え、入口 `mikeneko-figma` を共通禁止事項の唯一の正典（SOT）に集約する。
- **マネジメント委譲** — 調査/実装/レビューはサブエージェントに振り、人間（マネージャー）は要件確定・ゲート判定・完了可否を握る。

## インストール

各スキルのディレクトリを Claude Code のスキルフォルダにコピーします。

```bash
# 例: ユーザーグローバルに入れる
cp -r mikeneko-figma figma-ds-edit figma-component-design figma-design-create figma-e2e-test ~/.claude/skills/
```

その後 Claude Code で `/mikeneko-figma` を入口に呼び出します。

## ライセンス

MIT

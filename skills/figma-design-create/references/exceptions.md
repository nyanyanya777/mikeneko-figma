# 例外の理由コード（proc: / abs: / raw:）

**いつ読むか**: collection/single に収まらないフレーム、auto-layout で組めない要素、スタイルを持つ生ノードを例外として置くときに読む。コードはここに書いてあるものだけ。

[figma-design-create](../SKILL.md) の詳しい手順。工程番号（§0〜§9）は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## 手続き的フロー逃がし弁（proc:理由コード・default-deny・根拠宣言必須・閉じた列挙）
collection/single で書けない frame は閉じた理由コードを1つ付ける（§3エスカレ⑥／§4承認対象）:

- `proc:auth` — 認証/資格情報handshake(閲覧可能なドメインobjectが無い)
- `proc:txn-commit` — 取引の原子性＋ドメイン必須の順序(決済・不可逆submit。順序がUI都合でなくドメイン制約)
- `proc:dependent-branch` — 後続フィールド集合が前の回答で本質的に分岐(フラット提示だと無効な組合せを問う)。単なる値選択(即時/予約・ロール・種別)は分岐でなくプロパティ→不可
- `proc:legal-consent` — 外部規定の強制熟慮(同意/KYC/破壊的確認)
- `proc:onboarding` — 初回限定の教育的逐次(スキップ可・定常手段でない。同じ事をモードレスに行えるobjectビュー経路が別に存在することが条件)
- `proc:utility` — 非object面(404/error/splash/印刷ダイアログ)
- `cross-object:` — 複数objectを束ねるホーム/ダッシュボード/サマリ(各objectのcollection/singleへ確実に降りられること)

旧表記 `non-object:` は廃止＝非object面(404/error/splash等)は `proc:utility` を使う（閉じた列挙の外に並列タグを増やさない）。列挙外は `proc:other` のみ可、自動承認されず必ずユーザーへエスカレ(enum拡張は人間統制下)。各 `proc:` に1行の反証可能な正当化必須（「なぜobjectのcollection/single＋モードレスchipにできないか」を具体的ドメイン制約=順序強制/原子性/法定熟慮/真の分岐 で）。**無効理由(=書いたら差し戻し)**: 「綺麗」「ユーザーが期待」「作成フローだから」。例外スコープはcommit/handshakeの最小逐次スパンのみ。それが包むobject(Cart/Order/Account)の閲覧・編集ビューまで例外にしない。§8(f)で `proc:` 全件のリフレーム反証（レビュアーが能動的にOOUI化を試み、候補object名指し＋失敗するドメイン制約を文書化。書けなければproc:却下→OOUI化）を回す。

## auto-layout厳守の逃がし弁（abs:理由コード・default-deny・根拠宣言必須・閉じた列挙）
auto-layout/gap/paddingで組めない（=非auto-layout・絶対配置・隙間専用空ノードが正当な）要素は閉じた理由コードを1つ付ける（§0表Bの出典列 or §3マッピング表に明示／§4承認対象／§8(h)で全件反証）。出典タグ・proc:理由コードと完全同型:

- `abs:overlay-decor` — overlayバッジ/フォーカスリング/通知ドット等、**親のauto-layout計算に影響を与えてはいけない装飾**(layoutPositioning=ABSOLUTE。figma-component-design の [auto-layout](../../../skills/figma-component-design/references/auto-layout.md)『絶対配置を使ってよい唯一のケース』と整合)。
- `abs:fixed-overlay` — モーダル/トースト/FAB/ドロワー等、画面フローから外して固定オーバーレイする最上位レイヤ。
- `abs:divider` — 意図的な区切り線(ただしfill/strokeのpaintを持つ実体=Spacerでない。隙間でなく『線』であることが条件。場当たり線で取り繕うのは別途禁止)。
- `abs:empty-state-slot` — 空状態/プレースホルダの予約枠(instance実体or名前付きslotで、将来コンテンツが入る宣言付き。無記名の純空ノードは不可)。
- `abs:test-canvas` — DSページ/別Pageに隔離した全property組合せ等の検証用テスト並べ(成果物Pageには置かない。隔離規律と整合)。

列挙外は `abs:other` のみ可、自動承認されず必ずユーザーへエスカレ(enum拡張は人間統制下)。逃がし弁は『なぜgap/padding/Boolean Visibilityで表現できないか』を装飾性・最上位レイヤ性・線の意味・空状態の予約という具体根拠で書けたときのみ通る。**無効理由(=書いたら差し戻し)**: 「綺麗」「位置合わせが楽」「なんとなく」「AL組むのが面倒」「普通こうする」「見た目が同じだから」。§8(h)で全 `abs:` のリフレーム反証（レビュアーが能動的にgap/padding化を試み、失敗する構造制約を文書化。書けなければabs:却下→auto-layout化）を回す。

## `raw:`例外コード（閉じた列挙・これ以外は不可）
スタイル付き非INSTANCEノード（F-CMP-5 → [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)§部品系が正典）を例外として置くときの理由コード（§3マッピング表component列に明示／§4承認対象／§8で反証）。宣言した例外ノードはノード名を`raw:<コード>`にする（audit-structure.jsは名前prefixで機械照合。台帳件数とのN=N突合が§8の合格条件）。abs:例外も同様にノード名`abs:<コード>`。出典タグ・proc:/abs:理由コードと完全同型:

- `raw:one-off-decor` — この画面限定の装飾で再利用ゼロが根拠として書けるもののみ
- `raw:shell-region` — 画面リージョンの殻（サイドバー殻・ヘッダーバー等のレイアウト枠）。**fillは変数バインド必須**（raw値なら不合格=F-QLT-5）
- `raw:pending-comp` — コンポ化票承認待ちの暫定。票IDの併記必須、承認後に埋め戻す
- `raw:other` — 自動承認なし。必ずエスカレーション票で人間の判断を仰ぐ

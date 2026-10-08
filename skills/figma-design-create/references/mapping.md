# 設計マッピング表・配線リスト・状態バリエ

**いつ読むか**: 工程3で設計マッピング表と遷移配線リストを書くとき、工程8の件数突合の前に読む。

[figma-design-create](../SKILL.md) の詳しい手順。工程番号（§0〜§9）は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## 設計マッピング表のフォーマット（③で必須）

要素マッピング表（frame行に object / view / modeless-action / MAIN 列を追記。MAINは既存の操作ラベルから1つ選ぶ、無ければ`なし`。F-QLT-6(a)の判定材料）:
```
| frame | object | view | MAIN | section | element | cardinality | scope | component(id/variant) | text | modeless-action | 出典 | binding(color/typo) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 備品詳細 | 備品 | single | 編集chip | ヘッダ | 戻る | single | 新規 | IconButton/back | — | — | ds:123:456 | color/icon-default |
| 備品詳細 | 備品 | single | 編集chip | 主情報 | 備品名 | single | 新規 | text | サンプル備品名 | 編集chip | placeholder | typo/heading-m |
| 予約一覧 | 予約 | collection | 行選択/詳細へ | 本体 | 予約行 | template(N=8) | 新規 | TableRow | (テンプレ1行) | 行選択/詳細へ | placeholder | (内蔵) |
| 設定 | 設定 | single | なし | メニュー | 通知設定行 | single | 改修 | MenuRow | 通知設定 | — | req | (内蔵) |
```
（例示のMAIN値は書式サンプルであり実案件の値ではない）

- `object` / `view(collection|single|proc:<code>)` / `modeless-action`: frame=オブジェクトのビューであることを表現（鉄則13・OOUIビューインベントリ表Bと整合）。`collection/single` に収まらない frame は `proc:<code>` / `cross-object:` を入れエスカレ⑥（[exceptions](exceptions.md)「手続き的フロー逃がし弁」。非object面は `proc:utility`）。
- `cardinality`: `single` / `template(N=8)` / `dynamic` のいずれか。
- `scope`: `新規` / `改修` のいずれか。改修行は混在運用時に[figma-ds-edit](../../../skills/figma-ds-edit/SKILL.md)へ委譲する対象（reaction張りも改修扱い）。
- 実装マッピング表で要素の存在の出典として許容されるのは `user:` / `req:` / `existing:` の **3種**だけ（後の改定で確定）。`ds:` / `placeholder:` / `primitive-def:` は見た目・値の列に書く。存在の出典が3種で埋まらない行はエスカレ対象。`inherent:` / `guess:` / `similar:` / brief / REF は実装マッピング表に書かない（`item-provenance-pretool.sh` が止める）。
- **component列の値域は4値のみ**: `ds:<componentId>/variant`／`new-comp:<コンポ化票ID>`（[figma-component-design](../../../skills/figma-component-design/SKILL.md)へ委託し、票の承認・部品完成後にIDを埋め戻してから当該要素の実装に入る）／`raw:<コード>`（閉じた列挙のみ・根拠1行必須、[exceptions](exceptions.md)「`raw:`例外コード」）／`text`（テキストスタイル適用済みの生TEXT。F-CMP-5対象外・F-QLT系ゲートで検証）。**空欄・自由記述の行は設計ゲートを通さない**（出典タグと同じdefault-deny）。

### N突合の定義（cardinality対応）
- **マッピング表のN（設計N）**: `single` は1、`template(N=K)` は1（テンプレ1行）、`dynamic` は1（型のみ記載）。**設計承認はテンプレ1行で完了**。
- **実装後の要素件数（実装N）**: `single` は1、`template(N=K)` は K、`dynamic` は実体ベース。
- **レビュー件数（レビューN）**: `single` は1全件、`template(N=K)` は**テンプレ構造正しさ＋K個全体の placeholder 多様性チェック**（テンプレ通りでない異常がないかを全件目視。同じテンプレ文字列でOK）、`dynamic` は K 個サンプリングではなく実体ベース全件。
- **件数突合**: 設計N≦実装N＝レビューN。「設計1：実装K」は許容、「実装K：レビューM(<K)」は禁止。

遷移配線リスト:
```
| from(frame:element) | trigger | action | to(frame) | note |
|---|---|---|---|---|
| 設定:通知設定行 | On click | Navigate | 通知設定 | |
| 通知設定:戻る | On click | Navigate | 設定 | back |
| 一覧:予約行 | On click | Navigate(preserve:filter,sort) | 予約詳細 | 状態保持 |
| 予約詳細:戻る | On click | Navigate(preserve:filter,sort) | 一覧 | back, 状態保持 |
```

## 状態バリエの分類別ホワイトリスト
§0「作成フレームリスト」で「状態複数あり」を選んだとき、§3で全状態を列挙する際の**最低網羅参照**。**種別/繰り返し/区分はframe追加でなく、同一(object,view)行の状態/プロパティとして扱う**（種別選択や即時/予約の分岐をframe化しない＝鉄則13）。

### フォーム画面
通常／空／検証エラー／送信中／完了／不可

### データ表示画面（一覧・テーブル・ダッシュボード）
通常／**完全な空（データ0件）**／**フィルタ結果0件**／**検索結果0件**／**初回ロード**／**部分ロード**／**取得エラー（再試行可）**／**権限不足**／**選択中**

### 詳細画面
通常／読込／取得エラー／削除済／**競合（他者編集中）**／**ロール別表示差**

§0段ではこれら全部を列挙せず**「状態複数あり」の有無**だけを宣言。複数ありなら§3で全状態フレームを列挙し、§4で一括承認。§0で全状態を埋めようとして質問数を膨らませない。状態フレームはコンポーネントのプロパティ差し替えで構成し、フレームコピーで作らない（2コピー則: 状態フレーム間の複製もコピー1回と数える。正本=figma-component-design の [unit](../../../skills/figma-component-design/references/unit.md)「コンポーネント化の単位基準」）。

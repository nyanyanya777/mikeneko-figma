# 逆監査（OOUI・ページ編成・auto-layout）

**いつ読むか**: 工程5のあと（OOUI逆監査の1回目）と、工程8(f)(g)(h)で読む。

[figma-design-create](../SKILL.md) の詳しい手順。工程番号（§0〜§9）は SKILL.md の標準オーダーの番号。ルールID（F-*）の正典は [mikeneko-figma-rules](../../../skills/mikeneko-figma-rules/SKILL.md)。

## OOUI逆監査（§8(f) 詳細・実装→宣言）
**発火規定（正本・ここが唯一の記述、他§は本節への参照のみ）**: 計2回実行する。**1回目=§5実装後・§6配線前**（reactionが未配線なので構造項目のみ判定。collection⇄single の往復到達と線形ウィザードエッジの不在など配線依存の判定は保留）、**2回目=§8(f)**（(e)逆差分監査の直後・配線済み状態で reactionグラフ部を含む全項目の完全判定）。判定者は実装者と別個体（＝§7敵対レビュー）。

1. `get_metadata` で実装済み全top-level frameを列挙。
2. 各frameを機械判定:
   - (i) 表Bに対応行があるか。無い=未宣言フレーム→ブリード/退行として削除orエスカレ。
   - (ii) view種別を構造で裏取り(tag自己申告で合格にしない): collection=同型反復(リスト/テーブル/カードグリッド)が画面の主役 / single=単一オブジェクト1件の属性・状態提示。
   - (iii) modeless退行シグナル検査(1つでも該当=§4へ巻き戻し): frame名/ヘッダが動詞+ステップ名(「○○を作成」「ステップ1/3」「方法を選ぶ」)、step indicator/進捗ステッパー(生rect+TEXTの偽装ステッパーも疑い構造で見る)、frame下部の「次へ＋戻る」ボタン対、全画面ラジオ分岐(種別/即時/予約)、next/back以外の操作が無く背後にビューが無い閉じ込め。
3. reaction一覧を有向グラフ化: (a)入次数1/出次数1の一本道チェーン (b)「次へ/戻る」trigger比率 (c)collectionへ戻るエッジの無い「完了」終端 (d)decision frameのfan-out を抽出。健全形(collection⇄single双方向＋overlay→元ビュー復帰)から外れたエッジを列挙。**命名がオブジェクト名詞でもグラフが線形ウィザードなら不適合(命名は偽装可能、構造が正本)。**
4. 各objectでcollectionとsingle双方が存在し相互到達可能か(往復reactionが各1行立つか)を突合。片方欠落/片方向のみ(選択対象が次ビューに継承されない含む)は欠陥。
5. reaction未取得（1回目・§6配線前）なら「判定不能」(=適合ではない、空振り≠不在)。命名＋frame系列＋画面内mode固定UIの静的シグナルで暫定判定する（2回目の再監査は冒頭の発火規定どおり）。
6. **関係の双方向突合（表E）**: (a) 各frame内の他objectへの参照要素（関連一覧・参照リンク・パンくず・他objectのsingleへ向かうreaction）を全列挙し、表Eの行へ写像。写像先の無い参照=未宣言の関係→削除orエスカレ (b) 表Eの各行（`scope-out`を除く）が要素またはreactionエッジとして少なくとも1つ実在するか。無い=関係の欠落。reactionが要る判定は2回目のみ。
7. **操作権限の突合（表F）**: (a) 可否が「見るだけ/できない」の各行（`scope-out`を除く）について、そのロールの状態バリエframe（ロール別表示差・権限不足）上で当該操作の要素が非表示・無効化・権限不足状態のいずれかになっているか (b) ロール別表示差・権限不足の各frameが表Fの行へ写像されるか。「見るだけ/できない」行があるのにそのロールのframeが無い=状態欠落。
- **出力**: 「frame N件中 写像済みN / 未写像N」「線形チェーンエッジN件」「表E N行中 実在N / 欠落N・未宣言の参照N」「表F 制限行N件中 画面反映N / 未反映N」のカバレッジ形式・間引き禁止。違反0行でgreen。
- **proc:全件のリフレーム反証**: レビュアーが能動的にOOUI化を試み、候補object名指し＋失敗するドメイン制約を文書化。書けなければ proc:却下→OOUI化（[exceptions](exceptions.md)「手続き的フロー逃がし弁」）。

## ページ編成逆監査（§8(g) 詳細・実ファイル→宣言の双方向突合・間引き禁止）
0. 全Pageを実数取得で走査(`get_metadata`(nodeId無し)は1ページしか返らない罠を回避、空振りを不在と解さない)。各frameを実際の(object, view, state)に分類。
1. **散在検査**: 実ファイルから object→Page帰属集合を再構築し、|Page集合|>1 のオブジェクトを抽出。表Dで分割申告済み以外は違反→統合。
2. **孤立検査**: frame数=1のPageを全列挙。宣言で例外申告(横断Overview等)済み以外は違反。
3. **帰属/default-deny検査**: 実在するが宣言に無いPage/frame=スコープ膨張で弾く、宣言にあって不在=欠落で弾く(双方向)。
4. **横断検査**: 表Dの外向き配線の各to-frameが実在Pageに到達するか。別オブジェクトPageへの到達は正常(=横断)、同一オブジェクトのビュー割れは違反(=散在)。死配線/未配線を検出。
- **出力**: 違反frame/Page名のリスト。空であれば合格。差分が出たら配置を直すかマニフェストを更新して再監査。「散在していないはず」は不可、object→Page集合の実測でのみ合格。

## auto-layout厳守逆監査（§8(h) 詳細・実装→宣言・判定者は実装者と別個体＝§7敵対レビュー）
(g)ページ編成逆監査の直後に実行。§0表Bの『auto-layout既定＋abs:例外宣言』に対し、実装を構造で逆突合する（見た目でなく get_metadata の layoutMode/itemSpacing/padding/fills/strokes/children/layoutPositioning で判定）。

**検証はスクリプト＋手動走査の併走**: `~/.claude/skills/mikeneko-figma/scripts/audit-structure.js` を `use_figma` で実行する（F-STR-1/2・F-QLT-2/3・F-CMP-2 を機械検出）。ただし**スクリプトは ABSOLUTE 検査（下記手順4の検出シグナル5・6）と§0宣言との突合（下記手順5）を検査できない**（layoutPositioning を見ない・台帳突合は外側工程の責務）ため、スクリプトが green でも**手順4のシグナル5・6と手順5は常に手動で実行する**。スクリプト実行不可のときは手順1〜5の全部を手動 get_metadata 走査で回す。

1. `get_metadata` で実装済み全frameと全コンテナ(子2つ以上を持つノード)を実数列挙（`get_metadata`(nodeId無し)は1ページしか返さない罠を回避、全Page走査）。
2. 各コンテナを機械判定（**検出シグナル2: 非auto-layoutコンテナ＝手動配置**）: 子を2つ以上持つコンテナで `layoutMode==NONE`(またはlayoutModeプロパティ不在)、子がx/y絶対座標で並び間隔がitemSpacing/paddingでなく座標差で作られているものを列挙→§0でabs:宣言が無ければ違反。単一子のルート/キャンバス直下frameは除外。
3. 全ノードからSpacer候補を抽出（**検出シグナル1: 隙間専用空ノード＝Spacer本体**）: **(a)fills空 かつ (b)strokes空 かつ (c)子ノード0 かつ (d)非TextNode かつ (e)width or heightの一方だけ実寸(他方は0/極小 or 親方向にFILL)** を全件列挙。塗りも線も文字も中身も無く間隔だけ作る純粋な隙間ノード。誤検出ガード(後述)で除外し、残った無記名隙間ノードは違反。
4. auto-layoutコンテナの不一致・濫用を抽出し§0のabs:宣言と1:1突合（宣言外は違反）:
   - **検出シグナル3**: itemSpacing≒0 かつ padding≒0 なのに子の間に視覚的ギャップ＝ギャップが子側のダミー空ノードや固定sizeの透明子で作られている（itemSpacing/paddingと実測ギャップの不一致で検出）。
   - **検出シグナル4: 先頭/末尾ダミーによる擬似padding**: paddingLeft/Right/Top/Bottomが0で、代わりに端に塗り無し・文字無しの空ノードを置いて内側余白を作っている。
   - **検出シグナル5: layoutPositioning==ABSOLUTEの濫用**: 装飾(overlayバッジ/フォーカスリング)でない実コンテンツ・フロー参加要素がABSOLUTEで配置され、本来gap/paddingで並べるべき要素を絶対座標で逃げている。装飾(abs:宣言済み)以外のABSOLUTEを違反とする。
   - **検出シグナル6: 手動x/yによる間隔調整**: auto-layout子であるべき要素のx/yが、AL詰め後の期待座標(itemSpacing積算位置)からずれている＝overrideで手動ずらしして間隔を足している（absoluteBoundingBoxの実座標とAL理論座標の差分で検出）。
5. **§0宣言との突合**: abs:宣言した例外が(i)実在し(ii)逃がし弁の閉じたコードに該当し(iii)理由1行が反証可能か(「綺麗」「位置合わせが楽」「なんとなく」「AL組むのが面倒」は無効→差し戻し)を確認。**N突合は『ABSOLUTE/非AL配置として実装される宣言』に限り厳密に行う**（該当abs:宣言件数＝実装のABSOLUTE/非ALコンテナ件数。`abs:divider` 等paint持ちの通常auto-layout子として実装される宣言や `abs:test-canvas` 等の隔離Page宣言は件数突合の対象外とし、宣言どおりの実体〔paint有・隙間でなく線／隔離Pageに実在〕を個別確認する）。各abs:のリフレーム反証（レビュアーが能動的にgap/padding化を試み、失敗する構造制約を文書化。書けなければabs:却下→auto-layout化）を回す。
- **誤検出ガード（=違反にしないもの・機械的除外）**: ①空状態/プレースホルダ枠（空でもinstance実体・名前付きslot・将来コンテンツが入る宣言済み枠は正当。無記名の純空ノードのみSpacer判定） ②意図的divider（fill or strokeのpaintを持つRECTANGLE/LINEは区切り線であってSpacerでない＝塗り/線の有無が分岐点。ただし§構造系『場当たり線で取り繕わない』は別途適用） ③装飾overlay（abs:overlay-decor等で宣言済みのlayoutPositioning==ABSOLUTE） ④min/maxサイズ（コンテンツノードのminWidth/minHeightは隙間ノードでない）。これら4種は『塗り/文字/子/instance実体/宣言のいずれかを持つ』で機械的に除外し、純粋な無記名・無paint・無子の幅or高さだけノードのみをSpacer違反とする。
- **出力**: 『コンテナN件中 auto-layoutN/非ALN』『Spacer候補N件中 違反N/ガード除外N(各除外理由)』『ABSOLUTE/非AL対象のabs:宣言N=実装例外N・個別確認系(divider/test-canvas等)N件全確認』のカバレッジ形式（N突合の対象限定は手順5と同じ）。代表サンプル禁止・間引き禁止・全件列挙。**違反0行で初めてgreen**。違反が1件でも出たら修正(gap/paddingへ移行・Spacerノード削除・layoutMode付与)、ドメイン上どうしても非ALが要るならabs:でエスカレーション。§6配線とは独立に実行可。

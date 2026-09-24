---
name: reference_figma_ooui_page_gates
description: mikeneko-figmaにOOUI適合ゲートとページ編成ゲートを「宣言→機械的逆監査」で実装。実案件の教訓の制度化
metadata: 
  node_type: memory
  type: reference
---

mikeneko-figmaファミリーに **OOUI適合ゲート** と **ページ編成ゲート** を、既存の出典ゲートと同型（着手前に宣言→最終に機械的逆監査。意図ベース「OOUIで作れ」は違反が透明で効かない）で実装した（チーム討議＋実装、[feedback_wireframes_ooui_bound](../docs/feedback_wireframes_ooui_bound.md) の制度化）。本ゲートは figma-design-create に置き、入口 mikeneko-figma は原則一行（SOT）、ds-edit/component/e2e は軽い観点のみ。

**OOUIゲート（design-create）:**
- §0で先にビューを確定: 表A=オブジェクト棚卸し（動詞・種別・手続きはここに畳む＝独立objectにしない）／表B=ビュー割当（1frame=1行、view列は collection|single の二択）。作成フレームリストは表Bから導出。
- §8(f)逆監査（実装者と別個体）: 全top-level frameを get_metadata で列挙→各frameが表Bに写像されるか／view種別を**構造で裏取り**（collection=同型反復が主役／single=単一1件提示。tag自己申告で合格にしない）／reaction一覧を有向グラフ化して**線形ウィザードチェーン・次へ/戻る主動線・decision fan-out**を検出。**命名がオブジェクト名でも構造が線形なら不適合**。collection⇄single双方の存在と相互到達(往復reaction)も突合。配線前は「判定不能」(=適合でない)。
- 逃がし弁=閉じたproc:理由コード宣言制（auth / txn-commit / dependent-branch / legal-consent / onboarding / utility / cross-object / 列挙外は proc:other→必ずエスカレ）。各proc:に反証可能な正当化1行必須。**無効理由=「綺麗」「ユーザーが期待」「作成フローだから」**。単なる値選択(即時/予約・ロール・種別)は分岐でなくプロパティ→proc不可。

**ページ編成ゲート（design-create）:** 既定=**オブジェクト単位（1obj=1Page、実務上の機能とほぼ一致）。ストーリー単位でPageを切らない**（同一オブジェクトのビューが複数フローPageに散る＝「1画面1ページ」事故とフロー退行の物理固定化。フローはプロトタイプ配線で表現、俯瞰は『フロー俯瞰』1枚に限定）。§0でページIA宣言（表C=frame帰属／表D=Page構成）→§8で object→Page集合の実測逆監査（散在/孤立Page/帰属default-deny/横断 の4検査。全Page実数走査で空振りを不在と解さない）。命名規約=`10 備品`等の番号prefix+オブジェクト名、frame名=`{obj}/{view}/{state}`、SectionはView種別。散在=同一オブジェクトのビュー割れ(違反)／横断=別オブジェクトPageへ繋がる(正常) を機械区別。

**auto-layout厳守ゲート（同family・後の改定で追加）:** Spacer禁止を入口の原則文から機械ゲートに昇格。design-create §0表Bで「auto-layout既定（layoutMode=H/V、余白はgap/padding）」を宣言→§8**(h) auto-layout厳守逆監査**で構造走査（無記名Spacerノード=fills/strokes/children無し幅or高さだけ・layoutMode==NONE手動配置・装飾でないABSOLUTE濫用を検出、§0の`abs:`例外宣言と1:1突合、誤検出ガード=divider/空状態slot/overlay/min-maxは除外）。逃がし弁=閉じた`abs:`コード(overlay-decor/fixed-overlay/divider/empty-state-slot/test-canvas＋abs:other→エスカレ)、無効理由「綺麗/位置合わせが楽/AL面倒」。入口=Spacer禁止のSOT、コンポ内部の機械則本体はcomponent-design「デッドスペース禁止(TextField事件)」が正本、ds-editは鉄則10＋全件レビューのAL整合観点。

確定事項: 出典タグは実流通**7種**（req/ds/existing/inherent/placeholder/guess/primitive-def。実装マッピング表はguess除く6種）、view語彙は **collection|single + cross-object:**。詳細は`reference_mikeneko_figma_skill_skeleton`。


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [OOUI適合＋ページ編成ゲート] — design-createにOOUIゲート(frame=オブジェクトのビューcollection/single・動詞はモードレスaction・§0表A/B宣言→§8(f)reactionグラフ逆監査で線形ウィザード退行を構造検出・proc:逃がし弁)とページ編成ゲート(既定=1obj1Page・ストーリー単位Page禁止・1画面1ページ散在禁止・§8でobject→Page実測逆監査)。実案件の教訓の制度化

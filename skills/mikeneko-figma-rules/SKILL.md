---
name: mikeneko-figma-rules
description: 自作Figmaスキル全部に効く共通ルール（F-*）の唯一の正典(SOT)＋規模3段と体制＋最終ゲート対応表＋スキル成長規約。規範本文はここだけが持ち、各作業スキルは一行宣言＋ルールIDで参照する。Figmaへ書き込む前に必ずロードする。
---

# 自作Figmaスキル共通規範(SOT)

**TL;DR**: [mikeneko-figma](../../skills/mikeneko-figma/SKILL.md)(入口)から振り分けられた各作業スキルに共通するルールの唯一の正典。**F-\*** はルールID（番号は固定）。経緯は本文に書かず [rule_history](../../docs/rule_history.md) と各リンク先に置く。

## 規模と体制（F-TEAM-0）

着手前に規模を1行で宣言する: `SIZE: 小|中|大（理由1行）`。迷ったら上の段。途中で規模が変わったら宣言し直す。

| 段 | 当てはまる作業 | 手を動かすのは | 参照探し | 完了までに要るもの |
|---|---|---|---|---|
| **小** | 既存画面の直し（文言・余白・色や太さの調整・バインド是正・部品の差し替え）。新しい画面フレームを作らない | メイン | しない | 対象の確定（F-PRC-6・F-INT-1）＋機械監査（F-CMP-7・F-QLT-5）＋before/after を自分で見る（F-INT-2）＋判定役1回（F-QLT-9。verdict 2行と `regression:` 行。色・太さ・線・余白を直したときは F-QLT-10 の計測結果も渡す）。独立レビューは要らない |
| **中** | 新規画面1〜5枚、既存画面の刷新、新規部品 | メイン | 着手前に1回（F-PRC-11） | 小の全部＋案件の把握と最初の1画面（F-PRC-13・14）＋宣言と承認1往復（F-PRC-1）＋独立レビュー1体＋判定役（`regression:` の代わりに F-QLT-6/7 の採点。呼ぶのは1回） |
| **大** | 6画面以上、または要素100以上／利用者がデータを並べ替え・絞り込み・編集する画面群／DSの構築を含む | Workflow でチームを組む | 着手前（F-PRC-11）＋完了時（F-QLT-8） | 中の全部＋領域別の承認＋独立レビューの件数突合（F-PRC-8） |

- **メインが直接書き込んでよいのは、メインが画像を見られる最上位モデル（現行は Fable）で動いているときだけ。** それ以外のモデルがメインのときは、小・中でも実装を `figma-implementer` に委譲する（ノード3個以下の微修正を除く）。[feedback_agent_team_delegate_all](../../docs/feedback_agent_team_delegate_all.md)
- **どの段でも委譲しないもの**: 着手前の現物確認と完了前の突合（F-INT-2）、ゲートの合否判定、依頼者への確認。
- **どの段でも要る「別の目」**: 判定役は、作業した文脈を持たない別エージェントに頼む（F-QLT-9）。自分の見直しは別の目に数えない。

## 共通ルール

### 構造系
- **F-STR-1** Spacer（余白を作るだけの空フレーム・矩形）を置かない。余白と間隔は auto-layout の gap(itemSpacing) と padding で作る。
- **F-STR-2** コンテナはすべて auto-layout で組む。合否は見た目でなく構造（get_metadata の layoutMode/itemSpacing/padding/fills/strokes/children/layoutPositioning）で決める。第一手段は `~/.claude/skills/mikeneko-figma/scripts/audit-structure.js`（use_figma で実行。F-STR-1/2・F-QLT-2/3・F-CMP-2/5/6 を機械検出。初めて使うファイルでは小さいフレームで試走する）。スクリプトが見ない検査（ABSOLUTE の濫用、手動 x/y のずれ、`abs:` 件数の突合＝design-create [reverse-audits](../../skills/figma-design-create/references/reverse-audits.md)、mainComponent の照合＝ds-edit 工程6）は手動の get_metadata 走査を必ず併走し、スクリプト green だけで合格にしない。スクリプトが使えないときは全部を手動で行う。部品内部の sizing とデッドスペースの基準は [figma-component-design](../../skills/figma-component-design/SKILL.md)。
- **F-STR-3** 根拠のない線や区切りで体裁を整えない。各要素の意味に沿った構図で組む。

### 部品系
- **F-CMP-1** アイコンボタンは入れるアイコン（名前/ノード）まで決めて実体をセットする。仮のアイコン枠のまま置かない。
- **F-CMP-2** 部品は instance で置く。生フレームや外付けテキストで部品に見せかけない。合否は instance 実体監査（→対応表）で決め、スクショ一致で合格にしない。
- **F-CMP-3** 見た目を変えるためにメインコンポーネントを編集しない。要素を消す・変種にするのはインスタンス側で `visible=false`（行コンテナごと畳む）。[feedback_figma_hide_in_instance_not_master](../../docs/feedback_figma_hide_in_instance_not_master.md)
- **F-CMP-4** 強調やマーキングのために部品の fill/stroke を変えない（全インスタンスに伝播する）。外側のラッパーで囲む。`feedback_figma_component_style`
- **F-CMP-5** 完成フレーム内で、見えるスタイル（fill/stroke/effect/cornerRadius>0）を直接持つ非INSTANCEノードは不合格（default-deny。TEXT は対象外で F-QLT 系が見る）。合格は3つだけ: (a) DS部品の instance (b) 無装飾のレイアウト用コンテナ (c) 台帳に宣言した例外 `raw:<コード>`＋「なぜコンポ化しないか」の根拠1行。宣言した例外はノード名も `raw:<コード>` にし、台帳と件数を N=N で突合する（`abs:<コード>` も同じ。コード一覧の正本は design-create [exceptions](../../skills/figma-design-create/references/exceptions.md)）。分母は「部品に見えるもの」でなくスタイルを持つ全ノードで、自己認定で外さない。DSに無い部品は [figma-component-design](../../skills/figma-component-design/SKILL.md) で部品にしてから使う（コンポ化票に束ねて承認を取れば F-PLC-3 と両立する）。[feedback_figma_raw_frame_default_deny](../../docs/feedback_figma_raw_frame_default_deny.md)
- **F-CMP-6** 同じ構造のフレーム/グループは、2つ目のコピーを作る時点で部品にする（別画面・同一画面の状態フレーム間・画面内の繰り返しのすべて。単位は複製される最大の同一範囲。単位基準の正本は figma-component-design の [unit](../../skills/figma-component-design/references/unit.md)）。子が全部 instance でも、束ねる親フレームの複製は該当する（F-CMP-5(b) は単体で置くときの免除で、複製してよい理由にならない）。再利用が明らかな意味単位（フィルタバー、表の見出し行、リスト項目など）は1つ目から部品にするのが既定で、しないなら `raw:<コード>` で理由を台帳に残す。検証は最終ゲートで同名/同構成フレームの出現数を実測（audit-structure.js の複製検出、不可時は手動）。[feedback_component_unit_two_copy_rule](../../docs/feedback_component_unit_two_copy_rule.md)
- **F-CMP-7** Figma に書き込んだセッションは、最後の書き込みのあとに `scripts/audit-structure.js` を下の3回、この順で実行するまで完了できない。**セッション最後の use_figma は必ず run3**（Stopフックは最後の書き込み以降の pass 行を見る）。

  | run | 測る範囲 | 合格条件 |
  |---|---|---|
  | 1. F-CMP-6 | **比較相手を含む**親コンテナかページ | 検出クラスタを全件報告（`cmp:0` は条件でない。新規ノードだけ渡すと「既存1件＋今回の複製1件」が検出できない） |
  | 2. 親辿り（read-only・この1本だけ自分で書く） | run1 の各メンバー id から `parent` を遡る（id は violation の `detail`「出現位置: 」以降） | どのクラスタも自分の成果物ルートの配下に無い（id の一致や接頭辞で判定しない）。配下に有ればコンポ化か `raw:` 宣言をして run1 からやり直す |
  | 3. F-CMP-5（最終） | 自分が作成/置換したノード全部を1回で（スクリプト冒頭の `TARGET_NODE_IDS` か `globalThis.targetNodeIds` を書き換える。引数は無い。ノード単位の分割は不可、ページ跨ぎのときだけページ単位で分割可。ページ全体を渡すと既存の負債で必ず落ちる） | 返り値に `F-CMP-AUDIT cmp:0 fcmp5:pass` 行。summary の `roots:` と作成/置換リストを N=N で突合し、完了報告に転記 |

  cmp=F-CMP-5+F-CMP-6 の違反数。判定不能が1件でもあれば fcmp5:fail。run2 の突合はフックが見ないので自分で守る。実行した痕跡を Stopフック `~/.claude/hooks/visual-gate-stop.sh` が照合する（応答に書くだけでは通らない）。視覚判定（F-QLT-6/7）は代わりにならない。免除の語彙と復旧手順（`raw:` 台帳の書式を含む）の正本はフックのブロック文言 `~/.claude/hooks/msg/struct-block.json`。違反は機械判定の一次情報であって判決ではないので、現物を開いて同一か確かめてから2コピー則を当てる。仕組みと既知の限界は [reference_cmp_audit_mechanics](../../docs/reference_cmp_audit_mechanics.md)。

### 配置系
- **F-PLC-1** 置き場所のページは根拠を持って決める（既存の同種フレームがあるページか、対象機能のページ）。該当が無い・候補が割れるときは着手前に依頼者に確認し、自己判断で空きに置かない。
- **F-PLC-2** node-id 指定はそのノードを in-place で編集する（複製・横並びにしない）。Page 指定はその Page 上に作る。「別ページに作って」は新規 Page。[feedback_figma_target_node](../../docs/feedback_figma_target_node.md) [feedback_figma_page_vs_frame](../../docs/feedback_figma_page_vs_frame.md)
- **F-PLC-3** 「無い」と断定して作らない。作る前に既存DSを確認する（検索や一覧の空振りは不在の証拠にならない。存在だけでなく slot やプロパティで何ができるかまで読む）。勝手な新規コンポ/要素の作成、重複作成をしない。[feedback_verify_absence_before_creating](../../docs/feedback_verify_absence_before_creating.md)
- **F-PLC-4** ページの単位はオブジェクト（1オブジェクト1Page）。そのオブジェクトの一覧・詳細・全状態・その場のアクション派生を同じ Page に並べる。ストーリーやフローで Page を切らない（フローはプロトタイプ配線で表す）。新規 Page は新しいオブジェクトが出たときだけ。配置は着手前に宣言し、最終ゲートで object→Page 集合を実測して逆監査する（手順は design-create [pages](../../skills/figma-design-create/references/pages.md) と [reverse-audits](../../skills/figma-design-create/references/reverse-audits.md)）。
- **F-PLC-5** 複製・新規作成の配置先は、対象 node-id を `get_metadata(nodeId=対象)` で個別に問い合わせて所属ページIDを事前に特定し、それだけを基準にする。`get_metadata`(nodeId 省略) のページ一覧や `figma.currentPage` には頼らない（アクティブなページしか返さない疑いがある）。特定できなければ着手しない。作成後は生成物の node-id で所属ページを取り直し、事前に特定したページIDと一致してから完了報告する。不一致なら移動して再確認し、2回不一致なら依頼者に報告して止まる。`feedback_figma_page_membership_unverified`
- **F-PLC-6** このファイルへの恒久ルールの追加・変更は、軽微でも、反映前に Fable アドバイザーへ相談する（全Figma作業に波及するため）。

### 出典系
- **F-SRC-1** 項目を決めるのは依頼者。出典の無い要素は置かない（default-deny）。
  - 要素（項目・タブ・ボタン・列・欄・パネル・編集操作）が画面に在ってよい出典は3つだけ: **user**（このセッションの依頼者の逐語。AskUserQuestion の回答を含む）／**req**（議事録・要件文書の逐語＋ファイルと行）／**existing**（このサービスの既存画面の node-id。既存の項目は残す）。
  - **ds**・**placeholder**（仮の値・未確定文言の仮置き）・**primitive-def** は、在ることが決まった要素の見た目と値の根拠で、要素を増やす根拠にならない。
  - 出典にならないもの: inherent（この種の画面なら普通ある）／guess・推測・INFER／brief（自分の判断）／REF・参考サービス・lazyweb／similar。これらしか書けない要素は作らず、AskUserQuestion で1問聞く。他の出典と同じ行に並べても通らない。
  - 文言も同じ。user/req/existing に無い語は placeholder のまま置いて質問に積む（`feedback_never_invent_ui_copy`）。
  - 機械強制: `~/.claude/hooks/item-provenance-pretool.sh`（実装ワーカーに渡すブリーフと設計書に「出典にならない」語が1行でもあれば exit 2。免除の書式は無い）／`~/.claude/hooks/undecided-not-evidence-pretool.sh`（UI要素の追加指示には `ADD-SRC: user-verbatim "…"`／`ADD-SRC: req "…" <path>`／`ADD-SRC: existing <node-id>` が必要。引用は transcript・ファイルと照合され、追加する項目の語が引用に出てくることが要る）。
- **F-SRC-2** 他案件の情報は出典にならない。記憶・文脈・別プロジェクトの要素を混ぜない。[feedback_element_provenance_antibleed](../../docs/feedback_element_provenance_antibleed.md)
- **F-SRC-3** 良いと思った要素は置かずに、チャットに「提案」として別枠で出す。
- **F-SRC-4** 依頼者が明言した要素と、見せた現物（スクショ/フロー）は最上位の出典。レビュアーの指摘や1フレームとの突合で「ここに無い」を理由に消さない。明言された範囲の削除は、一次情報で確かめてからにする。[feedback_reviewer_claims_are_inputs_verify](../../docs/feedback_reviewer_claims_are_inputs_verify.md)
- 検証は、要素 allowlist の宣言→逆差分監査（→対応表。宣言に無い要素は削除かエスカレーション）。

### OOUI系
原則だけをここに置く。宣言の書式と逆監査の手順は design-create。順序は「オブジェクト→関係・操作権限（F-OOUI-6/7）→ビュー（F-OOUI-1）」。PRD がある案件は関係=「8.3 関係」「8.4 多重度」、権限=「4.3 利用者×権限」を写し、Figma 側で考え直さない。[feedback_wireframes_ooui_bound](../../docs/feedback_wireframes_ooui_bound.md)

- **F-OOUI-1** 新規画面/フローは「何のオブジェクトの、どのビュー（collection 一覧／single 詳細）か」を先に確定してから起こす。各ビューに `PRIME: <語>` を1つ、そのプロダクトの利用者向け既存ラベルの語彙で宣言する（社内呼称・専門語・造語は不可）。PRIME=そのビューを開いた利用者が最初に確かめに来る値/項目。逆監査は、宣言した PRIME（または同じものを指す既存ラベル）が当該フレームの先頭ブロック内に、最大の文字サイズか、そのブロックで唯一の強調として在るか。
- **F-OOUI-2** 動詞はビュー上のモードレスなアクション（chip/overlay/inline 編集/その場で完結して元のビューへ戻る modal）にする。独立画面・ステップ・ウィザードにしない（種別を選ぶだけの画面、Nステップ、後戻りできないモードを作らない）。
- **F-OOUI-3** 種別・区分・期間・期限はオブジェクトでなく、プロパティ・状態・アクションに畳む。
- **F-OOUI-4** 段を畳んでも、その段が与えていた選択肢や能力は残す（インラインのプロパティやセグメント切替で全部残す）。明言された選択肢を落としたら不合格。[feedback_keep_stated_core_verify_fully](../../docs/feedback_keep_stated_core_verify_fully.md)
- **F-OOUI-5** 本質的に逐次なフロー（認証・決済の確定・不可逆の確認・初回オンボーディング等）は例外にできるが、閉じた理由コードつきの宣言制（コードは design-create [exceptions](../../skills/figma-design-create/references/exceptions.md)）。
- **F-OOUI-6** オブジェクト同士の関係は、画面に出す前に宣言する（from/to・関係名・多重度 1:1/1:N/N:N・画面上の現れ）。関係名は利用者向け既存ラベルの語彙。関係を独立オブジェクトに昇格させない。逆監査は、画面上の他オブジェクト参照と宣言の双方向の写像。
- **F-OOUI-7** 誰がどのオブジェクトに何をできるかを、画面に出す前に宣言する（ロール×オブジェクト×操作ごとに「できる/見るだけ/できない」）。ロール名は依頼者の逐語・議事録・既存画面・PRD にあるものだけ（無ければ作らず聞く）。逆監査は、「見るだけ/できない」の各行が、そのロールの画面で非表示・無効化・権限不足のいずれかとして現れているか。
- **F-OOUI-8** 洗い出した概念を全件そのまま箱にしない。オブジェクトにするのは「画面で1件ずつ扱うもの」（一覧に並び、開くと詳細があるもの）だけ。選択肢の値はプロパティへ、操作はアクションへ、画面の区切りや表示の都合はビューの注記へ入れる。どこにも入らない概念は「関係不明」に出典つきで置く（黙って捨てない）。逆監査は、概念→入れ先の対応表を1件1行で作り、未割当0・重複0を件数で確かめる。

### 品質系
- **F-QLT-1** 色は見栄えで選ばない。DSのセマンティックトークンと実務の実カテゴリを根拠にする。過剰な配色・装飾をしない。[feedback_no_ai_arbitrary_colors](../../docs/feedback_no_ai_arbitrary_colors.md)
- **F-QLT-2** コントラストは WCAG AA 未満を出さない。「満たしている」と言う前に実測する。[feedback_verify_quality_by_measuring](../../docs/feedback_verify_quality_by_measuring.md)
- **F-QLT-3** 文字サイズは 14px を下限とし、DSの type style を使う。
- **F-QLT-4** 複数案・別案は、色やフォントの塗り替えでなく、構造・IA・見せ方から別物にする。[feedback_design_presentation_not_reskin](../../docs/feedback_design_presentation_not_reskin.md) [feedback_multiple_concepts_structure](../../docs/feedback_multiple_concepts_structure.md)
- **F-QLT-5** 生の値（hex・直書きの px）を残さない。色・タイポ・spacing・radius・effect は Variable/Style にバインドする（変数が無ければ定義してから使う）。テキストは名前付きテキストスタイルを丸ごとバインドする（フォントだけ・サイズだけ・一部セグメントだけの部分バインド、手動で値を合わせただけ、生フォントの据え置きはすべて不合格。専用の段が無ければ近い段を当て、迷えば実装前に相談）。決定論監査は `scripts/audit-ds-binding.js`（BIND-TEXT-1/3・BIND-FILL・BIND-STROKE・BIND-SPACE・BIND-RADIUS・BIND-EFFECT。範囲は今回触ったノード〔`TARGET_IDS`〕。use_figma で実行し pass=true が完了条件）。[feedback_css_use_variables](../../docs/feedback_css_use_variables.md) [feedback_figma_always_bind_text_style](../../docs/feedback_figma_always_bind_text_style.md)
- **F-QLT-6** 完成度ゲート。ビルド完了後の最終成果物が平坦なワイヤーのままなら不合格（着手前に構造を合意するための中間ワイヤー＝F-PRC-1 は別で、正当な工程）。最終スクショで次を確かめる: (a) 主導線: primary の操作要素は1つ以下で、1つならそれが `MAIN:`（設計時に既存の操作ラベルから選ぶ）。閲覧専用の画面は `MAIN: なし` で primary 0 が合格（ボタンを足さない） (b) 平坦/過剰: 全要素が「白カード＋細線」で等価に並んでいないか、アクセント色が操作要素以外の塗り面に載っていないか (c) 明度階層: 機械層（`audit-ds-binding.js` が返す facts）が出す段数を証拠に、差が実際に効いているか（段数だけで落とさない） (d) タイポ階層: PRIME が先頭ブロックで最大か唯一の強調か、見出し・本文・補助が区別できるか。不足と過剰の両方を不合格にする。ワイヤー的なら、塗り・階層・余白・タイポを追い込んでから完了にする。F-QLT-1〜5 の合格・スクショ一致・AA 合格・OOUI 適合・レビュー致命0は、どれも完成の代わりにならない。委譲するときはブリーフに「合格ライン=DS規約合格でなく、完成したプロダクトデザインとして成立」と書く。[feedback_no_avatar_icons](../../docs/feedback_no_avatar_icons.md) [feedback_design_presentation_not_reskin](../../docs/feedback_design_presentation_not_reskin.md)
- **F-QLT-7** 既存プロダクトとの一貫性ゲート。既存プロダクトの画面を新規に作る・刷新するときは、既存の姉妹画面（実アプリか既存Figma画面）を視覚の基準に固定して揃える。
  - 双子の同定（着手前。空なら実装に進まない）: 作る画面のビュー種別（一覧/単一詳細/編集）を要件だけから先に確定し、同じ種別の既存画面だけを候補にする（一覧は詳細の双子にならない）。DSファイルは視覚の基準にできない。同種別が無ければ合成せず、基準画面を依頼者に1問聞く。選んだ双子は `TWIN: <fileKey>/<node-id>（view=種別・なぜ双子か1行）` で宣言し、完了前に成果を同じ node-id の双子の隣に並べ、「同じプロダクトに見えるか」を判定する（兄弟コンテナの spacing の揃い、列数、情報量を含む。並べて別物なら不合格。比較相手を後から差し替えない）。
  - 着手前に姉妹画面を自分で見て言語を抽出する（色の使い所、カード様式、バッジ形状、余白のリズム、アプリ枠の有無）。濃さ・太さ・線の強さは F-QLT-10 で測る。
  - 既存の言語に無い device の発明（アクセント色の大きな塗り面や帯など）は不合格。姉妹画面が平板なときは F-QLT-6 を優先し、言語と構造は揃えたまま忠実度を上げてよい。
  - 委譲するときはブリーフに姉妹画面の node-id か画像パスを渡し、「これに揃える。DSファイル単独で起こさない」と書く。[feedback_figma_ground_on_sibling_screens](../../docs/feedback_figma_ground_on_sibling_screens.md) [feedback_qa_real_user_outcome](../../docs/feedback_qa_real_user_outcome.md)
- **F-QLT-8** 業界ベンチマーク report（lazyweb）。**規模が大のとき、または依頼者が求めたときだけ**行う。最終スクショ＋プロダクト文脈＋ゴールで `lazyweb_generate_report`（新規画面は objective:'create'）を実行し、返った全所見に処分——(a) 修正済み (b) 根拠つき棄却（一次情報で反証。破壊系の所見は既定で棄却） (c) 依頼者へエスカレ——をつける。所見の処分はメインが行う。所見は入力であって判決ではない（依頼者の逐語と F-QLT-7 が常に勝つ。report が良くても F-QLT-6/7 は別に要る）。lazyweb が不通なら `lazyweb_health` を確かめて1回再試行し、だめなら「未実施」と報告して依頼者に判断を仰ぐ（黙って飛ばさない）。report を判定役に再判定させない。[feedback_reviewer_claims_are_inputs_verify](../../docs/feedback_reviewer_claims_are_inputs_verify.md)
- **F-QLT-9** ビジュアル判定の実施証跡。Figma 書き込みツール（`use_figma`/`generate_figma_design`/`create_new_file`）を1回でも成功させたセッションは、完了報告に `F-QLT-6 verdict:<fable|opus>/<task-id>/<pass|fail>` と `F-QLT-7 verdict:<fable|opus>/<task-id>/<pass|fail>` の2行が要る（サブエージェント内の書き込みも数える。免除の宣言は無い）。
  - 判定役は Fable のサブエージェント（作業の文脈を持たせない）。Fable が起動できないときだけ `fable-fail:<task-id|エラー原文>` を併記して最新 Opus（`model:"opus"` を明示、手順は同じ）。sonnet・figma-reviewer・自分の目ではこの枠は埋まらない。
  - 判定役への入力は、スクショ＋機械層の facts＋`MAIN:`＋`PRIME:`＋判定基準の要約＋好みの記録（F-PRC-13。あれば）（F-QLT-7 は宣言した TWIN のスクショも。複数画面は1回に束ねる）。判定役は宣言を読む前にスクショと数字だけで主導線の候補と最大の強調を挙げ、そのあとで宣言と照合する。
  - verdict の直下に、フレーム×観点の `pass|fail＋根拠` 行を置く（揃わない合格は F-PRC-8 の「合格+証拠」に数えない）。
  - 新しい視覚判断を伴わない編集（バインド是正・文言など）は、採点表の代わりに before/after の視覚回帰を判定させ `regression:` 行を残す。色・太さ・線・余白を変える直しは、F-QLT-10 の計測結果も判定役に渡す。
  - 強制は Stopフック `~/.claude/hooks/visual-gate-stop.sh`（書き込みの検出＋判定役の完走＋verdict 行を照合。judge=opus は `fable-fail:` が無ければ BLOCK。ブロックはセッションごとに5回まで再評価）。[feedback_visual_gate_must_be_fable](../../docs/feedback_visual_gate_must_be_fable.md)
- **F-QLT-10** 濃さ・太さ・線の強さ・余白は、測って合わせる（感覚で決めない）。新規画面、刷新、色・太さ・線・余白を直す編集のときに行う（部品の property 軸だけの改修、文言だけの直しは対象外）。
  - 見本（F-QLT-7 の TWIN。無ければ依頼者が名指しした実在プロダクト）の実物から、面・線・文字色・文字の太さ・密度（行の高さ、箱の内側余白、操作部品の高さ）の値を取り、成果物の同じ場所の値と並べて、段階（何段あるか、各段の明るさや大きさ）を合わせる。色相・書体・ブランド色・要素は写さない（F-SRC-1）。部品が決める高さと内側余白は画面側で上書きせず、variant を選び直すか、部品の改修として相談する。
  - 成果物の中では、同じ種類の箱の余白がそろっているかを数える（変数に結びついていても数える）。紛らわしい値（14 と 16 など）と段外れは、変数に結びついていない値だけ数える。
  - 描画では、揃え（左端、中心軸、兄弟の間隔、左右の内側余白）を座標で測る。
  - 小の余白の直しは、見本とは比べず、成果物の中の揃いだけ測ればよい。手順とスクリプトは design-create [tone-measure](../../skills/figma-design-create/references/tone-measure.md)。

### 進め方系
- **F-PRC-1** 新規ビルドは、着手前にチャットで構造（ワイヤー）を出して合意してから起こす。[feedback_figma_use_real_components](../../docs/feedback_figma_use_real_components.md)
- **F-PRC-2** 画像やデザインの参照・再現を委譲するときは、画像を見られるモデルのサブに、実画像ファイルのパスを直接渡して Read させる（Agent ツールの `model` に画像対応を指定）。テキストへの書き起こしで渡すのは最後の手段。依頼者が出したスクショは Desktop 等にファイルの実体があるので（`source:` パス）、そのパスをブリーフに入れる。
- **F-PRC-3** 成果は Figma 上に直接書き戻す。HTMLモックやローカルファイルで出さない。[feedback_figma_output](../../docs/feedback_figma_output.md)
- **F-PRC-4** 文言は自然な日本語で。見出しやキャッチに読点を入れすぎない。翻訳調・AI調を避ける。[feedback_japanese_punctuation](../../docs/feedback_japanese_punctuation.md) [feedback_natural_japanese_copy](../../docs/feedback_natural_japanese_copy.md)
- **F-PRC-5** 「すべて/全部/全ページ」の範囲を勝手に狭めない。対象はファイルの全ページ（または明示された全範囲）。狭めるなら着手前に「対象は◯◯ページ群でよいか」と確認する。全数監査は全ページを loadAsync してページ横断で取り、完了前に「宣言した全ページ集合」と「実際に処理したページ集合」を双方向で diff する。[feedback_bind_all_scope_no_narrowing](../../docs/feedback_bind_all_scope_no_narrowing.md)
- **F-PRC-6** Figma の URL/node-id が指す範囲を勝手に決めない（広げも狭めもしない）。範囲は指定 node-id の祖先チェーン `指定ノード → それが属する画面 → その画面が乗るキャンバスページ → ファイル` のどれか1段。
  - 段は名詞の範囲語だけで決める。「把握して/見て/確認して」などの動詞は範囲を広げる根拠にしない。名詞が段を1つに決めていれば従う。決まらなければ（裸の「このページ/全部/全体」、名詞が無く動詞＋node-id だけ）、実際の祖先チェーンをフレーム名と各段が含むものつきで見せて1問確認する。「ページ」をキャンバスページと決めつけない。
  - 根拠は依頼者の逐語だけ。直前の指摘の方向に引きずられない。
  - 読み取り・委譲・編集のどれも、範囲が決まる前に始めない。
  - 聞かなくてよい場合: ①URL/node を複数列挙された（和集合） ②使用箇所の洗い出しなどクエリ型（ファイル全体） ③node-id の無いファイルURL（ファイル） ④同じ URL/node で直近に確定済み。[feedback_figma_url_scope_page_vs_file](../../docs/feedback_figma_url_scope_page_vs_file.md)
- **F-PRC-7** Figma の実装やデザインを委譲するときは、デザイン系エージェント＝Opus 以上で回す。Sonnet に格下げしない（`model:"sonnet"` を渡さない。「実装の委譲は Sonnet」という一般則は、デザイン系には当てない）。
- **F-PRC-8** レビュー結果は {合格+証拠 / 不合格 / 未実施} の3値だけ。エラー・タイムアウト・無応答は「未実施」で、完了できない。起動したレビュー数と戻った verdict 数を突合し、1件でも欠けたら不合格。数えるのは独立した別エージェントの verdict だけ（メイン自身の再確認は数えない）。F-QLT-6/7 は観点別の証拠行が全フレーム分揃って初めて「合格+証拠」。
- **F-PRC-9** 順序は「決定論監査→判断レビュー」。`audit-*.js`（不可時は手動走査）が red のうちは判定役やレビューを起動しない。
- **F-PRC-10** 実装完了の受入証拠は2点とも要る: (a) 決定論監査の生出力（pass=true。不可時は手動走査の生ログ） (b) 成果物の実スクショ。2点は必要条件で、合否は各ゲートが決める。
- **F-PRC-11** 参照ファースト（REF宣言）。**規模が中・大で、新しい見た目の判断を伴うときだけ**行う（新しい見た目の判断＝TWIN に無いレイアウト・部品構成・見せ方を決めること。TWIN の型どおりに項目を並べるだけの画面、小の直し、機械的な編集、部品の property 軸だけの改修は対象外）。着手前に `lazyweb_search`（2〜6語の具体的なUIパターン名＋platform）で実参照UIを1〜3件取り、各件を ①検索クエリ ②参照名 ③なぜ良いかの根拠1〜3行（レイアウト構造・階層・視線誘導・情報密度など構造の言葉。印象語だけは不可） ④流用候補要素の `[REF:参照名]` タグ で固定してから設計に入る。合格の目安は、実装時に参照スクショを見返さなくても、根拠の1〜3行から同じ判断を再現できること。 REF は見た目と配置の参考だけで、視覚の基準（TWIN）でも要素の出典（F-SRC-1）でもない。実装ワーカーに渡す設計書・ブリーフには REF／参考サービスの語を書かない。画面・フローを起こす／刷新するときは二段で探すので、必ず [ref-declaration](references/ref-declaration.md) を読む（0件のとき、置き場所も同資料）。
- **F-PRC-12** 作業スキルを経由して書き込む。公式スキル（`figma-use` 等）は下請け専用で、作業スキル（`figma-ds-edit`/`figma-component-design`/`figma-design-create`/`figma-e2e-test`/`figma-modal-open-reorg`/`mikeneko-frontend`）を1つもロードせずに Figma へ書き込まない（機械強制 `workskill-gate-pretool.sh`。免除は `figma-exempt: figjam|slides|user-snippet|code-connect` だけ）。DS があるときは書き込み前に棚卸しし、各要素の処遇を `~/.claude/gate/ds/<session_id>.md` に宣言する: `DS: fileKey=... lib=...`（DS が本当に無いときだけ `ds-none-because: <実測根拠>`）と、要素ごとに1行 `PLAN: <要素名> -> reuse:<node-id>` / `-> new-component:<理由>` / `-> raw:<コード>:<なぜコンポ化しないかの根拠>` の3択。既定は reuse か new-component で、raw は例外を台帳に載せて見えるようにする票（ノード名も `raw:<コード>` にし、監査の raw 件数と N=N で突合）。`reuse:`/`new-component:` の値に `raw:` を埋め込む書き方は不正。委譲するときはブリーフ本文に DS の fileKey と流用候補の node-id を書く（`scope-gate-pretool.sh` が ## DS セクションと突合）。
- **F-PRC-13** 案件の把握を1枚に残す。着手前に、実物で確かめたこと（要件の原文、文言の出どころ、見本、部品と素材。どこで見たかを添える）を案件の DESIGN.md に書き、「作るもの／合わせるもの／やらないこと」の3行を依頼者に見せる。依頼者に言われた却下・禁止・好みは、言葉のまま「好みの記録」に足す（言われていないことを書かない）。DESIGN.md は最初に読み、好みの記録は判定役と委譲のブリーフに渡す。記録にある禁止に当たる成果物は出さない。小は、対象の現物と依頼者の言葉、あれば好みの記録だけ。書式と手順は [context](../../skills/mikeneko-figma/references/context.md)。
- **F-PRC-14** 中・大は、最初の1画面を早く見せる。代表的な1画面のぶんだけ宣言と承認を済ませて作り（F-SRC-1 と F-PRC-12 は省かない）、依頼者に見せて方向を確かめてから残りに進む。却下されたら、残りを作る前に直す。見せ方も同資料。

### 解釈系
- **F-INT-1** 空間やレイアウトの語（padding・余白・端・幅いっぱい・詰める・揃える・はみ出す等）を含む指示は、着手・委譲の前に「node-id.プロパティ: 現在値→目標値」の錨つき差分に訳す。同じプロパティが祖先チェーン上の複数ノードにあるときは多義なので、候補を期待される見た目つきで見せて1問確認し、返答まで止まる。一意でも解釈を1行で示す。委譲するブリーフは「依頼者の逐語／メインの錨つき解釈／観測述語」の3つに分け、ワーカーは現物の構造が解釈と食い違ったら実装せず差し戻す。[feedback_figma_perceive_before_delegate](../../docs/feedback_figma_perceive_before_delegate.md)
- **F-INT-2** 意図を満たしたかの検証対象は、レンダリングと依頼者の逐語だけ（知覚は委譲しない）。着手前と完了前に、メイン自身が対象の get_screenshot と get_metadata を取る。受入条件は、スクショ上で観測できる述語で書く（プロパティ名や px 値でなく）。完了宣言は、自分で取った after のスクショと逐語を突合したあとだけ。ワーカーの報告・監査の pass=true・レビューの全 pass は規約や仕様への適合であって、意図を満たした根拠に引かない。レビュー依頼には依頼者の逐語を添え、spec-pass（仕様どおりか）と intent-pass（逐語とスクショで元の意図を満たすか）を分けて判定させる。[feedback_figma_perceive_before_delegate](../../docs/feedback_figma_perceive_before_delegate.md)

## 各スキルの最終ゲート対応表

正本の手順と合格基準は各スキル本文。ここは索引だけ（F-QLT-8 は大のときだけ、各スキルの最終工程）。

- **ds-edit**: 一括承認〔工程3末・判断が要る分岐のみ〕／全件レビュー=逆差分監査＋OOUI整合＋auto-layout整合〔工程5・6〕／instance実体監査＋F-CMP-5〔工程6〕／F-CMP-6 重複監査〔工程6の最後＝F-CMP-7 の run1+run2〕／バインド監査〔工程4末・5・6、`audit-ds-binding.js` pass=true〕／意図充足〔工程1(before)・6(after)、F-INT-1/2〕／F-PRC-11〔工程1・刷新や新しい視覚判断のとき〕／F-QLT-10 実測〔工程1・6・刷新や色・太さ・線・余白の直しのとき〕
- **component-design**: 全property組合せテスト〔破綻0・dead space 無し〕／既存使用箇所への影響レビュー〔公開前〕／F-PRC-11〔軸設計前・新しい見た目の判断があるとき〕／F-QLT-9 の verdict〔報告〕
- **design-create**: 把握の3行と最初の1画面〔工程0・5、F-PRC-13・14〕／一括承認〔工程4〕／逆差分監査〔工程8(e)〕／OOUI逆監査〔2回=配線前＋工程8(f)〕／ページ編成逆監査〔工程8(g)〕／auto-layout逆監査〔工程8(h)〕／instance実体監査＋F-CMP-5〔工程7・8(b)〕／F-CMP-6〔工程8(i)〕／F-QLT-10 見本の実測〔工程1・8〕／F-PRC-11〔工程1〕
- **e2e-test**: 体験E2E〔盲目セルフプレイで達成可否・離脱点・真因を切り分け、設計は直さずハンドオフ〕

## スキル成長規約

- 環境に依存する事実（「〜は無い」「〜は使えない」）を本文に埋めない。埋めてよいのは検証手順だけ。
- 事故対応は「1事故=1ルール行の追加/修正」。経緯・台詞・顛末は本文に書かず、[rule_history](../../docs/rule_history.md) か個別の docs に1行で残す。
- 失敗の直後に作成/改訂したスキルは、採用前に、文脈を持たない別エージェントに読ませる。
- サイズ予算: 入口17KB／このファイル40KB／ワーカー本文40KB。超えたら、詳しい手順を `references/` に移してから足す（本文には「いつ読むか」だけ残す）。

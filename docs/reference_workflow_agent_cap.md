---
name: reference_workflow_agent_cap
description: Workflowのagent()呼び出しは生涯1000体上限。fan-outサイズを事前に見積もる
metadata: 
  node_type: memory
  type: reference
---

Workflowツールの `agent()` 呼び出しはワークフロー生涯で**最大1000体**。超えると `WorkflowAgentCapError` で失敗し、それまでのトークンは無駄になる（実例：聖杯戦争16ゲーム×最大16ターン×7陣営で1000到達→2,200万トークン浪費）。

**How to apply:** ループ系ワークフローは投入前に「反復数 × 段数 × 並列数」をざっと掛けて1000未満か確認する。多すぎる場合はバッチ分割。失敗しても `resumeFromRunId` でキャッシュ済みのagent()結果は回収できる（再開は数十秒・数万トークンで済む）ので、まず小さくして resume するのが復旧の定石。[feedback_simulation_agents_self_play](../docs/feedback_simulation_agents_self_play.md)


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [Workflowのagent()は1000体上限] — fan-out(反復×段×並列)を事前見積、超過は失敗しトークン浪費、resumeでキャッシュ回収

---
name: feedback_no_ai_arbitrary_colors
description: 色・タグをAIが勝手に選ぶ「君色」NG。DSセマンティックトークン＋実務の実カテゴリに基づく
metadata: 
  node_type: memory
  type: feedback
---

タグ・バッジ・バナーの色を**Claude（AI）が見栄えで勝手に選ぶ「君色／AIっぽい色」は禁止**。

**Why:** 手選びのオレンジ/青/灰を散らすと、色が"意味"でなく"装飾"になり、根拠のないAIっぽい画面になる。実務のデザインは色先行でなく、確定したワークフロー・カテゴリが先にあって色は慣習で従う。

**How to apply:**
- **色は2源だけ**：①DSのセマンティックトークン（attention/warning/success/primary/muted等）②実務で意味が定まってる色。AIの手選びRGBは使わない。
- **タグは装飾でなく実カテゴリ**：例＝デザイナーのデザイン作業なら「探索/制作/レビュー依頼/FB反映/承認済み/ハンドオフ」のように確定カテゴリ。備品貸出アプリ（架空）の予約タスクなら 状態(貸出可=success・貸出中=muted・修理中=warning・返却遅延=attention)。
- きっかけ＝返却期限が近い予約を知らせるバナーで、手選びのオレンジが「AIっぽい君色」と指摘された（レビュアー）。

関連: [feedback_design_presentation_not_reskin](../docs/feedback_design_presentation_not_reskin.md)（再着色でなく見せ方を設計）, [feedback_figma_hide_in_instance_not_master](../docs/feedback_figma_hide_in_instance_not_master.md)。


## 旧MEMORY.mdインデックス詳細(スリム化で移設)
- [AIっぽい君色NG・色は根拠から] — タグ/色をAIが見栄えで選ぶの禁止、DSセマンティックトークン＋実務の実カテゴリに基づく

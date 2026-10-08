#!/usr/bin/env bash
# check-banned-patterns.sh — 禁止パターンの機械検査
#
# 使い方:
#   check-banned-patterns.sh <対象dir> [patterns.txt]
#     - patterns.txt 省略時はこのスクリプトと同じディレクトリの banned-patterns.txt を使う
#     - patterns.txt の各行を grep -rn -E で対象dirに当てる（# 始まりと空行はスキップ）
#     - ヒットは「パターン: ファイル:行」形式で列挙
#     - 1件でもヒットしたら exit 1 / ゼロなら "CLEAN" を出力して exit 0
#     - fail-closed: 不正regex（コンパイルエラー）を検出したら "INVALID PATTERN: <パターン> (行N)" を
#       stderr に出して exit 2 で落ちる（CLEANとは言わない）。本文検査の前に全パターンを空入力で
#       事前コンパイル検証し、本文検査中に grep が exit 2 を返した場合も同様に exit 2。
#       パターンは案件毎に手編集する仕様なので、typo 1つで検査が沈黙無効化（fail-open）しないための保証

set -u

if [ $# -lt 1 ]; then
  echo "usage: $(basename "$0") <対象dir> [patterns.txt]" >&2
  exit 2
fi

TARGET_DIR=$1
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PATTERNS_FILE=${2:-"$SCRIPT_DIR/banned-patterns.txt"}

if [ ! -d "$TARGET_DIR" ]; then
  echo "error: 対象dirが存在しません: $TARGET_DIR" >&2
  exit 2
fi
if [ ! -f "$PATTERNS_FILE" ]; then
  echo "error: パターンファイルが存在しません: $PATTERNS_FILE" >&2
  exit 2
fi
if [ ! -r "$PATTERNS_FILE" ]; then
  echo "error: パターンファイルを読めません（権限）: $PATTERNS_FILE" >&2
  exit 2
fi

# --- 事前コンパイル検証（fail-closed）---
# 本文検査の前に全パターンを空入力に当て、不正regex（grep exit 2）を列挙して exit 2 で落とす。
# exit 0/1（マッチ有無）は有効なパターン、exit 2 以上はコンパイルエラー。
invalid=0
lineno=0
while IFS= read -r pattern || [ -n "$pattern" ]; do
  lineno=$((lineno + 1))
  trimmed=${pattern#"${pattern%%[![:space:]]*}"}
  [ -z "$trimmed" ] && continue
  case "$trimmed" in
    \#*) continue ;;
  esac

  printf '' | grep -E -- "$trimmed" >/dev/null 2>&1
  rc=$?
  if [ "$rc" -ge 2 ]; then
    echo "INVALID PATTERN: $trimmed (行$lineno)" >&2
    invalid=$((invalid + 1))
  fi
done < "$PATTERNS_FILE"

if [ "$invalid" -gt 0 ]; then
  echo "error: 不正なregexパターン ${invalid}件。patterns.txt を修正するまで検査不能（fail-closed）" >&2
  exit 2
fi

# --- 本文検査 ---
hits=0
grep_errors=0
lineno=0

while IFS= read -r pattern || [ -n "$pattern" ]; do
  lineno=$((lineno + 1))
  # 空行・コメント行をスキップ（行頭空白許容）
  trimmed=${pattern#"${pattern%%[![:space:]]*}"}
  [ -z "$trimmed" ] && continue
  case "$trimmed" in
    \#*) continue ;;
  esac

  # grep -rn -E で当てる。exit 0=ヒット / 1=ヒットなし / 2以上=エラー（fail-closed対象）
  out=$(grep -rn -E -- "$trimmed" "$TARGET_DIR" 2>&1)
  rc=$?
  if [ "$rc" -ge 2 ]; then
    echo "INVALID PATTERN: $trimmed (行$lineno)" >&2
    [ -n "$out" ] && echo "  grep error: $out" >&2
    grep_errors=$((grep_errors + 1))
    continue
  fi
  [ "$rc" -ne 0 ] && continue

  # ヒットを「パターン: ファイル:行」で列挙
  while IFS= read -r loc; do
    [ -z "$loc" ] && continue
    echo "$trimmed: $loc"
    hits=$((hits + 1))
  done < <(printf '%s\n' "$out" | awk -F: '{print $1 ":" $2}')

done < "$PATTERNS_FILE"

if [ "$grep_errors" -gt 0 ]; then
  echo "---"
  echo "error: grep実行エラー ${grep_errors}件。検査は不完全＝CLEANとは言えない（fail-closed）" >&2
  exit 2
fi

if [ "$hits" -gt 0 ]; then
  echo "---"
  echo "NG: 禁止パターン ${hits}件ヒット" >&2
  exit 1
fi

echo "CLEAN"
exit 0

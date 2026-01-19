#!/usr/bin/env bash
set -euo pipefail

# jj-auto-commit - 変更を自動的にコミット（AI生成メッセージ付き）
# 使い方: jj-auto-commit.sh [--ai]

USE_AI=false
if [ "${1:-}" = "--ai" ]; then
  USE_AI=true
fi

API_KEY="${ANTHROPIC_API_KEY:-}"

# 変更があるかチェック
DIFF_SUMMARY=$(jj diff --summary)
if [ -z "$DIFF_SUMMARY" ]; then
  echo "✅ コミットする変更がありません"
  exit 0
fi

# 変更内容を取得
DIFF_STAT=$(jj diff --stat | head -20)

echo "📝 変更内容:"
echo "$DIFF_SUMMARY"
echo ""

# AI生成メッセージ
if [ "$USE_AI" = true ] && [ -n "$API_KEY" ]; then
  echo "🤖 AIでコミットメッセージを生成中..."

  PROMPT="以下の変更内容から、簡潔なコミットメッセージ（1行）を英語で生成してください。
プレフィックスは add/update/fix/refactor などを使用。

変更サマリー:
$DIFF_SUMMARY

統計:
$DIFF_STAT

出力は1行のコミットメッセージのみ（説明不要）"

  MESSAGE=$(curl -s https://api.anthropic.com/v1/messages \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d "{
      \"model\": \"claude-3-5-sonnet-20241022\",
      \"max_tokens\": 100,
      \"messages\": [{
        \"role\": \"user\",
        \"content\": $(echo "$PROMPT" | jq -Rs .)
      }]
    }" | jq -r '.content[0].text' | head -1)

  echo "💬 生成されたメッセージ: $MESSAGE"
  echo ""
  read -p "このメッセージでコミットしますか? (Y/n/e=edit) " answer

  case "${answer,,}" in
    n)
      echo "キャンセルしました"
      exit 0
      ;;
    e)
      read -p "コミットメッセージを入力: " MESSAGE
      ;;
  esac
else
  # 手動入力
  read -p "コミットメッセージを入力: " MESSAGE
fi

# コミット実行
jj commit -m "$MESSAGE"

echo "✅ コミット完了: $MESSAGE"
jj log --limit 2

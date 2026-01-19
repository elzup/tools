#!/usr/bin/env bash
set -euo pipefail

# jj-ai-squash - Claude APIを使った高度なコミット整理
# 環境変数: ANTHROPIC_API_KEY

COMMIT_LIMIT=${COMMIT_LIMIT:-10}
API_KEY="${ANTHROPIC_API_KEY:-}"

if [ -z "$API_KEY" ]; then
  echo "⚠️  ANTHROPIC_API_KEY が設定されていません"
  echo "   簡易版のルールベース分析を使用します"
  exec "$(dirname "$0")/jj-auto-squash.sh" "$@"
fi

# コミット履歴を取得
get_commits_json() {
  jj log -r "mine() & ::@" --limit "$COMMIT_LIMIT" --no-graph \
    -T 'change_id ++ "|" ++ description ++ "|" ++ commit_id ++ "|" ++ author.timestamp() ++ "\n"' \
    | awk -F'|' '{
      printf "{\"change_id\":\"%s\",\"desc\":\"%s\",\"commit\":\"%s\",\"time\":\"%s\"},\n", $1, $2, $3, $4
    }' \
    | sed '$ s/,$//' \
    | awk 'BEGIN{print "["} {print} END{print "]"}'
}

# ファイル変更サマリーを取得
get_file_changes() {
  jj log -r "mine() & ::@" --limit "$COMMIT_LIMIT" --no-graph \
    -T 'change_id ++ "|" ++ diff.summary() ++ "\n"'
}

# Claude APIにコミット分析を依頼
analyze_with_claude() {
  local commits="$1"
  local file_changes="$2"

  local prompt="以下のコミット履歴を分析して、関連するコミットをグループ化してください。
グループ化の基準：
1. 同じファイル/ディレクトリへの変更
2. 関連する機能追加や修正
3. 時間的な近さ
4. コミットメッセージの類似性

コミット情報:
$commits

ファイル変更:
$file_changes

以下の形式でJSON配列を返してください：
[
  {
    \"group\": \"グループ名\",
    \"change_ids\": [\"id1\", \"id2\"],
    \"reason\": \"グループ化の理由\",
    \"squash_message\": \"提案するコミットメッセージ\"
  }
]"

  local response=$(curl -s https://api.anthropic.com/v1/messages \
    -H "content-type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d "{
      \"model\": \"claude-3-5-sonnet-20241022\",
      \"max_tokens\": 2048,
      \"messages\": [{
        \"role\": \"user\",
        \"content\": $(echo "$prompt" | jq -Rs .)
      }]
    }")

  echo "$response" | jq -r '.content[0].text'
}

# squash提案を表示
show_suggestions() {
  local analysis="$1"

  echo "=== 🤖 AI分析によるSquash提案 ==="
  echo ""

  echo "$analysis" | jq -r '.[] |
    "🔸 \(.group)\n" +
    "  理由: \(.reason)\n" +
    "  コミット数: \(.change_ids | length)\n" +
    "  提案メッセージ: \(.squash_message)\n" +
    "  コマンド: jj squash --from \(.change_ids | join(" "))\n"'
}

# 対話的にsquashを実行
interactive_squash() {
  local analysis="$1"

  echo "$analysis" | jq -c '.[]' | while read -r group; do
    local group_name=$(echo "$group" | jq -r '.group')
    local change_ids=$(echo "$group" | jq -r '.change_ids | join(" ")')
    local message=$(echo "$group" | jq -r '.squash_message')

    echo ""
    read -p "🔄 '$group_name' をsquashしますか? (y/N) " answer
    if [ "${answer,,}" = "y" ]; then
      echo "実行中: jj squash --from $change_ids -m \"$message\""
      jj squash --from $change_ids -m "$message" || echo "⚠️  squash失敗"
    fi
  done
}

main() {
  echo "🔍 Claude AIでコミット履歴を分析中..."
  echo ""

  commits=$(get_commits_json)
  file_changes=$(get_file_changes)

  if [ "$commits" = "[]" ]; then
    echo "✅ 整理するコミットはありません"
    exit 0
  fi

  analysis=$(analyze_with_claude "$commits" "$file_changes")

  show_suggestions "$analysis"

  echo ""
  read -p "💾 対話的にsquashを実行しますか? (y/N) " execute
  if [ "${execute,,}" = "y" ]; then
    interactive_squash "$analysis"
  fi

  echo ""
  echo "✨ 完了"
}

main "$@"

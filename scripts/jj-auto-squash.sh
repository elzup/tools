#!/usr/bin/env bash
set -euo pipefail

# jj auto-squash - AI制御のコミット整理スクリプト
# 関連するコミットを自動的に検出してsquashを提案

# 設定
COMMIT_LIMIT=${COMMIT_LIMIT:-10}
MIN_GROUP_SIZE=${MIN_GROUP_SIZE:-2}

# コミット情報を取得
get_commit_info() {
  jj log -r "mine() & ::@" --limit "$COMMIT_LIMIT" \
    --no-graph \
    -T 'change_id ++ "|" ++ description ++ "|" ++ diff.summary() ++ "\n"'
}

# コミットをグループ化（ファイルパターンとメッセージの類似性で判定）
analyze_commits() {
  local commits="$1"

  # 簡易的な類似度判定
  # 実際のAI制御はここでClaude APIを呼び出す
  echo "$commits" | awk -F'|' '
  {
    change_id = $1
    desc = $2
    files = $3

    # ファイルパターンでグループ化
    if (files ~ /tsx?/) group = "frontend"
    else if (files ~ /\.md/) group = "docs"
    else if (files ~ /test/) group = "test"
    else group = "other"

    print change_id "|" group "|" desc
  }
  '
}

# squash提案を生成
suggest_squash() {
  local analyzed="$1"

  echo "=== Squash 提案 ==="
  echo ""

  # グループごとに集計
  echo "$analyzed" | awk -F'|' '
  {
    group = $2
    groups[group] = groups[group] $1 " "
    count[group]++
  }
  END {
    for (g in groups) {
      if (count[g] >= 2) {
        print "🔸 " g " グループ (" count[g] " commits)"
        print "  コマンド: jj squash --from " groups[g]
        print ""
      }
    }
  }
  '
}

# メイン処理
main() {
  echo "🔍 コミット履歴を分析中..."
  echo ""

  commits=$(get_commit_info)

  if [ -z "$commits" ]; then
    echo "✅ 整理するコミットはありません"
    exit 0
  fi

  echo "📊 分析結果:"
  analyzed=$(analyze_commits "$commits")
  echo "$analyzed" | column -t -s'|'
  echo ""

  suggest_squash "$analyzed"

  echo "💡 ヒント:"
  echo "  - jj squash --from <change_id> で手動squash"
  echo "  - jj split で大きなコミットを分割"
  echo "  - jj obslog でコミット履歴を確認"
}

main "$@"

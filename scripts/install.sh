#!/usr/bin/env bash
# 安装 procedural-scene-kit 到目标 harness
# 用法: ./scripts/install.sh [trae-cn|trae|claude|codex-user|codex-project]
set -euo pipefail

NAME="procedural-scene-kit"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-}"

case "$TARGET" in
  trae-cn)       DEST="$HOME/.trae-cn/skills/$NAME" ;;
  trae)          DEST="$HOME/.trae/skills/$NAME" ;;
  claude)        DEST="$HOME/.claude/skills/$NAME" ;;
  codex-user)    DEST="$HOME/.agents/skills/$NAME" ;;
  codex-project) DEST="$(pwd)/.agents/skills/$NAME" ;;
  *)
    echo "用法: $0 [trae-cn|trae|claude|codex-user|codex-project]"
    exit 1
    ;;
esac

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SRC" "$DEST"

echo "已安装到: $DEST"
echo "运行示例: cd \"$DEST/assets/kit\" && python -m http.server 8877"

#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if ! command -v npm >/dev/null 2>&1; then
  print '請先安裝 Node.js 22 或更新版本，再開啟本檔。'
  read '?按 Enter 結束'
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci || exit 1
fi
npm run dev -- --open

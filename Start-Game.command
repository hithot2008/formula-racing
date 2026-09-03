#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if ! command -v npm >/dev/null 2>&1; then
  print 'Please install Node.js 22 or later, then run Start-Game.command again.'
  read '?Press Enter to close'
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci || exit 1
fi
npm run dev -- --open

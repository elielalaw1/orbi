#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
# Prefer the compatible Node 22 already installed on this Mac.
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v npm >/dev/null 2>&1; then
  echo 'Node.js/npm was not found. Install Node.js 22.12+ first.'
  read -r -p 'Press Return to close. ' answer
  exit 1
fi
if [ ! -f dist/index.html ]; then
  echo 'Building ORBI...'
  if ! npm run build; then
    echo 'Build failed. See RUN.md; on a new computer run npm ci first.'
    read -r -p 'Press Return to close. ' answer
    exit 1
  fi
fi
echo ''
echo 'ORBI — open Google Chrome at http://localhost:4173/'
echo 'Keep this window open. Press Control + C here to stop.'
echo ''
if ! npm run preview -- --host 127.0.0.1 --port 4173 --strictPort; then
  echo 'Could not start. If port 4173 is in use, try http://localhost:4173/ in Chrome.'
  read -r -p 'Press Return to close. ' answer
  exit 1
fi

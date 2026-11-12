#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo 'Usage: bash scripts/convert-fallback.sh recording.webm B03_team_ORBI_2048x2048_30fps.mp4' >&2
  exit 1
fi
# The Python helper also exports synchronized, separate mono WAV channels.
exec python3 "$(dirname "$0")/prepare-delivery.py" "$1" "$2"

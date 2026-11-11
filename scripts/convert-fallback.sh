#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo 'Usage: bash scripts/convert-fallback.sh input.webm output.mp4' >&2
  exit 1
fi
# One-frame white circle on black provides the official sync flash without lighting corners.
# Use only in a delivery file; the live experience never flashes.
ffmpeg -hide_banner -y -f lavfi -i 'color=c=black:s=2048x2048:r=30:d=0.033333333' -i "$1" \
  -filter_complex "[0:v]geq=lum='if(lte((X-1024)*(X-1024)+(Y-1024)*(Y-1024),1046529),235,16)':cb=128:cr=128,setsar=1,setpts=PTS-STARTPTS[sync];[1:v]scale=2048:2048:flags=lanczos,fps=30,setsar=1,format=yuv420p,setpts=PTS-STARTPTS[clip];[sync][clip]concat=n=2:v=1:a=0,format=yuv420p[v]" \
  -map '[v]' -an -c:v libx264 -profile:v high -preset medium \
  -b:v 72M -minrate 72M -maxrate 72M -bufsize 144M -x264-params 'nal-hrd=cbr:force-cfr=1:vbv-init=1.0' \
  -pix_fmt yuv420p -r 30 -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -movflags +faststart "$2"

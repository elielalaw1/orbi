#!/usr/bin/env python3
"""Check exported Track B files. Human dome/performance checks remain mandatory."""
import argparse
import array
import json
from pathlib import Path
import re
import subprocess
import wave


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', type=Path)
    args = parser.parse_args()
    root = args.folder
    if not re.fullmatch(r'B\d{2}_[A-Za-z0-9-]+_[A-Za-z0-9-]+', root.name):
        parser.error('Folder must be B##_teamname_TITLE with actual assigned number/team.')
    base = root.name
    video = root / 'fallback' / f'{base}_2048x2048_30fps.mp4'
    errors = []
    def check(condition, message):
        if not condition:
            errors.append(message)
    def probe(path):
        return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(path)]))
    if not video.exists():
        parser.error(f'Missing full-quality master: {video}')
    streams = probe(video)['streams']
    v = next((s for s in streams if s['codec_type'] == 'video'), {})
    check(not any(s['codec_type'] == 'audio' for s in streams), 'MP4 must not contain audio')
    check((v.get('width'), v.get('height')) == (2048, 2048), 'Video must be 2048 square')
    check(v.get('codec_name') in ('h264', 'hevc'), 'Use H.264 or H.265')
    if v.get('codec_name') == 'h264':
        check(v.get('profile') == 'High', 'H.264 must use High profile')
    check(v.get('pix_fmt') == 'yuv420p', 'Use 8-bit yuv420p')
    check(all(v.get(k) == 'bt709' for k in ('color_space', 'color_transfer', 'color_primaries')), 'Rec.709 tags missing')
    check(float(v.get('bit_rate', 0)) >= 60000000, 'Full master bitrate below 60 Mbit/s')
    frames = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'json', str(video)]))['frames']
    times = [float(f['best_effort_timestamp_time']) for f in frames]
    check(len(times) > 1 and all(abs(b-a-1/30) < .0001 for a,b in zip(times,times[1:])), 'Decoded frame timestamps are not constant 30fps')
    pixels = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(video), '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
    def pixel(x, y):
        start = (y * 2048 + x) * 3
        return pixels[start:start+3]
    check(all(max(pixel(x,y)) <= 3 for x,y in ((0,0),(2047,0),(0,2047),(2047,2047))), 'Sync frame corners are not black')
    check(min(pixel(1024,1024)) >= 245, 'First picture frame must contain white sync flash')
    for channel in ('L', 'R'):
        wav = root / 'audio' / f'{base}_48k16_{channel}.wav'
        if not wav.exists():
            errors.append(f'Missing {wav.name}')
            continue
        with wave.open(str(wav)) as audio:
            check((audio.getnchannels(),audio.getframerate(),audio.getsampwidth()) == (1,48000,2), f'{channel}: require mono 48kHz 16-bit PCM')
            check(abs(audio.getnframes()-len(times)*1600) <= 1, f'{channel}: audio length differs from video')
            first = array.array('h', audio.readframes(1600))
            crossings = sum(a <= 0 < b for a,b in zip(first,first[1:]))
            check(32 <= crossings <= 34 and max(first,default=0) > 100, f'{channel}: first frame does not have a 1kHz sync tone')
    check((root / 'runbook.md').is_file(), 'Missing runbook.md')
    print(json.dumps({'file_checks_passed': not errors, 'errors': errors,
        'manual_checks_required': ['Watch entire final file in official simulator; check corners throughout',
        'Listen to final L/R with picture', 'Verify source uses160 degree projection',
        'Confirm actual capture performance; CFR alone can hide duplicated frames',
        'Rehearse HDMI3840x2160, Dante stereo, fallback playback and under2minute start']}, indent=2))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()

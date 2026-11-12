#!/usr/bin/env python3
"""Convert an actual performance capture into Wisdome video + stereo mono WAVs."""
import argparse
import json
from pathlib import Path
import re
import subprocess


def run(args):
    subprocess.run(args, check=True)


def probe(path):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)
    ]))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path)
    parser.add_argument('video', type=Path)
    args = parser.parse_args()
    if not re.fullmatch(r'B\d{2}_[A-Za-z0-9-]+_[A-Za-z0-9-]+_2048x2048_30fps\.mp4', args.video.name):
        parser.error('Use B##_teamname_TITLE_2048x2048_30fps.mp4 (letters, digits or hyphens in team/title).')
    if args.capture.resolve() == args.video.resolve():
        parser.error('Input and output must differ.')
    source = probe(args.capture)
    videos = [s for s in source['streams'] if s['codec_type'] == 'video']
    audios = [s for s in source['streams'] if s['codec_type'] == 'audio']
    if not videos or videos[0]['width'] != videos[0]['height']:
        parser.error('Capture must be a square dome master, without interface or HDMI sidebars.')
    if videos[0]['width'] < 2048:
        parser.error('Capture is below 2048 square. Record again at 2048; upscaling cannot recover detail.')
    if not audios or audios[0].get('channels') != 2:
        parser.error('Capture must contain stereo audio. Enable Orbi audio and record the actual performance again.')
    args.video.parent.mkdir(parents=True, exist_ok=True)
    base = args.video.stem.removesuffix('_2048x2048_30fps')
    audio_dir = args.video.parent.parent / 'audio' if args.video.parent.name == 'fallback' else args.video.parent / 'audio'
    audio_dir.mkdir(parents=True, exist_ok=True)
    left = audio_dir / f'{base}_48k16_L.wav'
    right = audio_dir / f'{base}_48k16_R.wav'
    for path in (args.video, left, right):
        if path.exists():
            parser.error(f'Refusing to overwrite {path}; move the previous export first.')
    # Exactly one 30fps sync frame, black outside the circular aperture.
    vf = ("[0:v]geq=lum='if(lte((X-1024)*(X-1024)+(Y-1024)*(Y-1024),1046529),235,16)':cb=128:cr=128,"
          'setsar=1,setpts=PTS-STARTPTS[sync];'
          '[1:v]scale=2048:2048:flags=lanczos,fps=30,setsar=1,format=yuv420p,setpts=PTS-STARTPTS[clip];'
          '[sync][clip]concat=n=2:v=1:a=0,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709[v]')
    run(['ffmpeg', '-hide_banner', '-nostdin', '-n', '-f', 'lavfi', '-i',
         'color=c=black:s=2048x2048:r=30:d=0.033333333', '-i', str(args.capture),
         '-filter_complex', vf, '-map', '[v]', '-an', '-c:v', 'libx264',
         '-profile:v', 'high', '-preset', 'medium', '-b:v', '72M', '-minrate', '72M',
         '-maxrate', '72M', '-bufsize', '144M', '-x264-params', 'nal-hrd=cbr:force-cfr=1:vbv-init=1.0',
         '-pix_fmt', 'yuv420p', '-r', '30', '-color_primaries', 'bt709', '-color_trc', 'bt709',
         '-colorspace', 'bt709', '-movflags', '+faststart', str(args.video)])
    v = next(s for s in probe(args.video)['streams'] if s['codec_type'] == 'video')
    samples = round(int(v['nb_frames']) * 48000 / 30)
    # 1600 samples = one frame. Prepend the tone, retaining the captured soundtrack after it.
    af = (f'[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,asetpts=PTS-STARTPTS[capture];'
          '[1:a]aformat=sample_fmts=fltp:channel_layouts=stereo[tone];'
          f'[tone][capture]concat=n=2:v=0:a=1,apad,atrim=end_sample={samples},'
          'channelsplit=channel_layout=stereo[L][R]')
    run(['ffmpeg', '-hide_banner', '-nostdin', '-n', '-i', str(args.capture), '-f', 'lavfi',
         '-i', 'sine=frequency=1000:sample_rate=48000:duration=0.033333333',
         '-filter_complex', af, '-map', '[L]', '-ar', '48000', '-c:a', 'pcm_s16le', '-channel_layout', 'mono', str(left),
         '-map', '[R]', '-ar', '48000', '-c:a', 'pcm_s16le', '-channel_layout', 'mono', str(right)])
    manifest = {'source': str(args.capture.resolve()), 'video': str(args.video.resolve()),
                'audio': [str(left.resolve()), str(right.resolve())], 'frames': int(v['nb_frames']),
                'duration_seconds': samples / 48000,
                'requires_human_review': ['Watch complete final MP4 in official simulator',
                    'Listen to both final WAVs in sync', 'Verify 160 degree source projection, comfort and sustained capture frame rate',
                    'Confirm performance matches fallback; rehearse HDMI and Dante in venue']}
    args.video.with_suffix('.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()

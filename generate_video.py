import os
import subprocess
import wave
import math
import struct

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
scene1_img = os.path.join(base_dir, "src/assets/images/creator_scene_one_1787919392319.jpg")
scene2_img = os.path.join(base_dir, "src/assets/images/creator_scene_two_1787919414689.jpg")
out_dir = "/tmp/video_build"
os.makedirs(out_dir, exist_ok=True)

# 1. Generate an upbeat dynamic electronic soundtrack with beat drops, chords, and celebration chimes
sample_rate = 44100
total_duration = 15.0 # seconds
n_samples = int(total_duration * sample_rate)

audio_path = os.path.join(out_dir, "soundtrack.wav")
with wave.open(audio_path, 'w') as wav_file:
    wav_file.setnchannels(2) # Stereo
    wav_file.setsampwidth(2) # 16-bit
    wav_file.setframerate(sample_rate)

    chord_seq = [
        [220.0, 261.63, 329.63], # Am
        [174.61, 220.0, 261.63], # F
        [261.63, 329.63, 392.0], # C
        [196.0, 246.94, 293.66], # G
    ]

    frames = bytearray()
    for i in range(n_samples):
        t = i / sample_rate
        chord_idx = int((t % 15.0) / 3.75) % len(chord_seq)
        current_chord = chord_seq[chord_idx]

        pad = sum(0.12 * math.sin(2 * math.pi * freq * t) for freq in current_chord)
        bass_freq = current_chord[0] / 2.0
        bass = 0.22 * math.sin(2 * math.pi * bass_freq * t)
        
        beat_t = t % 0.5
        beat_num = int(t / 0.5) % 4
        
        kick = 0.0
        if beat_num in (0, 2) and beat_t < 0.15:
            decay = math.exp(-beat_t * 25)
            kick = 0.35 * math.sin(2 * math.pi * 65 * math.exp(-beat_t * 15) * beat_t) * decay

        snare = 0.0
        if beat_num in (1, 3) and beat_t < 0.18:
            decay = math.exp(-beat_t * 20)
            snare = 0.25 * (math.sin(2 * math.pi * 240 * beat_t) + 0.5 * math.sin(2 * math.pi * 480 * beat_t)) * decay

        hihat_t = t % 0.25
        hihat = 0.0
        if hihat_t < 0.05:
            hihat = 0.08 * math.sin(2 * math.pi * 3200 * hihat_t) * math.exp(-hihat_t * 60)

        ding = 0.0
        if 7.2 <= t <= 10.0:
            dt = t - 7.2
            ding = 0.35 * (math.sin(2 * math.pi * 1046.5 * dt) + 0.5 * math.sin(2 * math.pi * 2093.0 * dt)) * math.exp(-dt * 2.5)

        total_signal = pad + bass + kick + snare + hihat + ding
        val = max(-1.0, min(1.0, total_signal * 0.85))
        int_val = int(val * 32767)
        frames.extend(struct.pack('<hh', int_val, int_val))

    wav_file.writeframes(frames)

print(f"Soundtrack generated: {audio_path}")

part1_mp4 = os.path.join(out_dir, "part1.mp4")
font_path = "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"

vf_part1 = (
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
    "zoompan=z='min(zoom+0.0008,1.15)':d=225:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920,"
    f"drawtext=fontfile='{font_path}':text='CREATOR STRATEGY • STEP 1':fontcolor=white:fontsize=38:box=1:boxcolor=0x1E1B4B@0.85:boxborderw=18:x=(w-text_w)/2:y=180,"
    f"drawtext=fontfile='{font_path}':text='#viral  #contentcreator  #trending  #growth':fontcolor=0x38BDF8:fontsize=34:box=1:boxcolor=0x0F172A@0.8:boxborderw=14:x=(w-text_w)/2:y=280,"
    f"drawtext=fontfile='{font_path}':text='Connecting those hashtags correctly':fontcolor=white:fontsize=46:box=1:boxcolor=0x000000@0.75:boxborderw=20:x=(w-text_w)/2:y=h-360:enable='between(t,0,3.8)',"
    f"drawtext=fontfile='{font_path}':text='generates massive organic engagement!':fontcolor=0x34D399:fontsize=44:box=1:boxcolor=0x000000@0.75:boxborderw=16:x=(w-text_w)/2:y=h-270:enable='between(t,0,3.8)',"
    f"drawtext=fontfile='{font_path}':text='Let me show you how it works':fontcolor=white:fontsize=48:box=1:boxcolor=0x000000@0.75:boxborderw=20:x=(w-text_w)/2:y=h-360:enable='gte(t,3.8)',"
    f"drawtext=fontfile='{font_path}':text='with platform-aware captions!':fontcolor=0xA78BFA:fontsize=44:box=1:boxcolor=0x000000@0.75:boxborderw=16:x=(w-text_w)/2:y=h-270:enable='gte(t,3.8)'"
)

cmd_part1 = [
    "ffmpeg", "-y", "-loop", "1", "-i", scene1_img,
    "-t", "7.5",
    "-vf", vf_part1,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
    part1_mp4
]
print("Running cmd_part1...")
subprocess.run(cmd_part1, check=True)

part2_mp4 = os.path.join(out_dir, "part2.mp4")

vf_part2 = (
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
    "zoompan=z='min(zoom+0.0012,1.20)':d=225:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920,"
    f"drawtext=fontfile='{font_path}':text='VIRAL EXPLOSION • RESULTS':fontcolor=white:fontsize=38:box=1:boxcolor=0x831843@0.85:boxborderw=18:x=(w-text_w)/2:y=180,"
    f"drawtext=fontfile='{font_path}':text='10,000 VIEWS':fontcolor=0xFBBF24:fontsize=46:box=1:boxcolor=0x0F172A@0.85:boxborderw=16:x=(w-text_w)/2:y=280:enable='between(t,0,2.2)',"
    f"drawtext=fontfile='{font_path}':text='100,000+ VIEWS  🔥':fontcolor=0xF97316:fontsize=48:box=1:boxcolor=0x0F172A@0.85:boxborderw=16:x=(w-text_w)/2:y=280:enable='between(t,2.2,4.5)',"
    f"drawtext=fontfile='{font_path}':text='200,000+ VIEWS IN 1 HOUR!  🚀':fontcolor=0x34D399:fontsize=46:box=1:boxcolor=0x0F172A@0.9:boxborderw=18:x=(w-text_w)/2:y=280:enable='gte(t,4.5)',"
    f"drawtext=fontfile='{font_path}':text='This is absolutely insane you guys!':fontcolor=white:fontsize=48:box=1:boxcolor=0x000000@0.75:boxborderw=20:x=(w-text_w)/2:y=h-360:enable='between(t,0,3.8)',"
    f"drawtext=fontfile='{font_path}':text='Look at these metrics!':fontcolor=0xF43F5E:fontsize=44:box=1:boxcolor=0x000000@0.75:boxborderw=16:x=(w-text_w)/2:y=h-270:enable='between(t,0,3.8)',"
    f"drawtext=fontfile='{font_path}':text='We went from 10,000 to over 200,000':fontcolor=white:fontsize=46:box=1:boxcolor=0x000000@0.75:boxborderw=20:x=(w-text_w)/2:y=h-360:enable='gte(t,3.8)',"
    f"drawtext=fontfile='{font_path}':text='in just the last hour!':fontcolor=0x34D399:fontsize=48:box=1:boxcolor=0x000000@0.75:boxborderw=20:x=(w-text_w)/2:y=h-270:enable='gte(t,3.8)'"
)

cmd_part2 = [
    "ffmpeg", "-y", "-loop", "1", "-i", scene2_img,
    "-t", "7.5",
    "-vf", vf_part2,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
    part2_mp4
]
print("Running cmd_part2...")
subprocess.run(cmd_part2, check=True)

final_output = os.path.join(base_dir, "public/onboarding.mp4")

cmd_merge = [
    "ffmpeg", "-y",
    "-i", part1_mp4,
    "-i", part2_mp4,
    "-i", audio_path,
    "-filter_complex",
    "[0:v][1:v]xfade=transition=fade:duration=0.6:offset=6.9[vmerged];"
    "[2:a]afade=t=in:ss=0:d=0.5,afade=t=out:st=13.8:d=0.6[aout]",
    "-map", "[vmerged]",
    "-map", "[aout]",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "22",
    "-c:a", "aac",
    "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    final_output
]

print("Running cmd_merge...")
subprocess.run(cmd_merge, check=True)
print(f"Final merged video successfully saved to: {final_output}")

dist_public = os.path.join(base_dir, "dist")
if os.path.exists(dist_public):
    import shutil
    shutil.copy2(final_output, os.path.join(dist_public, "onboarding.mp4"))
    print("Copied to dist/onboarding.mp4")

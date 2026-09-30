# The mishearing skit's local voices (Kokoro-82M): the cocky speech recognizer and the grocery add-on.
import json, subprocess, soundfile as sf
from kokoro_onnx import Kokoro

OUT = "../../video/public/voice"
k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
lines = {
    "ear-whoops": ("am_puck", "Whoops, missed that.", 1.0),
    "ear-fifteen": ("am_puck", "Fifteen?", 1.0),
    "ear-fifty": ("am_puck", "Fifty?", 1.0),
    "ear-definitely": ("am_puck", "Nah. Definitely fifty.", 0.95),
    "addon-sure": ("af_sky", "Are you sure?", 1.0),
    "addon-added": ("af_sky", "Added.", 1.0),
}
MASTER = "aresample=48000,highpass=f=75,equalizer=f=220:t=q:w=1.1:g=-2.5,equalizer=f=3200:t=q:w=1.3:g=2.5,aexciter=amount=1.6:drive=5.5:blend=0:freq=6500:ceil=18000,treble=g=3.5:f=10000,acompressor=threshold=-21dB:ratio=2.8:attack=6:release=90:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7"
durations = {}
for name, (voice, text, speed) in lines.items():
    samples, rate = k.create(text, voice=voice, speed=speed, lang="en-us")
    sf.write(f"{name}.wav", samples, rate)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{name}.wav", "-af", MASTER, "-c:a", "libmp3lame", "-b:a", "192k", f"{OUT}/{name}.mp3"], check=True)
    durations[name] = round(len(samples) / rate, 3)
json.dump(durations, open(f"{OUT}/skit-durations.json", "w"), indent=1)
print(durations)

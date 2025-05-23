#!/usr/bin/env python3
import asyncio
from media_simulator import simulate_conversation

# test sounds files been done like this using ffmpeg (mp3 -> ulaw):
# ffmpeg -i input.wav -ar 8000 -acodec pcm_mulaw sample.ulaw
# Run like this:
# python scripts/simulate_call.py

if __name__ == "__main__":
    #audio_sequence = [
    #    "../test_speech/sopii_kylla.ulaw",
    #    "../test_speech/vastaus1.ulaw",
    #    "../test_speech/vastaus2.ulaw",
    #    "../test_speech/vastaus3.ulaw",
    #    "../test_speech/patkii.ulaw",
    #    "../test_speech/vastaus4.ulaw",
    #    "../test_speech/vapaa_sana.ulaw",
    #    "../test_speech/hei_hei.ulaw",
    #]
    audio_sequence = [
        "../test_speech/sopii_kylla.ulaw",
        "../test_speech/vastaus1.ulaw",
        "../test_speech/hei_hei.ulaw",
    ]
    uri = "ws://localhost:8000/media-stream"
    asyncio.run(simulate_conversation(audio_sequence, uri))

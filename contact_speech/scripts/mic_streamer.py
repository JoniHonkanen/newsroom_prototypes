import asyncio
import json
import base64
import websockets
import sounddevice as sd
import audioop

#Start main.py
#- wait it starts
#- run this script
# start talking... your speech will be sent to the server and openai will respond
#- stop the script with Ctrl+C

SAMPLE_RATE = 8000
CHUNK_MS = 20
CHUNK_SIZE = int(SAMPLE_RATE * CHUNK_MS / 1000)  # 160 näytettä / 20ms
CHANNELS = 1

MIC_DEVICE_ID = 3  # Vaihda tähän LG UltraGear GP9:n laite-ID, esim. 3 tai 11


def list_devices():
    print(sd.query_devices())


async def stream_microphone(uri, device_id):

    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"event": "start", "start": {"streamSid": "mic-1"}}))

        queue = asyncio.Queue()

        # Callback-funktio mikille, siirtää datan queueen
        def callback(indata, frames, time, status):
            pcm_data = indata.tobytes()
            queue.put_nowait(pcm_data)

        # Avataan mikrofoni
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype="int16",
            blocksize=CHUNK_SIZE,
            callback=callback,
            device=device_id,
        ):
            print("🎤 Mikrofoni käytössä, puhu nyt! Lopeta Ctrl+C.")
            ts = 0
            try:
                while True:
                    pcm_data = await queue.get()
                    mulaw_data = audioop.lin2ulaw(pcm_data, 2)  # 2 tavua/sample
                    payload = base64.b64encode(mulaw_data).decode("utf-8")
                    await ws.send(
                        json.dumps(
                            {
                                "event": "media",
                                "media": {"payload": payload, "timestamp": ts},
                            }
                        )
                    )
                    ts += CHUNK_MS
            except KeyboardInterrupt:
                print("🔴 Tallennus lopetettu.")
                await ws.close()


if __name__ == "__main__":
    # Tarkista laitteet ennen käyttöä
    print("Käytettävissä olevat äänilaitteet:")
    print(sd.query_devices())
    uri = "ws://localhost:8000/media-stream"  # tai oma palvelin
    asyncio.run(stream_microphone(uri, MIC_DEVICE_ID))

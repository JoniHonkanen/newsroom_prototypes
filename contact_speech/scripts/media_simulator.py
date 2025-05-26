import asyncio
import json
import base64
import websockets
from pydub import AudioSegment

conversation_log = []

async def wait_for_ai_response(ws, timeout=10):
    try:
        while True:
            msg = await asyncio.wait_for(ws.recv(), timeout=timeout)
            data = json.loads(msg)
            if data.get("event") == "ai_response_done":
                print("🟢 AI finished responding.")
                conversation_log.append({
                    "speaker": "assistant",
                    "text": "[AI responded]"  # täsmällinen teksti ei ole saatavilla simulaattorista käsin
                })
                break
    except asyncio.TimeoutError:
        print("⚠️ Timeout: No response from AI. Proceeding anyway.")
        conversation_log.append({
            "speaker": "assistant",
            "text": "[no response received]"
        })

async def simulate_conversation(audio_files: list[str], uri: str):
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "event": "start",
            "start": {"streamSid": "sim-1"}
        }))

        for file_path in audio_files:
            print(f"🔊 Sending: {file_path}")
            conversation_log.append({
                "speaker": "user",
                "text": file_path
            })

            seg = AudioSegment.from_file(file_path, format="mulaw", frame_rate=8000, channels=1)
            chunk_length_ms = 20
            chunks = [seg[i:i+chunk_length_ms] for i in range(0, len(seg), chunk_length_ms)]


            ts = 0
            for c in chunks:
                payload = base64.b64encode(c.raw_data).decode("utf-8")
                await ws.send(json.dumps({
                    "event": "media",
                    "media": {
                        "payload": payload,
                        "timestamp": int(ts)
                    }
                }))
                ts += 20
                await asyncio.sleep(0.02)

            print("⏳ Waiting for AI to finish...")
            await wait_for_ai_response(ws)

        await asyncio.sleep(1.0)
        await ws.close()
        print("🔴 Connection closed.")

    # Kirjoita keskusteluloki tiedostoon
    with open("simulaatio_keskustelu.txt", "w", encoding="utf-8") as f:
        for entry in conversation_log:
            f.write(f"{entry['speaker']}: {entry['text']}\n")

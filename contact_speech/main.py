import os
import json
import base64
import sys, asyncio
import websockets
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.websockets import WebSocketDisconnect
from twilio.twiml.voice_response import VoiceResponse, Connect, Say, Stream
from twilio.rest import Client
from prompts import SYSTEM_MESSAGE, TRANSCRIPTION_PROMPT
from dotenv import load_dotenv

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()
twilio_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
NGROK_URL = os.getenv("NGROK_URL")

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("PORT", 8000))
VOICE = "shimmer"
LOG_EVENT_TYPES = [
    "error",
    "response.content.done",
    "rate_limits.updated",
    "response.done",
    "input_audio_buffer.committed",
    "input_audio_buffer.speech_stopped",
    "input_audio_buffer.speech_started",
    "session.created",
]
SHOW_TIMING_MATH = False

# lets log the whole conversation
conversation_log = []
app = FastAPI()

if not OPENAI_API_KEY:
    raise ValueError("Missing the OpenAI API key. Please set it in the .env file.")


@app.get("/", response_class=JSONResponse)
async def index_page():
    return {"message": "Twilio Media Stream Server is running!"}


# This is for both answering and making the CALL


@app.api_route("/incoming-call", methods=["GET", "POST"])
async def handle_incoming_call(request: Request):
    response = VoiceResponse()
    if not NGROK_URL:
        raise ValueError("Missing the NGROK_URL environment variable.")
    connect = Connect()
    connect.stream(url=f"{NGROK_URL.replace('https://','wss://')}/media-stream")
    response.append(connect)
    return HTMLResponse(content=str(response), media_type="application/xml")


# @app.api_route("/incoming-call", methods=["GET", "POST"])
# async def handle_incoming_call(request: Request):
#    """Handle incoming call and return TwiML response to connect to Media Stream."""
#    response = VoiceResponse()
#    # <Say> punctuation to improve text-to-speech flow
#    response.say("This is a interview simulation with OpenAI.", punctuation="exclamation")
#    host = request.url.hostname
#    connect = Connect()
#    print(f"TÄMÄ ON HOST: {host}")
#    if not NGROK_URL:
#        raise ValueError(
#            "Missing the PUBLIC_URL (NGROK_URL) environment variable. Please set it in the .env file."
#        )
#    connect.stream(url=f"{NGROK_URL.replace('https://','wss://')}/media-stream")
#    response.append(connect)
#    return HTMLResponse(content=str(response), media_type="application/xml")


# This endpoint is used to handle the WebSocket connection between Twilio and OpenA's Realtime API.
@app.websocket("/media-stream")
async def handle_media_stream(websocket: WebSocket):
    """Handle WebSocket connections between Twilio and OpenAI."""
    print("Client connected")
    await websocket.accept()

    # "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    async with websockets.connect(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17",
        additional_headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1",
        },
    ) as openai_ws:
        await initialize_session(openai_ws)

        # Connection specific state
        stream_sid = None
        latest_media_timestamp = 0
        last_assistant_item = None
        mark_queue: list[str] = []
        response_start_timestamp_twilio = None

        async def receive_from_twilio():
            nonlocal stream_sid, latest_media_timestamp
            try:
                async for message in websocket.iter_text():
                    data = json.loads(message)

                    if data["event"] == "media":

                        # Päivitä timestamp ja lähetä OpenAI:lle
                        if "timestamp" in data["media"]:
                            latest_media_timestamp = int(data["media"]["timestamp"])
                            if SHOW_TIMING_MATH:
                                print(
                                    f"[DEBUG] received media at {latest_media_timestamp}ms from user"
                                )
                        await openai_ws.send(
                            json.dumps(
                                {
                                    "type": "input_audio_buffer.append",
                                    "audio": data["media"]["payload"],
                                }
                            )
                        )

                    elif data["event"] == "start":
                        stream_sid = data["start"]["streamSid"]
                        print(f"[DEBUG] Incoming stream has started {stream_sid}")
                        response_start_timestamp_twilio = None
                        latest_media_timestamp = 0
                        last_assistant_item = None

                    elif data["event"] == "mark" and mark_queue:
                        mark_queue.pop(0)

            except WebSocketDisconnect:
                print("Client disconnected.")
                await openai_ws.close()
            finally:
                # Kirjoita loki tiedostoon aina kun yhteys sulkeutuu
                with open("conversation_log.json", "w", encoding="utf-8") as f:
                    json.dump(conversation_log, f, ensure_ascii=False, indent=2)

        async def send_to_twilio():
            nonlocal stream_sid, last_assistant_item, response_start_timestamp_twilio
            try:
                async for openai_message in openai_ws:
                    response = json.loads(openai_message)

                    if (
                        response.get("type")
                        == "conversation.item.input_audio_transcription.completed"
                    ):
                        transcript_text = response.get("transcript", "").strip()
                        print(f"🎤 Käyttäjä sanoi: {transcript_text}")
                        if transcript_text:
                            print(f"[DEBUG] User transcript: {transcript_text}")
                            conversation_log.append(
                                {"speaker": "user", "text": transcript_text}
                            )

                    # if response["type"] in LOG_EVENT_TYPES:
                    #    print(f"[EVENT] {response['type']}", response)

                    # Kerää AI:n transkriptioita
                    if (
                        response.get("type") == "response.audio.delta"
                        and "delta" in response
                    ):
                        # debug: näytä delta-paketin koko
                        if SHOW_TIMING_MATH:
                            size = len(response["delta"])
                            print(f"[DEBUG] audio.delta size={size}")
                        # ei talleta tässä, transcriptit kerätään response.done
                    if response.get("type") == "response.done":
                        if SHOW_TIMING_MATH:
                            print("[DEBUG] response.done received")
                        for item in response.get("response", {}).get("output", []):
                            if item.get("type") == "message":
                                last_assistant_item = item.get("id")
                                for part in item.get("content", []):
                                    if (
                                        part.get("type") == "audio"
                                        and "transcript" in part
                                    ):
                                        conversation_log.append(
                                            {
                                                "speaker": "assistant",
                                                "text": part["transcript"],
                                            }
                                        )
                                        ### LISÄTTY PRINTTI ###
                                        print(f"OpenAI Assistant: {part['transcript']}")
                                        ######################

                    # Lähetä audiopalasia
                    if response.get("type") == "response.audio.delta":
                        audio_payload = base64.b64encode(
                            base64.b64decode(response["delta"])
                        ).decode("utf-8")
                        await websocket.send_json(
                            {
                                "event": "media",
                                "streamSid": stream_sid,
                                "media": {"payload": audio_payload},
                            }
                        )
                        if response_start_timestamp_twilio is None:
                            response_start_timestamp_twilio = latest_media_timestamp
                            if SHOW_TIMING_MATH:
                                print(
                                    f"[DEBUG] set response_start_timestamp={response_start_timestamp_twilio}ms"
                                )
                        await send_mark(websocket, stream_sid)

                    # Simulaattorin signaali: AI-puhe valmis
                    if response.get("type") == "response.audio.done":
                        print("✔️ AI finished audio response — sending ai_response_done")
                        await websocket.send_json({"event": "ai_response_done"})

                    # Käyttäjän puheen alkaminen keskeyttää
                    if response.get("type") == "input_audio_buffer.speech_started":
                        print("Speech started detected.")
                        if last_assistant_item:
                            print(f"Interrupting response id={last_assistant_item}")
                            await handle_speech_started_event()

            except Exception as e:
                print(f"Error in send_to_twilio: {e}")

        async def send_mark(
            connection, stream_sid_local
        ):  # Nimi muutettu konfliktin välttämiseksi
            """Send mark events to Twilio to indicate audio chunks have been sent."""
            if stream_sid_local:  # Käytetään paikallista muuttujaa
                mark_event = {
                    "event": "mark",
                    "streamSid": stream_sid_local,  # Käytetään paikallista muuttujaa
                    "mark": {"name": "responsePart"},
                }
                await connection.send_json(mark_event)
                mark_queue.append("responsePart")
                if SHOW_TIMING_MATH:
                    print("[DEBUG] sent mark=responsePart")

        async def handle_speech_started_event():
            """Truncate AI response when user starts speaking."""
            nonlocal response_start_timestamp_twilio, last_assistant_item, stream_sid  # stream_sid lisätty nonlocal
            if response_start_timestamp_twilio is not None:
                elapsed = latest_media_timestamp - response_start_timestamp_twilio
            else:
                elapsed = 0
            if SHOW_TIMING_MATH:
                print(f"[DEBUG] truncating at {elapsed}ms")
            truncate_event = {
                "type": "conversation.item.truncate",
                "item_id": last_assistant_item,
                "content_index": 0,
                "audio_end_ms": elapsed,
            }
            await openai_ws.send(json.dumps(truncate_event))
            await websocket.send_json({"event": "clear", "streamSid": stream_sid})
            mark_queue.clear()
            last_assistant_item = None
            response_start_timestamp_twilio = None

        # Suorita vastaanotto ja lähetys rinnakkain
        await asyncio.gather(receive_from_twilio(), send_to_twilio())

    # WebSocket sulkeutui → tallenna loki
    with open("conversation_log.json", "w", encoding="utf-8") as f:
        json.dump(conversation_log, f, ensure_ascii=False, indent=2)


# Initialize the session with OpenAI Realtime API
async def send_initial_conversation_item(openai_ws):
    """Send initial conversation item if AI talks first."""
    initial_conversation_item = {
        "type": "conversation.item.create",
        "item": {
            "type": "message",
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "Hello! This is AI, who is calling and what do you want?",
                }
            ],
        },
    }
    await openai_ws.send(json.dumps(initial_conversation_item))
    await openai_ws.send(json.dumps({"type": "response.create"}))


async def initialize_session(openai_ws):
    """Control initial session with OpenAI."""
    # TURN DETECTION -> NOTICE IF CLIENT IS ANSWERING
    # CHECK HERE more information: https://platform.openai.com/docs/guides/realtime-vad
    session_update = {
        "type": "session.update",
        "session": {
            "turn_detection": {
                "type": "server_vad",  # Server-side Voice Activity Detection
                "threshold": 0.3,  # 0-1, when talk is detected, 1 for loud environments...
                "prefix_padding_ms": 200,  # Add 200ms before detected speech start
                "silence_duration_ms": 300,  # 300ms of silence to end the speech
                "create_response": True, # this means that AI will start the conversation
                "interrupt_response": True,
            },
            "input_audio_format": "g711_ulaw",
            "output_audio_format": "g711_ulaw",
            "input_audio_transcription": {
                "model": "gpt-4o-mini-transcribe",
                "prompt": TRANSCRIPTION_PROMPT,
                "language": "fi",
            },
            "voice": VOICE,
            "instructions": SYSTEM_MESSAGE,
            "modalities": ["text", "audio"],
            "temperature": 0.6,  # min value for this is 0.6... error if you go below it
        },
    }
    print("Sending session update:", json.dumps(session_update))
    await openai_ws.send(json.dumps(session_update))
    # await asyncio.sleep(0.2)

    # AI STARTS THE CONVERSATION!!!!
    # await send_initial_conversation_item(openai_ws)


#  for calling with Twilio
def call_and_connect():
    twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
    if not twilio_phone_number:
        raise ValueError(
            "Missing the Twilio phone number. Please set it in the .env file."
        )

    # Make sure to replace <ngrok-osoitteesi> with your actual ngrok address
    to_number = os.getenv("WHERE_TO_CALL")
    if not to_number:
        raise ValueError(
            "Missing the WHERE_TO_CALL environment variable. Please set it in the .env file."
        )

    call = twilio_client.calls.create(
        to=to_number,
        from_=twilio_phone_number,
        url="https://5cca-88-112-228-107.ngrok-free.app/incoming-call",
    )
    # asmaa 0403202768
    print(f"Call initiated, SID={call.sid}")


@app.post("/trigger-call")
async def trigger_call():
    call_and_connect()
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)

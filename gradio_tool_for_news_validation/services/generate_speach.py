from openai import OpenAI
import base64

client = OpenAI()

def generate_speech(text: str = None, voice: str = "nova", filename: str = "speech.mp3") -> str:
    
    print("Generating speech... test")

    if not text:
        text = "Hello! I am a Bengal cat enjoying the mountains."

    print(f"Generating speech for: {text!r}")

    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
        response_format="mp3"
    )

    # Lue binäärivaste
    audio_bytes = response.read()
    with open(filename, "wb") as f:
        f.write(audio_bytes)

    audio_bytes = response.read()
    return base64.b64encode(audio_bytes).decode("utf-8")

if __name__ == "__main__":
    audio_b64 = generate_speech()
    print("Base64 MP3:", audio_b64)

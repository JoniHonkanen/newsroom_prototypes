# Twilio–OpenAI Interview Transcription Server (Prototype)

**This is a prototype implementation.**  
In production, the system will work so that a separate agent sends the interview questions (which are then integrated into the AI prompt), the phone interview is transcribed and saved to a database, and the resulting structured data is passed to a news-generation agent for automatic news story creation.

---

This project enables **real-time phone interview transcription and conversation logging** using Twilio's Media Stream and OpenAI's Realtime API. All utterances are saved to JSON files, which can be further imported into a database for downstream processing.

## Features

* Answers incoming phone calls using Twilio Media Stream
* Routes speech to OpenAI's transcription and language model
* Logs all turns both as a raw chronological log and as combined speaker turns
* All communication is over WebSocket
* Built on FastAPI
* Uses ngrok for public webhook connectivity in development

## Technologies & Dependencies

* [Twilio Programmable Voice](https://www.twilio.com/docs/voice)
* [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
* [ngrok](https://ngrok.com/) (to expose local development server to the public internet)
* FastAPI
* Python 3.9+
* [dotenv](https://pypi.org/project/python-dotenv/)
* [websockets](https://pypi.org/project/websockets/)

## Environment Variables (.env)

Create a `.env` file in your project root with the following content:

```env
OPENAI_API_KEY=FILL_ME
TWILIO_ACCOUNT_SID=FILL_ME
TWILIO_AUTH_TOKEN=FILL_ME
TWILIO_PHONE_NUMBER=FILL_ME
NGROK_AUTHTOKEN=FILL_ME
NGROK_URL=FILL_ME
WHERE_TO_CALL=FILL_ME_PHONENUMBER
```

**All services require their own API keys!**
Twilio requires API keys and a registered number, OpenAI requires a GPT-4o Realtime API key, ngrok requires your own account and public URL.

You can install ngrok from here: https://ngrok.com/

## Getting Started

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Start ngrok (for example, if you use port 8000):

   ```bash
   ngrok http 8000
   ```

   Copy the HTTPS address from ngrok and set it to `NGROK_URL` in your `.env` file.

3. Start the server:

   ```bash
   uvicorn <your_code_file>:app --host 0.0.0.0 --port 8000
   ```

4. In Twilio console, set the webhook for your phone number to:

   ```
   https://<ngrok-url>/incoming-call
   ```

5. Trigger an outgoing call by calling the `/trigger-call` endpoint (for example, with Postman).
or -> curl -X POST http://localhost:8000/trigger-call

## Data Storage

* **conversation\_log.json** contains the full raw conversation, all utterances in chronological order.
* **conversation\_turns.json** contains combined turns for each speaker (consecutive utterances merged), easier for post-processing or database storage.

## Notes

* The application only works if all environment variables are properly set.
* In development, use ngrok to make your local API accessible from the internet.
* Do **not** share your Twilio and OpenAI API keys publicly!
* The code can be easily extended for automatic database storage or further automation.


## Test Scripts
Additional scripts for testing can be found in the contact_speech/scripts directory.
Note: These scripts are mainly for development and experimentation; their functionality may be incomplete or unstable.
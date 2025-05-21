import re
import os, smtplib
import email
import uuid
from imapclient import IMAPClient
from email.message import EmailMessage, Message
from dotenv import load_dotenv
from typing import Any, Dict, List, Tuple, Optional
from mailparser_reply import EmailReplyParser

from database.db import (
    init_db,
    store_sent_email,
    store_reply,
    inspect_db,
    fetch_full_email_thread,
)

load_dotenv()

parser = EmailReplyParser(languages=["en", "fi"])

# HOW THIS SHOULD WORK
# 1. AGENT SEND EMAIL AND ASK QUESTIONS RELATED TO NEWS
# 2. EMAIL ID IS STORED TO DATABASE
# 3. WHEN WE GET EMAIL AS REPLY, WE READ IT AND CHECK WHAT MESSAGE IT IS RELATED TO
# 4. WE SAVE REPLY TO DATABASE AND LINK IT TO THE ORIGINAL MESSAGE
# 5. SEND THANKS MESSAGE TO THE USER :)

mockdata: dict = {
    "news_id": 42,  # just an example of news id
    "recipient": "joni.j.honkanen@tuni.fi",
    "subject": "Kysymyksiä Helsingin kirkkojen pääsymaksuista – journalistinen jatkotutkimus",
    "intro": (
        "Hei,\n\n"
        "Teen juttua Helsingin keskustan kirkkojen pääsymaksuista, joita aletaan periä kesällä "
        "ulkopaikkakuntalaisilta vierailijoilta. Tuloilla on tarkoitus kattaa muun muassa siivous- "
        "ja henkilöstökuluja.\n\n"
        "Haluaisin kysyä muutaman tarkentavan kysymyksen aiheeseen liittyen:"
    ),
    "questions": [
        {
            "topic": "Pääsymaksujen vaikutus",
            "questions": [
                "Miten arvioitte pääsymaksujen vaikuttavan kirkkojen kävijämääriin ja kävijäkokemukseen?"
            ],
        },
        {
            "topic": "Kirkkopassi",
            "questions": [
                "Miten kirkkopassi toimii käytännössä, ja miten sen käyttöä valvotaan?"
            ],
        },
        {
            "topic": "Taloudellinen tavoite",
            "questions": [
                "Kuinka suuren osan toiminnan kustannuksista pääsymaksuilla arvioidaan katettavan?"
            ],
        },
        {
            "topic": "Kirkon avoimuus",
            "questions": [
                "Miten maksullisuus sovitetaan yhteen kirkon periaatteiden, kuten avoimuuden, kanssa?"
            ],
        },
    ],
    "outro": (
        "Kiitos ajastanne! Vastaukset käsitellään osana tekoälyavusteista tutkimusta, jossa tekoäly toimii journalistina."
        "https://www.tuni.fi/fi/tutkimus/tekoalyn-johtama-uutistoimitus"
    ),
    "signature": ("Teppo Tekoälyjournalisti\n" "– tutkimushanke Tampereen yliopisto"),
}


# SENDING EMAILS
# This function sends an email using the SMTP protocol.
def send_email_tool(
    to: str, subject: str, plain_text: str, html_body: str
) -> Tuple[bool, str, str]:
    # pakolliset ympäristömuuttujat, KeyError jos puuttuu
    email_host: str = os.environ["EMAIL_HOST_GMAIL"]
    email_port_str: str = os.environ["EMAIL_PORT"]
    email_address_sender: str = os.environ["EMAIL_ADDRESS_GMAIL"]
    email_password: str = os.environ["EMAIL_PASSWORD_GMAIL"]

    try:
        email_port = int(email_port_str)
    except ValueError:
        return False, "Invalid EMAIL_PORT (must be an integer)", "None"

    msg = EmailMessage()
    msg["From"] = email_address_sender
    msg["To"] = to
    msg["Subject"] = subject
    # best practice is to use plain text and html body, so plain text is used as fallback
    msg.set_content(plain_text)
    msg.add_alternative(html_body, subtype="html")

    msg_id = generate_message_id()
    msg["Message-ID"] = msg_id

    try:
        with smtplib.SMTP(email_host, email_port) as smtp:
            smtp.starttls()
            smtp.login(email_address_sender, email_password)
            smtp.send_message(msg)
        return True, f"Email sent to {to}", msg_id
    except Exception as e:
        return False, f"Failed to send email: {e}", "None"


# We want to generate a unique message ID for each email we send and store it to the database.
# We use this id to check if the received email is reply to our email.
# example: Message-ID: <2c8a1d42-cd1b-4d2f-a7d5-3ae6f69a78bd@example.com>
def generate_message_id(domain: Optional[str] = None) -> str:
    if domain is None:
        email_addr = os.getenv("EMAIL_ADDRESS_GMAIL", "example@example.com")
        domain = email_addr.split("@")[-1]
    unique_id = uuid.uuid4()
    return f"<{unique_id}@{domain}>"


# first send email and then store it to the database
def send_and_store_email(data: dict, db_path: str = "test.db") -> tuple[bool, str, str]:

    conn = init_db(db_path)

    plain_text, html_body = build_email_body(data)
    to = data["recipient"]
    subject = data["subject"]

    questions = [
        (block["topic"], q) for block in data["questions"] for q in block["questions"]
    ]

    success, message, msg_id = send_email_tool(
        to=to,
        subject=subject,
        plain_text=plain_text,
        html_body=html_body,
    )

    print(success, message, msg_id)

    if success:
        store_sent_email(conn, msg_id, to, subject, questions, data["news_id"])

    return success, message, msg_id


# READING EMAILS
# This function reads emails from the inbox using the IMAP protocol.
def read_email_tool(
    folder: str = "INBOX", unseen_only: bool = True, conn=None
) -> List[Dict[str, Any]]:
    if conn is None:
        conn = init_db("test.db")

    print("Reading emails...")
    host: str = os.environ["IMAP_HOST_GMAIL"]
    port_str: str = os.environ["IMAP_PORT"]
    user: str = os.environ["EMAIL_ADDRESS_GMAIL"]
    pwd: str = os.environ["EMAIL_PASSWORD_GMAIL"]

    try:
        port: int = int(port_str)
    except ValueError:
        raise ValueError("Invalid IMAP_PORT (must be an integer)")

    with IMAPClient(host, port) as client:
        client.login(user, pwd)

        available_folders = [f[2] for f in client.list_folders()]
        print(f"Available folders: {available_folders}")
        if folder not in available_folders:
            raise ValueError(
                f"Folder '{folder}' not found. Available folders: {available_folders}"
            )
        client.select_folder(folder)

        criteria = "UNSEEN" if unseen_only else "ALL"
        print(f"Searching for emails with criteria: {criteria}")
        uids = client.search(criteria)
        if not uids:
            return []

        uids = uids[-5:]
        print(f"Found {len(uids)} emails, processing the last 5...")
        result: List[Dict[str, Any]] = []

        for uid, data in client.fetch(uids, ["RFC822"]).items():
            raw = data.get(b"RFC822")
            if not isinstance(raw, (bytes, bytearray)):
                continue
            msg = email.message_from_bytes(raw)

            if not is_reply(msg):
                print("Skipping: not a reply.")
                continue

            raw = _extract_body(msg)
            clean = clean_reply_body(raw)

            print("RAW: \n", raw)
            print("CLEAN: \n", clean)

            reply = {
                "uid": uid,
                "from": msg["From"],
                "subject": msg["Subject"],
                "in_reply_to": msg.get("In-Reply-To"),
                "references_header": msg.get("References"),
                "body": clean,
            }

            # tallenna vastaus ja linkitä alkuperäiseen viestiin
            stored_id, email_id, reply_dict = store_reply(conn, reply)
            if stored_id is None:
                print("Vastaus oli jo tallennettu, ohitetaan.")
                continue

            # id of original message (what we sent and where is all the questions)
            orig_msg_id = reply_dict["in_reply_to"]
            if email_id is None:
                print("Ei alkuperäistä viestiä, ei linkitetty.")
                # ota ensimmäinen token references_headerista
                tokens = reply_dict["references_header"].split()
                if tokens:
                    orig_msg_id = tokens[0]

            thread_data = fetch_full_email_thread(conn, orig_msg_id)
            if thread_data:
                # This summary_text is the data we want to send to LLM
                summary_text = build_analysis_input(thread_data)
                print("Thread data:", thread_data)
                print("Summary text:", summary_text)
            result.append(reply)

        return result


# we are only interested in replies
def is_reply(msg: Message) -> bool:
    return bool(msg.get("In-Reply-To") or msg.get("References"))


def clean_reply_body(body: str) -> str:
    return parser.parse_reply(text=body) or body


# OUTPUT FROM THIS IS WHAT WE WANT TO SEND LLM!
# IT INCLUDES ORIGINAL QUESTIONS AND ALL THE REPLIES
def build_analysis_input(thread: dict) -> str:
    lines = [f"Aihe: {thread['subject']}\n", "QUESTIONS:\n"]
    for q in thread["questions"]:
        lines.append(f"{q['position']}. ({q['topic']}) {q['question']}")
    lines.append("\nANSWERS:\n")
    for r in thread["replies"]:
        lines.append(f"-- {r['from']} @ {r['received_at']}")
        lines.append(r["body"].strip())
        lines.append("")
    return "\n".join(lines)


# GET BODY OF THE REPLY
def _extract_body(msg: Message) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                charset: str = part.get_content_charset() or "utf-8"
                payload = part.get_payload(decode=True)
                if isinstance(payload, (bytes, bytearray)):
                    try:
                        return payload.decode(charset, errors="replace")
                    except Exception as e:
                        return f"[Decode error: {e}]"
                if isinstance(payload, str):
                    return payload
    else:
        charset: str = msg.get_content_charset() or "utf-8"
        payload = msg.get_payload(decode=True)
        if isinstance(payload, (bytes, bytearray)):
            try:
                return payload.decode(charset, errors="replace")
            except Exception as e:
                return f"[Decode error: {e}]"
        if isinstance(payload, str):
            return payload
    # if we get here, we have no body
    return ""


# We extract the MOCKDATA and build the email body
# best practice is to use plain text and html body, so plain text is used as fallback
def build_email_body(data: dict) -> tuple[str, str]:
    # Plain text -versio
    plain_lines = [data["intro"], ""]
    for topic_block in data["questions"]:
        for question in topic_block["questions"]:
            plain_lines.append(f"- {question}")
        plain_lines.append("")
    plain_lines.append(data.get("outro", ""))
    plain_text = "\n".join(plain_lines)

    # HTML-versio
    # 1 intro
    # 2 questions
    # 3 outro
    # 4 signature
    html_lines = [
        "<html><head><style>",
        "body { font-family: sans-serif; font-size: 16px; line-height: 1.6; color: #000; }",
        "ol { padding-left: 20px; margin-top: 1em; }",
        ".outro { margin-top: 2em; color: #4e008e; font-family: Georgia, serif; }",
        ".signature {",
        "  font-family: Times, 'Times New Roman', serif;",
        "  font-style: italic;",
        "  margin-top: 2em;",
        "  white-space: pre-line;",
        "}",
        "</style></head><body>",
        f"<p>{data['intro'].replace(chr(10), '<br>')}</p>",
        "<ol>",
    ]
    for topic_block in data["questions"]:
        for question in topic_block["questions"]:
            html_lines.append(f"<li>{question}</li>")
    html_lines.append("</ol>")
    # now we detect if there is a link in the outro, but maybe we can hardcode these in the future
    outro_html = auto_link_urls(data.get("outro", "")).replace("\n", "<br>")
    html_lines.append(f"<p class='outro'>{outro_html}</p>")
    html_lines.append(
        f"<p class='signature'>{data.get('signature', '').replace(chr(10), '<br>')}</p>"
    )
    html_lines.append("</body></html>")

    html_text = "\n".join(html_lines)

    return plain_text, html_text


def auto_link_urls(text: str) -> str:
    url_regex = re.compile(r"(https?://[^\s]+)")
    return url_regex.sub(r'<br><a href="\1">\1</a>', text)


if __name__ == "__main__":
    # success, message, msg_id = send_and_store_email(mockdata, db_path="test.db")
    # if success:
    #   print(message)
    # else:
    #   print(f"Virhe sähköpostin lähetyksessä: {message}")

    read_email_tool(
        folder="INBOX",
        unseen_only=True,
    )
    # inspect_db("test.db")

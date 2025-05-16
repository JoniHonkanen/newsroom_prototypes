import os, smtplib
import email
from imapclient import IMAPClient
from email.message import EmailMessage
from dotenv import load_dotenv
import uuid

load_dotenv()

# HOW THIS SHOULD WORK
# 1. AGENT SEND EMAIL AND ASK QUESTIONS RELATED TO NEWS
# 2. EMAIL ID IS STORED TO DATABASE
# 3. WHEN WE GET EMAIL AS REPLY, WE READ IT AND CHECK WHAT MESSAGE IT IS RELATED TO
# 4. WE SAVE REPLY TO DATABASE AND LINK IT TO THE ORIGINAL MESSAGE
# 5. SEND THANKS MESSAGE TO THE USER :)


# SENDING EMAILS
# This function sends an email using the SMTP protocol.
def send_email_tool(to: str, subject: str, body: str) -> str:
    msg = EmailMessage()
    msg["From"] = os.getenv("EMAIL_ADDRESS_GMAIL")
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    msg["Message-ID"] = generate_message_id()

    with smtplib.SMTP(
        os.getenv("EMAIL_HOST_GMAIL"), int(os.getenv("EMAIL_PORT"))
    ) as smtp:
        smtp.starttls()
        smtp.login(os.getenv("EMAIL_ADDRESS_GMAIL"), os.getenv("EMAIL_PASSWORD_GMAIL"))
        smtp.send_message(msg)
    return f"Email sent to {to}"


# We want to generate a unique message ID for each email we send and store it to the database.
# We use this id to check if the received email is reply to our email.
# example: Message-ID: <2c8a1d42-cd1b-4d2f-a7d5-3ae6f69a78bd@example.com>
def generate_message_id(domain: str = None) -> str:
    if domain is None:
        email_addr = os.getenv("EMAIL_ADDRESS_GMAIL", "example@example.com")
        domain = email_addr.split("@")[-1]
    unique_id = uuid.uuid4()
    return f"<{unique_id}@{domain}>"


# READING EMAILS
# This function reads emails from the inbox using the IMAP protocol.
def read_email_tool(folder: str = "INBOX", unseen_only: bool = True) -> list[dict]:
    print("Reading emails...")
    host, port = os.getenv("IMAP_HOST_GMAIL"), int(os.getenv("IMAP_PORT"))
    user, pwd = os.getenv("EMAIL_ADDRESS_GMAIL"), os.getenv("EMAIL_PASSWORD_GMAIL")
    with IMAPClient(host, port) as client:
        client.login(user, pwd)

        available_folders = [f[2] for f in client.list_folders()]
        if folder not in available_folders:
            raise ValueError(
                f"Folder '{folder}' not found. Available folders: {available_folders}"
            )
        print(f"Available folders: {available_folders}")
        client.select_folder(folder)
        print(f"Selected folder: {folder}")
        # check possible criteria
        print(f"CHECK CRITERIES:")
        print(client.capabilities())

        criteria = ["UNSEEN"] if unseen_only else ["ALL"]
        uids = client.search(criteria)
        print(f"Found {len(uids)} matching messages")
        uids = uids[-5:]  # rajoita esim. viimeiseen 5 viestiin
        print(f"Processing UIDs: {uids}")
        if not uids:
            print("No new emails found.")
            return []

        result = []
        for uid, data in client.fetch(uids, ["RFC822"]).items():
            print(f"Processing message UID: {uid}")
            msg = email.message_from_bytes(data[b"RFC822"])

            # we are only interested in replies
            if not is_reply(msg):
                print("Skipping: not a reply.")
                continue

            result.append(
                {
                    "uid": uid,
                    "from": msg["From"],
                    "subject": msg["Subject"],
                    "in_reply_to": msg.get("In-Reply-To"),
                    "references": msg.get("References"),
                    "body": _extract_body(msg),
                }
            )

        print(f"Returning {len(result)} emails.")
        print("Result:")
        for r in result:
            print(f"From: {r['from']}")
            print(f"Subject: {r['subject']}")
            print(f"In-Reply-To: {r['in_reply_to']}")
            print(f"References: {r['references']}")
            print(f"Body: {r['body']}")
            print("-" * 40)

        return result


# we are only interested in replies
def is_reply(msg: email.message.Message) -> bool:
    return bool(msg.get("In-Reply-To") or msg.get("References"))


def _extract_body(msg) -> str:
    print("Extracting body...")
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                charset = part.get_content_charset() or "utf-8"
                try:
                    return part.get_payload(decode=True).decode(
                        charset, errors="replace"
                    )
                except Exception as e:
                    return f"[Decode error: {e}]"
    else:
        charset = msg.get_content_charset() or "utf-8"
        try:
            return msg.get_payload(decode=True).decode(charset, errors="replace")
        except Exception as e:
            return f"[Decode error: {e}]"


if __name__ == "__main__":
    read_email_tool(
        folder="INBOX",
        unseen_only=True,
    )

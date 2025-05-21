import sqlite3


def init_db(path):
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    # Luo taulut, jos eivät vielä ole olemassa
    cur.executescript(
        """
    CREATE TABLE IF NOT EXISTS sent_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
        news_id INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_id INTEGER NOT NULL REFERENCES sent_emails(id),
        topic TEXT,
        question TEXT NOT NULL,
        position INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid INTEGER UNIQUE,
        from_address TEXT,
        in_reply_to TEXT,
        references_header TEXT,
        body TEXT,
        received_at TEXT DEFAULT CURRENT_TIMESTAMP,
        email_id INTEGER REFERENCES sent_emails(id)
    );
    """
    )
    conn.commit()
    return conn


def store_sent_email(conn, message_id, recipient, subject, questions, news_id):

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sent_emails (message_id, recipient, subject, news_id) VALUES (?, ?, ?, ?)",
        (message_id, recipient, subject, news_id),
    )
    email_id = cur.lastrowid
    for i, (topic, qtext) in enumerate(questions, start=1):
        cur.execute(
            "INSERT INTO questions (email_id, topic, question, position) VALUES (?, ?, ?, ?)",
            (email_id, topic, qtext, i),
        )
    conn.commit()
    return email_id


def store_reply(conn, reply_dict):
    cur = conn.cursor()

    # check if uid already exists
    cur.execute("SELECT id FROM replies WHERE uid = ?", (reply_dict["uid"],))
    if cur.fetchone():
        print(f"UID {reply_dict['uid']} already exists – skipping insert.")
        return None, None, reply_dict

    # check if in_reply_to already exists
    cur.execute(
        "SELECT id FROM sent_emails WHERE message_id = ?", (reply_dict["in_reply_to"],)
    )
    row = cur.fetchone()
    email_id = row[0] if row else None

    cur.execute(
        """INSERT INTO replies
           (uid, from_address, in_reply_to, references_header, body, email_id)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            reply_dict["uid"],
            reply_dict["from"],
            reply_dict["in_reply_to"],
            reply_dict["references_header"],
            reply_dict["body"],
            email_id,
        ),
    )
    conn.commit()
    return cur.lastrowid, email_id, reply_dict


# Original email and all the replies for it
def fetch_full_email_thread(conn, message_id: str) -> dict:
    print("fetch_full_email_thread!!!!")
    cur = conn.cursor()

    # Hae alkuperäinen viesti
    cur.execute(
        """
        SELECT id, recipient, subject, sent_at
        FROM sent_emails
        WHERE message_id = ?
    """,
        (message_id,),
    )
    row = cur.fetchone()
    if not row:
        return {}

    email_id, recipient, subject, sent_at = row

    # Hae kysymykset
    cur.execute(
        """
        SELECT topic, question, position
        FROM questions
        WHERE email_id = ?
        ORDER BY position
    """,
        (email_id,),
    )
    questions = cur.fetchall()

    # Hae kaikki vastaukset
    cur.execute(
        """
        SELECT from_address, body, received_at
        FROM replies
        WHERE email_id = ?
        ORDER BY received_at
    """,
        (email_id,),
    )
    replies = cur.fetchall()

    return {
        "message_id": message_id,
        "recipient": recipient,
        "subject": subject,
        "sent_at": sent_at,
        "questions": [
            {"topic": topic, "question": question, "position": position}
            for topic, question, position in questions
        ],
        "replies": [
            {"from": sender, "body": body, "received_at": ts}
            for sender, body, ts in replies
        ],
    }


# koska tuni ei anna asentaa sqlite3.exe niin katsotaan tietokannan sisältöä pythonin kautta...
# on kyl jäykät järjestelmät, taas aikaa hukattu säätämiseen
# kuhan vain puran turhautumistani tänne... :D
def inspect_db(path: str):
    print(f"Tarkastellaan tietokantaa: {path}")
    conn = sqlite3.connect(path)
    cursor = conn.cursor()

    # Listaa kaikki taulut
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print("Tietokannan taulut:")
    for (name,) in tables:
        print(f"\nTaulu: {name}")
        try:
            cursor.execute(f"SELECT * FROM {name}")
            rows = cursor.fetchall()
            for row in rows:
                print(row)
        except Exception as e:
            print(f"Virhe haettaessa tietoja taulusta {name}: {e}")

    conn.close()

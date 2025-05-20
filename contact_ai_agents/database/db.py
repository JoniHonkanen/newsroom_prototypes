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
        sent_at TEXT DEFAULT CURRENT_TIMESTAMP
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
        uid INTEGER,
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


def store_sent_email(conn, message_id, recipient, subject, questions):

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sent_emails (message_id, recipient, subject) VALUES (?, ?, ?)",
        (message_id, recipient, subject),
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
    # hae email_id In-Reply-To:n perusteella
    cur.execute(
        "SELECT id FROM sent_emails WHERE message_id = ?", (reply_dict["in_reply_to"],)
    )
    row = cur.fetchone()
    email_id = row[0] if row else None

    cur.execute(
        """INSERT INTO replies
           (uid, from_address, in_reply_to, references, body, email_id)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            reply_dict["uid"],
            reply_dict["from"],
            reply_dict["in_reply_to"],
            reply_dict["references"],
            reply_dict["body"],
            email_id,
        ),
    )
    conn.commit()
    return cur.lastrowid

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "omnispect.db"

def get_connection():
  conn = sqlite3.connect(DB_PATH)
  conn.row_factory = sqlite3.Row
  return conn

def init_db():
  """Creates the user_lists table on startup if it doesn't exist."""
  with get_connection() as conn:
    conn.execute("""
      CREATE TABLE IF NOT EXISTS user_lists(
        media_id INTEGER PRIMARY KEY,
        status TEXT NOT NULL CHECK(status IN ('watchlist', 'completed'
        )
        )
        )
        """)
    conn.commit()

def toggle_media_status(media_id: int, target_status: str) -> str:
    """
    Toggles an item's status in user_lists.
    Returns 'removed' if already in that status, or target_status if added/switched.
    """
    with get_connection() as conn:
        row = conn.execute(
            "SELECT status FROM user_lists WHERE media_id = ?",
            (media_id,)
        ).fetchone()

        if row and row["status"] == target_status:
            # Already in this list -> remove it (toggle off)
            conn.execute("DELETE FROM user_lists WHERE media_id = ?", (media_id,))
            conn.commit()
            return "removed"
        else:
            # Either not in DB, or switching from watchlist <-> completed
            conn.execute(
                "INSERT OR REPLACE INTO user_lists (media_id, status) VALUES (?, ?)",
                (media_id, target_status)
            )
            conn.commit()
            return target_status


def get_status_ids():
    """Returns two lists of media_ids: (watchlist_ids, completed_ids)"""
    with get_connection() as conn:
        rows = conn.execute("SELECT media_id, status FROM user_lists").fetchall()

    watchlist_ids = [r["media_id"] for r in rows if r["status"] == "watchlist"]
    completed_ids = [r["media_id"] for r in rows if r["status"] == "completed"]
    return watchlist_ids, completed_ids    
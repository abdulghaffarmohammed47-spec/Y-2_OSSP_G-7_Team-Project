import sqlite3
import datetime
from typing import List, Optional
from app.schemas.command import HistoryItem

DB_PATH = "a:\\Downloads(clg)\\OSSP-GUI\\ShellForge-Pro\\backend\\history.db"

class HistoryService:
    @staticmethod
    def _get_conn():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def init_db():
        with HistoryService._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_request TEXT NOT NULL,
                    generated_command TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,
                    exit_code INTEGER NOT NULL,
                    working_directory TEXT NOT NULL
                )
            """)
            conn.commit()

    @staticmethod
    def add(item: HistoryItem) -> HistoryItem:
        HistoryService.init_db()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with HistoryService._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO history (user_request, generated_command, timestamp, status, exit_code, working_directory)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (item.user_request, item.generated_command, now_str, item.status, item.exit_code, item.working_directory))
            conn.commit()
            item.id = cur.lastrowid
            item.timestamp = now_str
            return item

    @staticmethod
    def get_all() -> List[HistoryItem]:
        HistoryService.init_db()
        items = []
        with HistoryService._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM history ORDER BY id DESC LIMIT 100")
            for row in cur.fetchall():
                items.append(HistoryItem(
                    id=row["id"],
                    user_request=row["user_request"],
                    generated_command=row["generated_command"],
                    timestamp=row["timestamp"],
                    status=row["status"],
                    exit_code=row["exit_code"],
                    working_directory=row["working_directory"]
                ))
        return items

    @staticmethod
    def delete(item_id: int) -> bool:
        HistoryService.init_db()
        with HistoryService._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM history WHERE id = ?", (item_id,))
            conn.commit()
            return cur.rowcount > 0

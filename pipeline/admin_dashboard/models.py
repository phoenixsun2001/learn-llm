"""SQLite database schema and CRUD functions for the admin dashboard."""
import json
import logging
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from config import config

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    config.sqlite_db_path
)


def _get_conn() -> sqlite3.Connection:
    """Get a new database connection with row factory."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = _get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS review_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                source_url TEXT,
                source_type TEXT DEFAULT 'rss',
                raw_content TEXT,
                ai_summary TEXT,
                ai_category TEXT,
                ai_difficulty TEXT DEFAULT 'beginner',
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                reviewed_at TEXT,
                reviewed_by TEXT
            );

            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_id TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT DEFAULT 'uncategorized',
                difficulty TEXT DEFAULT 'beginner',
                tags TEXT DEFAULT '[]',
                source_url TEXT,
                file_path TEXT,
                status TEXT DEFAULT 'draft',
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS rss_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                url TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                enabled INTEGER DEFAULT 1,
                last_fetched_at TEXT,
                error_count INTEGER DEFAULT 0
            );
        """)
        conn.commit()
        logger.info(f"Database initialized at {DB_PATH}")
    finally:
        conn.close()


# -------------------- Dashboard Stats --------------------

def get_pending_count() -> int:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT COUNT(*) as cnt FROM review_queue WHERE status='pending'")
        return cur.fetchone()["cnt"]
    finally:
        conn.close()


def get_material_count() -> int:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT COUNT(*) as cnt FROM materials")
        return cur.fetchone()["cnt"]
    finally:
        conn.close()


def get_source_count() -> int:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT COUNT(*) as cnt FROM rss_sources")
        return cur.fetchone()["cnt"]
    finally:
        conn.close()


def get_active_source_count() -> int:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT COUNT(*) as cnt FROM rss_sources WHERE enabled=1")
        return cur.fetchone()["cnt"]
    finally:
        conn.close()


def get_last_fetch_time() -> Optional[str]:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT MAX(last_fetched_at) as ts FROM rss_sources")
        row = cur.fetchone()
        return row["ts"] if row and row["ts"] else None
    finally:
        conn.close()


# -------------------- Review Queue CRUD --------------------

def list_review_queue(
    status: str = "pending",
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.execute(
            """SELECT * FROM review_queue WHERE status=? ORDER BY created_at DESC LIMIT ? OFFSET ?""",
            (status, limit, offset)
        )
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def get_review_item(item_id: int) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT * FROM review_queue WHERE id=?", (item_id,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def insert_review_item(item: Dict[str, Any]) -> int:
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO review_queue
               (title, source_url, source_type, raw_content, ai_summary,
                ai_category, ai_difficulty, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)""",
            (
                item.get("title", "Untitled"),
                item.get("source_url", ""),
                item.get("source_type", "rss"),
                item.get("raw_content", ""),
                item.get("ai_summary", ""),
                item.get("ai_category", "uncategorized"),
                item.get("ai_difficulty", "beginner"),
                datetime.now(timezone.utc).isoformat(),
            )
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def update_review_status(item_id: int, status: str, reviewed_by: str = "admin") -> bool:
    conn = _get_conn()
    try:
        cur = conn.execute(
            """UPDATE review_queue SET status=?, reviewed_at=?, reviewed_by=?
               WHERE id=? AND status='pending'""",
            (status, datetime.now(timezone.utc).isoformat(), reviewed_by, item_id)
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def update_review_item(item_id: int, updates: Dict[str, Any]) -> bool:
    """Update editable fields of a review queue item."""
    allowed = {"title", "source_url", "raw_content", "ai_summary",
               "ai_category", "ai_difficulty", "source_type"}
    set_fields = {k: v for k, v in updates.items() if k in allowed}
    if not set_fields:
        return False

    set_clause = ", ".join(f"{k}=?" for k in set_fields)
    values = list(set_fields.values()) + [item_id]

    conn = _get_conn()
    try:
        cur = conn.execute(
            f"UPDATE review_queue SET {set_clause} WHERE id=?",
            values
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def insert_review_batch(items: List[Dict[str, Any]]) -> int:
    """Insert multiple review items at once. Returns count inserted."""
    count = 0
    conn = _get_conn()
    try:
        now = datetime.now(timezone.utc).isoformat()
        for item in items:
            cur = conn.execute(
                """INSERT OR IGNORE INTO review_queue
                   (title, source_url, source_type, raw_content, ai_summary,
                    ai_category, ai_difficulty, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)""",
                (
                    item.get("title", "Untitled"),
                    item.get("source_url", ""),
                    item.get("source_type", "rss"),
                    item.get("raw_content", ""),
                    item.get("ai_summary", ""),
                    item.get("ai_category", "uncategorized"),
                    item.get("ai_difficulty", "beginner"),
                    now,
                )
            )
            if cur.rowcount > 0:
                count += 1
        conn.commit()
    finally:
        conn.close()
    return count


# -------------------- Materials CRUD --------------------

def list_materials(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        conditions = []
        params = []

        if category:
            conditions.append("category=?")
            params.append(category)
        if difficulty:
            conditions.append("difficulty=?")
            params.append(difficulty)
        if search:
            conditions.append("(title LIKE ? OR content LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%"])
        if status:
            conditions.append("status=?")
            params.append(status)

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        sql = f"SELECT * FROM materials {where} ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cur = conn.execute(sql, params)
        rows = [dict(row) for row in cur.fetchall()]

        # Parse tags from JSON string
        for row in rows:
            try:
                row["tags"] = json.loads(row.get("tags", "[]"))
            except (json.JSONDecodeError, TypeError):
                row["tags"] = []

        return rows
    finally:
        conn.close()


def get_material(material_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.execute(
            "SELECT * FROM materials WHERE material_id=? OR id=?",
            (material_id, material_id)
        )
        row = cur.fetchone()
        if row:
            result = dict(row)
            try:
                result["tags"] = json.loads(result.get("tags", "[]"))
            except (json.JSONDecodeError, TypeError):
                result["tags"] = []
            return result
        return None
    finally:
        conn.close()


def insert_material(item: Dict[str, Any]) -> Optional[str]:
    conn = _get_conn()
    try:
        tags = item.get("tags", [])
        if isinstance(tags, list):
            tags = json.dumps(tags, ensure_ascii=False)

        cur = conn.execute(
            """INSERT OR IGNORE INTO materials
               (material_id, title, content, category, difficulty, tags,
                source_url, file_path, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item.get("material_id", ""),
                item.get("title", "Untitled"),
                item.get("content", ""),
                item.get("category", "uncategorized"),
                item.get("difficulty", "beginner"),
                tags,
                item.get("source_url", ""),
                item.get("file_path", ""),
                item.get("status", "draft"),
                item.get("created_at", datetime.now(timezone.utc).isoformat()),
            )
        )
        conn.commit()
        return item.get("material_id") if cur.lastrowid else None
    finally:
        conn.close()


def update_material(material_id: str, updates: Dict[str, Any]) -> bool:
    allowed = {"title", "content", "category", "difficulty", "tags",
               "source_url", "file_path", "status"}
    set_fields = {k: v for k, v in updates.items() if k in allowed}

    if "tags" in set_fields and isinstance(set_fields["tags"], list):
        set_fields["tags"] = json.dumps(set_fields["tags"], ensure_ascii=False)

    if not set_fields:
        return False

    set_clause = ", ".join(f"{k}=?" for k in set_fields)
    values = list(set_fields.values()) + [material_id]

    conn = _get_conn()
    try:
        cur = conn.execute(
            f"UPDATE materials SET {set_clause} WHERE material_id=? OR id=?",
            values + [material_id]
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def delete_material(material_id: str) -> bool:
    """Soft-delete: archive the material by setting status='archived'."""
    conn = _get_conn()
    try:
        cur = conn.execute(
            "UPDATE materials SET status='archived' WHERE material_id=? OR id=?",
            (material_id, material_id)
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def get_categories() -> List[str]:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT DISTINCT category FROM materials ORDER BY category")
        return [row["category"] for row in cur.fetchall()]
    finally:
        conn.close()


def get_difficulties() -> List[str]:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT DISTINCT difficulty FROM materials ORDER BY difficulty")
        return [row["difficulty"] for row in cur.fetchall()]
    finally:
        conn.close()


# -------------------- RSS Sources CRUD --------------------

def list_sources() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT * FROM rss_sources ORDER BY name")
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def get_source(source_id: int) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT * FROM rss_sources WHERE id=?", (source_id,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def add_source(name: str, url: str, category: str = "general") -> Optional[int]:
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO rss_sources (name, url, category)
               VALUES (?, ?, ?)""",
            (name, url, category)
        )
        conn.commit()
        return cur.lastrowid
    except sqlite3.IntegrityError:
        logger.warning(f"Source already exists: {name}")
        return None
    finally:
        conn.close()


def update_source(source_id: int, updates: Dict[str, Any]) -> bool:
    allowed = {"name", "url", "category", "enabled", "last_fetched_at", "error_count"}
    set_fields = {k: v for k, v in updates.items() if k in allowed}
    if not set_fields:
        return False

    set_clause = ", ".join(f"{k}=?" for k in set_fields)
    values = list(set_fields.values()) + [source_id]

    conn = _get_conn()
    try:
        cur = conn.execute(
            f"UPDATE rss_sources SET {set_clause} WHERE id=?",
            values
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def delete_source(source_id: int) -> bool:
    conn = _get_conn()
    try:
        cur = conn.execute("DELETE FROM rss_sources WHERE id=?", (source_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def toggle_source(source_id: int, enabled: bool) -> bool:
    conn = _get_conn()
    try:
        cur = conn.execute(
            "UPDATE rss_sources SET enabled=? WHERE id=?",
            (1 if enabled else 0, source_id)
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def update_source_fetch(source_id: int, success: bool = True) -> bool:
    conn = _get_conn()
    try:
        if success:
            conn.execute(
                """UPDATE rss_sources
                   SET last_fetched_at=?, error_count=0 WHERE id=?""",
                (datetime.now(timezone.utc).isoformat(), source_id)
            )
        else:
            conn.execute(
                """UPDATE rss_sources
                   SET error_count=error_count+1 WHERE id=?""",
                (source_id,)
            )
        conn.commit()
        return True
    finally:
        conn.close()


def seed_default_sources():
    """Insert default RSS sources from config if the table is empty."""
    conn = _get_conn()
    try:
        cur = conn.execute("SELECT COUNT(*) as cnt FROM rss_sources")
        count = cur.fetchone()["cnt"]
        if count > 0:
            return

        for name, url in config.rss_feeds.items():
            try:
                conn.execute(
                    "INSERT INTO rss_sources (name, url, category) VALUES (?, ?, ?)",
                    (name, url, "general")
                )
            except sqlite3.IntegrityError:
                pass
        conn.commit()
        logger.info(f"Seeded {len(config.rss_feeds)} default RSS sources")
    finally:
        conn.close()

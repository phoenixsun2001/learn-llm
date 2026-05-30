"""Pipeline configuration management. Loads from environment variables with sensible defaults."""
import os
from dataclasses import dataclass, field
from typing import Optional

# Default RSS feed sources
DEFAULT_RSS_FEEDS = {
    "anthropic_blog": "https://www.anthropic.com/blog/rss.xml",
    "openai_blog": "https://openai.com/blog/rss.xml",
    "langchain_blog": "https://blog.langchain.dev/rss/",
    "dify_blog": "https://dify.ai/blog/rss",
}

@dataclass
class Config:
    """Pipeline configuration, loaded from environment variables."""

    # RSS Feeds
    rss_feeds: dict = field(default_factory=lambda: DEFAULT_RSS_FEEDS.copy())

    # AI Processing (optional – if not set, AI steps are skipped)
    anthropic_api_key: Optional[str] = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY"))
    ollama_base_url: str = field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

    # Paths (relative to pipeline/ directory)
    pipeline_output_dir: str = field(default_factory=lambda: os.getenv("PIPELINE_OUTPUT_DIR", "../content/materials/"))
    sqlite_db_path: str = field(default_factory=lambda: os.getenv("SQLITE_DB_PATH", "data/admin.db"))
    frontend_data_dir: str = field(default_factory=lambda: os.getenv("FRONTEND_DATA_DIR", "../frontend/src/data/"))

    # Processing parameters
    dedup_threshold: float = 0.85
    max_items_per_fetch: int = 20
    summary_max_chars: int = 3000
    summary_output_chars: int = 200

    # Admin dashboard
    admin_host: str = "127.0.0.1"
    admin_port: int = 8400
    admin_token: Optional[str] = field(default_factory=lambda: os.getenv("ADMIN_TOKEN", "learn-llm-admin"))

# Singleton
config = Config()

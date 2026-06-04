"""Shared helpers for JSON-file-based content CRUD routes."""
import json
import logging
import os
import tempfile

from fastapi import Request

from config import config

logger = logging.getLogger(__name__)


def resolve_data_dir() -> str:
    """Resolve the frontend data directory to an absolute path."""
    d = config.frontend_data_dir
    if not os.path.isabs(d):
        # config.py lives in pipeline/; data dir is relative to project root
        d = os.path.normpath(
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                d,
            )
        )
    return d


def read_index(filename: str) -> list:
    """Read and parse a JSON array file from the frontend data directory."""
    path = os.path.join(resolve_data_dir(), filename)
    if not os.path.exists(path):
        logger.warning("Index file not found: %s", path)
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def write_index(filename: str, entries: list) -> None:
    """Atomic write: write to .tmp then os.replace for crash safety."""
    path = os.path.join(resolve_data_dir(), filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_fd, tmp_path = tempfile.mkstemp(
        dir=os.path.dirname(path), suffix=".tmp", prefix=".idx_"
    )
    try:
        with os.fdopen(tmp_fd, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, path)
    except BaseException:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def parse_lines(value) -> list:
    """Split a textarea value by newlines into a trimmed, non-empty list."""
    if not value:
        return []
    return [line.strip() for line in value.strip().splitlines() if line.strip()]


def get_templates(request: Request):
    """Retrieve the Jinja2 templates instance from the app state."""
    return request.app.state.templates

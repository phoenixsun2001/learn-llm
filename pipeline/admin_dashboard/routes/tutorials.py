"""
API routes for publishing tutorials to the shared content volume.
Writes .md files and updates index.json so the frontend picks them up immediately.
"""
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# Content root: in Docker this is /app/content, locally it's ../content relative to pipeline/
_CONTENT_ROOT = os.environ.get(
    "CONTENT_ROOT",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "content")
)
_TUTORIALS_DIR = os.path.join(_CONTENT_ROOT, "tutorials")
_INDEX_PATH = os.path.join(_TUTORIALS_DIR, "index.json")


class TutorialPublishRequest(BaseModel):
    slug: str
    title: str
    content: str
    category: str = "practice"
    subcategory: str = "practice"
    difficulty: str = "beginner"
    description: str = ""
    tags: list = []
    keywords: list = []


def _check_auth(request: Request):
    from config import config
    token = request.cookies.get("admin_token") or request.headers.get("X-Admin-Token")
    if token != config.admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _read_index() -> list:
    """Read the current index.json, return empty list if missing/corrupt."""
    try:
        if os.path.exists(_INDEX_PATH):
            with open(_INDEX_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        logger.warning(f"Failed to read index.json: {e}")
    return []


def _write_index(entries: list):
    """Write index.json atomically."""
    os.makedirs(_TUTORIALS_DIR, exist_ok=True)
    tmp_path = _INDEX_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, _INDEX_PATH)  # atomic on Unix
    logger.info(f"Updated index.json with {len(entries)} entries")


def _write_tutorial_file(subcategory: str, slug: str, content: str):
    """Write the .md file to the tutorials directory."""
    dir_path = os.path.join(_TUTORIALS_DIR, subcategory)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, f"{slug}.md")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    logger.info(f"Written tutorial: {file_path}")
    return file_path


@router.post("/tutorials/publish")
async def publish_tutorial(req: TutorialPublishRequest, request: Request):
    """
    Publish a tutorial: write the .md file and update index.json.
    Called by the frontend admin after creating/editing a tutorial.
    The frontend Nginx serves these files from the shared content volume.
    """
    _check_auth(request)

    try:
        # 1. Write the .md file
        _write_tutorial_file(req.subcategory, req.slug, req.content)

        # 2. Update index.json
        index = _read_index()
        existing_slugs = {e.get("slug") for e in index}

        new_entry = {
            "id": f"tut-{req.slug}",
            "slug": req.slug,
            "title": req.title,
            "description": req.description or "",
            "category": req.category,
            "subcategory": req.subcategory,
            "difficulty": req.difficulty,
            "estimatedTime": 30,
            "tags": req.tags,
            "keywords": req.keywords or req.tags,
            "prerequisites": [],
            "featured": False,
            "file": f"/content/tutorials/{req.subcategory}/{req.slug}.md",
            "status": "published",
        }

        if req.slug in existing_slugs:
            # Update existing entry
            index = [new_entry if e.get("slug") == req.slug else e for e in index]
        else:
            index.append(new_entry)

        _write_index(index)

        return {"ok": True, "slug": req.slug, "entries": len(index)}

    except Exception as e:
        logger.exception("Failed to publish tutorial")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tutorials/{slug}")
async def unpublish_tutorial(slug: str, request: Request):
    """
    Remove a tutorial from the dynamic index (does not delete the .md file).
    """
    _check_auth(request)

    try:
        index = _read_index()
        new_index = [e for e in index if e.get("slug") != slug]

        if len(new_index) == len(index):
            raise HTTPException(status_code=404, detail=f"Tutorial '{slug}' not found in index")

        _write_index(new_index)
        return {"ok": True, "slug": slug, "entries": len(new_index)}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to unpublish tutorial")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tutorials/check")
async def check_tutorials_status(request: Request):
    """Health check: verify the shared volume is writable and index.json is accessible."""
    _check_auth(request)
    try:
        os.makedirs(_TUTORIALS_DIR, exist_ok=True)
        index = _read_index()
        return {
            "ok": True,
            "tutorials_dir": _TUTORIALS_DIR,
            "index_path": _INDEX_PATH,
            "entries": len(index),
            "writable": os.access(_TUTORIALS_DIR, os.W_OK),
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

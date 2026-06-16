"""User library routes: favorites, view history, and per-tutorial progress.

All endpoints require authentication (require_auth) and are filtered by
current_user.id, so a user only ever sees their own data.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth_utils import require_auth
from admin_dashboard.models import (
    VALID_ITEM_TYPES,
    add_favorite, remove_favorite, list_favorites,
    record_view, list_history, clear_history,
    list_progress, upsert_progress, delete_progress,
)

router = APIRouter()


def _check_type(item_type: str) -> str:
    if item_type not in VALID_ITEM_TYPES:
        raise HTTPException(status_code=400, detail="无效的内容类型")
    return item_type


class FavoriteRequest(BaseModel):
    item_type: str
    item_slug: str


class HistoryRequest(BaseModel):
    item_type: str
    item_slug: str


class ProgressRequest(BaseModel):
    completed: bool = False
    chapterIndex: int = 0
    chapters: dict = {}


# ---------------- Favorites ----------------

@router.get("/me/favorites")
async def get_favorites(user=Depends(require_auth), type: Optional[str] = Query(default=None)):
    if type is not None:
        _check_type(type)
    return {"favorites": list_favorites(user["id"], item_type=type)}


@router.post("/me/favorites")
async def add_favorite_endpoint(req: FavoriteRequest, user=Depends(require_auth)):
    _check_type(req.item_type)
    if not req.item_slug:
        raise HTTPException(status_code=400, detail="item_slug 不能为空")
    add_favorite(user["id"], req.item_type, req.item_slug)
    return {"ok": True}


@router.delete("/me/favorites/{item_type}/{item_slug}")
async def remove_favorite_endpoint(item_type: str, item_slug: str, user=Depends(require_auth)):
    _check_type(item_type)
    remove_favorite(user["id"], item_type, item_slug)
    return {"ok": True}


# ---------------- History ----------------

@router.get("/me/history")
async def get_history(user=Depends(require_auth), limit: int = Query(default=50, ge=1, le=200)):
    return {"history": list_history(user["id"], limit=limit)}


@router.post("/me/history")
async def record_view_endpoint(req: HistoryRequest, user=Depends(require_auth)):
    _check_type(req.item_type)
    if not req.item_slug:
        raise HTTPException(status_code=400, detail="item_slug 不能为空")
    record_view(user["id"], req.item_type, req.item_slug)
    return {"ok": True}


@router.delete("/me/history")
async def clear_history_endpoint(user=Depends(require_auth)):
    clear_history(user["id"])
    return {"ok": True}


# ---------------- Progress ----------------

@router.get("/me/progress")
async def get_progress(user=Depends(require_auth)):
    # Returns {slug: {completed, chapterIndex, chapters, completedAt}}
    return list_progress(user["id"])


@router.put("/me/progress/{slug}")
async def put_progress(slug: str, req: ProgressRequest, user=Depends(require_auth)):
    upsert_progress(
        user["id"], slug,
        completed=req.completed,
        chapter_index=req.chapterIndex,
        chapters=req.chapters,
    )
    return {"ok": True}


@router.delete("/me/progress")
async def clear_progress_endpoint(user=Depends(require_auth)):
    delete_progress(user["id"])
    return {"ok": True}

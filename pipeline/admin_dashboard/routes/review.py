"""Review queue routes — approve, reject, edit pending pipeline items."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from admin_dashboard.models import (
    get_pending_count,
    get_review_item,
    insert_material,
    list_review_queue,
    update_review_item,
    update_review_status,
)
from config import config

logger = logging.getLogger(__name__)

router = APIRouter()


def _check_auth(request: Request):
    token = request.cookies.get("admin_token")
    if token != config.admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/review")
async def review_page(request: Request):
    _check_auth(request)
    items = list_review_queue(status="pending", limit=200, offset=0)
    return request.app.state.templates.TemplateResponse("review_queue.html", {
        "request": request,
        "items": items,
        "pending_count": get_pending_count(),
        "section": "review",
    })


@router.post("/review/{item_id}/approve")
async def approve_item(item_id: int, request: Request):
    _check_auth(request)
    item = get_review_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")
    if item["status"] != "pending":
        raise HTTPException(status_code=400, detail="Item is not pending")

    # Write to materials table
    from datetime import datetime as dt
    material_id = f"mat-{dt.now().year}-{item_id:03d}"

    insert_material({
        "material_id": material_id,
        "title": item["title"],
        "content": item["raw_content"] or "",
        "category": item["ai_category"] or "uncategorized",
        "difficulty": item["ai_difficulty"] or "beginner",
        "tags": [],
        "source_url": item["source_url"] or "",
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Also try to write to the filesystem via writer
    try:
        from output.writer import write_material
        write_material({
            "title": item["title"],
            "link": item["source_url"],
            "source_name": item.get("source_type", "rss"),
            "source_type": item.get("source_type", "rss"),
            "summary": item.get("raw_content", ""),
            "ai_summary": item.get("ai_summary", ""),
            "category": item.get("ai_category", "uncategorized"),
            "difficulty": item.get("ai_difficulty", "beginner"),
            "tags": [],
        })
    except Exception as e:
        logger.warning(f"Filesystem write skipped: {e}")

    update_review_status(item_id, "approved", "admin")

    return RedirectResponse("/admin/review", status_code=303)


@router.post("/review/{item_id}/reject")
async def reject_item(item_id: int, request: Request):
    _check_auth(request)
    item = get_review_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")
    if item["status"] != "pending":
        raise HTTPException(status_code=400, detail="Item is not pending")

    update_review_status(item_id, "rejected", "admin")
    return RedirectResponse("/admin/review", status_code=303)


@router.get("/review/{item_id}/edit")
async def edit_review_item_page(item_id: int, request: Request):
    _check_auth(request)
    item = get_review_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")

    return request.app.state.templates.TemplateResponse("material_edit.html", {
        "request": request,
        "item": item,
        "item_type": "review",
        "section": "review",
    })


@router.post("/review/{item_id}/update")
async def update_review_item_route(item_id: int, request: Request):
    """Save edits to a review item."""
    _check_auth(request)
    form = await request.form()
    updates = {
        "title": form.get("title", ""),
        "raw_content": form.get("content", ""),
        "ai_summary": form.get("ai_summary", ""),
        "ai_category": form.get("category", "uncategorized"),
        "ai_difficulty": form.get("difficulty", "beginner"),
        "source_url": form.get("source_url", ""),
    }
    update_review_item(item_id, updates)
    return RedirectResponse("/admin/review", status_code=303)

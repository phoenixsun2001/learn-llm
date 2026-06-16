"""RSS source management routes."""
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from admin_dashboard.models import (
    add_source,
    delete_source,
    get_source_count,
    list_sources,
    toggle_source,
    update_source,
    update_source_fetch,
)
from config import config
from content_taxonomy import normalize_category

logger = logging.getLogger(__name__)

router = APIRouter()


def _check_auth(request: Request):
    # Unified: accepts JWT(admin) from SPA login OR the legacy admin_token.
    from auth_utils import check_admin_or_token
    check_admin_or_token(request)


@router.get("/sources")
async def sources_page(request: Request, error: str = "", info: str = ""):
    _check_auth(request)
    sources = list_sources()
    flash_msg = error or info or None
    flash_error = bool(error)
    return request.app.state.templates.TemplateResponse("sources.html", {
        "request": request,
        "sources": sources,
        "source_count": get_source_count(),
        "section": "sources",
        "flash_msg": flash_msg,
        "flash_error": flash_error,
    })


@router.post("/sources")
async def add_source_route(request: Request):
    _check_auth(request)
    form = await request.form()
    name = form.get("name", "").strip()
    url = form.get("url", "").strip()
    category = form.get("category", "general").strip()

    if not name or not url:
        return RedirectResponse("/admin/sources?error=Name+and+URL+required", status_code=303)

    result = add_source(name, url, category)
    if result is None:
        return RedirectResponse("/admin/sources?error=Source+already+exists", status_code=303)

    return RedirectResponse("/admin/sources", status_code=303)


@router.post("/sources/{source_id}/toggle")
async def toggle_source_route(source_id: int, request: Request):
    _check_auth(request)
    form = await request.form()
    enabled = form.get("enabled", "1") == "1"
    toggle_source(source_id, enabled)
    return RedirectResponse("/admin/sources", status_code=303)


@router.post("/sources/{source_id}/delete")
async def delete_source_route(source_id: int, request: Request):
    _check_auth(request)
    delete_source(source_id)
    return RedirectResponse("/admin/sources", status_code=303)


@router.post("/sources/{source_id}/update")
async def update_source_route(source_id: int, request: Request):
    _check_auth(request)
    form = await request.form()
    form_enabled = form.get("enabled", "1")
    updates = {
        "name": form.get("name", ""),
        "url": form.get("url", ""),
        "category": form.get("category", "general"),
        "enabled": 1 if form_enabled in ("1", "on", "true") else 0,
    }
    update_source(source_id, updates)
    return RedirectResponse("/admin/sources", status_code=303)


@router.post("/sources/{source_id}/fetch")
async def fetch_source_route(source_id: int, request: Request):
    _check_auth(request)
    # Trigger RSS fetch for this specific source
    try:
        from admin_dashboard.models import get_source
        source = get_source(source_id)
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")

        # Attempt to fetch
        try:
            import feedparser
            feed = feedparser.parse(source["url"])
            if feed.get("bozo_exception"):
                raise Exception(f"Parse error: {feed.get('bozo_exception')}")

            from admin_dashboard.models import insert_review_batch
            items = []
            for entry in feed.entries[:20]:
                items.append({
                    "title": entry.get("title", "Untitled"),
                    "source_url": entry.get("link", ""),
                    "source_type": "rss",
                    "raw_content": entry.get("summary", entry.get("content", [{}])[0].get("value", "")) if hasattr(entry, 'get') else "",
                    "ai_summary": "",
                    "ai_category": normalize_category(source.get("category", "practice")),
                    "ai_difficulty": "beginner",
                })

            count = insert_review_batch(items)
            update_source_fetch(source_id, success=True)
            return RedirectResponse(f"/admin/sources?info=Fetched+{count}+items", status_code=303)

        except Exception as e:
            update_source_fetch(source_id, success=False)
            return RedirectResponse(f"/admin/sources?error=Fetch+failed:+{str(e)[:80]}", status_code=303)

    except Exception as e:
        return RedirectResponse(f"/admin/sources?error={str(e)[:80]}", status_code=303)

"""Materials CRUD routes."""
import json
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from admin_dashboard.models import (
    delete_material,
    get_categories,
    get_difficulties,
    get_material,
    get_material_count,
    insert_material,
    list_materials,
    update_material,
)

logger = logging.getLogger(__name__)

router = APIRouter()

DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"]


def _check_auth(request: Request):
    token = request.cookies.get("admin_token")
    if token != "learn-llm-admin":
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/materials")
async def materials_page(request: Request, category: str = "", difficulty: str = "", search: str = ""):
    _check_auth(request)
    items = list_materials(
        category=category or None,
        difficulty=difficulty or None,
        search=search or None,
        limit=100,
    )
    categories = get_categories()
    difficulties = get_difficulties()
    return request.app.state.templates.TemplateResponse("materials.html", {
        "request": request,
        "items": items,
        "categories": categories,
        "difficulties": difficulties,
        "current_category": category,
        "current_difficulty": difficulty,
        "current_search": search,
        "material_count": get_material_count(),
        "section": "materials",
    })


@router.get("/materials/{material_id}")
async def material_detail_page(material_id: str, request: Request):
    _check_auth(request)
    item = get_material(material_id)
    if not item:
        raise HTTPException(status_code=404, detail="Material not found")

    categories = get_categories()
    return request.app.state.templates.TemplateResponse("material_edit.html", {
        "request": request,
        "item": item,
        "item_type": "material",
        "categories": categories,
        "difficulty_options": DIFFICULTY_OPTIONS,
        "section": "materials",
    })


@router.post("/materials/{material_id}/update")
async def update_material_route(material_id: str, request: Request):
    _check_auth(request)
    form = await request.form()

    tags_str = form.get("tags", "[]")
    try:
        tags = json.loads(tags_str)
    except (json.JSONDecodeError, TypeError):
        tags = []

    updates = {
        "title": form.get("title", ""),
        "content": form.get("content", ""),
        "category": form.get("category", "uncategorized"),
        "difficulty": form.get("difficulty", "beginner"),
        "tags": tags,
        "source_url": form.get("source_url", ""),
        "status": form.get("status", "draft"),
    }

    update_material(material_id, updates)
    return RedirectResponse("/admin/materials", status_code=303)


@router.post("/materials/{material_id}/delete")
async def delete_material_route(material_id: str, request: Request):
    _check_auth(request)
    delete_material(material_id)
    return RedirectResponse("/admin/materials", status_code=303)


@router.get("/materials/new")
async def new_material_page(request: Request):
    _check_auth(request)
    categories = get_categories()
    return request.app.state.templates.TemplateResponse("material_edit.html", {
        "request": request,
        "item": None,
        "item_type": "new",
        "categories": categories,
        "difficulty_options": DIFFICULTY_OPTIONS,
        "section": "materials",
    })


@router.post("/materials/new")
async def create_material_route(request: Request):
    _check_auth(request)
    form = await request.form()

    tags_str = form.get("tags", "[]")
    try:
        tags = json.loads(tags_str)
    except (json.JSONDecodeError, TypeError):
        tags = []

    from datetime import datetime as dt
    material_id = f"mat-{dt.now().year}-{dt.now().timestamp():.0f}"

    insert_material({
        "material_id": material_id,
        "title": form.get("title", "Untitled"),
        "content": form.get("content", ""),
        "category": form.get("category", "uncategorized"),
        "difficulty": form.get("difficulty", "beginner"),
        "tags": tags,
        "source_url": form.get("source_url", ""),
        "status": form.get("status", "draft"),
    })

    return RedirectResponse("/admin/materials", status_code=303)

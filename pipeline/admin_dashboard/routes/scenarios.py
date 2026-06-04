"""Scenario management CRUD routes."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from admin_dashboard.routes.content_base import (
    get_templates,
    parse_lines,
    read_index,
    write_index,
)

router = APIRouter()

DATA_FILE = "scenarios-index.json"
CATEGORIES = [
    "analysis", "coding", "communication", "creative",
    "learning", "management", "research", "translation", "writing",
]


def _find(entries: list, slug: str) -> dict | None:
    return next((e for e in entries if e.get("slug") == slug), None)


@router.get("/admin/scenarios")
async def scenarios_list(request: Request, category: str = "", search: str = ""):
    tpl = get_templates(request)
    entries = read_index(DATA_FILE)
    if category:
        entries = [e for e in entries if e.get("category") == category]
    if search:
        q = search.lower()
        entries = [
            e for e in entries
            if q in (e.get("title") or "").lower()
            or q in (e.get("description") or "").lower()
            or q in (e.get("goal") or "").lower()
            or any(q in t.lower() for t in e.get("tags", []))
        ]
    return tpl.TemplateResponse("scenarios.html", {
        "request": request,
        "items": entries,
        "categories": CATEGORIES,
        "current_category": category,
        "current_search": search,
        "section": "scenarios",
    })


@router.get("/admin/scenarios/new")
async def scenario_new(request: Request):
    tpl = get_templates(request)
    return tpl.TemplateResponse("scenario_edit.html", {
        "request": request,
        "item": None,
        "categories": CATEGORIES,
        "section": "scenarios",
    })


@router.post("/admin/scenarios/new")
async def scenario_create(request: Request):
    form = await request.form()
    slug = (form.get("slug") or "").strip()
    if not slug:
        tpl = get_templates(request)
        return tpl.TemplateResponse("scenario_edit.html", {
            "request": request, "item": None, "categories": CATEGORIES,
            "section": "scenarios", "error": "Slug 不能为空",
        })

    entries = read_index(DATA_FILE)
    if _find(entries, slug):
        tpl = get_templates(request)
        return tpl.TemplateResponse("scenario_edit.html", {
            "request": request, "item": None, "categories": CATEGORIES,
            "section": "scenarios", "error": f"Slug '{slug}' 已存在",
        })

    entry = {
        "id": form.get("id") or f"scn-{slug}",
        "slug": slug,
        "title": form.get("title", ""),
        "description": form.get("description", ""),
        "goal": form.get("goal", ""),
        "category": form.get("category", "coding"),
        "tools": parse_lines(form.get("tools")),
        "tutorials": parse_lines(form.get("tutorials")),
        "workflow": form.get("workflow", ""),
        "tags": parse_lines(form.get("tags")),
    }
    entries.append(entry)
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/scenarios", status_code=303)


@router.get("/admin/scenarios/{slug}")
async def scenario_edit(request: Request, slug: str):
    tpl = get_templates(request)
    entries = read_index(DATA_FILE)
    item = _find(entries, slug)
    if not item:
        return tpl.TemplateResponse("scenario_edit.html", {
            "request": request, "item": None, "categories": CATEGORIES,
            "section": "scenarios", "error": f"场景 '{slug}' 不存在",
        })
    return tpl.TemplateResponse("scenario_edit.html", {
        "request": request, "item": item, "categories": CATEGORIES,
        "section": "scenarios",
    })


@router.post("/admin/scenarios/{slug}/update")
async def scenario_update(request: Request, slug: str):
    form = await request.form()
    entries = read_index(DATA_FILE)
    idx = next((i for i, e in enumerate(entries) if e.get("slug") == slug), None)
    if idx is None:
        return RedirectResponse("/admin/scenarios", status_code=303)

    entries[idx] = {
        "id": form.get("id") or entries[idx].get("id", f"scn-{slug}"),
        "slug": slug,
        "title": form.get("title", ""),
        "description": form.get("description", ""),
        "goal": form.get("goal", ""),
        "category": form.get("category", "coding"),
        "tools": parse_lines(form.get("tools")),
        "tutorials": parse_lines(form.get("tutorials")),
        "workflow": form.get("workflow", ""),
        "tags": parse_lines(form.get("tags")),
    }
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/scenarios", status_code=303)


@router.post("/admin/scenarios/{slug}/delete")
async def scenario_delete(request: Request, slug: str):
    entries = read_index(DATA_FILE)
    entries = [e for e in entries if e.get("slug") != slug]
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/scenarios", status_code=303)

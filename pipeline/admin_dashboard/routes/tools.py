"""Tool management CRUD routes."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from admin_dashboard.routes.content_base import (
    get_templates,
    parse_lines,
    read_index,
    write_index,
)

router = APIRouter()

DATA_FILE = "tools-index.json"
CATEGORIES = ["harness", "workflow", "development"]


def _find(entries: list, slug: str) -> dict | None:
    return next((e for e in entries if e.get("slug") == slug), None)


@router.get("/admin/tools")
async def tools_list(request: Request, category: str = "", search: str = ""):
    tpl = get_templates(request)
    entries = read_index(DATA_FILE)
    if category:
        entries = [e for e in entries if e.get("category") == category]
    if search:
        q = search.lower()
        entries = [
            e for e in entries
            if q in (e.get("name") or "").lower()
            or q in (e.get("description") or "").lower()
            or any(q in t.lower() for t in e.get("tags", []))
        ]
    return tpl.TemplateResponse("tools.html", {
        "request": request,
        "items": entries,
        "categories": CATEGORIES,
        "current_category": category,
        "current_search": search,
        "section": "tools",
    })


@router.get("/admin/tools/new")
async def tool_new(request: Request):
    tpl = get_templates(request)
    return tpl.TemplateResponse("tool_edit.html", {
        "request": request,
        "item": None,
        "categories": CATEGORIES,
        "section": "tools",
    })


@router.post("/admin/tools/new")
async def tool_create(request: Request):
    form = await request.form()
    slug = (form.get("slug") or "").strip()
    if not slug:
        tpl = get_templates(request)
        return tpl.TemplateResponse("tool_edit.html", {
            "request": request, "item": None, "categories": CATEGORIES,
            "section": "tools", "error": "Slug 不能为空",
        })

    entries = read_index(DATA_FILE)
    if _find(entries, slug):
        tpl = get_templates(request)
        return tpl.TemplateResponse("tool_edit.html", {
            "request": request, "item": None, "categories": CATEGORIES,
            "section": "tools", "error": f"Slug '{slug}' 已存在",
        })

    steps = form.getlist("ws_step")
    titles = form.getlist("ws_title")
    slugs = form.getlist("ws_tutorialSlug")
    wizardSteps = [
        {"step": int(s), "title": t, "tutorialSlug": sl}
        for s, t, sl in zip(steps, titles, slugs)
        if s.strip()
    ]

    entry = {
        "id": form.get("id") or f"tool-{slug}",
        "slug": slug,
        "name": form.get("name", ""),
        "description": form.get("description", ""),
        "category": form.get("category", "harness"),
        "officialUrl": form.get("officialUrl", ""),
        "wizardSteps": wizardSteps,
        "tags": parse_lines(form.get("tags")),
    }
    entries.append(entry)
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/tools", status_code=303)


@router.get("/admin/tools/{slug}")
async def tool_edit(request: Request, slug: str):
    tpl = get_templates(request)
    entries = read_index(DATA_FILE)
    item = _find(entries, slug)
    if not item:
        return tpl.TemplateResponse("tool_edit.html", {
            "request": request, "item": None, "categories": CATEGORIES,
            "section": "tools", "error": f"工具 '{slug}' 不存在",
        })
    return tpl.TemplateResponse("tool_edit.html", {
        "request": request, "item": item, "categories": CATEGORIES,
        "section": "tools",
    })


@router.post("/admin/tools/{slug}/update")
async def tool_update(request: Request, slug: str):
    form = await request.form()
    entries = read_index(DATA_FILE)
    idx = next((i for i, e in enumerate(entries) if e.get("slug") == slug), None)
    if idx is None:
        return RedirectResponse("/admin/tools", status_code=303)

    steps = form.getlist("ws_step")
    titles = form.getlist("ws_title")
    slugs = form.getlist("ws_tutorialSlug")
    wizardSteps = [
        {"step": int(s), "title": t, "tutorialSlug": sl}
        for s, t, sl in zip(steps, titles, slugs)
        if s.strip()
    ]

    entries[idx] = {
        "id": form.get("id") or entries[idx].get("id", f"tool-{slug}"),
        "slug": slug,
        "name": form.get("name", ""),
        "description": form.get("description", ""),
        "category": form.get("category", "harness"),
        "officialUrl": form.get("officialUrl", ""),
        "wizardSteps": wizardSteps,
        "tags": parse_lines(form.get("tags")),
    }
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/tools", status_code=303)


@router.post("/admin/tools/{slug}/delete")
async def tool_delete(request: Request, slug: str):
    entries = read_index(DATA_FILE)
    entries = [e for e in entries if e.get("slug") != slug]
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/tools", status_code=303)

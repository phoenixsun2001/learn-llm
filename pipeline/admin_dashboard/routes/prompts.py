"""Prompt management CRUD routes."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from admin_dashboard.routes.content_base import (
    get_templates,
    parse_lines,
    read_index,
    write_index,
)

router = APIRouter()

DATA_FILE = "prompts-index.json"
CATEGORIES = [
    "analysis", "coding", "communication", "creative",
    "learning", "management", "translation", "writing",
]
DIFFICULTIES = ["beginner", "intermediate", "advanced"]


def _find(entries: list, slug: str) -> dict | None:
    return next((e for e in entries if e.get("slug") == slug), None)


def _next_id(entries: list) -> str:
    """Auto-generate prompt-NNN by incrementing the max existing number."""
    existing_ids = [e.get("id", "") for e in entries]
    nums = [
        int(e.split("-")[-1])
        for e in existing_ids
        if e.startswith("prompt-") and e.split("-")[-1].isdigit()
    ]
    next_num = max(nums, default=0) + 1
    return f"prompt-{next_num:03d}"


def _rebuild_variables(form) -> list:
    """Reconstruct variables array from parallel form fields."""
    names = form.getlist("var_name")
    labels = form.getlist("var_label")
    examples = form.getlist("var_example")
    return [
        {"name": n, "label": l, "example": e}
        for n, l, e in zip(names, labels, examples)
        if n.strip()
    ]


def _build_entry(form, entries: list, existing_id: str | None = None) -> dict:
    """Build a prompt entry dict from form data."""
    variables = _rebuild_variables(form)
    return {
        "id": existing_id or _next_id(entries),
        "slug": (form.get("slug") or "").strip(),
        "title": form.get("title", ""),
        "description": form.get("description", ""),
        "category": form.get("category", "coding"),
        "difficulty": form.get("difficulty", "beginner"),
        "tags": parse_lines(form.get("tags")),
        "keywords": parse_lines(form.get("keywords")),
        "template": form.get("template", ""),
        "variables": variables,
        "tips": parse_lines(form.get("tips")),
        "relatedScenarios": parse_lines(form.get("relatedScenarios")),
    }


# ── List ──────────────────────────────────────────────────────────────────

@router.get("/admin/prompts")
async def prompts_list(
    request: Request,
    category: str = "",
    difficulty: str = "",
    search: str = "",
):
    tpl = get_templates(request)
    entries = read_index(DATA_FILE)
    if category:
        entries = [e for e in entries if e.get("category") == category]
    if difficulty:
        entries = [e for e in entries if e.get("difficulty") == difficulty]
    if search:
        q = search.lower()
        entries = [
            e for e in entries
            if q in (e.get("title") or "").lower()
            or q in (e.get("description") or "").lower()
            or q in (e.get("template") or "").lower()
            or any(q in t.lower() for t in e.get("tags", []))
            or any(q in k.lower() for k in e.get("keywords", []))
        ]
    return tpl.TemplateResponse("prompts.html", {
        "request": request,
        "items": entries,
        "categories": CATEGORIES,
        "difficulties": DIFFICULTIES,
        "current_category": category,
        "current_difficulty": difficulty,
        "current_search": search,
        "section": "prompts",
    })


# ── New (GET) ─────────────────────────────────────────────────────────────

@router.get("/admin/prompts/new")
async def prompt_new(request: Request):
    tpl = get_templates(request)
    return tpl.TemplateResponse("prompt_edit.html", {
        "request": request,
        "item": None,
        "categories": CATEGORIES,
        "difficulties": DIFFICULTIES,
        "section": "prompts",
    })


# ── Create (POST) ─────────────────────────────────────────────────────────

@router.post("/admin/prompts/new")
async def prompt_create(request: Request):
    form = await request.form()
    slug = (form.get("slug") or "").strip()

    tpl = get_templates(request)
    ctx_base = {
        "request": request,
        "item": None,
        "categories": CATEGORIES,
        "difficulties": DIFFICULTIES,
        "section": "prompts",
    }

    if not slug:
        ctx_base["error"] = "Slug 不能为空"
        return tpl.TemplateResponse("prompt_edit.html", ctx_base)

    entries = read_index(DATA_FILE)
    if _find(entries, slug):
        ctx_base["error"] = f"Slug '{slug}' 已存在"
        return tpl.TemplateResponse("prompt_edit.html", ctx_base)

    entry = _build_entry(form, entries)
    entries.append(entry)
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/prompts", status_code=303)


# ── Edit (GET) ────────────────────────────────────────────────────────────

@router.get("/admin/prompts/{slug}")
async def prompt_edit(request: Request, slug: str):
    tpl = get_templates(request)
    entries = read_index(DATA_FILE)
    item = _find(entries, slug)
    if not item:
        return tpl.TemplateResponse("prompt_edit.html", {
            "request": request, "item": None,
            "categories": CATEGORIES, "difficulties": DIFFICULTIES,
            "section": "prompts", "error": f"提示词 '{slug}' 不存在",
        })
    return tpl.TemplateResponse("prompt_edit.html", {
        "request": request, "item": item,
        "categories": CATEGORIES, "difficulties": DIFFICULTIES,
        "section": "prompts",
    })


# ── Update (POST) ─────────────────────────────────────────────────────────

@router.post("/admin/prompts/{slug}/update")
async def prompt_update(request: Request, slug: str):
    form = await request.form()
    entries = read_index(DATA_FILE)
    idx = next((i for i, e in enumerate(entries) if e.get("slug") == slug), None)
    if idx is None:
        return RedirectResponse("/admin/prompts", status_code=303)

    existing_id = entries[idx].get("id", f"prompt-{slug}")
    entries[idx] = _build_entry(form, entries, existing_id=existing_id)
    entries[idx]["slug"] = slug
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/prompts", status_code=303)


# ── Delete (POST) ─────────────────────────────────────────────────────────

@router.post("/admin/prompts/{slug}/delete")
async def prompt_delete(request: Request, slug: str):
    entries = read_index(DATA_FILE)
    entries = [e for e in entries if e.get("slug") != slug]
    write_index(DATA_FILE, entries)
    return RedirectResponse("/admin/prompts", status_code=303)

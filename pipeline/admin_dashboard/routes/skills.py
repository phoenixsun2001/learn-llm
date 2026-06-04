"""Skill and Skill Package management CRUD routes."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from admin_dashboard.routes.content_base import (
    get_templates,
    parse_lines,
    read_index,
    write_index,
)

router = APIRouter()

SKILLS_FILE = "skills-index.json"
PACKAGES_FILE = "skills-packages-index.json"

SKILL_CATEGORIES = ["entry", "planning", "execution", "finish"]
DIFFICULTIES = ["beginner", "intermediate", "advanced"]
USAGE_OPTIONS = ["required", "recommended", "optional", "advanced"]


def _find(entries: list, slug: str) -> dict | None:
    return next((e for e in entries if e.get("slug") == slug), None)


def _recalc_package_stats(pkg_slug: str):
    """Recalculate skillCount and layers for a package."""
    skills = read_index(SKILLS_FILE)
    pkg_skills = [s for s in skills if s.get("package") == pkg_slug]
    packages = read_index(PACKAGES_FILE)
    for pkg in packages:
        if pkg.get("slug") == pkg_slug:
            pkg["skillCount"] = len(pkg_skills)
            pkg["layers"] = max((s.get("layer", 1) for s in pkg_skills), default=0)
            break
    write_index(PACKAGES_FILE, packages)


# ============================================================
# Skills CRUD
# ============================================================

@router.get("/admin/skills")
async def skills_list(request: Request, category: str = "", package: str = "", search: str = ""):
    tpl = get_templates(request)
    entries = read_index(SKILLS_FILE)
    packages = read_index(PACKAGES_FILE)

    if category:
        entries = [e for e in entries if e.get("category") == category]
    if package:
        entries = [e for e in entries if e.get("package") == package]
    if search:
        q = search.lower()
        entries = [
            e for e in entries
            if q in (e.get("name") or "").lower()
            or q in (e.get("description") or "").lower()
            or any(q in t.lower() for t in e.get("tags", []))
        ]

    return tpl.TemplateResponse("skills.html", {
        "request": request,
        "items": entries,
        "packages": packages,
        "categories": SKILL_CATEGORIES,
        "difficulties": DIFFICULTIES,
        "usage_options": USAGE_OPTIONS,
        "current_category": category,
        "current_package": package,
        "current_search": search,
        "section": "skills",
        "tab": "skills",
    })


@router.get("/admin/skills/new")
async def skill_new(request: Request):
    tpl = get_templates(request)
    return tpl.TemplateResponse("skill_edit.html", {
        "request": request,
        "item": None,
        "packages": read_index(PACKAGES_FILE),
        "categories": SKILL_CATEGORIES,
        "difficulties": DIFFICULTIES,
        "usage_options": USAGE_OPTIONS,
        "section": "skills",
    })


@router.post("/admin/skills/new")
async def skill_create(request: Request):
    form = await request.form()
    slug = (form.get("slug") or "").strip()
    if not slug:
        tpl = get_templates(request)
        return tpl.TemplateResponse("skill_edit.html", {
            "request": request, "item": None,
            "packages": read_index(PACKAGES_FILE),
            "categories": SKILL_CATEGORIES,
            "difficulties": DIFFICULTIES,
            "usage_options": USAGE_OPTIONS,
            "section": "skills", "error": "Slug 不能为空",
        })

    entries = read_index(SKILLS_FILE)
    if _find(entries, slug):
        tpl = get_templates(request)
        return tpl.TemplateResponse("skill_edit.html", {
            "request": request, "item": None,
            "packages": read_index(PACKAGES_FILE),
            "categories": SKILL_CATEGORIES,
            "difficulties": DIFFICULTIES,
            "usage_options": USAGE_OPTIONS,
            "section": "skills", "error": f"Slug '{slug}' 已存在",
        })

    entry = {
        "id": form.get("id") or f"skill-{slug}",
        "slug": slug,
        "name": form.get("name", ""),
        "description": form.get("description", ""),
        "category": form.get("category", "entry"),
        "layer": int(form.get("layer") or 1),
        "difficulty": form.get("difficulty", "beginner"),
        "tags": parse_lines(form.get("tags")),
        "keywords": parse_lines(form.get("keywords")),
        "usage": form.get("usage", "recommended"),
        "file": form.get("file", ""),
        "relatedSkills": parse_lines(form.get("relatedSkills")),
        "package": form.get("package", ""),
    }
    entries.append(entry)
    write_index(SKILLS_FILE, entries)
    _recalc_package_stats(entry["package"])
    return RedirectResponse("/admin/skills", status_code=303)


@router.get("/admin/skills/{slug}")
async def skill_edit(request: Request, slug: str):
    tpl = get_templates(request)
    entries = read_index(SKILLS_FILE)
    item = _find(entries, slug)
    if not item:
        return tpl.TemplateResponse("skill_edit.html", {
            "request": request, "item": None,
            "packages": read_index(PACKAGES_FILE),
            "categories": SKILL_CATEGORIES,
            "difficulties": DIFFICULTIES,
            "usage_options": USAGE_OPTIONS,
            "section": "skills", "error": f"技能 '{slug}' 不存在",
        })
    return tpl.TemplateResponse("skill_edit.html", {
        "request": request, "item": item,
        "packages": read_index(PACKAGES_FILE),
        "categories": SKILL_CATEGORIES,
        "difficulties": DIFFICULTIES,
        "usage_options": USAGE_OPTIONS,
        "section": "skills",
    })


@router.post("/admin/skills/{slug}/update")
async def skill_update(request: Request, slug: str):
    form = await request.form()
    entries = read_index(SKILLS_FILE)
    idx = next((i for i, e in enumerate(entries) if e.get("slug") == slug), None)
    if idx is None:
        return RedirectResponse("/admin/skills", status_code=303)

    old_package = entries[idx].get("package", "")
    entries[idx] = {
        "id": form.get("id") or entries[idx].get("id", f"skill-{slug}"),
        "slug": slug,
        "name": form.get("name", ""),
        "description": form.get("description", ""),
        "category": form.get("category", "entry"),
        "layer": int(form.get("layer") or 1),
        "difficulty": form.get("difficulty", "beginner"),
        "tags": parse_lines(form.get("tags")),
        "keywords": parse_lines(form.get("keywords")),
        "usage": form.get("usage", "recommended"),
        "file": form.get("file", ""),
        "relatedSkills": parse_lines(form.get("relatedSkills")),
        "package": form.get("package", ""),
    }
    write_index(SKILLS_FILE, entries)
    new_package = entries[idx]["package"]
    _recalc_package_stats(new_package)
    if old_package != new_package and old_package:
        _recalc_package_stats(old_package)
    return RedirectResponse("/admin/skills", status_code=303)


@router.post("/admin/skills/{slug}/delete")
async def skill_delete(request: Request, slug: str):
    entries = read_index(SKILLS_FILE)
    deleted = _find(entries, slug)
    entries = [e for e in entries if e.get("slug") != slug]
    write_index(SKILLS_FILE, entries)
    if deleted and deleted.get("package"):
        _recalc_package_stats(deleted["package"])
    return RedirectResponse("/admin/skills", status_code=303)


# ============================================================
# Skill Packages CRUD
# ============================================================

@router.get("/admin/skills/packages")
async def packages_list(request: Request):
    tpl = get_templates(request)
    packages = read_index(PACKAGES_FILE)
    skills = read_index(SKILLS_FILE)
    # Ensure stats are fresh
    for pkg in packages:
        pkg_skills = [s for s in skills if s.get("package") == pkg.get("slug")]
        pkg["skillCount"] = len(pkg_skills)
        pkg["layers"] = max((s.get("layer", 1) for s in pkg_skills), default=0)
    return tpl.TemplateResponse("skill_packages.html", {
        "request": request,
        "items": packages,
        "section": "skills",
        "tab": "packages",
    })


@router.get("/admin/skills/packages/new")
async def package_new(request: Request):
    tpl = get_templates(request)
    return tpl.TemplateResponse("skill_package_edit.html", {
        "request": request,
        "item": None,
        "section": "skills",
    })


@router.post("/admin/skills/packages/new")
async def package_create(request: Request):
    form = await request.form()
    slug = (form.get("slug") or "").strip()
    if not slug:
        tpl = get_templates(request)
        return tpl.TemplateResponse("skill_package_edit.html", {
            "request": request, "item": None,
            "section": "skills", "error": "Slug 不能为空",
        })

    entries = read_index(PACKAGES_FILE)
    if _find(entries, slug):
        tpl = get_templates(request)
        return tpl.TemplateResponse("skill_package_edit.html", {
            "request": request, "item": None,
            "section": "skills", "error": f"Slug '{slug}' 已存在",
        })

    entry = {
        "id": form.get("id") or f"pkg-{slug}",
        "slug": slug,
        "name": form.get("name", ""),
        "description": form.get("description", ""),
        "source": form.get("source", ""),
        "sourceLabel": form.get("sourceLabel", ""),
        "tags": parse_lines(form.get("tags")),
        "keywords": parse_lines(form.get("keywords")),
        "skillCount": 0,
        "layers": 0,
    }
    entries.append(entry)
    write_index(PACKAGES_FILE, entries)
    return RedirectResponse("/admin/skills/packages", status_code=303)


@router.get("/admin/skills/packages/{slug}")
async def package_edit(request: Request, slug: str):
    tpl = get_templates(request)
    entries = read_index(PACKAGES_FILE)
    item = _find(entries, slug)
    if not item:
        return tpl.TemplateResponse("skill_package_edit.html", {
            "request": request, "item": None,
            "section": "skills", "error": f"技能包 '{slug}' 不存在",
        })
    return tpl.TemplateResponse("skill_package_edit.html", {
        "request": request, "item": item,
        "section": "skills",
    })


@router.post("/admin/skills/packages/{slug}/update")
async def package_update(request: Request, slug: str):
    form = await request.form()
    entries = read_index(PACKAGES_FILE)
    idx = next((i for i, e in enumerate(entries) if e.get("slug") == slug), None)
    if idx is None:
        return RedirectResponse("/admin/skills/packages", status_code=303)

    entries[idx] = {
        "id": form.get("id") or entries[idx].get("id", f"pkg-{slug}"),
        "slug": slug,
        "name": form.get("name", ""),
        "description": form.get("description", ""),
        "source": form.get("source", ""),
        "sourceLabel": form.get("sourceLabel", ""),
        "tags": parse_lines(form.get("tags")),
        "keywords": parse_lines(form.get("keywords")),
        "skillCount": entries[idx].get("skillCount", 0),
        "layers": entries[idx].get("layers", 0),
    }
    write_index(PACKAGES_FILE, entries)
    _recalc_package_stats(slug)
    return RedirectResponse("/admin/skills/packages", status_code=303)


@router.post("/admin/skills/packages/{slug}/delete")
async def package_delete(request: Request, slug: str):
    entries = read_index(PACKAGES_FILE)
    entries = [e for e in entries if e.get("slug") != slug]
    write_index(PACKAGES_FILE, entries)
    return RedirectResponse("/admin/skills/packages", status_code=303)

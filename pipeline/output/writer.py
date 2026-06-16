"""Output writer for processed pipeline materials. Writes Markdown + JSON metadata files."""
import json
import logging
import os
import re
from datetime import datetime
from typing import Dict, Optional

import yaml

from config import config
from content_taxonomy import LEARNING_CATEGORIES, normalize_category, normalize_difficulty

# Standard 6 categories from the learning platform taxonomy
VALID_CATEGORIES = set(LEARNING_CATEGORIES)
CATEGORY_LABELS = LEARNING_CATEGORIES


def _validate_category(category: str) -> str:
    """Validate and normalize category. Falls back to 'practice' if invalid."""
    normalized = normalize_category(category)
    if normalized != (category or "").strip().lower():
        if category:
            logger.warning(f"Unknown category '{category}', falling back to 'practice'")
    return normalized

logger = logging.getLogger(__name__)

# Counter for generating material IDs
_counter = 0


def _generate_id() -> str:
    """Generate a unique material ID like 'mat-2026-001'."""
    global _counter
    year = datetime.now().year
    _counter += 1
    return f"mat-{year}-{_counter:03d}"


def _sanitize_filename(title: str) -> str:
    """Convert a title to a safe filename."""
    # Remove special chars, replace spaces with hyphens
    safe = re.sub(r'[^\w\s-]', '', title)
    safe = re.sub(r'[-\s]+', '-', safe)
    return safe.lower().strip('-')[:80]


def write_material(item: Dict, output_dir: str = None) -> Optional[str]:
    """
    Write a processed material item as Markdown + JSON to the output directory.

    Args:
        item: Processed item dict with keys:
            title, link (source URL), summary/raw_html (content),
            ai_summary, category, subcategory, difficulty, tags,
            source_name, source_type, published_at
        output_dir: Base output directory (from config if not specified)

    Returns:
        Material ID if written successfully, None if skipped (duplicate/existing)
    """
    if output_dir is None:
        output_dir = config.pipeline_output_dir

    # Make path absolute relative to pipeline directory
    if not os.path.isabs(output_dir):
        output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), output_dir)

    material_id = _generate_id()
    category = _validate_category(item.get('category', ''))
    subcategory = item.get('subcategory', '')
    difficulty = normalize_difficulty(item.get('difficulty', 'beginner'))
    title = item.get('title', 'Untitled')

    # Create category subdirectory
    cat_dir = os.path.join(output_dir, category)
    os.makedirs(cat_dir, exist_ok=True)

    filename = _sanitize_filename(title)
    md_path = os.path.join(cat_dir, f"{filename}.md")
    json_path = os.path.join(cat_dir, f"{filename}.json")

    # Skip if file already exists
    if os.path.exists(md_path):
        logger.info(f"Skipping duplicate: {md_path}")
        return None

    # Build metadata
    metadata = {
        'id': material_id,
        'title': title,
        'source': {
            'type': item.get('source_type', 'unknown'),
            'url': item.get('link', ''),
            'name': item.get('source_name', 'Unknown'),
            'author': item.get('author', ''),
            'published_at': item.get('published_at', ''),
        },
        'ai_processed': {
            'summary': item.get('ai_summary', ''),
            'category': category,
            'subcategory': subcategory,
            'difficulty': difficulty,
            'tags': item.get('tags', []),
            'quality_score': item.get('quality_score', None),
        },
        'review_status': 'pending',
        'created_at': datetime.now().isoformat(),
    }

    # Write JSON metadata
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # Write Markdown file with YAML frontmatter (use yaml.dump for proper escaping)
    frontmatter = {
        'title': title,
        'source': item.get('link', ''),
        'source_name': item.get('source_name', 'Unknown'),
        'source_type': item.get('source_type', 'unknown'),
        'category': category,
        'difficulty': difficulty,
        'ai_summary': item.get('ai_summary', ''),
        'tags': item.get('tags', []),
        'material_id': material_id,
    }
    yaml_header = yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False)
    md_content = f"""---
{yaml_header}---

# {title}

> 来源：[{item.get('source_name', 'Unknown')}]({item.get('link', '')})
> 分类：{category} | 难度：{difficulty}

## AI 摘要

{item.get('ai_summary', '（无摘要）')}

## 原始内容

{item.get('raw_html', '') or item.get('summary', '')}
"""

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    logger.info(f"Wrote material {material_id}: {title} → {md_path}")
    return material_id


def update_search_index(output_dir: str = None, frontend_data_dir: str = None) -> int:
    """
    Scan the output materials directory and update the frontend search index.

    Args:
        output_dir: Materials directory (from config)
        frontend_data_dir: Frontend data directory (from config)

    Returns:
        Number of entries added/updated
    """
    if output_dir is None:
        output_dir = config.pipeline_output_dir
    if frontend_data_dir is None:
        frontend_data_dir = config.frontend_data_dir

    # Make paths absolute
    if not os.path.isabs(output_dir):
        output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), output_dir)
    if not os.path.isabs(frontend_data_dir):
        frontend_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), frontend_data_dir)

    if not os.path.isdir(output_dir):
        logger.warning(f"Materials directory not found: {output_dir}")
        return 0

    search_index_path = os.path.join(frontend_data_dir, 'search-index.json')

    # Load existing search index
    existing_entries = []
    if os.path.exists(search_index_path):
        try:
            with open(search_index_path, 'r', encoding='utf-8') as f:
                existing_entries = json.load(f)
        except Exception:
            existing_entries = []

    existing_slugs = {e.get('slug', '') for e in existing_entries}

    # Scan all material JSON files
    import glob
    count = 0
    for json_path in glob.glob(os.path.join(output_dir, '**', '*.json'), recursive=True):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        except Exception:
            continue

        slug = _sanitize_filename(meta.get('title', ''))

        # Skip if already in index
        if slug in existing_slugs:
            continue

        # Build search entry
        title = meta.get('title', '')
        keywords = list(set(
            [w.lower() for w in re.split(r'[\s\-_.]+', title) if len(w) > 1] +
            meta.get('ai_processed', {}).get('tags', [])
        ))

        entry = {
            'type': 'tutorial',
            'slug': slug,
            'title': title,
            'keywords': keywords[:15],
            'category': meta.get('ai_processed', {}).get('category', ''),
            'difficulty': meta.get('ai_processed', {}).get('difficulty', 'beginner'),
        }

        existing_entries.append(entry)
        existing_slugs.add(slug)
        count += 1

    # Write updated search index
    os.makedirs(os.path.dirname(search_index_path), exist_ok=True)
    with open(search_index_path, 'w', encoding='utf-8') as f:
        json.dump(existing_entries, f, ensure_ascii=False, indent=2)

    logger.info(f"Updated search index: added {count} entries, total {len(existing_entries)}")
    return count

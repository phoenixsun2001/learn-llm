"""GitHub/local Markdown content fetcher for community contributions."""
import logging
import os
import re
import yaml
from typing import Dict, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


def parse_frontmatter(content: str) -> Tuple[Dict, str]:
    """
    Parse YAML frontmatter from Markdown content.

    Returns:
        (metadata_dict, body_text) tuple
    """
    metadata = {}
    body = content

    # Check for YAML frontmatter between --- delimiters
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            metadata = yaml.safe_load(match.group(1)) or {}
            body = content[match.end():]
        except yaml.YAMLError:
            logger.warning("Failed to parse YAML frontmatter, using entire content as body")

    return metadata, body.strip()


def fetch_github_md(file_path: str) -> Tuple[Dict, str]:
    """
    Read a local Markdown file (from content/ directory or community PR).
    Extracts metadata from YAML frontmatter if present, or infers from filename/content.

    Args:
        file_path: Absolute or relative path to .md file

    Returns:
        (metadata_dict, markdown_body) tuple
    """
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}")
        return {}, ''

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        logger.warning(f"Failed to read {file_path}: {e}")
        return {}, ''

    metadata, body = parse_frontmatter(content)

    # Infer metadata from filename if not in frontmatter
    if 'title' not in metadata:
        filename = os.path.splitext(os.path.basename(file_path))[0]
        # Convert kebab-case to Title Case
        metadata['title'] = filename.replace('-', ' ').title()

    if 'source_type' not in metadata:
        metadata['source_type'] = 'github'

    if 'source_url' not in metadata:
        metadata['source_url'] = f'file://{file_path}'

    logger.info(f"Read GitHub/local MD: '{metadata.get('title')}', {len(body)} chars")
    return metadata, body

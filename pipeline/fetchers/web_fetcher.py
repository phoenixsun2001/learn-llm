"""Generic web page fetcher for HTML-to-text extraction."""
import logging
import re
import httpx
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


def strip_html(html: str) -> str:
    """Remove HTML tags and return plain text."""
    # Remove script and style elements
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    # Replace common block elements with newlines
    html = re.sub(r'</?(div|p|br|h[1-6]|li|tr|article|section)[^>]*>', '\n', html, flags=re.IGNORECASE)
    # Remove remaining tags
    html = re.sub(r'<[^>]+>', '', html)
    # Collapse whitespace
    html = re.sub(r'\n\s*\n', '\n\n', html)
    html = re.sub(r'[ \t]+', ' ', html)
    return html.strip()


def extract_title(html: str) -> Optional[str]:
    """Extract the <title> from HTML."""
    match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else None


def fetch_web_page(url: str, timeout: int = 15) -> Tuple[Optional[str], Optional[str]]:
    """
    Fetch a web page and extract title + body text.

    Returns:
        (title, text_content) tuple. Both may be None on failure.
    """
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            response = client.get(url, headers={
                'User-Agent': 'Learn-LLM-Pipeline/1.0 (Content Aggregator)'
            })
            response.raise_for_status()
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {e}")
        return None, None

    html = response.text
    title = extract_title(html)
    text = strip_html(html)

    # Truncate to reasonable length
    if len(text) > 10000:
        text = text[:10000] + '...'

    logger.info(f"Fetched web page '{title}': {len(text)} chars")
    return title, text

"""RSS feed fetcher for content aggregation."""
import logging
from datetime import datetime
from typing import List, Dict, Optional

import feedparser

from config import config

logger = logging.getLogger(__name__)


def fetch_rss_feed(url: str, name: str, max_items: int = None) -> List[Dict]:
    """
    Fetch and parse a single RSS feed.

    Args:
        url: RSS feed URL
        name: Human-readable source name
        max_items: Maximum entries to return (default from config)

    Returns:
        List of structured article dicts with keys:
        title, link, summary, author, published_at, source_name, source_type, raw_html
    """
    if max_items is None:
        max_items = config.max_items_per_fetch

    try:
        feed = feedparser.parse(url)
    except Exception as e:
        logger.warning(f"Failed to fetch RSS feed '{name}' ({url}): {e}")
        return []

    if feed.bozo and not feed.entries:
        logger.warning(f"Malformed RSS feed '{name}' ({url}): {feed.bozo_exception}")
        return []

    items = []
    for entry in feed.entries[:max_items]:
        # Extract published date
        published_at = None
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            published_at = datetime(*entry.published_parsed[:6]).isoformat()
        elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
            published_at = datetime(*entry.updated_parsed[:6]).isoformat()

        # Get raw content (prefer content:encoded, fallback to summary)
        raw_html = ''
        if hasattr(entry, 'content') and entry.content:
            raw_html = entry.content[0].get('value', '')
        elif hasattr(entry, 'summary'):
            raw_html = entry.summary

        items.append({
            'title': getattr(entry, 'title', 'Untitled'),
            'link': getattr(entry, 'link', ''),
            'summary': getattr(entry, 'summary', ''),
            'author': getattr(entry, 'author', 'Unknown'),
            'published_at': published_at,
            'source_name': name,
            'source_type': 'rss',
            'raw_html': raw_html,
        })

    logger.info(f"Fetched {len(items)} items from RSS feed '{name}'")
    return items


def fetch_all_feeds(feeds: Dict[str, str] = None) -> List[Dict]:
    """
    Fetch all configured RSS feeds and return merged results.

    Args:
        feeds: Dict of name→URL, defaults to config.rss_feeds

    Returns:
        Combined list of all feed items
    """
    if feeds is None:
        feeds = config.rss_feeds

    all_items = []
    for name, url in feeds.items():
        items = fetch_rss_feed(url, name)
        all_items.extend(items)

    logger.info(f"Fetched total {len(all_items)} items from {len(feeds)} feeds")
    return all_items

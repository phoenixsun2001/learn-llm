"""RSS feed fetcher for content aggregation with source health monitoring."""
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple

import feedparser

from config import config

logger = logging.getLogger(__name__)

# Source health tracking (in-memory, resets on restart)
_source_health: Dict[str, Dict] = {}


def _update_health(name: str, success: bool, error_msg: str = None) -> None:
    """Update health tracking for a source."""
    if name not in _source_health:
        _source_health[name] = {'success_count': 0, 'error_count': 0, 'last_error': None, 'last_success': None}

    if success:
        _source_health[name]['success_count'] += 1
        _source_health[name]['last_success'] = datetime.now().isoformat()
    else:
        _source_health[name]['error_count'] += 1
        _source_health[name]['last_error'] = error_msg or 'Unknown error'


def get_sources_health() -> Dict[str, Dict]:
    """
    Get health status for all tracked RSS sources.

    Returns:
        Dict of source_name → health_info with keys:
        success_count, error_count, last_error, last_success, status
        status is one of: 'healthy', 'degraded', 'failing'
    """
    result = {}
    for name, health in _source_health.items():
        total = health['success_count'] + health['error_count']
        if total == 0:
            status = 'unknown'
        elif health['error_count'] >= 3 and health['success_count'] == 0:
            status = 'failing'
        elif health['error_count'] > health['success_count']:
            status = 'degraded'
        else:
            status = 'healthy'

        result[name] = {
            **health,
            'status': status,
            'total_attempts': total,
        }
    return result


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
        _update_health(name, False, str(e))
        return []

    if feed.bozo and not feed.entries:
        error_msg = str(feed.bozo_exception) if feed.bozo_exception else 'Malformed XML'
        logger.warning(f"Malformed RSS feed '{name}' ({url}): {error_msg}")
        _update_health(name, False, error_msg)
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
    _update_health(name, True)
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

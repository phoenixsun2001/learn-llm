"""Integration tests for content pipeline."""
import os
import sys
import tempfile
import shutil

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fetchers.rss_fetcher import fetch_rss_feed
from processors.dedup import deduplicate
from output.writer import write_material


def test_pipeline_fetch_dedup_write():
    """Test the fetch -> dedup -> write pipeline stages."""
    # 1. Fetch from a known RSS feed
    items = fetch_rss_feed('https://blog.langchain.dev/rss/', 'langchain_test', max_items=3)

    if not items:
        print("WARNING: No items fetched (network may be unavailable). Skipping integration test.")
        return

    assert len(items) > 0
    assert all('title' in item for item in items)
    print(f"OK: Fetched {len(items)} items")

    # 2. Deduplicate
    results, _ = deduplicate(items, threshold=0.85)
    assert len(results) == len(items)
    assert all('is_duplicate' in r for r in results)
    duplicates = [r for r in results if r.get('is_duplicate')]
    print(f"OK: Dedup complete: {len(duplicates)} duplicates")

    # 3. Write (to temp directory)
    temp_dir = tempfile.mkdtemp()
    try:
        # Add required fields for writer
        for item in results:
            item.setdefault('category', 'practice')
            item.setdefault('difficulty', 'intermediate')
            item.setdefault('tags', [])
            item.setdefault('source_type', 'rss')
            item.setdefault('source_name', 'Test')
            item.setdefault('ai_summary', 'Test summary')

        count = 0
        for item in results:
            mid = write_material(item, temp_dir)
            if mid:
                count += 1

        print(f"OK: Wrote {count} materials to temp directory")
    finally:
        shutil.rmtree(temp_dir)

    print("Integration test passed!")


if __name__ == '__main__':
    test_pipeline_fetch_dedup_write()

"""Tests for RSS fetcher."""
import tempfile
import os
from fetchers.rss_fetcher import fetch_rss_feed

SAMPLE_RSS = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <link>https://example.com</link>
    <description>Test RSS Feed</description>
    <item>
      <title>Test Article 1</title>
      <link>https://example.com/1</link>
      <description>First test article description.</description>
      <author>test@example.com</author>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Test Article 2</title>
      <link>https://example.com/2</link>
      <description>Second test article description.</description>
      <author>author2@example.com</author>
      <pubDate>Tue, 02 Jan 2024 15:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>"""


def test_fetch_rss_feed_from_file():
    """Test that fetch_rss_feed correctly parses an RSS XML file URL."""
    # Write sample RSS to a temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False, encoding='utf-8') as f:
        f.write(SAMPLE_RSS)
        temp_path = f.name

    try:
        file_url = f'file:///{temp_path.replace(chr(92), "/")}'
        items = fetch_rss_feed(file_url, 'test_source', max_items=10)

        assert len(items) == 2, f"Expected 2 items, got {len(items)}"

        assert items[0]['title'] == 'Test Article 1'
        assert items[0]['source_name'] == 'test_source'
        assert items[0]['source_type'] == 'rss'
        assert items[0]['published_at'] is not None
        assert '2024-01-01' in items[0]['published_at']

        assert items[1]['title'] == 'Test Article 2'
        assert items[1]['author'] == 'author2@example.com'

        print("[PASS] test_fetch_rss_feed_from_file")
    finally:
        os.unlink(temp_path)


def test_fetch_invalid_feed():
    """Test that an invalid feed URL returns empty list without crashing."""
    items = fetch_rss_feed('https://invalid.example.com/not-a-feed', 'bad', max_items=5)
    assert isinstance(items, list)
    # May return empty list for invalid URL
    print("[PASS] test_fetch_invalid_feed")


if __name__ == '__main__':
    test_fetch_rss_feed_from_file()
    test_fetch_invalid_feed()
    print("All RSS fetcher tests passed!")

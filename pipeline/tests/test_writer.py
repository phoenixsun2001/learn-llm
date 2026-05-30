"""Tests for output writer."""
import os
import tempfile
import shutil
from output.writer import write_material, _generate_id, _sanitize_filename


def test_sanitize_filename():
    assert _sanitize_filename('Claude Code 入门指南') == 'claude-code-入门指南'
    assert _sanitize_filename('Hello World!!!') == 'hello-world'
    assert _sanitize_filename('  Spaces  ') == 'spaces'


def test_write_material():
    temp_dir = tempfile.mkdtemp()
    try:
        item = {
            'title': 'Test Article',
            'link': 'https://example.com/test',
            'source_type': 'rss',
            'source_name': 'Test Source',
            'author': 'Test Author',
            'published_at': '2026-01-01T00:00:00',
            'raw_html': '<p>This is test content.</p>',
            'ai_summary': 'A test article about testing.',
            'category': 'harness',
            'subcategory': 'claude-code',
            'difficulty': 'beginner',
            'tags': ['test', 'claude'],
        }

        material_id = write_material(item, temp_dir)

        assert material_id is not None
        assert material_id.startswith('mat-2026-')

        # Check that both .md and .json were created
        cat_dir = os.path.join(temp_dir, 'harness')
        files = os.listdir(cat_dir)
        assert any(f.endswith('.md') for f in files)
        assert any(f.endswith('.json') for f in files)

        print(f"[PASS] Material written: {material_id}")
    finally:
        shutil.rmtree(temp_dir)


def test_write_duplicate_skipped():
    """Writing the same material twice should skip the second."""
    temp_dir = tempfile.mkdtemp()
    try:
        item = {'title': 'Unique Article', 'link': 'https://x.com/u', 'source_type': 'rss'}

        id1 = write_material(item, temp_dir)
        id2 = write_material(item, temp_dir)

        assert id1 is not None
        assert id2 is None  # Should be skipped
        print("[PASS] Duplicate correctly skipped")
    finally:
        shutil.rmtree(temp_dir)


if __name__ == '__main__':
    test_sanitize_filename()
    test_write_material()
    test_write_duplicate_skipped()
    print("All writer tests passed!")

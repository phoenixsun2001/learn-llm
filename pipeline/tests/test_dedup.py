"""Tests for deduplication processor."""
from processors.dedup import deduplicate, cosine_similarity
import numpy as np


def test_cosine_similarity_identical():
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([1.0, 2.0, 3.0])
    assert abs(cosine_similarity(a, b) - 1.0) < 0.001


def test_cosine_similarity_different():
    a = np.array([1.0, 0.0, 0.0])
    b = np.array([0.0, 1.0, 0.0])
    assert abs(cosine_similarity(a, b) - 0.0) < 0.001


def test_cosine_similarity_none():
    assert cosine_similarity(None, np.array([1.0])) == 0.0
    assert cosine_similarity(np.array([1.0]), None) == 0.0


def test_deduplicate_no_embeddings():
    """Without sentence-transformers, dedup still works (all marked unique)."""
    items = [
        {'title': 'Article A', 'summary': 'Content about AI tools'},
        {'title': 'Article B', 'summary': 'Different content about cooking'},
    ]
    results, embeddings = deduplicate(items, existing_embeddings=None, threshold=0.85)

    assert len(results) == 2
    # Without the model, no duplicates should be found (cosine_sim returns 0 for None)
    assert all(not r['is_duplicate'] for r in results)


def test_deduplicate_structure():
    """Verify dedup adds expected fields to items."""
    items = [{'title': 'Test', 'summary': 'Test content'}]
    results, _ = deduplicate(items)

    assert 'is_duplicate' in results[0]
    assert 'duplicate_of' in results[0]


if __name__ == '__main__':
    test_cosine_similarity_identical()
    test_cosine_similarity_different()
    test_cosine_similarity_none()
    test_deduplicate_no_embeddings()
    test_deduplicate_structure()
    print("All dedup tests passed!")

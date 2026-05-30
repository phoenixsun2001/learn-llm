"""Deduplication processor using sentence-transformers embedding similarity."""
import logging
import os
import json
import glob
from typing import List, Dict, Tuple, Optional
import numpy as np

from config import config

logger = logging.getLogger(__name__)

# Lazy-loaded model
_model = None


def _get_model():
    """Lazy-load the sentence-transformers model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Use multilingual model for Chinese content support
            _model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            logger.info("Loaded sentence-transformers model")
        except ImportError:
            logger.warning("sentence-transformers not installed. Dedup will use simple text comparison.")
            _model = False
        except Exception as e:
            logger.warning(f"Failed to load model: {e}. Using simple text comparison fallback.")
            _model = False
    return _model if _model is not False else None


def _compute_embedding(text: str):
    """Compute embedding vector for text."""
    model = _get_model()
    if model is None:
        return None
    # Truncate long texts for embedding
    truncated = text[:2000] if len(text) > 2000 else text
    return model.encode(truncated, convert_to_numpy=True)


def cosine_similarity(a, b) -> float:
    """Compute cosine similarity between two vectors."""
    if a is None or b is None:
        return 0.0
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def deduplicate(
    items: List[Dict],
    existing_embeddings: Optional[List[Tuple[str, np.ndarray]]] = None,
    threshold: float = None
) -> Tuple[List[Dict], List[Tuple[str, np.ndarray]]]:
    """
    Deduplicate items against existing content using embedding similarity.

    Args:
        items: List of article dicts (must have 'title' and 'raw_html' or 'summary' keys)
        existing_embeddings: List of (id, embedding) tuples from previously processed content
        threshold: Similarity threshold for marking as duplicate (default from config)

    Returns:
        (deduped_items, updated_embeddings) tuple.
        Each item gets a 'duplicate_of' field if it's a near-duplicate, or None if unique.
    """
    if threshold is None:
        threshold = config.dedup_threshold

    if existing_embeddings is None:
        existing_embeddings = []

    results = []
    new_embeddings = list(existing_embeddings)
    duplicate_count = 0

    for item in items:
        # Combine title + content for embedding
        text = item.get('title', '') + ' ' + (item.get('raw_html', '') or item.get('summary', ''))
        emb = _compute_embedding(text)

        is_duplicate = False
        duplicate_of = None

        # Check against existing embeddings
        for existing_id, existing_emb in existing_embeddings:
            sim = cosine_similarity(emb, existing_emb)
            if sim >= threshold:
                is_duplicate = True
                duplicate_of = existing_id
                break

        # Also check against newly added items (within this batch)
        if not is_duplicate:
            for new_id, new_emb in new_embeddings:
                sim = cosine_similarity(emb, new_emb)
                if sim >= threshold:
                    is_duplicate = True
                    duplicate_of = new_id
                    break

        item['is_duplicate'] = is_duplicate
        item['duplicate_of'] = duplicate_of

        if is_duplicate:
            duplicate_count += 1
            logger.debug(f"Duplicate: '{item.get('title')}' matches '{duplicate_of}'")
        else:
            # Add to embeddings only if unique
            item_id = item.get('link', '') or item.get('title', '')
            new_embeddings.append((item_id, emb))

        results.append(item)

    logger.info(f"Dedup: {duplicate_count}/{len(items)} duplicates found (threshold={threshold})")
    return results, new_embeddings


def load_existing_embeddings(materials_dir: str = None) -> List[Tuple[str, np.ndarray]]:
    """
    Load embeddings from existing materials in the output directory.
    Reads JSON metadata files and computes embeddings for each.

    Args:
        materials_dir: Path to materials directory (default from config)

    Returns:
        List of (material_id, embedding) tuples
    """
    if materials_dir is None:
        materials_dir = config.pipeline_output_dir

    # Make path absolute relative to pipeline directory
    if not os.path.isabs(materials_dir):
        materials_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), materials_dir)

    if not os.path.isdir(materials_dir):
        logger.info(f"Materials directory not found: {materials_dir}. Starting fresh.")
        return []

    embeddings = []
    json_files = glob.glob(os.path.join(materials_dir, '**', '*.json'), recursive=True)
    model = _get_model()

    for json_path in json_files[:100]:  # Limit to prevent excessive loading
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)

            material_id = meta.get('id', os.path.basename(json_path))
            # Read corresponding markdown file
            md_path = json_path.replace('.json', '.md')
            if os.path.exists(md_path):
                with open(md_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            else:
                content = meta.get('title', '') + ' ' + meta.get('ai_summary', '')

            if model:
                emb = _compute_embedding(content[:2000])
                if emb is not None:
                    embeddings.append((material_id, emb))
        except Exception as e:
            logger.warning(f"Failed to load embedding for {json_path}: {e}")

    logger.info(f"Loaded {len(embeddings)} existing embeddings from materials")
    return embeddings

#!/usr/bin/env python3
"""
Content Pipeline CLI for Learn-LLM.
Orchestrates fetching, processing, and output of AI learning content.
"""
import argparse
import logging
import sys
import os
import json
import glob

import yaml
from datetime import datetime

# Add pipeline directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from config import config
from fetchers.rss_fetcher import fetch_all_feeds
from processors.dedup import deduplicate, load_existing_embeddings
from processors.summarizer import generate_summary
from processors.classifier import classify_and_rate
from output.writer import write_material, update_search_index

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger('pipeline')


def run_full_pipeline(source_name=None):
    """Run the complete pipeline: fetch -> process -> output."""
    logger.info("=" * 60)
    logger.info("Starting full pipeline run")
    logger.info("=" * 60)

    # Step 1: Fetch
    logger.info("Step 1/5: Fetching content...")
    if source_name:
        url = config.rss_feeds.get(source_name)
        if not url:
            logger.error(f"Unknown source: {source_name}")
            logger.error(f"Available sources: {list(config.rss_feeds.keys())}")
            return
        feeds = {source_name: url}
    else:
        feeds = config.rss_feeds

    items = fetch_all_feeds(feeds)
    logger.info(f"Fetched {len(items)} items")

    if not items:
        logger.info("No new items to process.")
        return

    # Step 2: Deduplicate
    logger.info("Step 2/5: Deduplicating...")
    existing = load_existing_embeddings()
    items, _ = deduplicate(items, existing)
    unique = [i for i in items if not i.get('is_duplicate')]
    logger.info(f"After dedup: {len(unique)} unique items (filtered {len(items) - len(unique)} duplicates)")

    if not unique:
        logger.info("All items were duplicates. Pipeline complete.")
        return

    # Step 3: Summarize
    logger.info("Step 3/5: Generating summaries...")
    for i, item in enumerate(unique, 1):
        text = item.get('raw_html', '') or item.get('summary', '')
        title = item.get('title', '')[:50]
        logger.info(f"  [{i}/{len(unique)}] Summarizing: {title}")
        item['ai_summary'] = generate_summary(item.get('title', ''), text)

    # Step 4: Classify
    logger.info("Step 4/5: Classifying content...")
    for i, item in enumerate(unique, 1):
        title = item.get('title', '')[:50]
        logger.info(f"  [{i}/{len(unique)}] Classifying: {title}")
        result = classify_and_rate(item)
        item['category'] = result['category']
        item['subcategory'] = result.get('subcategory', '')
        item['difficulty'] = result['difficulty']
        item['tags'] = result.get('tags', [])

    # Step 5: Write output
    logger.info("Step 5/5: Writing output...")
    count = 0
    for i, item in enumerate(unique, 1):
        material_id = write_material(item)
        if material_id:
            count += 1
            logger.info(f"  [{i}/{len(unique)}] Written: {material_id}")
        else:
            logger.info(f"  [{i}/{len(unique)}] Skipped (duplicate)")

    # Update search index
    added = update_search_index()
    logger.info(f"Updated search index: {added} new entries")

    logger.info("=" * 60)
    logger.info(f"Pipeline complete: {len(items)} fetched, {len(unique)} unique, {count} written")
    logger.info("=" * 60)


def run_process_only():
    """Re-process existing materials in the output directory.

    Re-runs classification on every material (valuable after the taxonomy or
    classifier prompts change) and rebuilds the search index. Summarization is
    intentionally NOT re-run because the raw source text is not persisted in
    material metadata — only the AI summary is stored.
    """
    output_dir = config.pipeline_output_dir
    if not os.path.isabs(output_dir):
        output_dir = os.path.join(os.path.dirname(__file__), output_dir)

    if not os.path.isdir(output_dir):
        logger.error(f"Materials directory not found: {output_dir}")
        logger.error("Run --full first to fetch and process content.")
        return

    json_files = glob.glob(os.path.join(output_dir, '**', '*.json'), recursive=True)
    logger.info("=" * 60)
    logger.info(f"Process-only mode: re-classifying {len(json_files)} materials")
    logger.info("=" * 60)
    if not json_files:
        logger.info("No materials found. Nothing to process.")
        return

    reclassified = 0
    for i, json_path in enumerate(json_files, 1):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        except Exception as err:
            logger.warning(f"  [{i}/{len(json_files)}] Skipping (invalid JSON): {json_path}")
            continue

        title = meta.get('title', '')
        ai = meta.get('ai_processed', {}) or {}
        # Use the stored summary as the text signal for classification.
        text = ai.get('summary') or meta.get('summary') or title

        try:
            result = classify_and_rate({'title': title, 'raw_html': text, 'summary': text})
        except Exception as err:
            logger.warning(f"  [{i}/{len(json_files)}] Classify failed for {title[:40]!r}: {err}")
            continue

        ai['category'] = result['category']
        ai['subcategory'] = result.get('subcategory', '')
        ai['difficulty'] = result['difficulty']
        ai['tags'] = result.get('tags', [])
        meta['ai_processed'] = ai
        meta['reprocessed_at'] = datetime.now().isoformat()

        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
        except Exception as err:
            logger.warning(f"  [{i}/{len(json_files)}] Write failed for {json_path}: {err}")
            continue

        # Keep the paired .md frontmatter consistent with the new classification.
        md_path = json_path[:-5] + '.md'
        if os.path.exists(md_path):
            try:
                with open(md_path, 'r', encoding='utf-8') as f:
                    md_text = f.read()
                parts = md_text.split('---', 2)
                if len(parts) >= 3:
                    fm = yaml.safe_load(parts[1]) or {}
                    fm['category'] = result['category']
                    fm['difficulty'] = result['difficulty']
                    fm['tags'] = result.get('tags', [])
                    new_fm = yaml.dump(fm, allow_unicode=True, default_flow_style=False)
                    with open(md_path, 'w', encoding='utf-8') as f:
                        f.write('---\n' + new_fm + '---' + parts[2])
            except Exception as err:
                logger.warning(f"  [{i}/{len(json_files)}] MD update failed for {md_path}: {err}")

        reclassified += 1
        logger.info(f"  [{i}/{len(json_files)}] {title[:50]:<50} -> {result['category']}")

    logger.info(f"Re-classified {reclassified}/{len(json_files)} materials")
    added = update_search_index()
    logger.info(f"Search index rebuilt: {added} new entries")
    logger.info("=" * 60)
    logger.info("Process-only complete")
    logger.info("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description='Learn-LLM Content Pipeline',
        epilog='Examples:\n'
               '  python run_pipeline.py --full              # Run full pipeline\n'
               '  python run_pipeline.py --source langchain  # Fetch single source\n'
               '  python run_pipeline.py --fetch-only         # Only fetch feeds\n'
               '  python run_pipeline.py --update-index       # Only rebuild search index',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        '--full', action='store_true',
        help='Run full pipeline (fetch + process + output)'
    )
    parser.add_argument(
        '--fetch-only', action='store_true',
        help='Only fetch RSS feeds and print results'
    )
    parser.add_argument(
        '--process-only', action='store_true',
        help='Only process already-fetched content from materials directory'
    )
    parser.add_argument(
        '--source', type=str, metavar='NAME',
        help='Specific RSS source name to fetch (e.g. langchain_blog, anthropic_blog)'
    )
    parser.add_argument(
        '--update-index', action='store_true',
        help='Update search index only (scan materials directory)'
    )
    parser.add_argument(
        '--list-sources', action='store_true',
        help='List available RSS feed sources'
    )

    args = parser.parse_args()

    # List sources (informational, any combination works)
    if args.list_sources:
        print("Available RSS feed sources:")
        for name, url in config.rss_feeds.items():
            print(f"  {name}: {url}")
        return

    # Run full pipeline (default when no specific flag given, or explicit --full)
    if args.full or (not args.fetch_only and not args.process_only and not args.update_index):
        run_full_pipeline(args.source)
    elif args.fetch_only:
        if args.source:
            url = config.rss_feeds.get(args.source)
            if not url:
                logger.error(f"Unknown source: {args.source}")
                return
            feeds = {args.source: url}
        else:
            feeds = config.rss_feeds
        items = fetch_all_feeds(feeds)
        logger.info(f"Fetched {len(items)} items")
        for item in items:
            logger.info(f"  - {item['title']} ({item['source_name']})")
    elif args.update_index:
        count = update_search_index()
        logger.info(f"Updated search index: {count} entries")
    elif args.process_only:
        run_process_only()


if __name__ == '__main__':
    main()

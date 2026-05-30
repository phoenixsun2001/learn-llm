#!/usr/bin/env python3
"""
Content Pipeline CLI for Learn-LLM.
Orchestrates fetching, processing, and output of AI learning content.
"""
import argparse
import logging
import sys
import os

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
        logger.info("Process-only mode: reading from materials directory...")
        logger.info("Not yet implemented for standalone process-only mode.")
        logger.info("Use --full to run the complete pipeline.")


if __name__ == '__main__':
    main()

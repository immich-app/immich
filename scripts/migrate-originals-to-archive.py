#!/usr/bin/env python3
"""
Migration Script: Move originals from hot bucket to archive bucket

Usage:
  python migrate.py --dry-run
  python migrate.py
  python migrate.py --delete-source
  python migrate.py --concurrency=10
  python migrate.py --limit=100
"""

import os
import sys
import asyncio
import argparse
from datetime import datetime

import boto3
import psycopg
from botocore.config import Config

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument('--dry-run', action='store_true')
parser.add_argument('--delete-source', action='store_true')
parser.add_argument('--concurrency', type=int, default=10)
parser.add_argument('--batch-size', type=int, default=100)
parser.add_argument('--limit', type=int, default=0)
args = parser.parse_args()

# Config from environment
config = {
    'database': os.environ.get('DATABASE_URL') or os.environ.get('DB_URL'),
    'hot': {
        'bucket': os.environ.get('STORAGE_S3_HOT_BUCKET', 'user-media'),
        'endpoint': os.environ.get('STORAGE_S3_ENDPOINT', 'https://t3.storage.dev'),
        'access_key': os.environ.get('STORAGE_S3_ACCESS_KEY_ID'),
        'secret_key': os.environ.get('STORAGE_S3_SECRET_ACCESS_KEY'),
    },
    'archive': {
        'bucket': os.environ.get('STORAGE_S3_ARCHIVE_BUCKET', 'user-media-ira'),
        'endpoint': os.environ.get('STORAGE_S3_ARCHIVE_ENDPOINT', 'https://fly.storage.tigris.dev'),
        'access_key': os.environ.get('STORAGE_S3_ARCHIVE_ACCESS_KEY_ID'),
        'secret_key': os.environ.get('STORAGE_S3_ARCHIVE_SECRET_ACCESS_KEY'),
    },
}

# Stats
stats = {'processed': 0, 'succeeded': 0, 'skipped': 0, 'failed': 0, 'bytes': 0}
stats_lock = asyncio.Lock()
start_time = datetime.now()

def create_s3_client(cfg):
    return boto3.client(
        's3',
        endpoint_url=cfg['endpoint'],
        aws_access_key_id=cfg['access_key'],
        aws_secret_access_key=cfg['secret_key'],
        region_name='auto',
        config=Config(signature_version='s3v4')
    )

def get_object_size(client, bucket, key):
    try:
        response = client.head_object(Bucket=bucket, Key=key)
        return response['ContentLength']
    except client.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            return None
        raise

def copy_object_streaming(hot_client, archive_client, hot_bucket, archive_bucket, key):
    """Stream copy without loading entire file into memory"""
    # Get object with streaming body
    response = hot_client.get_object(Bucket=hot_bucket, Key=key)
    content_type = response.get('ContentType', 'application/octet-stream')
    content_length = response['ContentLength']

    # Upload with streaming body
    archive_client.upload_fileobj(
        response['Body'],
        archive_bucket,
        key,
        ExtraArgs={'ContentType': content_type}
    )

    return content_length

async def process_asset(asset, hot_client, archive_client, db_pool, total_count, semaphore):
    async with semaphore:
        asset_id, key = asset['id'], asset['s3Key']

        async with stats_lock:
            stats['processed'] += 1
            idx = stats['processed']

        try:
            # Run S3 operations in thread pool (boto3 is sync)
            loop = asyncio.get_event_loop()

            # Check source exists
            source_size = await loop.run_in_executor(
                None, get_object_size, hot_client, config['hot']['bucket'], key
            )
            if source_size is None:
                print(f"[{idx}/{total_count}] {key} - ERROR: not found in source")
                async with stats_lock:
                    stats['failed'] += 1
                return

            # Check if already in archive
            archive_size = await loop.run_in_executor(
                None, get_object_size, archive_client, config['archive']['bucket'], key
            )

            if archive_size is not None and archive_size == source_size:
                # Already migrated, just update DB
                if not args.dry_run:
                    async with db_pool.connection() as conn:
                        await conn.execute(
                            'UPDATE asset SET "s3Bucket" = %s WHERE id = %s',
                            (config['archive']['bucket'], asset_id)
                        )
                print(f"[{idx}/{total_count}] {key} - already in archive, updated DB")
                async with stats_lock:
                    stats['skipped'] += 1
                return

            size_mb = source_size / 1024 / 1024

            if args.dry_run:
                print(f"[{idx}/{total_count}] {key} - would copy ({size_mb:.2f} MB)")
                async with stats_lock:
                    stats['succeeded'] += 1
                    stats['bytes'] += source_size
                return

            # Copy with streaming
            t0 = datetime.now()
            await loop.run_in_executor(
                None, copy_object_streaming,
                hot_client, archive_client,
                config['hot']['bucket'], config['archive']['bucket'], key
            )
            duration = (datetime.now() - t0).total_seconds()

            # Verify
            dest_size = await loop.run_in_executor(
                None, get_object_size, archive_client, config['archive']['bucket'], key
            )
            if dest_size != source_size:
                print(f"[{idx}/{total_count}] {key} - ERROR: size mismatch")
                async with stats_lock:
                    stats['failed'] += 1
                return

            # Update DB
            async with db_pool.connection() as conn:
                await conn.execute(
                    'UPDATE asset SET "s3Bucket" = %s WHERE id = %s',
                    (config['archive']['bucket'], asset_id)
                )

            # Delete source if requested
            if args.delete_source:
                await loop.run_in_executor(
                    None, hot_client.delete_object,
                    {'Bucket': config['hot']['bucket'], 'Key': key}
                )
                print(f"[{idx}/{total_count}] {key} - {size_mb:.2f} MB in {duration:.1f}s (deleted)")
            else:
                print(f"[{idx}/{total_count}] {key} - {size_mb:.2f} MB in {duration:.1f}s")

            async with stats_lock:
                stats['succeeded'] += 1
                stats['bytes'] += source_size

        except Exception as e:
            print(f"[{idx}/{total_count}] {key} - ERROR: {e}")
            async with stats_lock:
                stats['failed'] += 1

async def main():
    print("=== Original Files Migration Script (Python) ===")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"Delete source: {args.delete_source}")
    print(f"Concurrency: {args.concurrency}")
    print(f"Batch size: {args.batch_size}")
    if args.limit:
        print(f"Limit: {args.limit}")
    print(f"Hot bucket: {config['hot']['bucket']} @ {config['hot']['endpoint']}")
    print(f"Archive bucket: {config['archive']['bucket']} @ {config['archive']['endpoint']}")
    print()

    # Create clients
    hot_client = create_s3_client(config['hot'])
    archive_client = create_s3_client(config['archive'])

    # Database pool
    db_pool = psycopg.AsyncConnectionPool(config['database'], min_size=1, max_size=args.concurrency + 5)
    await db_pool.open()

    try:
        # Count assets
        async with db_pool.connection() as conn:
            result = await conn.execute(
                '''SELECT COUNT(*) FROM asset
                   WHERE "storageBackend" = 's3'
                   AND "s3Bucket" = %s
                   AND "s3Key" IS NOT NULL''',
                (config['hot']['bucket'],)
            )
            row = await result.fetchone()
            total_in_db = row[0]

        total_count = min(total_in_db, args.limit) if args.limit else total_in_db
        print(f"Found {total_in_db} assets, processing {total_count}\n")

        if total_count == 0:
            print("Nothing to migrate!")
            return

        semaphore = asyncio.Semaphore(args.concurrency)
        last_created_at = None
        last_id = None

        while stats['processed'] < total_count:
            remaining = min(args.batch_size, total_count - stats['processed']) if args.limit else args.batch_size

            async with db_pool.connection() as conn:
                if last_created_at is None:
                    result = await conn.execute(
                        '''SELECT id, "s3Key", "createdAt" FROM asset
                           WHERE "storageBackend" = 's3'
                           AND "s3Bucket" = %s
                           AND "s3Key" IS NOT NULL
                           ORDER BY "createdAt", id
                           LIMIT %s''',
                        (config['hot']['bucket'], remaining)
                    )
                else:
                    result = await conn.execute(
                        '''SELECT id, "s3Key", "createdAt" FROM asset
                           WHERE "storageBackend" = 's3'
                           AND "s3Bucket" = %s
                           AND "s3Key" IS NOT NULL
                           AND ("createdAt" > %s OR ("createdAt" = %s AND id > %s))
                           ORDER BY "createdAt", id
                           LIMIT %s''',
                        (config['hot']['bucket'], last_created_at, last_created_at, last_id, remaining)
                    )

                rows = await result.fetchall()

            if not rows:
                break

            assets = [{'id': r[0], 's3Key': r[1], 'createdAt': r[2]} for r in rows]
            last_created_at = assets[-1]['createdAt']
            last_id = assets[-1]['id']

            # Process batch concurrently
            tasks = [process_asset(a, hot_client, archive_client, db_pool, total_count, semaphore) for a in assets]
            await asyncio.gather(*tasks)

            # Progress
            elapsed = (datetime.now() - start_time).total_seconds()
            rate = stats['succeeded'] / elapsed if elapsed > 0 else 0
            gb = stats['bytes'] / 1024 / 1024 / 1024
            print(f"\n--- {stats['processed']}/{total_count} | OK: {stats['succeeded']} | Skip: {stats['skipped']} | Fail: {stats['failed']} | {gb:.2f} GB | {rate:.1f}/s | {elapsed:.0f}s ---\n")

        # Final summary
        elapsed = (datetime.now() - start_time).total_seconds()
        gb = stats['bytes'] / 1024 / 1024 / 1024
        print("\n=== Migration Complete ===")
        print(f"Processed: {stats['processed']}")
        print(f"Succeeded: {stats['succeeded']}")
        print(f"Skipped: {stats['skipped']}")
        print(f"Failed: {stats['failed']}")
        print(f"Data: {gb:.2f} GB")
        print(f"Time: {elapsed:.0f}s")

    finally:
        await db_pool.close()

if __name__ == '__main__':
    asyncio.run(main())

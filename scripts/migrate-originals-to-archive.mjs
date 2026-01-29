#!/usr/bin/env node
/**
 * Migration Script: Move originals from hot bucket to archive bucket
 *
 * This script:
 * 1. Queries the database for assets with originals in the wrong bucket
 * 2. Copies each file to the archive bucket
 * 3. Verifies the copy (size match)
 * 4. Updates the database
 * 5. Deletes from source (optional, disabled by default)
 *
 * Usage:
 *   node migrate-originals-to-archive.mjs [--dry-run] [--delete-source] [--batch-size=100]
 *
 * Environment variables required:
 *   DATABASE_URL or DB_URL
 *   STORAGE_S3_ACCESS_KEY_ID, STORAGE_S3_SECRET_ACCESS_KEY (hot bucket)
 *   STORAGE_S3_ARCHIVE_ACCESS_KEY_ID, STORAGE_S3_ARCHIVE_SECRET_ACCESS_KEY (archive bucket)
 *   STORAGE_S3_ENDPOINT (hot bucket endpoint)
 *   STORAGE_S3_ARCHIVE_ENDPOINT (archive bucket endpoint)
 *   STORAGE_S3_HOT_BUCKET
 *   STORAGE_S3_ARCHIVE_BUCKET
 */

import { S3Client, CopyObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import pg from 'pg';

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DELETE_SOURCE = args.includes('--delete-source');
const BATCH_SIZE = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '100');

// Configuration from environment
const config = {
  database: process.env.DATABASE_URL || process.env.DB_URL,
  hotBucket: {
    name: process.env.STORAGE_S3_HOT_BUCKET || 'user-media',
    endpoint: process.env.STORAGE_S3_ENDPOINT || 'https://t3.storage.dev',
    accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
  },
  archiveBucket: {
    name: process.env.STORAGE_S3_ARCHIVE_BUCKET || 'user-media-ira',
    endpoint: process.env.STORAGE_S3_ARCHIVE_ENDPOINT || 'https://fly.storage.tigris.dev',
    accessKeyId: process.env.STORAGE_S3_ARCHIVE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_S3_ARCHIVE_SECRET_ACCESS_KEY,
  },
};

// Validate configuration
function validateConfig() {
  const missing = [];
  if (!config.database) missing.push('DATABASE_URL or DB_URL');
  if (!config.hotBucket.accessKeyId) missing.push('STORAGE_S3_ACCESS_KEY_ID');
  if (!config.hotBucket.secretAccessKey) missing.push('STORAGE_S3_SECRET_ACCESS_KEY');
  if (!config.archiveBucket.accessKeyId) missing.push('STORAGE_S3_ARCHIVE_ACCESS_KEY_ID');
  if (!config.archiveBucket.secretAccessKey) missing.push('STORAGE_S3_ARCHIVE_SECRET_ACCESS_KEY');

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

// Create S3 clients
function createS3Client(bucketConfig) {
  return new S3Client({
    endpoint: bucketConfig.endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: bucketConfig.accessKeyId,
      secretAccessKey: bucketConfig.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

// Get object metadata (size)
async function getObjectSize(client, bucket, key) {
  try {
    const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return response.ContentLength;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

// Copy object between buckets (cross-account copy via download/upload)
async function copyObject(sourceClient, destClient, sourceBucket, destBucket, key) {
  // For cross-account/cross-endpoint copies, we need to download and re-upload
  // Using the S3 copy command won't work across different endpoints

  const { GetObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');

  // Get the object from source
  const getResponse = await sourceClient.send(new GetObjectCommand({
    Bucket: sourceBucket,
    Key: key,
  }));

  // Upload to destination
  await destClient.send(new PutObjectCommand({
    Bucket: destBucket,
    Key: key,
    Body: getResponse.Body,
    ContentType: getResponse.ContentType,
    ContentLength: getResponse.ContentLength,
  }));

  return getResponse.ContentLength;
}

// Delete object
async function deleteObject(client, bucket, key) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// Main migration function
async function migrate() {
  validateConfig();

  console.log('=== Original Files Migration Script ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Delete source after copy: ${DELETE_SOURCE}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Hot bucket: ${config.hotBucket.name} @ ${config.hotBucket.endpoint}`);
  console.log(`Archive bucket: ${config.archiveBucket.name} @ ${config.archiveBucket.endpoint}`);
  console.log('');

  // Connect to database
  const pool = new pg.Pool({ connectionString: config.database });
  const hotClient = createS3Client(config.hotBucket);
  const archiveClient = createS3Client(config.archiveBucket);

  try {
    // Count total assets to migrate
    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM asset
      WHERE "storageBackend" = 's3'
        AND "s3Bucket" = $1
        AND "s3Key" IS NOT NULL
    `, [config.hotBucket.name]);

    const totalCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${totalCount} assets to migrate`);

    if (totalCount === 0) {
      console.log('Nothing to migrate!');
      return;
    }

    let processed = 0;
    let succeeded = 0;
    let skipped = 0;
    let failed = 0;

    // Process in batches
    while (processed < totalCount) {
      const batchResult = await pool.query(`
        SELECT id, "s3Key", "s3Bucket"
        FROM asset
        WHERE "storageBackend" = 's3'
          AND "s3Bucket" = $1
          AND "s3Key" IS NOT NULL
        ORDER BY "createdAt"
        LIMIT $2
        OFFSET $3
      `, [config.hotBucket.name, BATCH_SIZE, processed]);

      if (batchResult.rows.length === 0) break;

      for (const asset of batchResult.rows) {
        processed++;
        const key = asset.s3Key;

        try {
          // Check if already exists in archive (for resumability)
          const archiveSize = await getObjectSize(archiveClient, config.archiveBucket.name, key);

          if (archiveSize !== null) {
            // Already in archive, just update DB if needed
            if (asset.s3Bucket !== config.archiveBucket.name) {
              if (!DRY_RUN) {
                await pool.query(`
                  UPDATE asset SET "s3Bucket" = $1 WHERE id = $2
                `, [config.archiveBucket.name, asset.id]);
              }
              console.log(`[${processed}/${totalCount}] ${key} - already in archive, updated DB`);
            } else {
              console.log(`[${processed}/${totalCount}] ${key} - skipped (already migrated)`);
            }
            skipped++;
            continue;
          }

          // Get source size
          const sourceSize = await getObjectSize(hotClient, config.hotBucket.name, key);
          if (sourceSize === null) {
            console.error(`[${processed}/${totalCount}] ${key} - ERROR: not found in source bucket`);
            failed++;
            continue;
          }

          if (DRY_RUN) {
            console.log(`[${processed}/${totalCount}] ${key} - would copy (${(sourceSize / 1024 / 1024).toFixed(2)} MB)`);
            succeeded++;
            continue;
          }

          // Copy to archive
          console.log(`[${processed}/${totalCount}] ${key} - copying (${(sourceSize / 1024 / 1024).toFixed(2)} MB)...`);
          await copyObject(hotClient, archiveClient, config.hotBucket.name, config.archiveBucket.name, key);

          // Verify copy
          const destSize = await getObjectSize(archiveClient, config.archiveBucket.name, key);
          if (destSize !== sourceSize) {
            console.error(`[${processed}/${totalCount}] ${key} - ERROR: size mismatch (source=${sourceSize}, dest=${destSize})`);
            failed++;
            continue;
          }

          // Update database
          await pool.query(`
            UPDATE asset SET "s3Bucket" = $1 WHERE id = $2
          `, [config.archiveBucket.name, asset.id]);

          // Delete from source (optional)
          if (DELETE_SOURCE) {
            await deleteObject(hotClient, config.hotBucket.name, key);
            console.log(`[${processed}/${totalCount}] ${key} - migrated and deleted from source`);
          } else {
            console.log(`[${processed}/${totalCount}] ${key} - migrated (source retained)`);
          }

          succeeded++;

        } catch (error) {
          console.error(`[${processed}/${totalCount}] ${key} - ERROR: ${error.message}`);
          failed++;
        }
      }

      // Progress summary every batch
      console.log(`\n--- Progress: ${processed}/${totalCount} (${succeeded} succeeded, ${skipped} skipped, ${failed} failed) ---\n`);
    }

    // Final summary
    console.log('\n=== Migration Complete ===');
    console.log(`Total processed: ${processed}`);
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Skipped (already migrated): ${skipped}`);
    console.log(`Failed: ${failed}`);

  } finally {
    await pool.end();
  }
}

// Run
migrate().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Migration Script: Move originals from hot bucket to archive bucket
 * CommonJS version for running inside Fly machine
 *
 * Usage (from /usr/src/app/server):
 *   node migrate.cjs --dry-run
 *   node migrate.cjs
 *   node migrate.cjs --delete-source
 *   node migrate.cjs --concurrency=20
 *   node migrate.cjs --limit=100
 */

const {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Pool } = require('pg');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DELETE_SOURCE = args.includes('--delete-source');
const BATCH_SIZE = parseInt(args.find((a) => a.startsWith('--batch-size='))?.split('=')[1] || '100');
const LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
const CONCURRENCY = parseInt(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '10');

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

// Stream copy between buckets
async function copyObject(sourceClient, destClient, sourceBucket, destBucket, key) {
  const getResponse = await sourceClient.send(
    new GetObjectCommand({
      Bucket: sourceBucket,
      Key: key,
    }),
  );

  const chunks = [];
  for await (const chunk of getResponse.Body) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);

  await destClient.send(
    new PutObjectCommand({
      Bucket: destBucket,
      Key: key,
      Body: body,
      ContentType: getResponse.ContentType,
      ContentLength: body.length,
    }),
  );

  return body.length;
}

// Delete object
async function deleteObject(client, bucket, key) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// Stats tracking
const stats = {
  processed: 0,
  succeeded: 0,
  skipped: 0,
  failed: 0,
  totalBytes: 0,
  startTime: Date.now(),
};

// Process a single asset
async function processAsset(asset, pool, hotClient, archiveClient, totalCount) {
  const key = asset.s3Key;
  const idx = ++stats.processed;

  try {
    // Get source size first
    const sourceSize = await getObjectSize(hotClient, config.hotBucket.name, key);
    if (sourceSize === null) {
      console.log(`[${idx}/${totalCount}] ${key} - ERROR: not found in source`);
      stats.failed++;
      return;
    }

    // Check if already exists in archive (for resumability)
    const archiveSize = await getObjectSize(archiveClient, config.archiveBucket.name, key);

    if (archiveSize !== null && archiveSize === sourceSize) {
      if (!DRY_RUN) {
        await pool.query(`UPDATE asset SET "s3Bucket" = $1 WHERE id = $2`, [config.archiveBucket.name, asset.id]);
      }
      console.log(`[${idx}/${totalCount}] ${key} - already in archive, updated DB`);
      stats.skipped++;
      return;
    }

    const sizeMB = (sourceSize / 1024 / 1024).toFixed(2);

    if (DRY_RUN) {
      console.log(`[${idx}/${totalCount}] ${key} - would copy (${sizeMB} MB)`);
      stats.succeeded++;
      stats.totalBytes += sourceSize;
      return;
    }

    // Copy to archive
    const startTime = Date.now();
    await copyObject(hotClient, archiveClient, config.hotBucket.name, config.archiveBucket.name, key);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Verify copy
    const destSize = await getObjectSize(archiveClient, config.archiveBucket.name, key);
    if (destSize !== sourceSize) {
      console.log(`[${idx}/${totalCount}] ${key} - ERROR: size mismatch`);
      stats.failed++;
      return;
    }

    // Update database
    await pool.query(`UPDATE asset SET "s3Bucket" = $1 WHERE id = $2`, [config.archiveBucket.name, asset.id]);

    // Delete from source (optional)
    if (DELETE_SOURCE) {
      await deleteObject(hotClient, config.hotBucket.name, key);
      console.log(`[${idx}/${totalCount}] ${key} - ${sizeMB} MB in ${duration}s (deleted)`);
    } else {
      console.log(`[${idx}/${totalCount}] ${key} - ${sizeMB} MB in ${duration}s`);
    }

    stats.succeeded++;
    stats.totalBytes += sourceSize;
  } catch (error) {
    console.log(`[${idx}/${totalCount}] ${key} - ERROR: ${error.message}`);
    stats.failed++;
  }
}

// Process batch with concurrency limit
async function processBatch(assets, pool, hotClient, archiveClient, totalCount) {
  const chunks = [];
  for (let i = 0; i < assets.length; i += CONCURRENCY) {
    chunks.push(assets.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map((asset) => processAsset(asset, pool, hotClient, archiveClient, totalCount)));
  }
}

// Main migration function
async function migrate() {
  validateConfig();

  console.log('=== Original Files Migration Script ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Delete source after copy: ${DELETE_SOURCE}`);
  console.log(`Concurrency: ${CONCURRENCY} parallel transfers`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  if (LIMIT > 0) console.log(`Limit: ${LIMIT} files`);
  console.log(`Hot bucket: ${config.hotBucket.name} @ ${config.hotBucket.endpoint}`);
  console.log(`Archive bucket: ${config.archiveBucket.name} @ ${config.archiveBucket.endpoint}`);
  console.log('');

  const pool = new Pool({ connectionString: config.database, max: CONCURRENCY + 5 });
  const hotClient = createS3Client(config.hotBucket);
  const archiveClient = createS3Client(config.archiveBucket);

  try {
    // Count total assets to migrate
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM asset
      WHERE "storageBackend" = 's3'
        AND "s3Bucket" = $1
        AND "s3Key" IS NOT NULL
    `,
      [config.hotBucket.name],
    );

    let totalCount = parseInt(countResult.rows[0].count);
    if (LIMIT > 0) totalCount = Math.min(totalCount, LIMIT);

    console.log(`Found ${countResult.rows[0].count} assets, processing ${totalCount}\n`);

    if (totalCount === 0) {
      console.log('Nothing to migrate!');
      return;
    }

    // Process in batches using cursor-based pagination
    let lastCreatedAt = null;
    let lastId = null;

    while (stats.processed < totalCount) {
      const remaining = LIMIT > 0 ? Math.min(BATCH_SIZE, LIMIT - stats.processed) : BATCH_SIZE;

      let query, params;
      if (lastCreatedAt === null) {
        query = `
          SELECT id, "s3Key", "s3Bucket", "createdAt"
          FROM asset
          WHERE "storageBackend" = 's3'
            AND "s3Bucket" = $1
            AND "s3Key" IS NOT NULL
          ORDER BY "createdAt", id
          LIMIT $2
        `;
        params = [config.hotBucket.name, remaining];
      } else {
        query = `
          SELECT id, "s3Key", "s3Bucket", "createdAt"
          FROM asset
          WHERE "storageBackend" = 's3'
            AND "s3Bucket" = $1
            AND "s3Key" IS NOT NULL
            AND ("createdAt" > $2 OR ("createdAt" = $2 AND id > $3))
          ORDER BY "createdAt", id
          LIMIT $4
        `;
        params = [config.hotBucket.name, lastCreatedAt, lastId, remaining];
      }

      const batchResult = await pool.query(query, params);
      if (batchResult.rows.length === 0) break;

      // Update cursor for next batch
      const lastRow = batchResult.rows[batchResult.rows.length - 1];
      lastCreatedAt = lastRow.createdAt;
      lastId = lastRow.id;

      // Process batch in parallel
      await processBatch(batchResult.rows, pool, hotClient, archiveClient, totalCount);

      // Progress summary
      const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
      const rate = (stats.succeeded / elapsed).toFixed(1);
      const totalGB = (stats.totalBytes / 1024 / 1024 / 1024).toFixed(2);
      console.log(
        `\n--- ${stats.processed}/${totalCount} | OK: ${stats.succeeded} | Skip: ${stats.skipped} | Fail: ${stats.failed} | ${totalGB} GB | ${rate}/s | ${elapsed}s ---\n`,
      );
    }

    // Final summary
    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
    const totalGB = (stats.totalBytes / 1024 / 1024 / 1024).toFixed(2);
    console.log('\n=== Migration Complete ===');
    console.log(`Total processed: ${stats.processed}`);
    console.log(`Succeeded: ${stats.succeeded}`);
    console.log(`Skipped (already migrated): ${stats.skipped}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Total data: ${totalGB} GB`);
    console.log(`Total time: ${elapsed}s`);

    if (stats.failed > 0) {
      console.log('\nTo retry failed items, run the script again.');
    }

    if (!DELETE_SOURCE && stats.succeeded > 0) {
      console.log('\nOriginals still exist in hot bucket. Run with --delete-source to remove them.');
    }
  } finally {
    await pool.end();
  }
}

// Run
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

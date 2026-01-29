const { Pool } = require('pg');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

async function validate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.DB_URL });

  // Check DB state
  const hotCount = await pool.query(`SELECT COUNT(*) FROM asset WHERE "storageBackend" = 's3' AND "s3Bucket" = 'user-media'`);
  const archiveCount = await pool.query(`SELECT COUNT(*) FROM asset WHERE "storageBackend" = 's3' AND "s3Bucket" = 'user-media-ira'`);

  console.log('=== Database State ===');
  console.log('  user-media (hot):', hotCount.rows[0].count);
  console.log('  user-media-ira (archive):', archiveCount.rows[0].count);

  // Get sample of migrated assets to verify in S3
  const migrated = await pool.query(`SELECT id, "s3Key" FROM asset WHERE "s3Bucket" = 'user-media-ira' LIMIT 5`);

  if (migrated.rows.length > 0) {
    console.log('\n=== Validating migrated files in S3 ===');

    const archiveClient = new S3Client({
      endpoint: process.env.STORAGE_S3_ARCHIVE_ENDPOINT,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.STORAGE_S3_ARCHIVE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_S3_ARCHIVE_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const hotClient = new S3Client({
      endpoint: process.env.STORAGE_S3_ENDPOINT,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    for (const row of migrated.rows) {
      try {
        const archiveHead = await archiveClient.send(new HeadObjectCommand({
          Bucket: 'user-media-ira',
          Key: row.s3Key
        }));

        let hotExists = false;
        try {
          await hotClient.send(new HeadObjectCommand({
            Bucket: 'user-media',
            Key: row.s3Key
          }));
          hotExists = true;
        } catch (e) {
          hotExists = false;
        }

        const sizeMB = (archiveHead.ContentLength / 1024 / 1024).toFixed(2);
        console.log('  ' + row.s3Key);
        console.log('    Archive: OK (' + sizeMB + ' MB), Hot: ' + (hotExists ? 'still exists' : 'deleted'));
      } catch (error) {
        console.log('  ' + row.s3Key);
        console.log('    Archive: MISSING!, Error: ' + error.message);
      }
    }
  }

  await pool.end();
}

validate().catch(e => { console.error(e); process.exit(1); });

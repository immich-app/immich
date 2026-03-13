import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PNG } from 'pngjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const E2E_DIR = resolve(__dirname, '..');
const BASE_URL = 'http://127.0.0.1:2285/api';
const DB_URL = 'postgres://postgres:postgres@127.0.0.1:5435/immich';
const COMPOSE = 'docker compose -f docker-compose.yml -f docker-compose.storage-migration.yml';
// Must match the server container's IMMICH_MEDIA_LOCATION (default in Docker)
const MEDIA_LOCATION = '/usr/src/app/upload';

// ---------------------------------------------------------------------------
// File Generators
// ---------------------------------------------------------------------------
let pngCounter = 0;

export function createPng(): Buffer {
  const r = pngCounter % 256;
  const g = Math.floor(pngCounter / 256) % 256;
  const b = Math.floor(pngCounter / 65_536) % 256;
  pngCounter++;

  const image = new PNG({ width: 1, height: 1 });
  image.data[0] = r;
  image.data[1] = g;
  image.data[2] = b;
  image.data[3] = 255;
  return PNG.sync.write(image);
}

export function createXmpSidecar(): Buffer {
  const xmp = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:description>Test sidecar for storage migration e2e</dc:description>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
  return Buffer.from(xmp, 'utf8');
}

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------
interface ApiOptions {
  body?: unknown;
  formData?: FormData;
  token?: string;
}

export async function api(method: string, path: string, opts?: ApiOptions): Promise<any> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {};

  if (opts?.token) {
    headers['Authorization'] = `Bearer ${opts.token}`;
  }

  let fetchBody: BodyInit | undefined;

  if (opts?.formData) {
    fetchBody = opts.formData;
  } else if (opts?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(opts.body);
  }

  const res = await fetch(url, { method, headers, body: fetchBody });

  const contentType = res.headers.get('content-type') ?? '';
  const responseBody = await (contentType.includes('application/json') ? res.json() : res.text());

  if (!res.ok) {
    throw new Error(`API ${method} ${path} failed: ${res.status} ${JSON.stringify(responseBody)}`);
  }

  return responseBody;
}

const ADMIN_EMAIL = 'admin@immich.cloud';
const ADMIN_PASSWORD = 'password';
const ADMIN_NAME = 'Admin';

export async function signUpAdmin(): Promise<string> {
  await api('POST', '/auth/admin-sign-up', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME },
  });
  const loginRes = await api('POST', '/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  return loginRes.accessToken;
}

export async function loginAdmin(): Promise<string> {
  const loginRes = await api('POST', '/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  return loginRes.accessToken;
}

export async function uploadAsset(
  token: string,
  filename: string,
  data: Buffer,
  sidecar?: Buffer,
): Promise<{ id: string; status: number }> {
  const form = new FormData();
  form.append('assetData', new Blob([new Uint8Array(data)]), filename);
  form.append('deviceAssetId', `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  form.append('deviceId', 'e2e-storage-migration');
  form.append('fileCreatedAt', new Date().toISOString());
  form.append('fileModifiedAt', new Date().toISOString());

  if (sidecar) {
    form.append('sidecarData', new Blob([new Uint8Array(sidecar)]), `${filename}.xmp`);
  }

  const url = `${BASE_URL}/assets`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(`Upload asset failed: ${res.status} ${JSON.stringify(body)}`);
  }

  return { id: body.id, status: res.status };
}

export async function uploadProfileImage(token: string, data: Buffer): Promise<void> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(data)]), 'profile.png');

  await api('POST', '/users/profile-image', { formData: form, token });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForProcessing(token: string, timeoutMs = 60_000): Promise<void> {
  await sleep(2000);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const jobs = await api('GET', '/jobs', { token });

    let allIdle = true;
    for (const [, queueData] of Object.entries(jobs) as [string, any][]) {
      const counts = queueData.jobCounts;
      if (counts && (counts.active > 0 || counts.waiting > 0 || counts.delayed > 0)) {
        allIdle = false;
        break;
      }
    }

    if (allIdle) {
      return;
    }

    await sleep(500);
  }

  throw new Error(`waitForProcessing timed out after ${timeoutMs}ms`);
}

export async function startMigration(token: string, direction: 'toS3' | 'toDisk'): Promise<string> {
  const body = {
    direction,
    deleteSource: true,
    fileTypes: {
      originals: true,
      thumbnails: true,
      previews: true,
      fullsize: true,
      encodedVideos: true,
      sidecars: true,
      personThumbnails: true,
      profileImages: true,
    },
    concurrency: 5,
  };

  const res = await api('POST', '/storage-migration/start', { body, token });
  return res.batchId;
}

export async function waitForMigration(token: string, timeoutMs = 120_000): Promise<void> {
  // Give the orchestrator job time to queue worker jobs
  await sleep(2000);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await api('GET', '/storage-migration/status', { token });

    console.log(
      `  migration status: isActive=${status.isActive} active=${status.active ?? 0} waiting=${status.waiting ?? 0} completed=${status.completed ?? 0} failed=${status.failed ?? 0}`,
    );

    if (!status.isActive && (status.waiting ?? 0) === 0 && (status.active ?? 0) === 0) {
      if ((status.failed ?? 0) > 0) {
        throw new Error(`Storage migration completed with ${status.failed} failed jobs`);
      }
      return;
    }

    await sleep(1000);
  }

  throw new Error(`waitForMigration timed out after ${timeoutMs}ms`);
}

// ---------------------------------------------------------------------------
// DB Helpers
// ---------------------------------------------------------------------------
let db: pg.Client;

export async function connectDb(): Promise<void> {
  db = new pg.Client(DB_URL);
  await db.connect();
}

export async function queryDb<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await db.query(sql, params);
  return result.rows as T[];
}

export async function disconnectDb(): Promise<void> {
  if (db) {
    await db.end();
  }
}

export interface MigrationState {
  assets: { id: string; originalPath: string; encodedVideoPath: string | null }[];
  assetFiles: { id: string; path: string; type: string }[];
  persons: { id: string; thumbnailPath: string }[];
  users: { id: string; profileImagePath: string }[];
  migrationLogs: { id: string; entityType: string; direction: string; batchId: string }[];
}

export async function captureState(): Promise<MigrationState> {
  const [assets, assetFiles, persons, users, migrationLogs] = await Promise.all([
    queryDb<{ id: string; originalPath: string; encodedVideoPath: string | null }>(
      'SELECT id, "originalPath", "encodedVideoPath" FROM asset ORDER BY id',
    ),
    queryDb<{ id: string; path: string; type: string }>('SELECT id, path, type FROM asset_file ORDER BY id'),
    queryDb<{ id: string; thumbnailPath: string }>(
      'SELECT id, "thumbnailPath" FROM person WHERE "thumbnailPath" != \'\' ORDER BY id',
    ),
    queryDb<{ id: string; profileImagePath: string }>(
      'SELECT id, "profileImagePath" FROM "user" WHERE "profileImagePath" != \'\' ORDER BY id',
    ),
    queryDb<{ id: string; entityType: string; direction: string; batchId: string }>(
      'SELECT id, "entityType", direction, "batchId" FROM storage_migration_log ORDER BY id',
    ),
  ]);

  return { assets, assetFiles, persons, users, migrationLogs };
}

// ---------------------------------------------------------------------------
// Docker Exec Helpers
// ---------------------------------------------------------------------------
export function dockerExec(service: string, cmd: string): string {
  const escaped = cmd.replaceAll("'", String.raw`'\''`);
  return execSync(`${COMPOSE} exec -T ${service} sh -c '${escaped}'`, {
    cwd: E2E_DIR,
    timeout: 30_000,
    encoding: 'utf8',
  }).trim();
}

export function minioFileExists(key: string): boolean {
  try {
    dockerExec('minio', `mc stat local/immich-test/${key}`);
    return true;
  } catch {
    return false;
  }
}

export function diskFileExists(path: string): boolean {
  try {
    dockerExec('immich-server', `test -f "${path}"`);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Setup
// ---------------------------------------------------------------------------
async function phaseSetup(): Promise<void> {
  console.log('=== Phase 1: Setup ===');

  // Create admin user
  console.log('  Signing up admin...');
  const token = await signUpAdmin();

  // Upload test assets
  console.log('  Uploading image asset...');
  const asset1 = await uploadAsset(token, 'test-image.png', createPng());
  console.log(`  Uploaded asset: ${asset1.id}`);

  console.log('  Uploading image with XMP sidecar...');
  const asset2 = await uploadAsset(token, 'test-sidecar.png', createPng(), createXmpSidecar());
  console.log(`  Uploaded asset with sidecar: ${asset2.id}`);

  // Upload profile image
  console.log('  Uploading profile image...');
  await uploadProfileImage(token, createPng());

  // Create a person with a real thumbnail file
  console.log('  Creating person with thumbnail...');
  const person = await api('POST', '/people', { body: { name: 'Test Person' }, token });
  console.log(`  Created person: ${person.id}`);

  dockerExec('immich-server', 'mkdir -p /usr/src/app/upload/thumbs');
  const pngBase64 = createPng().toString('base64');
  dockerExec('immich-server', `echo '${pngBase64}' | base64 -d > /usr/src/app/upload/thumbs/person-test.png`);
  await queryDb('UPDATE person SET "thumbnailPath" = $1 WHERE id = $2', [
    '/usr/src/app/upload/thumbs/person-test.png',
    person.id,
  ]);
  console.log('  Person thumbnail written and DB updated');

  // Wait for processing (thumbnails, previews, etc.)
  console.log('  Waiting for job processing...');
  await waitForProcessing(token);

  // Verify initial state
  console.log('  Capturing and verifying initial state...');
  const state = await captureState();

  assert.ok(state.assets.length >= 2, `Expected >= 2 assets, got ${state.assets.length}`);
  assert.ok(state.assetFiles.length > 0, `Expected > 0 asset files, got ${state.assetFiles.length}`);

  for (const asset of state.assets) {
    assert.ok(asset.originalPath.startsWith('/'), `Asset originalPath is not absolute: ${asset.originalPath}`);
  }
  for (const af of state.assetFiles) {
    assert.ok(af.path.startsWith('/'), `AssetFile path is not absolute: ${af.path}`);
  }
  for (const p of state.persons) {
    assert.ok(p.thumbnailPath.startsWith('/'), `Person thumbnailPath is not absolute: ${p.thumbnailPath}`);
  }

  console.log(`  Assets: ${state.assets.length}`);
  console.log(`  Asset files: ${state.assetFiles.length}`);
  console.log(`  Persons with thumbnails: ${state.persons.length}`);
  console.log(`  Users with profile images: ${state.users.length}`);
  console.log('=== Phase 1: Setup complete ===');
}

// ---------------------------------------------------------------------------
// Phase 2: Migrate to S3
// ---------------------------------------------------------------------------
async function phaseMigrateToS3(): Promise<void> {
  console.log('=== Phase 2: Migrate to S3 ===');

  // Login (server was restarted, old sessions invalid)
  console.log('  Logging in as admin...');
  const token = await loginAdmin();

  // Get migration estimate
  console.log('  Getting migration estimate...');
  const estimate = await api('GET', '/storage-migration/estimate?direction=toS3', { token });
  const counts = estimate.fileCounts;
  console.log(
    `  Estimate: total=${counts.total} originals=${counts.originals ?? 0} thumbnails=${counts.thumbnails ?? 0}`,
  );
  assert.ok(counts.total > 0, `Expected estimate total > 0, got ${counts.total}`);

  // Start migration
  console.log('  Starting migration to S3...');
  const batchId = await startMigration(token, 'toS3');
  console.log(`  Batch ID: ${batchId}`);

  // Wait for migration to complete
  console.log('  Waiting for migration to complete...');
  await waitForMigration(token);

  // Set up minio mc alias
  console.log('  Setting up MinIO mc alias...');
  dockerExec('minio', 'mc alias set local http://localhost:9000 minioadmin minioadmin');

  // Validate
  console.log('  Capturing and validating post-migration state...');
  const state = await captureState();

  // DB paths should be relative (not starting with /)
  for (const asset of state.assets) {
    assert.ok(
      !asset.originalPath.startsWith('/'),
      `Asset originalPath should be relative after S3 migration: ${asset.originalPath}`,
    );
  }
  for (const af of state.assetFiles) {
    assert.ok(!af.path.startsWith('/'), `AssetFile path should be relative after S3 migration: ${af.path}`);
  }
  for (const p of state.persons) {
    assert.ok(
      !p.thumbnailPath.startsWith('/'),
      `Person thumbnailPath should be relative after S3 migration: ${p.thumbnailPath}`,
    );
  }
  for (const u of state.users) {
    if (u.profileImagePath) {
      assert.ok(
        !u.profileImagePath.startsWith('/'),
        `User profileImagePath should be relative after S3 migration: ${u.profileImagePath}`,
      );
    }
  }

  // API access: each asset original should be accessible
  console.log('  Verifying API access to assets...');
  for (const asset of state.assets) {
    const res = await fetch(`${BASE_URL}/assets/${asset.id}/original`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    assert.ok(res.status === 200, `Expected 200 for asset ${asset.id} original, got ${res.status}`);
    // Consume body to avoid leaking connections
    await res.arrayBuffer();
  }

  // MinIO files exist (originals, asset files, person thumbnails, profile images)
  console.log('  Verifying MinIO files exist...');
  for (const asset of state.assets) {
    assert.ok(minioFileExists(asset.originalPath), `Expected MinIO file to exist: ${asset.originalPath}`);
  }
  for (const af of state.assetFiles) {
    assert.ok(minioFileExists(af.path), `Expected MinIO asset file to exist: ${af.path}`);
  }
  for (const p of state.persons) {
    assert.ok(minioFileExists(p.thumbnailPath), `Expected MinIO person thumbnail to exist: ${p.thumbnailPath}`);
  }
  for (const u of state.users) {
    if (u.profileImagePath) {
      assert.ok(minioFileExists(u.profileImagePath), `Expected MinIO profile image to exist: ${u.profileImagePath}`);
    }
  }

  // Disk files gone (deleteSource: true)
  console.log('  Verifying disk files are removed...');
  for (const asset of state.assets) {
    assert.ok(
      !diskFileExists(`${MEDIA_LOCATION}/${asset.originalPath}`),
      `Expected disk file to be deleted: ${MEDIA_LOCATION}/${asset.originalPath}`,
    );
  }

  // Migration log validation
  const s3Logs = state.migrationLogs.filter((l) => l.direction === 'toS3');
  assert.ok(s3Logs.length > 0, `Expected migration logs with direction=toS3, got ${s3Logs.length}`);
  const batchLogs = s3Logs.filter((l) => l.batchId === batchId);
  assert.ok(batchLogs.length > 0, `Expected migration logs with batchId=${batchId}, got ${batchLogs.length}`);

  console.log(`  Assets: ${state.assets.length}, Asset files: ${state.assetFiles.length}`);
  console.log(`  Persons: ${state.persons.length}, Users with profile: ${state.users.length}`);
  console.log(`  Migration log entries (toS3): ${s3Logs.length}`);
  console.log('=== Phase 2: Migrate to S3 complete ===');
}

// ---------------------------------------------------------------------------
// Phase 3: Migrate to Disk
// ---------------------------------------------------------------------------
async function phaseMigrateToDisk(): Promise<void> {
  console.log('=== Phase 3: Migrate to Disk ===');

  // Login
  console.log('  Logging in as admin...');
  const token = await loginAdmin();

  // Start migration
  console.log('  Starting migration to disk...');
  const batchId = await startMigration(token, 'toDisk');
  console.log(`  Batch ID: ${batchId}`);

  // Wait for migration to complete
  console.log('  Waiting for migration to complete...');
  await waitForMigration(token);

  // Validate
  console.log('  Capturing and validating post-migration state...');
  const state = await captureState();

  // DB paths should be absolute (starting with /)
  for (const asset of state.assets) {
    assert.ok(
      asset.originalPath.startsWith('/'),
      `Asset originalPath should be absolute after disk migration: ${asset.originalPath}`,
    );
  }
  for (const af of state.assetFiles) {
    assert.ok(af.path.startsWith('/'), `AssetFile path should be absolute after disk migration: ${af.path}`);
  }
  for (const p of state.persons) {
    assert.ok(
      p.thumbnailPath.startsWith('/'),
      `Person thumbnailPath should be absolute after disk migration: ${p.thumbnailPath}`,
    );
  }
  for (const u of state.users) {
    if (u.profileImagePath) {
      assert.ok(
        u.profileImagePath.startsWith('/'),
        `User profileImagePath should be absolute after disk migration: ${u.profileImagePath}`,
      );
    }
  }

  // API access: each asset original should be accessible
  console.log('  Verifying API access to assets...');
  for (const asset of state.assets) {
    const res = await fetch(`${BASE_URL}/assets/${asset.id}/original`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    assert.ok(res.status === 200, `Expected 200 for asset ${asset.id} original, got ${res.status}`);
    // Consume body to avoid leaking connections
    await res.arrayBuffer();
  }

  // Disk files exist (originals, asset files, person thumbnails, profile images)
  console.log('  Verifying disk files exist...');
  for (const asset of state.assets) {
    assert.ok(diskFileExists(asset.originalPath), `Expected disk file to exist: ${asset.originalPath}`);
  }
  for (const af of state.assetFiles) {
    assert.ok(diskFileExists(af.path), `Expected disk asset file to exist: ${af.path}`);
  }
  for (const p of state.persons) {
    assert.ok(diskFileExists(p.thumbnailPath), `Expected disk person thumbnail to exist: ${p.thumbnailPath}`);
  }
  for (const u of state.users) {
    if (u.profileImagePath) {
      assert.ok(diskFileExists(u.profileImagePath), `Expected disk profile image to exist: ${u.profileImagePath}`);
    }
  }

  // MinIO files gone (deleteSource: true)
  console.log('  Setting up MinIO mc alias...');
  dockerExec('minio', 'mc alias set local http://localhost:9000 minioadmin minioadmin');

  console.log('  Verifying MinIO files are removed...');
  const mediaPrefix = new RegExp(`^${MEDIA_LOCATION}/`);
  for (const asset of state.assets) {
    const s3Key = asset.originalPath.replace(mediaPrefix, '');
    assert.ok(!minioFileExists(s3Key), `Expected MinIO file to be deleted: ${s3Key}`);
  }

  // Migration log validation
  const diskLogs = state.migrationLogs.filter((l) => l.direction === 'toDisk');
  assert.ok(diskLogs.length > 0, `Expected migration logs with direction=toDisk, got ${diskLogs.length}`);

  console.log(`  Assets: ${state.assets.length}, Asset files: ${state.assetFiles.length}`);
  console.log(`  Persons: ${state.persons.length}, Users with profile: ${state.users.length}`);
  console.log(`  Migration log entries (toDisk): ${diskLogs.length}`);
  console.log('=== Phase 3: Migrate to Disk complete ===');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const phase = process.argv[2];
  if (!phase) {
    throw new Error('Usage: storage-migration.ts <setup|migrate-to-s3|migrate-to-disk>');
  }

  try {
    await connectDb();

    switch (phase) {
      case 'setup': {
        await phaseSetup();
        break;
      }
      case 'migrate-to-s3': {
        await phaseMigrateToS3();
        break;
      }
      case 'migrate-to-disk': {
        await phaseMigrateToDisk();
        break;
      }
      default: {
        throw new Error(`Unknown phase: ${phase}`);
      }
    }
  } finally {
    await disconnectDb();
  }
}

void main();

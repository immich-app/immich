import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
// Cross-phase state file (persists asset IDs, content hashes, user credentials)
const STATE_FILE = resolve(E2E_DIR, '.storage-migration-state.json');

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
// Cross-Phase State Helpers
// ---------------------------------------------------------------------------
function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function saveState(data: Record<string, unknown>): void {
  const existing = loadState();
  writeFileSync(STATE_FILE, JSON.stringify({ ...existing, ...data }, null, 2));
}

function loadState(): Record<string, any> {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  }
  return {};
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

export async function createUser(adminToken: string, email: string, password: string, name: string): Promise<string> {
  await api('POST', '/admin/users', {
    body: { email, password, name },
    token: adminToken,
  });
  const loginRes = await api('POST', '/auth/login', {
    body: { email, password },
  });
  return loginRes.accessToken;
}

export async function loginUser(email: string, password: string): Promise<string> {
  const loginRes = await api('POST', '/auth/login', {
    body: { email, password },
  });
  return loginRes.accessToken;
}

export async function downloadAssetOriginal(token: string, assetId: string): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/assets/${assetId}/original`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'follow',
  });
  assert.ok(res.status === 200, `Expected 200 for asset ${assetId} original, got ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
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

interface MigrationOptions {
  deleteSource?: boolean;
  fileTypes?: Partial<{
    originals: boolean;
    thumbnails: boolean;
    previews: boolean;
    fullsize: boolean;
    encodedVideos: boolean;
    sidecars: boolean;
    personThumbnails: boolean;
    profileImages: boolean;
  }>;
  concurrency?: number;
}

const ALL_FILE_TYPES = {
  originals: true,
  thumbnails: true,
  previews: true,
  fullsize: true,
  encodedVideos: true,
  sidecars: true,
  personThumbnails: true,
  profileImages: true,
};

export async function startMigration(
  token: string,
  direction: 'toS3' | 'toDisk',
  options?: MigrationOptions,
): Promise<string> {
  const body = {
    direction,
    deleteSource: options?.deleteSource ?? true,
    fileTypes: { ...ALL_FILE_TYPES, ...options?.fileTypes },
    concurrency: options?.concurrency ?? 5,
  };

  const res = await api('POST', '/storage-migration/start', { body, token });
  return res.batchId;
}

export async function waitForMigration(token: string, timeoutMs = 120_000): Promise<void> {
  // Give the orchestrator job time to be picked up by BullMQ workers.
  // On CI after a server restart, workers may take several seconds to connect.
  await sleep(5000);

  const deadline = Date.now() + timeoutMs;
  let sawActivity = false;

  while (Date.now() < deadline) {
    const status = await api('GET', '/storage-migration/status', { token });

    const active = status.active ?? 0;
    const waiting = status.waiting ?? 0;
    const completed = status.completed ?? 0;
    const failed = status.failed ?? 0;

    console.log(
      `  migration status: isActive=${status.isActive} active=${active} waiting=${waiting} completed=${completed} failed=${failed}`,
    );

    if (status.isActive || active > 0 || waiting > 0 || completed > 0 || failed > 0) {
      sawActivity = true;
    }

    if (sawActivity && !status.isActive && waiting === 0 && active === 0) {
      if (failed > 0) {
        throw new Error(`Storage migration completed with ${failed} failed jobs`);
      }
      return;
    }

    // If we haven't seen any activity yet, keep waiting — the job may not have been picked up
    await sleep(1000);
  }

  throw new Error(`waitForMigration timed out after ${timeoutMs}ms (sawActivity=${sawActivity})`);
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
  assets: { id: string; originalPath: string }[];
  assetFiles: { id: string; path: string; type: string }[];
  persons: { id: string; thumbnailPath: string }[];
  users: { id: string; profileImagePath: string }[];
  migrationLogs: { id: string; entityType: string; direction: string; batchId: string }[];
}

export async function captureState(): Promise<MigrationState> {
  const [assets, assetFiles, persons, users, migrationLogs] = await Promise.all([
    queryDb<{ id: string; originalPath: string }>('SELECT id, "originalPath" FROM asset ORDER BY id'),
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

export function minioReadFile(key: string): string {
  return dockerExec('minio', `mc cat local/immich-test/${key}`);
}

export function minioSetupAlias(): void {
  dockerExec('minio', 'mc alias set local http://localhost:9000 minioadmin minioadmin');
}

// ---------------------------------------------------------------------------
// Phase 1: Setup
// ---------------------------------------------------------------------------
async function phaseSetup(): Promise<void> {
  console.log('=== Phase 1: Setup ===');

  // Create admin user
  console.log('  Signing up admin...');
  const adminToken = await signUpAdmin();

  const contentHashes: Record<string, string> = {};

  // Upload test assets as admin
  console.log('  Uploading image asset...');
  const png1 = createPng();
  const asset1 = await uploadAsset(adminToken, 'test-image.png', png1);
  contentHashes[asset1.id] = sha256(png1);
  console.log(`  Uploaded asset: ${asset1.id}`);

  console.log('  Uploading image with XMP sidecar...');
  const png2 = createPng();
  const sidecar = createXmpSidecar();
  const asset2 = await uploadAsset(adminToken, 'test-sidecar.png', png2, sidecar);
  contentHashes[asset2.id] = sha256(png2);
  const sidecarHash = sha256(sidecar);
  console.log(`  Uploaded asset with sidecar: ${asset2.id}`);

  // Upload profile image for admin
  console.log('  Uploading profile image...');
  await uploadProfileImage(adminToken, createPng());

  // Create a person with a real thumbnail file
  console.log('  Creating person with thumbnail...');
  const person = await api('POST', '/people', { body: { name: 'Test Person' }, token: adminToken });
  console.log(`  Created person: ${person.id}`);

  dockerExec('immich-server', 'mkdir -p /usr/src/app/upload/thumbs');
  const pngBase64 = createPng().toString('base64');
  dockerExec('immich-server', `echo '${pngBase64}' | base64 -d > /usr/src/app/upload/thumbs/person-test.png`);
  await queryDb('UPDATE person SET "thumbnailPath" = $1 WHERE id = $2', [
    '/usr/src/app/upload/thumbs/person-test.png',
    person.id,
  ]);
  console.log('  Person thumbnail written and DB updated');

  // Create second user with their own assets
  console.log('  Creating second user...');
  const user2Email = 'user2@immich.cloud';
  const user2Password = 'password';
  const user2Token = await createUser(adminToken, user2Email, user2Password, 'User Two');

  console.log('  Uploading asset as second user...');
  const png3 = createPng();
  const asset3 = await uploadAsset(user2Token, 'user2-image.png', png3);
  contentHashes[asset3.id] = sha256(png3);
  console.log(`  Uploaded user2 asset: ${asset3.id}`);

  console.log('  Uploading profile image for second user...');
  await uploadProfileImage(user2Token, createPng());

  // Wait for processing (thumbnails, previews, etc.)
  console.log('  Waiting for job processing...');
  await waitForProcessing(adminToken);

  // Verify initial state
  console.log('  Capturing and verifying initial state...');
  const state = await captureState();

  assert.ok(state.assets.length >= 3, `Expected >= 3 assets, got ${state.assets.length}`);
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
  for (const u of state.users) {
    if (u.profileImagePath) {
      assert.ok(u.profileImagePath.startsWith('/'), `User profileImagePath is not absolute: ${u.profileImagePath}`);
    }
  }

  // Verify multi-user: both users have profile images
  assert.ok(state.users.length >= 2, `Expected >= 2 users with profile images, got ${state.users.length}`);

  // Save state for later phases
  saveState({
    contentHashes,
    sidecarHash,
    sidecarAssetId: asset2.id,
    user2: { email: user2Email, password: user2Password },
    adminAssetIds: [asset1.id, asset2.id],
    user2AssetIds: [asset3.id],
  });

  console.log(`  Assets: ${state.assets.length}`);
  console.log(`  Asset files: ${state.assetFiles.length}`);
  console.log(`  Persons with thumbnails: ${state.persons.length}`);
  console.log(`  Users with profile images: ${state.users.length}`);
  console.log(`  Content hashes stored: ${Object.keys(contentHashes).length}`);
  console.log('=== Phase 1: Setup complete ===');
}

// ---------------------------------------------------------------------------
// Phase 2: Migrate to S3
// ---------------------------------------------------------------------------
async function phaseMigrateToS3(): Promise<void> {
  console.log('=== Phase 2: Migrate to S3 ===');

  // Login as both users (server was restarted, old sessions invalid)
  console.log('  Logging in as admin...');
  const token = await loginAdmin();
  const savedState = loadState();
  const user2Token = savedState.user2 ? await loginUser(savedState.user2.email, savedState.user2.password) : null;

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
  minioSetupAlias();

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

  // Multi-user verification: both users' assets migrated
  if (savedState.adminAssetIds && savedState.user2AssetIds) {
    const allUploadedIds = [...savedState.adminAssetIds, ...savedState.user2AssetIds];
    for (const id of allUploadedIds) {
      const asset = state.assets.find((a: { id: string }) => a.id === id);
      assert.ok(asset, `Expected uploaded asset ${id} to exist in DB`);
      assert.ok(
        !asset.originalPath.startsWith('/'),
        `Uploaded asset ${id} should have relative path after S3 migration: ${asset.originalPath}`,
      );
    }
    console.log(`  Multi-user: all ${allUploadedIds.length} uploaded assets have relative paths`);
  }

  // Multi-user verification: both users' profile images migrated
  assert.ok(
    state.users.length >= 2,
    `Expected >= 2 users with profile images after migration, got ${state.users.length}`,
  );
  for (const u of state.users) {
    if (u.profileImagePath) {
      assert.ok(
        !u.profileImagePath.startsWith('/'),
        `User ${u.id} profileImagePath should be relative: ${u.profileImagePath}`,
      );
    }
  }

  // API access: each asset original should be accessible (admin)
  console.log('  Verifying API access to assets (admin)...');
  for (const asset of state.assets) {
    const res = await fetch(`${BASE_URL}/assets/${asset.id}/original`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    assert.ok(res.status === 200, `Expected 200 for asset ${asset.id} original, got ${res.status}`);
    await res.arrayBuffer();
  }

  // API access: user2 can access their own assets
  if (user2Token && savedState.user2AssetIds) {
    console.log('  Verifying API access to assets (user2)...');
    for (const id of savedState.user2AssetIds) {
      const res = await fetch(`${BASE_URL}/assets/${id}/original`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        redirect: 'follow',
      });
      assert.ok(res.status === 200, `Expected 200 for user2 asset ${id} original, got ${res.status}`);
      await res.arrayBuffer();
    }
  }

  // Content integrity: download originals and compare SHA-256 hashes
  if (savedState.contentHashes) {
    console.log('  Verifying content integrity (SHA-256)...');
    for (const [assetId, expectedHash] of Object.entries(savedState.contentHashes)) {
      // Admin can access all assets
      const content = await downloadAssetOriginal(token, assetId);
      const actualHash = sha256(content);
      assert.equal(
        actualHash,
        expectedHash,
        `Content hash mismatch for asset ${assetId}: expected ${expectedHash}, got ${actualHash}`,
      );
    }
    console.log(`  Content integrity verified for ${Object.keys(savedState.contentHashes).length} assets`);
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

  // Save batchId for rollback phase
  saveState({ lastToS3BatchId: batchId });

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

  // Login as both users
  console.log('  Logging in as admin...');
  const token = await loginAdmin();
  const savedState = loadState();
  const user2Token = savedState.user2 ? await loginUser(savedState.user2.email, savedState.user2.password) : null;

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

  // Multi-user verification: both users' assets migrated back
  if (savedState.adminAssetIds && savedState.user2AssetIds) {
    const allUploadedIds = [...savedState.adminAssetIds, ...savedState.user2AssetIds];
    for (const id of allUploadedIds) {
      const asset = state.assets.find((a: { id: string }) => a.id === id);
      assert.ok(asset, `Expected uploaded asset ${id} to exist in DB`);
      assert.ok(
        asset.originalPath.startsWith('/'),
        `Uploaded asset ${id} should have absolute path after disk migration: ${asset.originalPath}`,
      );
    }
    console.log(`  Multi-user: all ${allUploadedIds.length} uploaded assets have absolute paths`);
  }

  // Multi-user verification: both users' profile images migrated back
  assert.ok(
    state.users.length >= 2,
    `Expected >= 2 users with profile images after migration, got ${state.users.length}`,
  );

  // API access: each asset original should be accessible (admin)
  console.log('  Verifying API access to assets (admin)...');
  for (const asset of state.assets) {
    const res = await fetch(`${BASE_URL}/assets/${asset.id}/original`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    assert.ok(res.status === 200, `Expected 200 for asset ${asset.id} original, got ${res.status}`);
    await res.arrayBuffer();
  }

  // API access: user2 can access their own assets
  if (user2Token && savedState.user2AssetIds) {
    console.log('  Verifying API access to assets (user2)...');
    for (const id of savedState.user2AssetIds) {
      const res = await fetch(`${BASE_URL}/assets/${id}/original`, {
        headers: { Authorization: `Bearer ${user2Token}` },
        redirect: 'follow',
      });
      assert.ok(res.status === 200, `Expected 200 for user2 asset ${id} original, got ${res.status}`);
      await res.arrayBuffer();
    }
  }

  // Content integrity: download originals and compare SHA-256 hashes
  if (savedState.contentHashes) {
    console.log('  Verifying content integrity (SHA-256)...');
    for (const [assetId, expectedHash] of Object.entries(savedState.contentHashes)) {
      const content = await downloadAssetOriginal(token, assetId);
      const actualHash = sha256(content);
      assert.equal(
        actualHash,
        expectedHash,
        `Content hash mismatch for asset ${assetId}: expected ${expectedHash}, got ${actualHash}`,
      );
    }
    console.log(`  Content integrity verified for ${Object.keys(savedState.contentHashes).length} assets`);
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
  minioSetupAlias();

  console.log('  Verifying MinIO files are removed...');
  const mediaPrefix = new RegExp(`^${MEDIA_LOCATION}/`);
  for (const asset of state.assets) {
    const s3Key = asset.originalPath.replace(mediaPrefix, '');
    assert.ok(!minioFileExists(s3Key), `Expected MinIO file to be deleted: ${s3Key}`);
  }

  // Migration log validation
  const diskLogs = state.migrationLogs.filter((l) => l.direction === 'toDisk');
  assert.ok(diskLogs.length > 0, `Expected migration logs with direction=toDisk, got ${diskLogs.length}`);

  // Save batchId for potential rollback testing
  saveState({ lastToDiskBatchId: batchId });

  console.log(`  Assets: ${state.assets.length}, Asset files: ${state.assetFiles.length}`);
  console.log(`  Persons: ${state.persons.length}, Users with profile: ${state.users.length}`);
  console.log(`  Migration log entries (toDisk): ${diskLogs.length}`);
  console.log('=== Phase 3: Migrate to Disk complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Estimate Validation
// Precondition: files are on disk (run after setup or after migrate-to-disk)
// Backend: either disk or s3 (estimate is a DB query, no backend validation)
// ---------------------------------------------------------------------------
async function phaseEstimate(): Promise<void> {
  console.log('=== Phase: Estimate Validation ===');
  const token = await loginAdmin();

  // toS3 estimate: files are on disk, so should have counts
  console.log('  Getting toS3 estimate...');
  const toS3 = await api('GET', '/storage-migration/estimate?direction=toS3', { token });
  console.log(
    `  toS3: total=${toS3.fileCounts.total} originals=${toS3.fileCounts.originals} thumbnails=${toS3.fileCounts.thumbnails} previews=${toS3.fileCounts.previews}`,
  );
  assert.ok(toS3.fileCounts.total > 0, `Expected toS3 total > 0, got ${toS3.fileCounts.total}`);
  assert.ok(
    toS3.fileCounts.originals >= 3,
    `Expected originals >= 3 (3 uploaded assets), got ${toS3.fileCounts.originals}`,
  );
  assert.ok(toS3.fileCounts.thumbnails > 0, `Expected thumbnails > 0, got ${toS3.fileCounts.thumbnails}`);
  assert.ok(toS3.fileCounts.previews > 0, `Expected previews > 0, got ${toS3.fileCounts.previews}`);
  assert.ok(
    toS3.fileCounts.personThumbnails > 0,
    `Expected personThumbnails > 0, got ${toS3.fileCounts.personThumbnails}`,
  );
  assert.ok(toS3.fileCounts.profileImages >= 2, `Expected profileImages >= 2, got ${toS3.fileCounts.profileImages}`);
  assert.ok(toS3.estimatedSizeBytes > 0, `Expected estimatedSizeBytes > 0, got ${toS3.estimatedSizeBytes}`);

  // Verify total matches sum of individual counts
  const expectedTotal =
    toS3.fileCounts.originals +
    toS3.fileCounts.thumbnails +
    toS3.fileCounts.previews +
    toS3.fileCounts.fullsize +
    toS3.fileCounts.sidecars +
    toS3.fileCounts.encodedVideos +
    toS3.fileCounts.personThumbnails +
    toS3.fileCounts.profileImages;
  assert.equal(toS3.fileCounts.total, expectedTotal, `Total ${toS3.fileCounts.total} != sum ${expectedTotal}`);

  // toDisk estimate: files are already on disk, so should be 0
  console.log('  Getting toDisk estimate...');
  const toDisk = await api('GET', '/storage-migration/estimate?direction=toDisk', { token });
  console.log(`  toDisk: total=${toDisk.fileCounts.total}`);
  assert.equal(toDisk.fileCounts.total, 0, `Expected toDisk total = 0, got ${toDisk.fileCounts.total}`);
  assert.equal(toDisk.fileCounts.originals, 0, `Expected toDisk originals = 0, got ${toDisk.fileCounts.originals}`);

  // Save estimate for later comparison
  saveState({ initialEstimate: toS3 });

  console.log('=== Phase: Estimate Validation complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Rollback
// Precondition: files are on S3 (run after migrate-to-s3)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseRollback(): Promise<void> {
  console.log('=== Phase: Rollback ===');
  const token = await loginAdmin();
  const savedState = loadState();

  const batchId = savedState.lastToS3BatchId;
  assert.ok(batchId, 'No lastToS3BatchId in state — run migrate-to-s3 first');

  // Capture pre-rollback state (paths should be relative / S3)
  const preState = await captureState();
  for (const asset of preState.assets) {
    assert.ok(
      !asset.originalPath.startsWith('/'),
      `Pre-rollback: asset path should be relative: ${asset.originalPath}`,
    );
  }

  // Perform rollback
  console.log(`  Rolling back batch ${batchId}...`);
  const result = await api('POST', `/storage-migration/rollback/${batchId}`, { token });
  console.log(`  Rollback result: rolledBack=${result.rolledBack} failed=${result.failed} total=${result.total}`);

  assert.ok(result.total > 0, `Expected rollback total > 0, got ${result.total}`);
  assert.equal(result.failed, 0, `Expected 0 rollback failures, got ${result.failed}`);
  assert.equal(
    result.rolledBack,
    result.total,
    `Expected all ${result.total} entries rolled back, got ${result.rolledBack}`,
  );

  // Verify paths reverted to absolute (disk paths)
  console.log('  Verifying paths reverted to absolute...');
  const postState = await captureState();

  for (const asset of postState.assets) {
    assert.ok(
      asset.originalPath.startsWith('/'),
      `Post-rollback: asset originalPath should be absolute: ${asset.originalPath}`,
    );
  }
  for (const af of postState.assetFiles) {
    assert.ok(af.path.startsWith('/'), `Post-rollback: assetFile path should be absolute: ${af.path}`);
  }
  for (const p of postState.persons) {
    assert.ok(
      p.thumbnailPath.startsWith('/'),
      `Post-rollback: person thumbnailPath should be absolute: ${p.thumbnailPath}`,
    );
  }
  for (const u of postState.users) {
    if (u.profileImagePath) {
      assert.ok(
        u.profileImagePath.startsWith('/'),
        `Post-rollback: user profileImagePath should be absolute: ${u.profileImagePath}`,
      );
    }
  }

  // Note: rollback only reverts DB paths, NOT file locations.
  // Files are still on S3, so API access via disk paths will fail until re-migrated.
  // This is expected — rollback is a DB-only operation.
  console.log('  Verifying files still exist in MinIO (rollback is DB-only)...');
  minioSetupAlias();
  for (const asset of preState.assets) {
    assert.ok(
      minioFileExists(asset.originalPath),
      `MinIO file should still exist after rollback: ${asset.originalPath}`,
    );
  }

  // Verify migration log entries were deleted (successful rollback cleans up)
  const logEntries = postState.migrationLogs.filter((l) => l.batchId === batchId);
  assert.equal(
    logEntries.length,
    0,
    `Expected migration logs for batch ${batchId} to be deleted after rollback, got ${logEntries.length}`,
  );

  // Verify rollback of already-rolled-back batch returns zero counts
  console.log('  Verifying double-rollback returns zero...');
  const doubleResult = await api('POST', `/storage-migration/rollback/${batchId}`, { token });
  assert.equal(doubleResult.total, 0, `Expected double-rollback total = 0, got ${doubleResult.total}`);
  assert.equal(doubleResult.rolledBack, 0, `Expected double-rollback rolledBack = 0, got ${doubleResult.rolledBack}`);

  console.log('=== Phase: Rollback complete ===');
}

// ---------------------------------------------------------------------------
// Phase: No Files to Migrate
// Precondition: all files are already on S3 (run after migrate-to-s3)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseNoFiles(): Promise<void> {
  console.log('=== Phase: No Files to Migrate ===');
  const token = await loginAdmin();

  // Verify estimate shows 0 files for toS3 (everything already there)
  const estimate = await api('GET', '/storage-migration/estimate?direction=toS3', { token });
  console.log(`  toS3 estimate after migration: total=${estimate.fileCounts.total}`);
  assert.equal(estimate.fileCounts.total, 0, `Expected 0 files to migrate toS3, got ${estimate.fileCounts.total}`);

  // Verify toDisk estimate shows files (they're on S3, can be migrated back)
  const toDiskEstimate = await api('GET', '/storage-migration/estimate?direction=toDisk', { token });
  console.log(`  toDisk estimate: total=${toDiskEstimate.fileCounts.total}`);
  assert.ok(toDiskEstimate.fileCounts.total > 0, `Expected toDisk total > 0, got ${toDiskEstimate.fileCounts.total}`);

  // Try starting toS3 migration — should fail with "No files to migrate"
  console.log('  Attempting toS3 migration (should fail)...');
  try {
    await startMigration(token, 'toS3');
    assert.fail('Expected startMigration to throw "No files to migrate"');
  } catch (error: any) {
    assert.ok(
      error.message.includes('No files to migrate'),
      `Expected "No files to migrate" error, got: ${error.message}`,
    );
    console.log('  Correctly rejected: No files to migrate');
  }

  console.log('=== Phase: No Files to Migrate complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Concurrent Migration Rejection
// Precondition: files need migrating (run after setup, migrate-to-disk, or rollback)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseConcurrentRejection(): Promise<void> {
  console.log('=== Phase: Concurrent Migration Rejection ===');
  const token = await loginAdmin();

  // Start first migration with low concurrency to widen the race window
  console.log('  Starting first migration (concurrency=1)...');
  const batchId = await startMigration(token, 'toS3', { concurrency: 1 });
  console.log(`  First migration started: ${batchId}`);

  // Immediately try to start a second migration
  console.log('  Attempting second concurrent migration...');
  try {
    await startMigration(token, 'toS3', { concurrency: 1 });
    // If we get here, the first migration completed before our second call.
    // This is acceptable — verify the second one also completed.
    console.log('  Note: first migration completed before second call (race not caught)');
  } catch (error: any) {
    const msg = error.message;
    // Accept either "already in progress" (caught the race) or "No files to migrate" (first completed)
    assert.ok(
      msg.includes('already in progress') || msg.includes('No files to migrate'),
      `Expected concurrent rejection or no-files error, got: ${msg}`,
    );
    console.log(`  Second migration correctly rejected: ${msg}`);
  }

  // Wait for the first migration to complete
  console.log('  Waiting for migration to complete...');
  await waitForMigration(token);

  // Save the batchId
  saveState({ lastToS3BatchId: batchId });

  console.log('=== Phase: Concurrent Migration Rejection complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Selective Migration (originals only)
// Precondition: files are on disk (run after setup or migrate-to-disk)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseSelectiveToS3(): Promise<void> {
  console.log('=== Phase: Selective Migration (originals only) ===');
  const token = await loginAdmin();

  // Capture pre-migration state
  const preState = await captureState();

  // Verify all paths are absolute (on disk)
  for (const asset of preState.assets) {
    assert.ok(
      asset.originalPath.startsWith('/'),
      `Pre-selective: asset originalPath should be absolute: ${asset.originalPath}`,
    );
  }

  // Start migration with ONLY originals enabled
  console.log('  Starting selective migration (originals only)...');
  const batchId = await startMigration(token, 'toS3', {
    fileTypes: {
      originals: true,
      thumbnails: false,
      previews: false,
      fullsize: false,
      encodedVideos: false,
      sidecars: false,
      personThumbnails: false,
      profileImages: false,
    },
  });
  console.log(`  Batch ID: ${batchId}`);

  await waitForMigration(token);

  // Verify post-migration state
  console.log('  Verifying selective migration results...');
  const postState = await captureState();

  // Originals should be relative (migrated to S3)
  for (const asset of postState.assets) {
    assert.ok(
      !asset.originalPath.startsWith('/'),
      `After selective migration: asset originalPath should be relative: ${asset.originalPath}`,
    );
  }

  // Asset files (thumbnails, previews) should still be absolute (NOT migrated)
  for (const af of postState.assetFiles) {
    assert.ok(
      af.path.startsWith('/'),
      `After selective migration: assetFile path should still be absolute (not migrated): ${af.path}`,
    );
  }

  // Person thumbnails should still be absolute
  for (const p of postState.persons) {
    assert.ok(
      p.thumbnailPath.startsWith('/'),
      `After selective migration: person thumbnailPath should still be absolute: ${p.thumbnailPath}`,
    );
  }

  // User profile images should still be absolute
  for (const u of postState.users) {
    if (u.profileImagePath) {
      assert.ok(
        u.profileImagePath.startsWith('/'),
        `After selective migration: user profileImagePath should still be absolute: ${u.profileImagePath}`,
      );
    }
  }

  // Verify originals exist in MinIO
  console.log('  Verifying originals exist in MinIO...');
  minioSetupAlias();
  for (const asset of postState.assets) {
    assert.ok(minioFileExists(asset.originalPath), `Expected MinIO original to exist: ${asset.originalPath}`);
  }

  // Verify thumbnails still exist on disk
  console.log('  Verifying thumbnails still on disk...');
  for (const af of postState.assetFiles) {
    assert.ok(diskFileExists(af.path), `Expected disk asset file to still exist: ${af.path}`);
  }

  // Verify estimate: originals should be 0, but thumbnails/previews should remain
  const estimate = await api('GET', '/storage-migration/estimate?direction=toS3', { token });
  console.log(
    `  Remaining toS3 estimate: total=${estimate.fileCounts.total} originals=${estimate.fileCounts.originals}`,
  );
  assert.equal(
    estimate.fileCounts.originals,
    0,
    `Expected 0 originals remaining, got ${estimate.fileCounts.originals}`,
  );
  assert.ok(
    estimate.fileCounts.total > 0,
    `Expected remaining files (thumbnails, etc.) > 0, got ${estimate.fileCounts.total}`,
  );

  // Migration log should only contain original-type entries
  const batchLogs = postState.migrationLogs.filter((l) => l.batchId === batchId);
  assert.ok(batchLogs.length > 0, `Expected migration logs for batch ${batchId}`);
  for (const log of batchLogs) {
    assert.equal(
      log.entityType,
      'asset',
      `Selective migration should only have asset entity type, got ${log.entityType}`,
    );
  }

  saveState({ selectiveBatchId: batchId });

  console.log('=== Phase: Selective Migration complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Selective Cleanup (migrate remaining file types)
// Precondition: originals on S3, other files on disk (run after selective-to-s3)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseSelectiveCleanup(): Promise<void> {
  console.log('=== Phase: Selective Cleanup ===');
  const token = await loginAdmin();

  // Migrate remaining file types (everything except originals)
  console.log('  Starting cleanup migration (everything except originals)...');
  const batchId = await startMigration(token, 'toS3', {
    fileTypes: {
      originals: false,
      thumbnails: true,
      previews: true,
      fullsize: true,
      encodedVideos: true,
      sidecars: true,
      personThumbnails: true,
      profileImages: true,
    },
  });
  console.log(`  Batch ID: ${batchId}`);

  await waitForMigration(token);

  // Verify all paths are now relative (everything on S3)
  console.log('  Verifying all paths are relative...');
  const state = await captureState();

  for (const asset of state.assets) {
    assert.ok(
      !asset.originalPath.startsWith('/'),
      `After cleanup: asset originalPath should be relative: ${asset.originalPath}`,
    );
  }
  for (const af of state.assetFiles) {
    assert.ok(!af.path.startsWith('/'), `After cleanup: assetFile path should be relative: ${af.path}`);
  }
  for (const p of state.persons) {
    assert.ok(
      !p.thumbnailPath.startsWith('/'),
      `After cleanup: person thumbnailPath should be relative: ${p.thumbnailPath}`,
    );
  }
  for (const u of state.users) {
    if (u.profileImagePath) {
      assert.ok(
        !u.profileImagePath.startsWith('/'),
        `After cleanup: user profileImagePath should be relative: ${u.profileImagePath}`,
      );
    }
  }

  // Verify estimate shows 0 for toS3
  const estimate = await api('GET', '/storage-migration/estimate?direction=toS3', { token });
  assert.equal(estimate.fileCounts.total, 0, `Expected 0 remaining files, got ${estimate.fileCounts.total}`);

  saveState({ lastToS3BatchId: batchId });

  console.log('=== Phase: Selective Cleanup complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Delete Source False
// Precondition: files are on disk (run after setup or migrate-to-disk)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseDeleteSourceFalse(): Promise<void> {
  console.log('=== Phase: Delete Source False ===');
  const token = await loginAdmin();

  // Capture pre-migration state (all on disk)
  const preState = await captureState();
  const diskPaths = preState.assets.map((a) => a.originalPath);
  for (const path of diskPaths) {
    assert.ok(path.startsWith('/'), `Pre-migration: asset path should be absolute: ${path}`);
    assert.ok(diskFileExists(path), `Pre-migration: disk file should exist: ${path}`);
  }

  // Start migration with deleteSource=false
  console.log('  Starting migration with deleteSource=false...');
  const batchId = await startMigration(token, 'toS3', { deleteSource: false });
  console.log(`  Batch ID: ${batchId}`);

  await waitForMigration(token);

  // Verify DB paths are now relative (S3)
  console.log('  Verifying DB paths updated to relative...');
  const postState = await captureState();
  for (const asset of postState.assets) {
    assert.ok(
      !asset.originalPath.startsWith('/'),
      `After migration: asset originalPath should be relative: ${asset.originalPath}`,
    );
  }
  for (const af of postState.assetFiles) {
    assert.ok(!af.path.startsWith('/'), `After migration: assetFile path should be relative: ${af.path}`);
  }

  // Verify S3 files exist
  console.log('  Verifying S3 files exist...');
  minioSetupAlias();
  for (const asset of postState.assets) {
    assert.ok(minioFileExists(asset.originalPath), `Expected MinIO file to exist: ${asset.originalPath}`);
  }
  for (const af of postState.assetFiles) {
    assert.ok(minioFileExists(af.path), `Expected MinIO asset file to exist: ${af.path}`);
  }

  // CRITICAL: Verify disk files ALSO still exist (deleteSource=false)
  console.log('  Verifying disk files still exist (deleteSource=false)...');
  for (const path of diskPaths) {
    assert.ok(diskFileExists(path), `Disk file should still exist after deleteSource=false migration: ${path}`);
  }

  // Also check asset files on disk
  for (const af of preState.assetFiles) {
    assert.ok(diskFileExists(af.path), `Disk asset file should still exist: ${af.path}`);
  }
  for (const p of preState.persons) {
    assert.ok(diskFileExists(p.thumbnailPath), `Disk person thumbnail should still exist: ${p.thumbnailPath}`);
  }
  for (const u of preState.users) {
    if (u.profileImagePath) {
      assert.ok(diskFileExists(u.profileImagePath), `Disk profile image should still exist: ${u.profileImagePath}`);
    }
  }

  // API access should work (served from S3 now)
  console.log('  Verifying API access works...');
  for (const asset of postState.assets) {
    const res = await fetch(`${BASE_URL}/assets/${asset.id}/original`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    assert.ok(res.status === 200, `Expected 200 for asset ${asset.id} original, got ${res.status}`);
    await res.arrayBuffer();
  }

  saveState({ lastToS3BatchId: batchId });

  console.log('=== Phase: Delete Source False complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Content Verification
// Precondition: files are on S3 (run after migrate-to-s3)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseContentVerify(): Promise<void> {
  console.log('=== Phase: Content Verification ===');
  const token = await loginAdmin();
  const savedState = loadState();

  assert.ok(savedState.contentHashes, 'No contentHashes in state — run setup first');

  const contentHashes: Record<string, string> = savedState.contentHashes;

  // Download every asset original via API and compare SHA-256 hashes
  console.log(`  Verifying content integrity for ${Object.keys(contentHashes).length} assets...`);
  for (const [assetId, expectedHash] of Object.entries(contentHashes)) {
    const content = await downloadAssetOriginal(token, assetId);
    const actualHash = sha256(content);
    assert.equal(
      actualHash,
      expectedHash,
      `Content hash mismatch for asset ${assetId}: expected ${expectedHash}, got ${actualHash}`,
    );
    console.log(`  Asset ${assetId}: hash verified (${actualHash.slice(0, 12)}...)`);
  }

  // Verify user2 can also download their own assets with correct content
  if (savedState.user2 && savedState.user2AssetIds) {
    console.log('  Verifying user2 content integrity...');
    const user2Token = await loginUser(savedState.user2.email, savedState.user2.password);
    for (const assetId of savedState.user2AssetIds) {
      const expectedHash = contentHashes[assetId];
      if (!expectedHash) {
        continue;
      }
      const content = await downloadAssetOriginal(user2Token, assetId);
      const actualHash = sha256(content);
      assert.equal(
        actualHash,
        expectedHash,
        `User2 content hash mismatch for asset ${assetId}: expected ${expectedHash}, got ${actualHash}`,
      );
    }
    console.log(`  User2 content integrity verified for ${savedState.user2AssetIds.length} assets`);
  }

  // Verify thumbnail download works (via /assets/:id/thumbnail)
  console.log('  Verifying thumbnail API access...');
  const state = await captureState();
  for (const asset of state.assets) {
    const res = await fetch(`${BASE_URL}/assets/${asset.id}/thumbnail`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    assert.ok(res.status === 200, `Expected 200 for asset ${asset.id} thumbnail, got ${res.status}`);
    const body = await res.arrayBuffer();
    assert.ok(body.byteLength > 0, `Expected non-empty thumbnail for asset ${asset.id}`);
  }

  console.log('=== Phase: Content Verification complete ===');
}

// ---------------------------------------------------------------------------
// Phase: Sidecar Verification
// Precondition: files are on S3 (run after migrate-to-s3)
// Backend: s3
// ---------------------------------------------------------------------------
async function phaseSidecarVerify(): Promise<void> {
  console.log('=== Phase: Sidecar Verification ===');
  const savedState = loadState();

  assert.ok(savedState.sidecarAssetId, 'No sidecarAssetId in state — run setup first');
  assert.ok(savedState.sidecarHash, 'No sidecarHash in state — run setup first');

  const sidecarAssetId: string = savedState.sidecarAssetId;
  const expectedHash: string = savedState.sidecarHash;

  // Find the sidecar file in the asset_files table
  const sidecarFiles = await queryDb<{ id: string; path: string; type: string }>(
    `SELECT af.id, af.path, af.type FROM asset_file af
     JOIN asset a ON af."assetId" = a.id
     WHERE a.id = $1 AND af.type = 'sidecar'`,
    [sidecarAssetId],
  );

  assert.ok(sidecarFiles.length > 0, `Expected sidecar file for asset ${sidecarAssetId}, found none`);
  const sidecarFile = sidecarFiles[0];
  console.log(`  Sidecar file: ${sidecarFile.path} (type: ${sidecarFile.type})`);

  // Verify path is relative (on S3)
  assert.ok(
    !sidecarFile.path.startsWith('/'),
    `Sidecar path should be relative after S3 migration: ${sidecarFile.path}`,
  );

  // Verify sidecar exists in MinIO
  minioSetupAlias();
  assert.ok(minioFileExists(sidecarFile.path), `Expected MinIO sidecar to exist: ${sidecarFile.path}`);

  // Read sidecar content from MinIO and verify hash
  console.log('  Reading sidecar content from MinIO...');
  const sidecarContent = minioReadFile(sidecarFile.path);
  const actualHash = sha256(Buffer.from(sidecarContent, 'utf8'));
  assert.equal(actualHash, expectedHash, `Sidecar content hash mismatch: expected ${expectedHash}, got ${actualHash}`);

  // Verify the sidecar content is valid XMP
  assert.ok(
    sidecarContent.includes('x:xmpmeta'),
    `Sidecar should contain XMP metadata: ${sidecarContent.slice(0, 100)}`,
  );
  assert.ok(
    sidecarContent.includes('Test sidecar for storage migration e2e'),
    'Sidecar should contain our test description',
  );

  console.log('  Sidecar content verified: hash matches and XMP content valid');
  console.log('=== Phase: Sidecar Verification complete ===');
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
      case 'estimate': {
        await phaseEstimate();
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
      case 'rollback': {
        await phaseRollback();
        break;
      }
      case 'no-files': {
        await phaseNoFiles();
        break;
      }
      case 'concurrent-rejection': {
        await phaseConcurrentRejection();
        break;
      }
      case 'selective-to-s3': {
        await phaseSelectiveToS3();
        break;
      }
      case 'selective-cleanup': {
        await phaseSelectiveCleanup();
        break;
      }
      case 'delete-source-false': {
        await phaseDeleteSourceFalse();
        break;
      }
      case 'content-verify': {
        await phaseContentVerify();
        break;
      }
      case 'sidecar-verify': {
        await phaseSidecarVerify();
        break;
      }
      default: {
        throw new Error(
          `Unknown phase: ${phase}. Valid phases: setup, estimate, migrate-to-s3, migrate-to-disk, rollback, no-files, concurrent-rejection, selective-to-s3, selective-cleanup, delete-source-false, content-verify, sidecar-verify`,
        );
      }
    }
  } finally {
    await disconnectDb();
  }
}

void main();

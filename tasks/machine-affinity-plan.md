# Machine-Prefixed Queues Plan (Revised)

## Goal

Simple, predictable file processing:
```
Upload → Process locally → Upload to S3 → Done
```

Each machine handles its uploads end-to-end. Load balancer distributes new uploads across machines.

---

## Architecture

```
                    Load Balancer (Fly.io)
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
        Machine A      Machine B      Machine C
            │              │              │
      ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
      │ Upload    │  │ Upload    │  │ Upload    │
      │ Process   │  │ Process   │  │ Process   │
      │ S3 Upload │  │ S3 Upload │  │ S3 Upload │
      └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
            │              │              │
            └──────────────┴──────────────┘
                           │
                      S3 Bucket
```

- No cross-machine file access
- No S3 downloads during processing
- Machines share Redis for queue coordination only
- Each machine has its own prefixed queues

---

## ML Service

**Use Sync Mode (HTTP)** - server sends image bytes via HTTP POST to ML service.

- Disable stream mode in config
- Server reads local file, sends bytes to ML
- ML doesn't need filesystem or S3 access
- Works with any ML deployment (separate service, sidecar, etc.)

```typescript
// Ensure stream mode is disabled
machineLearning.streamMode.enabled = false
```

---

## Queues

### Machine-Prefixed (file access required)
These queues get suffixed with `-{machineId}`:

| Queue | Reason |
|-------|--------|
| MetadataExtraction | Reads original file |
| AssetThumbnailGeneration | Reads original, writes thumbnails |
| PersonThumbnailGeneration | Reads original, writes face thumbnails |
| VideoConversion | Reads original, writes encoded video |
| Sidecar | Reads sidecar files |
| FaceDetection | Reads original, sends bytes to ML |
| SmartSearch | Reads original, sends bytes to ML |
| Ocr | Reads original, sends bytes to ML |
| S3Upload | Reads all local files, uploads to S3 |

### Global (no file access)
These stay unprefixed - any machine can process:

| Queue | Reason |
|-------|--------|
| BackgroundTask | Database operations |
| Notification | Sends notifications |
| Search | Index updates |
| Library | Library scanning (reads from network paths) |
| BackupDatabase | Database backup |
| DuplicateDetection | Compares hashes in DB |
| FacialRecognition | Clustering (DB operations) |
| Workflow | Orchestration |

---

## Implementation

### Step 1: Add machineId to config

**File:** `server/src/repositories/config.repository.ts`

```typescript
// In getEnv(), add:
machineId: process.env.FLY_MACHINE_ID || process.env.IMMICH_MACHINE_ID || 'local',
```

### Step 2: Create queue utility

**File:** `server/src/utils/queue.util.ts` (new)

```typescript
import { QueueName } from 'src/enum';

// Queues that access local files
const MACHINE_AFFINITY_QUEUES = new Set<QueueName>([
  QueueName.MetadataExtraction,
  QueueName.AssetThumbnailGeneration,
  QueueName.PersonThumbnailGeneration,
  QueueName.VideoConversion,
  QueueName.Sidecar,
  QueueName.FaceDetection,
  QueueName.SmartSearch,
  QueueName.Ocr,
  QueueName.S3Upload,
]);

export function getActualQueueName(baseQueue: QueueName, machineId: string): string {
  if (MACHINE_AFFINITY_QUEUES.has(baseQueue)) {
    return `${baseQueue}-${machineId}`;
  }
  return baseQueue;
}

export function isAffinityQueue(queue: QueueName): boolean {
  return MACHINE_AFFINITY_QUEUES.has(queue);
}
```

### Step 3: Modify worker creation

**File:** `server/src/repositories/job.repository.ts`

In `startWorkers()`:
```typescript
startWorkers() {
  const { bull, queues, machineId } = this.configRepository.getEnv();

  for (const baseQueueName of queues) {
    const actualQueueName = getActualQueueName(baseQueueName, machineId);
    this.logger.log(`Starting worker for queue: ${actualQueueName}`);

    const workerOptions = this.getWorkerOptions(baseQueueName);
    this.workers[baseQueueName] = new Worker(
      actualQueueName,
      (job) => this.eventRepository.emit('JobRun', baseQueueName, job as JobItem),
      { ...bull.config, concurrency: 1, ...workerOptions },
    );
  }
}
```

### Step 4: Modify job queueing

**File:** `server/src/repositories/job.repository.ts`

Add queue cache and modify `queueAll()`:
```typescript
private queueCache: Record<string, Queue> = {};

private getQueueByName(queueName: string): Queue {
  if (!this.queueCache[queueName]) {
    const { bull } = this.configRepository.getEnv();
    this.queueCache[queueName] = new Queue(queueName, bull.config);
  }
  return this.queueCache[queueName];
}

async queueAll(items: JobItem[]): Promise<void> {
  const { machineId } = this.configRepository.getEnv();

  for (const item of items) {
    const baseQueueName = JOBS_TO_QUEUE[item.name];
    const actualQueueName = getActualQueueName(baseQueueName, machineId);
    const queue = this.getQueueByName(actualQueueName);

    // ... rest of queueing logic
  }
}
```

### Step 5: Remove S3 downloads from workers

**File:** `server/src/services/media.service.ts`

Remove S3 download fallback in:
- `handleGenerateThumbnails()` - Remove lines 192-215
- `handleEncodeVideo()` - Remove lines 817-876
- `handleGeneratePersonThumbnail()` - Remove lines 582-603

Workers now expect files to be local. If not found, job fails (will be retried or requires re-upload).

### Step 6: Remove sync S3 upload during HTTP upload

**File:** `server/src/services/asset-media.service.ts`

Remove `uploadToS3Sync()` call at lines 583-585. Files stay local until S3Upload job.

### Step 7: S3Upload job handles everything

**File:** `server/src/services/s3-storage.service.ts`

S3Upload job runs AFTER all processing completes:
1. Upload original to S3
2. Upload thumbnails to S3
3. Upload preview to S3
4. Upload encoded video (if exists) to S3
5. Update database with S3 metadata
6. Delete local files

---

## Orphaned Job Handling

**Problem:** Machine restarts, jobs in its queue reference deleted files.

**Solution:** Don't drain queues. Instead, fail gracefully:

```typescript
// In job handlers, check file exists before processing
const filePath = asset.originalPath;
if (!existsSync(filePath)) {
  this.logger.warn(`File not found for asset ${asset.id}, marking as failed`);
  throw new Error(`Local file missing: ${filePath}`);
}
```

BullMQ will retry with backoff. After max retries, job moves to failed queue.

For cleanup, add a periodic job that:
1. Scans failed jobs older than 24h
2. Checks if asset needs reprocessing
3. Notifies user or triggers re-upload flow

---

## Fly.io Configuration

**File:** `fly.toml`

Keep unified process for simplicity:
```toml
[processes]
  immich = "node dist/main.js"

[http_service]
  processes = ["immich"]
  [http_service.concurrency]
    type = "connections"
    soft_limit = 50
    hard_limit = 100

[[vm]]
  memory = "8gb"
  cpus = 4
```

Scaling:
- Fly.io adds machines when connections > 50
- Load balancer distributes new uploads
- Each machine is self-contained

---

## Autoscaler Changes

**File:** `immich-fly-infra/autoscaler/`

Monitor machine-prefixed queues:
```typescript
// Get all machine queue patterns
const machineQueues = await redis.keys('bull:*-fly*:waiting');

// Group by machine ID
const machineJobCounts = {};
for (const key of machineQueues) {
  const machineId = extractMachineId(key);
  const count = await redis.llen(key);
  machineJobCounts[machineId] = (machineJobCounts[machineId] || 0) + count;
}

// Scale down idle machines (keep minimum 1)
for (const [machineId, count] of Object.entries(machineJobCounts)) {
  if (count === 0 && idleFor(machineId) > 60_000) {
    await flyApi.stopMachine(machineId);
  }
}
```

---

## Migration Path

1. Deploy to single machine first
2. Test full upload → process → S3 flow
3. Verify files in S3 bucket
4. Scale to 2 machines
5. Upload to both via load balancer
6. Verify separate queue names in Redis
7. Verify both machines complete independently

---

## Files Changed

| File | Change |
|------|--------|
| `server/src/repositories/config.repository.ts` | Add machineId |
| `server/src/utils/queue.util.ts` | New: queue name resolution |
| `server/src/repositories/job.repository.ts` | Machine-prefixed queues |
| `server/src/services/asset-media.service.ts` | Remove sync S3 upload |
| `server/src/services/media.service.ts` | Remove S3 download fallback |
| `server/src/services/s3-storage.service.ts` | S3Upload as final step |
| `fly.toml` | Unified process |
| `immich-fly-infra/autoscaler/` | Monitor machine queues |

---

## Key Differences from Original Plan

1. **S3Upload is machine-prefixed** - Not global. Same machine uploads.
2. **More queues in affinity list** - FaceDetection, SmartSearch, Ocr added.
3. **No queue draining on startup** - Fail gracefully instead, avoid data loss.
4. **Remove S3 download code** - Workers expect local files only.

#!/usr/bin/env node
/*
 Lightweight BullMQ queue stats script.
 Outputs JSON or a single total depending on --total <state> argument.
 States: active|completed|failed|delayed|waiting|paused
 Usage:
   node server/scripts/queue-stats.js            # full JSON
   node server/scripts/queue-stats.js --total active
   node server/scripts/queue-stats.js --total failed
   node server/scripts/queue-stats.js --json     # force JSON (default when not TTY)

 Environment variables honored:
   REDIS_URL, REDIS_SOCKET, REDIS_HOSTNAME, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, REDIS_DBINDEX
*/

const { Queue } = require('bullmq');
const process = require('process');

const QUEUE_NAMES = [
  'thumbnailGeneration',
  'metadataExtraction',
  'videoConversion',
  'faceDetection',
  'facialRecognition',
  'smartSearch',
  'duplicateDetection',
  'backgroundTask',
  'storageTemplateMigration',
  'migration',
  'search',
  'sidecar',
  'library',
  'notifications',
  'backupDatabase',
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const totalIdx = argv.indexOf('--total');
  return {
    total: totalIdx !== -1 ? argv[totalIdx + 1] : undefined,
    json: argv.includes('--json'),
  };
}

function getRedisConnectionOptions() {
  const {
    REDIS_URL,
    REDIS_SOCKET,
    REDIS_HOSTNAME = 'redis',
    REDIS_PORT = '6379',
    REDIS_DBINDEX = '0',
    REDIS_USERNAME,
    REDIS_PASSWORD,
  } = process.env;

  let prefix = 'immich_bull'; // default used in config.repository.ts
  if (process.env.BULL_PREFIX) {
    prefix = process.env.BULL_PREFIX;
  }

  if (REDIS_URL) {
    if (REDIS_URL.startsWith('ioredis://')) {
      const encoded = REDIS_URL.substring('ioredis://'.length);
      try {
        const json = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
        return { ...json, prefix };
      } catch {
        return { url: REDIS_URL, prefix };
      }
    }
    return { url: REDIS_URL, prefix };
  }
  if (REDIS_SOCKET) {
    return { path: REDIS_SOCKET, db: Number(REDIS_DBINDEX), prefix };
  }
  return {
    host: REDIS_HOSTNAME,
    port: Number(REDIS_PORT),
    db: Number(REDIS_DBINDEX),
    username: REDIS_USERNAME || undefined,
    password: REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 1,
    prefix,
  };
}

async function fetchQueue(name, connection) {
  const queue = new Queue(name, { connection, prefix: connection.prefix });
  try {
    const [counts, isPaused, activeCount] = await Promise.all([
      queue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting', 'paused'),
      queue.isPaused(),
      queue.getActiveCount(),
    ]);
    return [
      name,
      {
        jobCounts: {
          active: typeof counts.active === 'number' ? counts.active : activeCount || 0,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
          waiting: counts.waiting,
          paused: counts.paused,
        },
      },
    ];
  } finally {
    await queue.close();
  }
}

function aggregate(entries) {
  const totals = { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0, paused: 0 };
  for (const [, stats] of entries) {
    const c = stats.jobCounts || {};
    totals.active += c.active || 0;
    totals.completed += c.completed || 0;
    totals.failed += c.failed || 0;
    totals.delayed += c.delayed || 0;
    totals.waiting += c.waiting || 0;
    totals.paused += c.paused || 0;
  }
  return totals;
}

async function main() {
  const { total, json } = parseArgs();
  if (total && !['active', 'completed', 'failed', 'delayed', 'waiting', 'paused'].includes(total)) {
    console.error(`Invalid --total value: ${total}`);
    process.exit(2);
  }
  const connection = getRedisConnectionOptions();
  const entries = await Promise.all(QUEUE_NAMES.map((q) => fetchQueue(q, connection)));
  const totals = aggregate(entries);

  if (total) {
    console.log(String(totals[total] ?? 0));
    return;
  }
  const output = { queues: Object.fromEntries(entries), totals: { jobCounts: totals } };
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

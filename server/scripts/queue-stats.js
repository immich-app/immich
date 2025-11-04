#!/usr/bin/env node
/*
 * Lightweight BullMQ queue stats script.
 *
 * Provides a quick way to inspect aggregate job counts for all Immich server queues
 * without spinning up the full application. Suitable for CI scripts, health checks,
 * smoke tests and operational tooling.
 *
 * Output modes:
 *  - Default (no flags): JSON document with per-queue and aggregate totals.
 *  - --total <state>: Prints ONLY the numeric total of the requested state
 *                     (active|completed|failed|delayed|waiting|paused).
 *  - --json: Forces JSON output (mainly useful when piping or when stdout is not a TTY).
 *  - --wait:  Polls once per second until there are no remaining active or waiting jobs.
 *             While waiting in a TTY, prints a single updating status line; on completion
 *             prints final output (respects --total / --json if provided).
 *             (Alias: --watch retained for backwards compatibility)
 *
 * Usage examples:
 *   node server/scripts/queue-stats.js
 *   node server/scripts/queue-stats.js --total active
 *   node server/scripts/queue-stats.js --total failed
 *   node server/scripts/queue-stats.js --json
 *   node server/scripts/queue-stats.js --wait
 *   node server/scripts/queue-stats.js --wait --total failed
 *
 * Environment variables honored for Redis connectivity:
 *   REDIS_URL, REDIS_SOCKET, REDIS_HOSTNAME, REDIS_PORT, REDIS_USERNAME,
 *   REDIS_PASSWORD, REDIS_DBINDEX, BULL_PREFIX
 */

const { Queue } = require('bullmq');
const process = require('process');

/**
 * Ordered list of queues whose statistics we care about for Immich.
 * Extend this list as new BullMQ queues are introduced server-side.
 */
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
  'ocr'
];

/**
 * Parse command line arguments into a structured object.
 * Flags:
 *  --total <state>  Return only the numeric total for a given state.
 *  --json           Force JSON output format.
 *  --wait / --watch Continuously poll until active+waiting == 0.
 * @returns {{ total?: string, json: boolean, wait: boolean }} Parsed args.
 */
function parseArgs() {
  const argv = process.argv.slice(2);
  const totalIdx = argv.indexOf('--total');
  const hasWatch = argv.includes('--watch');
  const hasWait = argv.includes('--wait');
  return {
    total: totalIdx !== -1 ? argv[totalIdx + 1] : undefined,
    json: argv.includes('--json'),
    wait: hasWait || hasWatch,
  };
}

/**
 * Derive Redis connection options honoring several environment variable styles.
 * Supports direct URL, unix socket path, or discrete host/port credentials.
 * Also decodes the Immich-specific 'ioredis://' base64 JSON variant.
 * @returns {object} An options object consumable by BullMQ / ioredis.
 */
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

/**
 * Fetch job counts for a single queue.
 * Uses getJobCounts for bulk retrieval; falls back to getActiveCount when
 * 'active' isn't provided (defensive, though BullMQ should include it).
 * @param {string} name Queue name.
 * @param {object} connection Redis connection options (shared across queues).
 * @returns {Promise<[string, { jobCounts: {active:number,completed:number,failed:number,delayed:number,waiting:number,paused:number}}]>}
 */
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

/**
 * Aggregate jobCounts across all queues into a single totals object.
 * @param {Array<[string, {jobCounts: object}]>} entries Per-queue stats.
 * @returns {{active:number,completed:number,failed:number,delayed:number,waiting:number,paused:number}}
 */
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

/**
 * Entrypoint: parse args, collect stats once or loop in watch mode.
 * Exits with code 2 for invalid arguments, 1 for unhandled errors.
 */
async function main() {
  const { total, json, wait } = parseArgs();
  if (total && !['active', 'completed', 'failed', 'delayed', 'waiting', 'paused'].includes(total)) {
    console.error(`Invalid --total value: ${total}`);
    process.exit(2);
  }
  const connection = getRedisConnectionOptions();
  const intervalMs = 1000;

  /**
   * Execute one full polling cycle.
   * @returns {{ entries: Array<[string, {jobCounts:object}]>, totals: {active:number,completed:number,failed:number,delayed:number,waiting:number,paused:number} }}
   */
  async function runOnce() {
    const entries = await Promise.all(QUEUE_NAMES.map((q) => fetchQueue(q, connection)));
    const totals = aggregate(entries);
    return { entries, totals };
  }

  if (!wait) {
    const { entries, totals } = await runOnce();
    if (total) {
      console.log(String(totals[total] ?? 0));
      return;
    }
    const output = { queues: Object.fromEntries(entries), totals: { jobCounts: totals } };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Wait mode: keep polling until there are no active or waiting jobs left.
  const isTTY = process.stdout.isTTY;
  let lastLine = '';
  /**
   * Render a single-line progress status (TTY only) to show remaining work.
   * @param {{active:number,waiting:number}} totals Current aggregate totals.
   */
  function renderStatus(totals) {
    if (!isTTY) return; // don't spam logs when not interactive
    const line = `active:${totals.active} waiting:${totals.waiting} (remaining:${totals.active + totals.waiting})`;
    // Avoid flicker if unchanged
    if (line === lastLine) return;
    lastLine = line;
    process.stdout.write(`\r${line.padEnd(process.stdout.columns || line.length)}`);
  }

  while (true) {
    const { entries, totals } = await runOnce();
    const remaining = (totals.active || 0) + (totals.waiting || 0);
    if (remaining === 0) {
      if (isTTY && lastLine) {
        process.stdout.write('\n');
      }
      if (total) {
        console.log(String(totals[total] ?? 0));
      } else if (json || !isTTY) {
        const output = { queues: Object.fromEntries(entries), totals: { jobCounts: totals } };
        console.log(JSON.stringify(output, null, 2));
      } else {
  // Human readable summary
  console.log('All queues idle. Final totals:');
        console.log(JSON.stringify({ totals: { jobCounts: totals } }, null, 2));
      }
      break;
    }
    renderStatus(totals);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

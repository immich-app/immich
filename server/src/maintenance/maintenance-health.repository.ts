import { Injectable } from '@nestjs/common';
import { fork } from 'node:child_process';
import { dirname, join } from 'node:path';

const HEALTH_CHECK_HOST = '127.0.0.1';
const HEALTH_CHECK_PORT = '33001';
const HEALTH_CHECK_TIMEOUT = 180_000;
const PING_INTERVAL = 1000;

@Injectable()
export class MaintenanceHealthRepository {
  checkApiHealth(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const basePath = dirname(import.meta.filename);
      const workerFile = join(basePath, '..', 'workers', `api.js`);

      const worker = fork(workerFile, [], {
        execArgv: process.execArgv.filter((arg) => !arg.startsWith('--inspect')),
        env: {
          ...process.env,
          IMMICH_HOST: HEALTH_CHECK_HOST,
          IMMICH_PORT: HEALTH_CHECK_PORT,
        },
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      });

      let settled = false;
      let pingTimer: NodeJS.Timeout | undefined;

      function settle(error?: Error) {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(pingTimer);
        clearTimeout(deadline);
        worker.kill('SIGTERM');

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }

      async function ping() {
        const response = await fetch(`http://${HEALTH_CHECK_HOST}:${HEALTH_CHECK_PORT}/api/server/ping`, {
          signal: AbortSignal.timeout(PING_INTERVAL * 5),
        }).catch(() => null);

        if (response?.ok) {
          settle();
        } else if (!settled) {
          pingTimer = setTimeout(() => void ping(), PING_INTERVAL);
        }
      }

      worker.on('exit', (code, signal) =>
        settle(new Error(`Server health check failed, server exited with ${signal ?? code}`)),
      );
      worker.on('error', (error) => settle(new Error(`Server health check failed, process threw: ${error}`)));

      const deadline = setTimeout(
        () => settle(new Error('Server health check failed, took too long to start.')),
        HEALTH_CHECK_TIMEOUT,
      );
      pingTimer = setTimeout(() => void ping(), PING_INTERVAL);
    });
  }
}

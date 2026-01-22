import { Injectable } from '@nestjs/common';
import { fork } from 'node:child_process';
import { dirname, join } from 'node:path';

@Injectable()
export class MaintenanceHealthRepository {
  checkApiHealth(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // eslint-disable-next-line unicorn/prefer-module
      const basePath = dirname(__filename);
      const workerFile = join(basePath, '..', 'workers', `api.js`);

      const worker = fork(workerFile, [], {
        execArgv: process.execArgv.filter((arg) => !arg.startsWith('--inspect')),
        env: {
          ...process.env,
          IMMICH_HOST: '127.0.0.1',
          IMMICH_PORT: '33001',
        },
        stdio: ['ignore', 'pipe', 'ignore', 'ipc'],
      });

      async function checkHealth() {
        try {
          const response = await fetch('http://127.0.0.1:33001/api/server/config');
          const { isOnboarded } = await response.json();
          if (isOnboarded) {
            resolve();
          } else {
            reject(new Error('Server health check failed, no admin exists.'));
          }
        } catch (error) {
          reject(error);
        } finally {
          if (worker.exitCode === null) {
            worker.kill('SIGTERM');
          }
        }
      }

      let output = '',
        alive = false;

      worker.stdout?.on('data', (data) => {
        if (alive) {
          return;
        }

        output += data;

        if (output.includes('Immich Server is listening')) {
          alive = true;
          void checkHealth();
        }
      });

      worker.on('exit', reject);
      worker.on('error', reject);

      setTimeout(() => {
        if (worker.exitCode === null) {
          worker.kill('SIGTERM');
        }
      }, 20_000);
    });
  }
}

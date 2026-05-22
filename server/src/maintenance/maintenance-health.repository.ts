import { Injectable } from '@nestjs/common';
import { fork } from 'node:child_process';
import { dirname, join } from 'node:path';
import { IMMICH_SERVER_START } from 'src/constants';

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

      let output = '';

      worker.stdout?.on('data', (data) => {
        if (worker.exitCode !== null) {
          return;
        }

        output += data;

        if (output.includes(IMMICH_SERVER_START)) {
          resolve();
          worker.kill('SIGTERM');
        }
      });

      worker.on('exit', (code, signal) => reject(`Server health check failed, server exited with ${signal ?? code}`));
      worker.on('error', (error) => reject(`Server health check failed, process threw: ${error}`));

      setTimeout(() => {
        if (worker.exitCode === null) {
          reject('Server health check failed, took too long to start.');
          worker.kill('SIGTERM');
        }
      }, 20_000);
    });
  }
}

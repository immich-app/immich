import { ChildProcess, fork } from 'node:child_process';
import { dirname, join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { ExitCode, ImmichWorker } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';

/**
 * Manages worker lifecycle
 */
class Workers {
  workers: Partial<Record<ImmichWorker, { kill: (signal: NodeJS.Signals) => Promise<void> | void }>> = {};
  restarting = false;

  bootstrap() {
    const { workers } = new ConfigRepository().getEnv();
    for (const worker of workers) {
      this.startWorker(worker);
    }
  }

  private startWorker(name: ImmichWorker) {
    console.log(`Starting ${name} worker`);

    // eslint-disable-next-line unicorn/prefer-module
    const basePath = dirname(__filename);
    const workerFile = join(basePath, 'workers', `${name}.js`);

    let anyWorker: Worker | ChildProcess;
    let kill: (signal?: NodeJS.Signals) => Promise<void> | void;

    if (name === ImmichWorker.Api) {
      const worker = fork(workerFile, [], {
        execArgv: process.execArgv.map((arg) => (arg.startsWith('--inspect') ? '--inspect=0.0.0.0:9231' : arg)),
      });
      kill = (signal) => void worker.kill(signal);
      anyWorker = worker;
    } else {
      const worker = new Worker(workerFile);
      kill = async () => void (await worker.terminate());
      anyWorker = worker;
    }

    anyWorker.on('error', (error) => this.onError(name, error));
    anyWorker.on('exit', (exitCode) => this.onExit(name, exitCode));

    this.workers[name] = { kill };
  }

  onError(name: ImmichWorker, error: Error) {
    console.error(`${name} worker error: ${error}, stack: ${error.stack}`);
  }

  onExit(name: ImmichWorker, exitCode: number | null) {
    if (exitCode === ExitCode.AppRestart || this.restarting) {
      this.restarting = true;
      console.info(`${name} worker shutdown for restart`);
      delete this.workers[name];

      if (Object.keys(this.workers).length === 0) {
        void this.bootstrap();
        this.restarting = false;
      }
      return;
    }

    delete this.workers[name];

    if (exitCode !== 0) {
      console.error(`${name} worker exited with code ${exitCode}`);
      if (this.workers[ImmichWorker.Api] && name !== ImmichWorker.Api) {
        console.error('Killing api process');
        void this.workers[ImmichWorker.Api].kill('SIGTERM');
      }
    }

    process.exit(exitCode);
  }
}

function main() {
  process.title = 'server';
  void new Workers().bootstrap();
}

void main();

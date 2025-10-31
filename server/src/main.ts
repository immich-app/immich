import { NestFactory } from '@nestjs/core';
import { CommandFactory } from 'nest-commander';
import { ChildProcess, fork } from 'node:child_process';
import { dirname, join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { ApiModule, ImmichAdminModule } from 'src/app.module';
import { ImmichWorker, LogLevel } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { getConfig } from 'src/utils/config';

/**
 * Manages worker lifecycle
 */
class Workers {
  /**
   * Currently running workers
   */
  workers: Partial<Record<ImmichWorker, Worker | ChildProcess>>;

  constructor() {
    this.workers = {};
  }

  /**
   * Boot all enabled workers
   */
  async bootstrap() {
    const {
      maintenance: { enabled: maintenanceMode },
    } = await this.getConfig();
    const { workers } = new ConfigRepository().getEnv();

    if (maintenanceMode) {
      this.startWorker(ImmichWorker.Maintenance);
    } else {
      for (const worker of workers) {
        this.startWorker(worker);
      }
    }
  }

  /**
   * Initialise a short-lived Nest application to build configuration
   * @returns System configuration
   */
  private async getConfig() {
    const app = await NestFactory.create(ApiModule);
    const logger = await app.resolve(LoggingRepository);
    const configRepo = app.get(ConfigRepository);
    const metadataRepo = app.get(SystemMetadataRepository);

    const systemConfig = await getConfig(
      {
        configRepo,
        metadataRepo,
        logger,
      },
      { withCache: false },
    );

    await app.close();

    return systemConfig;
  }

  /**
   * Start an individual worker
   * @param name Worker
   */
  private startWorker(name: ImmichWorker) {
    console.log(`Starting ${name} worker`);

    // eslint-disable-next-line unicorn/prefer-module
    const basePath = dirname(__filename);
    const workerFile = join(basePath, 'workers', `${name}.js`);

    let worker: Worker | ChildProcess;
    if (name === ImmichWorker.Api) {
      worker = fork(workerFile, [], {
        execArgv: process.execArgv.map((arg) => (arg.startsWith('--inspect') ? '--inspect=0.0.0.0:9231' : arg)),
      });
    } else {
      worker = new Worker(workerFile);
    }

    worker.on('error', (error) => this.onError(name, error));
    worker.on('exit', (exitCode) => this.onExit(name, exitCode));

    this.workers[name] = worker;
  }

  onError(name: ImmichWorker, error: Error) {
    console.error(`${name} worker error: ${error}, stack: ${error.stack}`);
  }

  onExit(name: ImmichWorker, exitCode: number | null) {
    // restart immich server
    if (exitCode === 7) {
      console.info(`${name} worker shutdown for restart`);
      delete this.workers[name];

      // once all workers shut down, bootstrap again
      if (Object.keys(this.workers).length === 0) {
        this.bootstrap();
      }

      return;
    }

    // shutdown the entire process
    delete this.workers[name];

    if (exitCode !== 0) {
      console.error(`${name} worker exited with code ${exitCode}`);

      if (this.workers[ImmichWorker.Api] && name !== ImmichWorker.Api) {
        console.error('Killing api process');
        (this.workers[ImmichWorker.Api] as ChildProcess).kill('SIGTERM');
      }
    }

    process.exit(exitCode);
  }
}

function main() {
  const immichApp = process.argv[2];
  if (immichApp) {
    process.argv.splice(2, 1);
  }

  if (immichApp === 'immich-admin') {
    process.title = 'immich_admin_cli';
    process.env.IMMICH_LOG_LEVEL = LogLevel.Warn;
    return CommandFactory.run(ImmichAdminModule);
  }

  if (immichApp === 'immich' || immichApp === 'microservices') {
    console.error(
      `Using "start.sh ${immichApp}" has been deprecated. See https://github.com/immich-app/immich/releases/tag/v1.118.0 for more information.`,
    );
    process.exit(1);
  }

  if (immichApp) {
    console.error(`Unknown command: "${immichApp}"`);
    process.exit(1);
  }

  process.title = 'immich';
  new Workers().bootstrap();
}

void main();

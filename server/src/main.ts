import { Kysely, sql } from 'kysely';
import { CommandFactory } from 'nest-commander';
import { ChildProcess, fork } from 'node:child_process';
import { dirname, join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { PostgresError } from 'postgres';
import { ImmichAdminModule } from 'src/app.module';
import { DatabaseLock, ExitCode, ImmichWorker, LogLevel, SystemMetadataKey } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { type DB } from 'src/schema';
import { getKyselyConfig } from 'src/utils/database';

/**
 * Manages worker lifecycle
 */
class Workers {
  /**
   * Currently running workers
   */
  workers: Partial<Record<ImmichWorker, { kill: (signal: NodeJS.Signals) => Promise<void> | void }>> = {};

  /**
   * Fail-safe in case anything dies during restart
   */
  restarting = false;

  /**
   * Whether we're in graceful shutdown
   */
  shuttingDown = false;

  /**
   * Boot all enabled workers
   */
  async bootstrap() {
    this.setupSignalHandlers();
    const isMaintenanceMode = await this.isMaintenanceMode();
    const { workers } = new ConfigRepository().getEnv();

    if (isMaintenanceMode) {
      this.startWorker(ImmichWorker.Maintenance);
    } else {
      await this.waitForFreeLock();

      for (const worker of workers) {
        this.startWorker(worker);
      }
    }
  }

  private async isMaintenanceMode(): Promise<boolean> {
    const { database } = new ConfigRepository().getEnv();
    const { log: _, ...kyselyConfig } = getKyselyConfig(database.config);
    const kysely = new Kysely<DB>(kyselyConfig);
    const systemMetadataRepository = new SystemMetadataRepository(kysely);

    try {
      const value = await systemMetadataRepository.get(SystemMetadataKey.MaintenanceMode);
      return value?.isMaintenanceMode || false;
    } catch (error) {
      // Table doesn't exist (migrations haven't run yet)
      if (error instanceof PostgresError && error.code === '42P01') {
        return false;
      }

      throw error;
    } finally {
      await kysely.destroy();
    }
  }

  private async waitForFreeLock() {
    const { database } = new ConfigRepository().getEnv();
    const kysely = new Kysely<DB>(getKyselyConfig(database.config));

    let locked = false;
    while (!locked) {
      locked = await kysely.connection().execute(async (conn) => {
        const { rows } = await sql<{
          pg_try_advisory_lock: boolean;
        }>`SELECT pg_try_advisory_lock(${DatabaseLock.MaintenanceOperation})`.execute(conn);

        const isLocked = rows[0].pg_try_advisory_lock;

        if (isLocked) {
          await sql`SELECT pg_advisory_unlock(${DatabaseLock.MaintenanceOperation})`.execute(conn);
        }

        return isLocked;
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await kysely.destroy();
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

      kill = () => {
        // Post a shutdown message to allow graceful cleanup
        worker.postMessage({ type: 'shutdown' });
        // Force terminate after timeout if worker doesn't exit
        setTimeout(() => void worker.terminate(), 5000);
      };
      anyWorker = worker;
    }

    anyWorker.on('error', (error) => this.onError(name, error));
    anyWorker.on('exit', (exitCode) => this.onExit(name, exitCode));

    this.workers[name] = { kill };
  }

  private setupSignalHandlers() {
    const shutdown = async (signal: NodeJS.Signals) => {
      if (this.shuttingDown) {
        return;
      }
      this.shuttingDown = true;
      console.log(`Received ${signal}, initiating graceful shutdown...`);

      const workerNames = Object.keys(this.workers) as ImmichWorker[];
      for (const name of workerNames) {
        console.log(`Sending ${signal} to ${name} worker`);
        await this.workers[name]?.kill(signal);
      }

      // Give workers time to shutdown gracefully
      setTimeout(() => {
        console.log('Shutdown timeout reached, forcing exit');
        process.exit(0);
      }, 10_000);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  }

  onError(name: ImmichWorker, error: Error) {
    console.error(`${name} worker error: ${error}, stack: ${error.stack}`);
  }

  onExit(name: ImmichWorker, exitCode: number | null) {
    console.log(`${name} worker exited with code ${exitCode}`);
    delete this.workers[name];

    // graceful shutdown in progress
    if (this.shuttingDown) {
      if (Object.keys(this.workers).length === 0) {
        console.log('All workers have exited, shutting down main process');
        process.exit(0);
      }
      return;
    }

    // restart immich server
    if (exitCode === ExitCode.AppRestart || this.restarting) {
      this.restarting = true;

      console.info(`${name} worker shutdown for restart`);

      // once all workers shut down, bootstrap again
      if (Object.keys(this.workers).length === 0) {
        void this.bootstrap();
        this.restarting = false;
      }

      return;
    }

    // unexpected exit - shutdown the entire process
    if (exitCode !== 0) {
      console.error(`${name} worker exited unexpectedly`);

      if (this.workers[ImmichWorker.Api] && name !== ImmichWorker.Api) {
        console.error('Killing api process');
        void this.workers[ImmichWorker.Api].kill('SIGTERM');
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
  void new Workers().bootstrap();
}

void main();

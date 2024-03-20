import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:stream';
import { Server } from 'node:tls';
import { ApiModule } from 'src/apps/api.module';
import { ApiService } from 'src/apps/api.service';
import { AppModule, AppTestModule } from 'src/apps/app.module';
import { MicroservicesService } from 'src/apps/microservices.service';
import { QueueName } from 'src/domain/job/job.constants';
import { dataSource } from 'src/infra/database.config';
import { IJobRepository, JobItem, JobItemHandler } from 'src/interfaces/job.repository';
import { IMediaRepository } from 'src/interfaces/media.repository';
import { StorageEventType } from 'src/interfaces/storage.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { EntityTarget, ObjectLiteral } from 'typeorm';

export const IMMICH_TEST_ASSET_PATH = process.env.IMMICH_TEST_ASSET_PATH as string;
export const IMMICH_TEST_ASSET_TEMP_PATH = join(tmpdir(), 'immich');

export const today = DateTime.fromObject({ year: 2023, month: 11, day: 3 });
export const yesterday = today.minus({ days: 1 });

export interface ResetOptions {
  entities?: EntityTarget<ObjectLiteral>[];
}
export const db = {
  reset: async (options?: ResetOptions) => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await dataSource.transaction(async (em) => {
      const entities = options?.entities || [];
      const tableNames =
        entities.length > 0
          ? entities.map((entity) => em.getRepository(entity).metadata.tableName)
          : dataSource.entityMetadatas
              .map((entity) => entity.tableName)
              .filter((tableName) => !tableName.startsWith('geodata'));

      let deleteUsers = false;
      for (const tableName of tableNames) {
        if (tableName === 'users') {
          deleteUsers = true;
          continue;
        }
        await em.query(`DELETE FROM ${tableName} CASCADE;`);
      }
      if (deleteUsers) {
        await em.query(`DELETE FROM "users" CASCADE;`);
      }

      // Release all locks
      await em.query('SELECT pg_advisory_unlock_all()');
    });
  },
  disconnect: async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  },
};

class JobMock implements IJobRepository {
  private _handler: JobItemHandler = () => Promise.resolve();
  addHandler(_queueName: QueueName, _concurrency: number, handler: JobItemHandler) {
    this._handler = handler;
  }
  addCronJob() {}
  updateCronJob() {}
  deleteCronJob() {}
  validateCronExpression() {}
  queue(item: JobItem) {
    return this._handler(item);
  }
  queueAll(items: JobItem[]) {
    return Promise.all(items.map((arg) => this._handler(arg))).then(() => {});
  }
  async resume() {}
  async empty() {}
  async setConcurrency() {}
  getQueueStatus() {
    return Promise.resolve(null) as any;
  }
  getJobCounts() {
    return Promise.resolve(null) as any;
  }
  async pause() {}
  clear() {
    return Promise.resolve([]);
  }
  async waitForQueueCompletion() {}
}

class MediaMockRepository extends MediaRepository {
  generateThumbhash() {
    return Promise.resolve(Buffer.from('mock-thumbhash'));
  }
}

let app: INestApplication;

export const testApp = {
  create: async (): Promise<INestApplication> => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ApiModule],
      providers: [ApiService, MicroservicesService],
    })
      .overrideModule(AppModule)
      .useModule(AppTestModule)
      .overrideProvider(IJobRepository)
      .useClass(JobMock)
      .overrideProvider(IMediaRepository)
      .useClass(MediaMockRepository)
      .compile();

    app = await moduleFixture.createNestApplication().init();
    await app.listen(0);
    await db.reset();
    await app.get(ApiService).init();
    await app.get(MicroservicesService).init();

    const port = app.getHttpServer().address().port;
    const protocol = app instanceof Server ? 'https' : 'http';
    process.env.IMMICH_INSTANCE_URL = protocol + '://127.0.0.1:' + port;

    return app;
  },
  reset: async (options?: ResetOptions) => {
    await db.reset(options);
  },
  get: (member: any) => app.get(member),
  teardown: async () => {
    if (app) {
      await app.get(MicroservicesService).teardown();
      await app.close();
    }
    await db.disconnect();
  },
};

export function waitForEvent(emitter: EventEmitter, event: string, times = 1): Promise<void[]> {
  const promises: Promise<void>[] = [];

  for (let i = 1; i <= times; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        const success = (value: any) => {
          emitter.off(StorageEventType.ERROR, fail);
          resolve(value);
        };
        const fail = (error: Error) => {
          emitter.off(event, success);
          reject(error);
        };
        emitter.once(event, success);
        emitter.once(StorageEventType.ERROR, fail);
      }),
    );
  }
  return Promise.all(promises);
}

const directoryExists = async (dirPath: string) =>
  await fs.promises
    .access(dirPath)
    .then(() => true)
    .catch(() => false);

export async function restoreTempFolder(): Promise<void> {
  if (await directoryExists(`${IMMICH_TEST_ASSET_TEMP_PATH}`)) {
    // Temp directory exists, delete all files inside it
    await fs.promises.rm(IMMICH_TEST_ASSET_TEMP_PATH, { recursive: true });
  }
  // Create temp folder
  await fs.promises.mkdir(IMMICH_TEST_ASSET_TEMP_PATH);
}

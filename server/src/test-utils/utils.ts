import { IJobRepository, IMediaRepository, JobItem, JobItemHandler, QueueName } from '@app/domain';
import { AppModule } from '@app/immich';
import { InfraModule, InfraTestModule, dataSource } from '@app/infra';
import { MediaRepository } from '@app/infra/repositories';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import * as fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:stream';
import { Server } from 'node:tls';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { AppService } from '../immich/app.service';
import { AppService as MicroAppService } from '../microservices/app.service';

export const IMMICH_TEST_ASSET_PATH = process.env.IMMICH_TEST_ASSET_PATH as string;
export const IMMICH_TEST_ASSET_TEMP_PATH = path.normalize(`${IMMICH_TEST_ASSET_PATH}/temp/`);

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
  async getQueueStatus() {
    return null as any;
  }
  async getJobCounts() {
    return null as any;
  }
  async pause() {}
  async clear() {
    return [];
  }
  async waitForQueueCompletion() {}
}

class MediaMockRepository extends MediaRepository {
  async generateThumbhash() {
    return Buffer.from('mock-thumbhash');
  }
}

let app: INestApplication;

export const testApp = {
  create: async (): Promise<INestApplication> => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      providers: [AppService, MicroAppService],
    })
      .overrideModule(InfraModule)
      .useModule(InfraTestModule)
      .overrideProvider(IJobRepository)
      .useClass(JobMock)
      .overrideProvider(IMediaRepository)
      .useClass(MediaMockRepository)
      .compile();

    app = await moduleFixture.createNestApplication().init();
    await app.listen(0);
    await db.reset();
    await app.get(AppService).init();
    await app.get(MicroAppService).init();

    const port = app.getHttpServer().address().port;
    const protocol = app instanceof Server ? 'https' : 'http';
    process.env.IMMICH_INSTANCE_URL = protocol + '://127.0.0.1:' + port;

    return app;
  },
  reset: async (options?: ResetOptions) => {
    await db.reset(options);
    await app.get(AppService).init();

    await app.get(MicroAppService).init();
  },
  get: (member: any) => app.get(member),
  teardown: async () => {
    if (app) {
      await app.get(MicroAppService).teardown();
      await app.get(AppService).teardown();
      await app.close();
    }
    await db.disconnect();
  },
};

export function waitForEvent<T>(emitter: EventEmitter, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const success = (value: T) => {
      emitter.off('error', fail);
      resolve(value);
    };
    const fail = (error: Error) => {
      emitter.off(event, success);
      reject(error);
    };
    emitter.once(event, success);
    emitter.once('error', fail);
  });
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

import { IJobRepository, JobItem, JobItemHandler, QueueName } from '@app/domain';
import { AppModule } from '@app/immich';
import { dataSource } from '@app/infra';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import path from 'path';
import { AppService } from '../src/microservices/app.service';

export const IMMICH_TEST_ASSET_PATH = process.env.IMMICH_TEST_ASSET_PATH;
export const IMMICH_TEST_ASSET_TEMP_PATH = path.normalize(`${IMMICH_TEST_ASSET_PATH}/temp/`);

export const db = {
  reset: async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await dataSource.transaction(async (em) => {
      for (const entity of dataSource.entityMetadatas) {
        if (entity.tableName === 'users') {
          continue;
        }
        await em.query(`DELETE FROM ${entity.tableName} CASCADE;`);
      }
      await em.query(`DELETE FROM "users" CASCADE;`);
    });
  },
  disconnect: async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  },
};

let _handler: JobItemHandler = () => Promise.resolve();

interface TestAppOptions {
  jobs: boolean;
}

let app: INestApplication;

export const testApp = {
  create: async (options?: TestAppOptions): Promise<[any, INestApplication]> => {
    const { jobs } = options || { jobs: false };

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule], providers: [AppService] })
      .overrideProvider(IJobRepository)
      .useValue({
        addHandler: (_queueName: QueueName, _concurrency: number, handler: JobItemHandler) => (_handler = handler),
        queue: (item: JobItem) => jobs && _handler(item),
        resume: jest.fn(),
        empty: jest.fn(),
        setConcurrency: jest.fn(),
        getQueueStatus: jest.fn(),
        getJobCounts: jest.fn(),
        pause: jest.fn(),
      } as IJobRepository)
      .compile();

    app = await moduleFixture.createNestApplication().init();

    if (jobs) {
      await app.get(AppService).init();
    }

    return [app.getHttpServer(), app];
  },
  reset: async () => {
    await db.reset();
  },
  teardown: async () => {
    await app.get(AppService).teardown();
    await db.disconnect();
    await app.close();
  },
};

export const runAllTests: boolean = process.env.IMMICH_RUN_ALL_TESTS === 'true';

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

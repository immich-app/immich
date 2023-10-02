import { dataSource } from '@app/infra';

import { IJobRepository, JobItem, JobItemHandler, QueueName } from '@app/domain';
import { AppModule } from '@app/immich';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import path from 'path';
import { AppService } from '../src/microservices/app.service';

export const TEST_ASSET_PATH = process.env.TEST_ASSET_PATH;
export const TEST_ASSET_TEMP_PATH = path.normalize(`${TEST_ASSET_PATH}/temp/`);

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

export async function createTestApp(runJobs = false, log = false): Promise<INestApplication> {
  const moduleBuilder = await Test.createTestingModule({
    imports: [AppModule],
    providers: [AppService],
  })
    .overrideProvider(IJobRepository)
    .useValue({
      addHandler: (_queueName: QueueName, _concurrency: number, handler: JobItemHandler) => (_handler = handler),
      queue: (item: JobItem) => runJobs && _handler(item),
      resume: jest.fn(),
      empty: jest.fn(),
      setConcurrency: jest.fn(),
      getQueueStatus: jest.fn(),
      getJobCounts: jest.fn(),
      pause: jest.fn(),
    } as IJobRepository);

  if (log) {
    moduleBuilder.setLogger(new Logger());
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();

  const app = await moduleFixture.createNestApplication().init();
  const appService = app.get(AppService);
  await appService.init();

  return app;
}

export const allTests: boolean = process.env.ALL_TESTS === 'true';

const directoryExists = async (dirPath: string) =>
  await fs.promises
    .access(dirPath)
    .then(() => true)
    .catch(() => false);

export async function restoreTempFolder(): Promise<void> {
  if (await directoryExists(`${TEST_ASSET_TEMP_PATH}`)) {
    // Temp directory exists, delete all files inside it
    await fs.promises.rm(TEST_ASSET_TEMP_PATH, { recursive: true });
  }
  // Create temp folder
  await fs.promises.mkdir(TEST_ASSET_TEMP_PATH);
}

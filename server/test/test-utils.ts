import { dataSource } from '@app/infra';

import { IJobRepository, JobItem, JobItemHandler, QueueName } from '@app/domain';
import { AppModule } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import path from 'path';
import { AppService } from '../src/microservices/app.service';
import { MetadataExtractionProcessor } from '../src/microservices/processors/metadata-extraction.processor';

export const TEST_ASSET_PATH = path.normalize(`${__dirname}/../test/assets/`);
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

export async function createTestApp(runJobs = false): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
    providers: [MetadataExtractionProcessor, AppService],
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
    } as IJobRepository)
    .compile();

  const app = await moduleFixture.createNestApplication().init();
  const appService = app.get(AppService);
  await appService.init();

  return app;
}

export async function ensureTestAssets(): Promise<void> {
  const directoryExists = async (dirPath: string) =>
    await fs.promises
      .access(dirPath)
      .then(() => true)
      .catch(() => false);

  if (!(await directoryExists(`${TEST_ASSET_PATH}/albums`))) {
    throw new Error(
      `Test assets not found. Please checkout https://github.com/etnoy/immich-test-assets/ into ${TEST_ASSET_PATH} first`,
    );
  }
  if (!(await directoryExists(`${TEST_ASSET_TEMP_PATH}`))) {
    await fs.promises.mkdir(TEST_ASSET_TEMP_PATH);
  }
}

import { AssetCreate, IJobRepository, JobItem, JobItemHandler, LibraryResponseDto, QueueName } from '@app/domain';
import { AppModule } from '@app/immich';
import { dataSource } from '@app/infra';
import { AssetEntity, AssetType, LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { randomBytes } from 'crypto';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import path from 'path';
import { Server } from 'tls';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { AppService } from '../src/microservices/app.service';

export const IMMICH_TEST_ASSET_PATH = process.env.IMMICH_TEST_ASSET_PATH;
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

let _handler: JobItemHandler = () => Promise.resolve();

interface TestAppOptions {
  jobs: boolean;
}

let app: INestApplication;

export const testApp = {
  create: async (options?: TestAppOptions): Promise<INestApplication> => {
    const { jobs } = options || { jobs: false };

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule], providers: [AppService] })
      .overrideProvider(IJobRepository)
      .useValue({
        addHandler: (_queueName: QueueName, _concurrency: number, handler: JobItemHandler) => (_handler = handler),
        addCronJob: jest.fn(),
        updateCronJob: jest.fn(),
        deleteCronJob: jest.fn(),
        validateCronExpression: jest.fn(),
        queue: (item: JobItem) => jobs && _handler(item),
        resume: jest.fn(),
        empty: jest.fn(),
        setConcurrency: jest.fn(),
        getQueueStatus: jest.fn(),
        getJobCounts: jest.fn(),
        pause: jest.fn(),
        clear: jest.fn(),
      } as IJobRepository)
      .compile();

    app = await moduleFixture.createNestApplication().init();
    await app.listen(0);
    await app.get(AppService).init();

    const port = app.getHttpServer().address().port;
    const protocol = app instanceof Server ? 'https' : 'http';
    process.env.IMMICH_INSTANCE_URL = protocol + '://127.0.0.1:' + port;

    return app;
  },
  reset: async (options?: ResetOptions) => {
    await app.get(AppService).init();
    await db.reset(options);
  },
  teardown: async () => {
    if (app) {
      await app.get(AppService).teardown();
      await app.close();
    }
    await db.disconnect();
  },
};

export const runAllTests: boolean = process.env.IMMICH_RUN_ALL_TESTS === 'true';

export const itif = (condition: boolean) => (condition ? it : it.skip);

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

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

let assetCount = 0;
export function generateAsset(
  userId: string,
  libraries: LibraryResponseDto[],
  other: Partial<AssetEntity> = {},
): AssetCreate {
  const id = assetCount++;
  const { fileCreatedAt = randomDate(new Date(1970, 1, 1), new Date(2023, 1, 1)) } = other;

  return {
    createdAt: today.toJSDate(),
    updatedAt: today.toJSDate(),
    ownerId: userId,
    checksum: randomBytes(20),
    originalPath: `/tests/test_${id}`,
    deviceAssetId: `test_${id}`,
    deviceId: 'e2e-test',
    libraryId: (
      libraries.find(({ ownerId, type }) => ownerId === userId && type === LibraryType.UPLOAD) as LibraryResponseDto
    ).id,
    isVisible: true,
    fileCreatedAt,
    fileModifiedAt: new Date(),
    localDateTime: fileCreatedAt,
    type: AssetType.IMAGE,
    originalFileName: `test_${id}`,
    ...other,
  };
}

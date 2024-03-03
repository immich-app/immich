import { AssetCreate, IJobRepository, IMetadataRepository, LibraryResponseDto } from '@app/domain';
import { AppModule } from '@app/immich';
import { InfraModule, InfraTestModule, dataSource } from '@app/infra';
import { AssetEntity, AssetType, LibraryType } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { randomBytes } from 'node:crypto';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { AppService } from '../../src/microservices/app.service';
import { newJobRepositoryMock, newMetadataRepositoryMock } from '../../test';

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

      if (tableNames.includes('asset_stack')) {
        await em.query(`DELETE FROM "asset_stack" CASCADE;`);
      }
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

let app: INestApplication;

export const testApp = {
  create: async (): Promise<INestApplication> => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule], providers: [AppService] })
      .overrideModule(InfraModule)
      .useModule(InfraTestModule)
      .overrideProvider(IJobRepository)
      .useValue(newJobRepositoryMock())
      .overrideProvider(IMetadataRepository)
      .useValue(newMetadataRepositoryMock())
      .compile();

    app = await moduleFixture.createNestApplication().init();
    await app.get(AppService).init();

    return app;
  },
  reset: async (options?: ResetOptions) => {
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

import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { transformIndexes } from 'src/sql-tools/transformers/index.transformer';
import { describe, expect, it } from 'vitest';

const ctx = new BaseContext({});

describe(transformIndexes.name, () => {
  describe('IndexCreate', () => {
    it('should work', () => {
      expect(
        transformIndexes(ctx, {
          type: 'IndexCreate',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            columnNames: ['column1'],
            unique: false,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" ("column1");');
    });

    it('should create an unique index', () => {
      expect(
        transformIndexes(ctx, {
          type: 'IndexCreate',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            columnNames: ['column1'],
            unique: true,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE UNIQUE INDEX "IDX_test" ON "table1" ("column1");');
    });

    it('should create an index with a custom expression', () => {
      expect(
        transformIndexes(ctx, {
          type: 'IndexCreate',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            unique: false,
            expression: '"id" IS NOT NULL',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" ("id" IS NOT NULL);');
    });

    it('should create an index with a where clause', () => {
      expect(
        transformIndexes(ctx, {
          type: 'IndexCreate',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            columnNames: ['id'],
            unique: false,
            where: '("id" IS NOT NULL)',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" ("id") WHERE ("id" IS NOT NULL);');
    });

    it('should create an index with a custom expression', () => {
      expect(
        transformIndexes(ctx, {
          type: 'IndexCreate',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            unique: false,
            using: 'gin',
            expression: '"id" IS NOT NULL',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" USING gin ("id" IS NOT NULL);');
    });
  });

  describe('IndexDrop', () => {
    it('should work', () => {
      expect(
        transformIndexes(ctx, {
          type: 'IndexDrop',
          indexName: 'IDX_test',
          reason: 'unknown',
        }),
      ).toEqual(`DROP INDEX "IDX_test";`);
    });
  });
});

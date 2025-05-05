import { transformIndexes } from 'src/sql-tools/to-sql/transformers/index.transformer';
import { describe, expect, it } from 'vitest';

describe(transformIndexes.name, () => {
  describe('index.create', () => {
    it('should work', () => {
      expect(
        transformIndexes({
          type: 'index.create',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            columnNames: ['column1'],
            unique: false,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" ("column1")');
    });

    it('should create an unique index', () => {
      expect(
        transformIndexes({
          type: 'index.create',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            columnNames: ['column1'],
            unique: true,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE UNIQUE INDEX "IDX_test" ON "table1" ("column1")');
    });

    it('should create an index with a custom expression', () => {
      expect(
        transformIndexes({
          type: 'index.create',
          index: {
            name: 'IDX_test',
            tableName: 'table1',
            unique: false,
            expression: '"id" IS NOT NULL',
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" ("id" IS NOT NULL)');
    });

    it('should create an index with a where clause', () => {
      expect(
        transformIndexes({
          type: 'index.create',
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
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" ("id") WHERE ("id" IS NOT NULL)');
    });

    it('should create an index with a custom expression', () => {
      expect(
        transformIndexes({
          type: 'index.create',
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
      ).toEqual('CREATE INDEX "IDX_test" ON "table1" USING gin ("id" IS NOT NULL)');
    });
  });

  describe('index.drop', () => {
    it('should work', () => {
      expect(
        transformIndexes({
          type: 'index.drop',
          indexName: 'IDX_test',
          reason: 'unknown',
        }),
      ).toEqual(`DROP INDEX "IDX_test";`);
    });
  });
});

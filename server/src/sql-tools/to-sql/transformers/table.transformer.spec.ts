import { transformTables } from 'src/sql-tools/to-sql/transformers/table.transformer';
import { describe, expect, it } from 'vitest';

describe(transformTables.name, () => {
  describe('table.drop', () => {
    it('should work', () => {
      expect(
        transformTables({
          type: 'table.drop',
          tableName: 'table1',
          reason: 'unknown',
        }),
      ).toEqual(`DROP TABLE "table1";`);
    });
  });

  describe('table.create', () => {
    it('should work', () => {
      expect(
        transformTables({
          type: 'table.create',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                nullable: true,
                isArray: false,
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying);`]);
    });

    it('should handle a non-nullable column', () => {
      expect(
        transformTables({
          type: 'table.create',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                isArray: false,
                nullable: false,
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying NOT NULL);`]);
    });

    it('should handle a default value', () => {
      expect(
        transformTables({
          type: 'table.create',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                isArray: false,
                nullable: true,
                default: 'uuid_generate_v4()',
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying DEFAULT uuid_generate_v4());`]);
    });

    it('should handle a string with a fixed length', () => {
      expect(
        transformTables({
          type: 'table.create',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                length: 2,
                isArray: false,
                nullable: true,
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying(2));`]);
    });

    it('should handle an array type', () => {
      expect(
        transformTables({
          type: 'table.create',
          table: {
            name: 'table1',
            columns: [
              {
                tableName: 'table1',
                name: 'column1',
                type: 'character varying',
                isArray: true,
                nullable: true,
                synchronize: true,
              },
            ],
            indexes: [],
            constraints: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual([`CREATE TABLE "table1" ("column1" character varying[]);`]);
    });
  });
});

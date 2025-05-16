import { transformColumns } from 'src/sql-tools/to-sql/transformers/column.transformer';
import { describe, expect, it } from 'vitest';

describe(transformColumns.name, () => {
  describe('column.add', () => {
    it('should work', () => {
      expect(
        transformColumns({
          type: 'column.add',
          column: {
            name: 'column1',
            tableName: 'table1',
            type: 'character varying',
            nullable: false,
            isArray: false,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('ALTER TABLE "table1" ADD "column1" character varying NOT NULL;');
    });

    it('should add a nullable column', () => {
      expect(
        transformColumns({
          type: 'column.add',
          column: {
            name: 'column1',
            tableName: 'table1',
            type: 'character varying',
            nullable: true,
            isArray: false,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('ALTER TABLE "table1" ADD "column1" character varying;');
    });

    it('should add a column with an enum type', () => {
      expect(
        transformColumns({
          type: 'column.add',
          column: {
            name: 'column1',
            tableName: 'table1',
            type: 'character varying',
            enumName: 'table1_column1_enum',
            nullable: true,
            isArray: false,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('ALTER TABLE "table1" ADD "column1" table1_column1_enum;');
    });

    it('should add a column that is an array type', () => {
      expect(
        transformColumns({
          type: 'column.add',
          column: {
            name: 'column1',
            tableName: 'table1',
            type: 'boolean',
            nullable: true,
            isArray: true,
            synchronize: true,
          },
          reason: 'unknown',
        }),
      ).toEqual('ALTER TABLE "table1" ADD "column1" boolean[];');
    });
  });

  describe('column.alter', () => {
    it('should make a column nullable', () => {
      expect(
        transformColumns({
          type: 'column.alter',
          tableName: 'table1',
          columnName: 'column1',
          changes: { nullable: true },
          reason: 'unknown',
        }),
      ).toEqual([`ALTER TABLE "table1" ALTER COLUMN "column1" DROP NOT NULL;`]);
    });

    it('should make a column non-nullable', () => {
      expect(
        transformColumns({
          type: 'column.alter',
          tableName: 'table1',
          columnName: 'column1',
          changes: { nullable: false },
          reason: 'unknown',
        }),
      ).toEqual([`ALTER TABLE "table1" ALTER COLUMN "column1" SET NOT NULL;`]);
    });

    it('should update the default value', () => {
      expect(
        transformColumns({
          type: 'column.alter',
          tableName: 'table1',
          columnName: 'column1',
          changes: { default: 'uuid_generate_v4()' },
          reason: 'unknown',
        }),
      ).toEqual([`ALTER TABLE "table1" ALTER COLUMN "column1" SET DEFAULT uuid_generate_v4();`]);
    });
  });

  describe('column.drop', () => {
    it('should work', () => {
      expect(
        transformColumns({
          type: 'column.drop',
          tableName: 'table1',
          columnName: 'column1',
          reason: 'unknown',
        }),
      ).toEqual(`ALTER TABLE "table1" DROP COLUMN "column1";`);
    });
  });
});

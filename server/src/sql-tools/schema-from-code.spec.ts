import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { schemaFromCode } from 'src/sql-tools/schema-from-code';
import { DatabaseSchema, SchemaFromCodeOptions } from 'src/sql-tools/types';
import { describe, expect, it } from 'vitest';

const importModule = (filePath: string) => {
  return vi.importActual<{
    description: string;
    message: string;
    schema: DatabaseSchema;
    options: SchemaFromCodeOptions;
  }>(filePath);
};

describe(schemaFromCode.name, () => {
  it('should work', () => {
    expect(schemaFromCode({ reset: true })).toEqual({
      databaseName: 'postgres',
      schemaName: 'public',
      functions: [],
      enums: [],
      extensions: [],
      parameters: [],
      overrides: [],
      tables: [],
      warnings: [],
    });
  });

  describe('test files', () => {
    const errorStubs = readdirSync('test/sql-tools/errors', { withFileTypes: true });
    for (const file of errorStubs) {
      const filePath = join(file.parentPath, file.name);
      it(filePath, async () => {
        const { message, options } = await importModule(filePath);

        expect(message).toBeDefined();
        expect(() => schemaFromCode({ ...options, reset: true })).toThrowError(message);
      });
    }

    const stubs = readdirSync('test/sql-tools', { withFileTypes: true });
    for (const file of stubs) {
      if (file.isDirectory()) {
        continue;
      }

      const filePath = join(file.parentPath, file.name);
      it(filePath, async () => {
        const { description, schema, options } = await importModule(filePath);

        expect(description).toBeDefined();
        expect(schema).toBeDefined();
        expect(schemaFromCode({ ...options, reset: true }), description).toEqual(schema);
      });
    }
  });
});

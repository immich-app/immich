import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { schemaFromCode } from 'src/sql-tools/schema-from-code';
import { describe, expect, it } from 'vitest';

describe(schemaFromCode.name, () => {
  it('should work', () => {
    expect(schemaFromCode({ reset: true })).toEqual({
      databaseName: 'postgres',
      schemaName: 'public',
      functions: [],
      enums: [],
      extensions: [],
      parameters: [],
      tables: [],
      warnings: [],
    });
  });

  describe('test files', () => {
    const errorStubs = readdirSync('test/sql-tools/errors', { withFileTypes: true });
    for (const file of errorStubs) {
      const filePath = join(file.parentPath, file.name);
      it(filePath, async () => {
        const module = await import(filePath);
        expect(module.message).toBeDefined();
        expect(() => schemaFromCode({ reset: true })).toThrowError(module.message);
      });
    }

    const stubs = readdirSync('test/sql-tools', { withFileTypes: true });
    for (const file of stubs) {
      if (file.isDirectory()) {
        continue;
      }

      const filePath = join(file.parentPath, file.name);
      it(filePath, async () => {
        const module = await import(filePath);
        expect(module.description).toBeDefined();
        expect(module.schema).toBeDefined();
        expect(schemaFromCode({ reset: true }), module.description).toEqual(module.schema);
      });
    }
  });
});

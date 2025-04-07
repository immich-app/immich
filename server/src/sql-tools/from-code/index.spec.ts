import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { reset, schemaFromCode } from 'src/sql-tools/from-code';
import { describe, expect, it } from 'vitest';

describe(schemaFromCode.name, () => {
  beforeEach(() => {
    reset();
  });

  it('should work', () => {
    expect(schemaFromCode()).toEqual({
      name: 'postgres',
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
    const files = readdirSync('test/sql-tools', { withFileTypes: true });
    for (const file of files) {
      const filePath = join(file.parentPath, file.name);
      it(filePath, async () => {
        const module = await import(filePath);
        expect(module.description).toBeDefined();
        expect(module.schema).toBeDefined();
        expect(schemaFromCode(), module.description).toEqual(module.schema);
      });
    }
  });
});

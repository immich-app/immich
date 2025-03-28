import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { reset, schemaFromDecorators } from 'src/sql-tools/schema-from-decorators';
import { describe, expect, it } from 'vitest';

describe('schemaDiff', () => {
  beforeEach(() => {
    reset();
  });

  it('should work', () => {
    expect(schemaFromDecorators()).toEqual({
      name: 'public',
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
        expect(schemaFromDecorators(), module.description).toEqual(module.schema);
      });
    }
  });
});

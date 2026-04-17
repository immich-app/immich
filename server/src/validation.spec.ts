import { IsNotSiblingOf } from 'src/validation';
import { describe, expect, it } from 'vitest';
import z from 'zod';

describe('Validation', () => {
  describe('IsNotSiblingOf', () => {
    const MySchemaBase = z.object({
      attribute1: z.string().optional(),
      attribute2: z.string().optional(),
      attribute3: z.string().optional(),
      unrelatedAttribute: z.string().optional(),
    });

    const MySchema = MySchemaBase.pipe(IsNotSiblingOf(MySchemaBase, 'attribute1', ['attribute2']))
      .pipe(IsNotSiblingOf(MySchemaBase, 'attribute2', ['attribute1', 'attribute3']))
      .pipe(IsNotSiblingOf(MySchemaBase, 'attribute3', ['attribute2']));

    it('passes when only one attribute is present', () => {
      const result = MySchema.safeParse({
        attribute1: 'value1',
        unrelatedAttribute: 'value2',
      });
      expect(result.success).toBe(true);
    });

    it('fails when colliding attributes are present', () => {
      const result = MySchema.safeParse({
        attribute1: 'value1',
        attribute2: 'value2',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('attribute1 cannot exist alongside attribute2');
      }
    });

    it('passes when no colliding attributes are present', () => {
      const result = MySchema.safeParse({
        attribute1: 'value1',
        attribute3: 'value2',
      });
      expect(result.success).toBe(true);
    });
  });
});

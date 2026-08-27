import { IsNotSiblingOf, toEmail } from 'src/validation';
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

  describe('toEmail', () => {
    it.each([
      'test@immich.cloud',
      'test@immich',
      'first.last+tag@immich.cloud',
      // unicode local parts and internationalized domain names
      'tëst@immich.cloud',
      'leoñ@immich.cloud',
      'test@яндекс.рф',
      'test@xn--d1acpjx3f.xn--p1ai',
      '用户@例子.广告',
      'test@ท่องเที่ยว.ไทย',
    ])('should accept %s', (email) => {
      expect(toEmail.safeParse(email).success).toBe(true);
    });

    it.each(['immich', 'test@@immich.cloud', 'test user@immich.cloud', 'test@immich..cloud', 'test@-immich.cloud'])(
      'should reject %s',
      (email) => {
        expect(toEmail.safeParse(email).success).toBe(false);
      },
    );

    it('should convert the email to lower case', () => {
      expect(toEmail.parse('tÉst@Immich.Cloud')).toBe('tést@immich.cloud');
    });
  });
});

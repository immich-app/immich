import { TagUpdateSchema } from 'src/dtos/tag.dto';

describe('Tag DTOs', () => {
  describe('TagUpdateDto', () => {
    it('should validate a valid TagUpdateDto', () => {
      const data = { name: 'updated-tag', color: '#00FF00' };
      const result = TagUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should throw error for invalid name with slash', () => {
      const result = TagUpdateSchema.safeParse({ name: 'updated/tag' });
      expect(result.success).toBe(false);
    });

    it('should accept null color', () => {
      const result = TagUpdateSchema.safeParse({ name: 'updated-tag', color: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBeNull();
      }
    });

    it('should throw error for invalid color', () => {
      const result = TagUpdateSchema.safeParse({ name: 'updated-tag', color: 'invalid-color' });
      expect(result.success).toBe(false);
    });
  });
});

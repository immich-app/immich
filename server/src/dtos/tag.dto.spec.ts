import { TagCreateSchema, TagResponseSchema, TagUpdateSchema } from 'src/dtos/tag.dto';

describe('Tag DTOs', () => {
  describe('TagCreateDto', () => {
    it('should validate a valid TagCreateDto', () => {
      const data = { name: 'test-tag', parentId: 'dfffed71-8ed5-44d7-81fe-9b2ddfbef361', color: '#FF0000' };
      const result = TagCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should throw error for tag name with slash', () => {
      const result = TagCreateSchema.safeParse({ name: 'test/tag' });
      expect(result.success).toBe(false);
    });

    it('should throw error for invalid tag parentId', () => {
      const result = TagCreateSchema.safeParse({ name: 'test-tag', parentId: 'invalid-uuid' });
      expect(result.success).toBe(false);
    });

    it('should accept null color', () => {
      const result = TagCreateSchema.safeParse({ name: 'test-tag', color: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBeNull();
      }
    });

    it('should throw error for invalid tag color', () => {
      const result = TagCreateSchema.safeParse({ name: 'test-tag', color: 'invalid-color' });
      expect(result.success).toBe(false);
    });
  });

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

  describe('TagResponseDto', () => {
    it('should validate a valid TagResponseDto', () => {
      const data = {
        id: '123e4567-e89b-42d3-a456-426614174000',
        name: 'test-tag',
        value: 'parent/test-tag',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        color: '#FF0000',
      };
      const result = TagResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept optional parentId and color', () => {
      const data = {
        id: '123e4567-e89b-42d3-a456-426614174000',
        name: 'test-tag',
        value: 'test-tag',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };
      const result = TagResponseSchema.safeParse(data);
      console.log(result);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parentId).toBeUndefined();
        expect(result.data.color).toBeUndefined();
      }
    });
  });
});

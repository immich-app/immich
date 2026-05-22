import { TagBulkAddRemoveAssetsSchema, TagsForAssetsQuerySchema, TagsForAssetsResponseSchema } from 'src/dtos/tag.dto';

describe('Tag DTOs', () => {
  describe('TagsForAssetsQueryDto', () => {
    it('should validate a valid TagsForAssetsQueryDto', () => {
      const result = TagsForAssetsQuerySchema.safeParse({ assetIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657'] });
      expect(result.success).toBe(true);
    });

    it('should allow a single asset id passed as string', () => {
      const result = TagsForAssetsQuerySchema.safeParse({ assetIds: '3fe388e4-2078-44d7-b36c-39d9dee3a657' });
      expect(result.success).toBe(true);
    });

    it('should throw error for invalid assetId', () => {
      const result = TagsForAssetsQuerySchema.safeParse({ assetIds: ['invalid-uuid'] });
      expect(result.success).toBe(false);
    });
  });

  describe('TagsForAssetsResponseDto', () => {
    it('should validate a valid TagsForAssetsResponseDto', () => {
      const data = {
        tagId: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
        assetIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657', '4fe388e4-2078-44d7-b36c-39d9dee3a657'],
      };
      const result = TagsForAssetsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should throw error for invalid tagId', () => {
      const result = TagsForAssetsResponseSchema.safeParse({
        tagId: 'invalid-uuid',
        assetIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657'],
      });
      expect(result.success).toBe(false);
    });

    it('should throw error for invalid assetIds', () => {
      const result = TagsForAssetsResponseSchema.safeParse({
        tagId: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
        assetIds: ['invalid-uuid'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TagBulkAddRemoveAssetsDto', () => {
    it('should validate a valid TagBulkAddRemoveAssetsDto', () => {
      const result = TagBulkAddRemoveAssetsSchema.safeParse({
        tagIdsToAdd: ['2fe388e4-2078-44d7-b36c-39d9dee3a657'],
        tagIdsToRemove: ['4fe388e4-2078-44d7-b36c-39d9dee3a657'],
        assetIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657'],
      });
      expect(result.success).toBe(true);
    });

    it('should throw error for invalid assetIds', () => {
      const result = TagBulkAddRemoveAssetsSchema.safeParse({
        tagIdsToAdd: ['2fe388e4-2078-44d7-b36c-39d9dee3a657'],
        tagIdsToRemove: ['4fe388e4-2078-44d7-b36c-39d9dee3a657'],
        assetIds: ['invalid-uuid'],
      });
      expect(result.success).toBe(false);
    });

    it('should throw error for invalid tagIdsToAdd', () => {
      const result = TagBulkAddRemoveAssetsSchema.safeParse({
        tagIdsToAdd: ['invalid-uuid'],
        tagIdsToRemove: ['4fe388e4-2078-44d7-b36c-39d9dee3a657'],
        assetIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657'],
      });
      expect(result.success).toBe(false);
    });

    it('should throw error for invalid tagIdsToRemove', () => {
      const result = TagBulkAddRemoveAssetsSchema.safeParse({
        tagIdsToAdd: ['2fe388e4-2078-44d7-b36c-39d9dee3a657'],
        tagIdsToRemove: ['invalid-uuid'],
        assetIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657'],
      });
      expect(result.success).toBe(false);
    });
  });
});

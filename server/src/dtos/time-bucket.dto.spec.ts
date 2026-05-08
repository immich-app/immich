import { TimeBucketDto } from 'src/dtos/time-bucket.dto';

describe('TimeBucketDto', () => {
  describe('spacePersonIds query param handling', () => {
    it('should accept an array of UUIDs', () => {
      const result = TimeBucketDto.schema.safeParse({
        spacePersonIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657', 'a1b2c3d4-5678-4abc-9def-012345678901'],
      });
      expect(result.success).toBe(true);
      expect(result.data?.spacePersonIds).toEqual([
        '3fe388e4-2078-44d7-b36c-39d9dee3a657',
        'a1b2c3d4-5678-4abc-9def-012345678901',
      ]);
    });

    it('should accept a single UUID string and wrap it in an array', () => {
      // When Express receives ?spacePersonIds=uuid, it parses as a string, not array.
      // The DTO preprocess wraps a single string into a single-element array.
      const result = TimeBucketDto.schema.safeParse({
        spacePersonIds: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
      });
      expect(result.success).toBe(true);
      expect(result.data?.spacePersonIds).toEqual(['3fe388e4-2078-44d7-b36c-39d9dee3a657']);
    });
  });

  describe('personIds query param handling', () => {
    it('should accept a single UUID string and wrap it in an array', () => {
      const result = TimeBucketDto.schema.safeParse({
        personIds: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
      });
      expect(result.success).toBe(true);
      expect(result.data?.personIds).toEqual(['3fe388e4-2078-44d7-b36c-39d9dee3a657']);
    });

    it('should accept scoped shared-space person tokens', () => {
      const result = TimeBucketDto.schema.safeParse({
        personIds: 'space-person:3fe388e4-2078-44d7-b36c-39d9dee3a657',
      });
      expect(result.success).toBe(true);
      expect(result.data?.personIds).toEqual(['space-person:3fe388e4-2078-44d7-b36c-39d9dee3a657']);
    });
  });

  describe('tagIds query param handling', () => {
    it('should accept a single UUID string and wrap it in an array', () => {
      const result = TimeBucketDto.schema.safeParse({
        tagIds: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
      });
      expect(result.success).toBe(true);
      expect(result.data?.tagIds).toEqual(['3fe388e4-2078-44d7-b36c-39d9dee3a657']);
    });
  });

  describe('isNotInAlbum query param handling', () => {
    it('should coerce true string to boolean', () => {
      const result = TimeBucketDto.schema.safeParse({ isNotInAlbum: 'true' });

      expect(result.success).toBe(true);
      expect(result.data?.isNotInAlbum).toBe(true);
    });

    it('should coerce false string to boolean', () => {
      const result = TimeBucketDto.schema.safeParse({ isNotInAlbum: 'false' });

      expect(result.success).toBe(true);
      expect(result.data?.isNotInAlbum).toBe(false);
    });
  });
});

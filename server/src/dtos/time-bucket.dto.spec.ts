import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TimeBucketDto } from 'src/dtos/time-bucket.dto';

describe('TimeBucketDto', () => {
  describe('spacePersonIds query param handling', () => {
    it('should accept an array of UUIDs', async () => {
      const dto = plainToInstance(TimeBucketDto, {
        spacePersonIds: ['3fe388e4-2078-44d7-b36c-39d9dee3a657', 'a1b2c3d4-5678-4abc-9def-012345678901'],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.spacePersonIds).toEqual([
        '3fe388e4-2078-44d7-b36c-39d9dee3a657',
        'a1b2c3d4-5678-4abc-9def-012345678901',
      ]);
    });

    it('should accept a single UUID string and wrap it in an array', async () => {
      // When Express receives ?spacePersonIds=uuid, it parses as a string, not array.
      // The DTO must transform a single string into a single-element array.
      const dto = plainToInstance(TimeBucketDto, {
        spacePersonIds: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.spacePersonIds).toEqual(['3fe388e4-2078-44d7-b36c-39d9dee3a657']);
    });
  });

  describe('personIds query param handling', () => {
    it('should accept a single UUID string and wrap it in an array', async () => {
      const dto = plainToInstance(TimeBucketDto, {
        personIds: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.personIds).toEqual(['3fe388e4-2078-44d7-b36c-39d9dee3a657']);
    });
  });

  describe('tagIds query param handling', () => {
    it('should accept a single UUID string and wrap it in an array', async () => {
      const dto = plainToInstance(TimeBucketDto, {
        tagIds: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.tagIds).toEqual(['3fe388e4-2078-44d7-b36c-39d9dee3a657']);
    });
  });
});

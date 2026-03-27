import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FilteredMapMarkerDto } from 'src/dtos/gallery-map.dto';

function transform(plain: Record<string, unknown>): FilteredMapMarkerDto {
  return plainToInstance(FilteredMapMarkerDto, plain, { enableImplicitConversion: false });
}

describe('FilteredMapMarkerDto', () => {
  describe('personIds', () => {
    it('should normalize a single string to an array', () => {
      const dto = transform({ personIds: '7e57d004-2b97-0e7a-b45f-5387367791cd' });
      expect(dto.personIds).toEqual(['7e57d004-2b97-0e7a-b45f-5387367791cd']);
    });

    it('should keep an array as-is', () => {
      const ids = ['7e57d004-2b97-0e7a-b45f-5387367791cd', '8e57d004-2b97-0e7a-b45f-5387367791cd'];
      const dto = transform({ personIds: ids });
      expect(dto.personIds).toEqual(ids);
    });

    it('should leave undefined when not provided and pass validation', () => {
      const dto = transform({});
      expect(dto.personIds).toBeUndefined();
      const errors = validateSync(dto);
      expect(errors.filter((e) => e.property === 'personIds')).toHaveLength(0);
    });
  });

  describe('tagIds', () => {
    it('should normalize a single string to an array', () => {
      const dto = transform({ tagIds: '7e57d004-2b97-0e7a-b45f-5387367791cd' });
      expect(dto.tagIds).toEqual(['7e57d004-2b97-0e7a-b45f-5387367791cd']);
    });

    it('should leave undefined when not provided and pass validation', () => {
      const dto = transform({});
      expect(dto.tagIds).toBeUndefined();
      const errors = validateSync(dto);
      expect(errors.filter((e) => e.property === 'tagIds')).toHaveLength(0);
    });
  });

  describe('rating', () => {
    it('should coerce string to number', () => {
      const dto = transform({ rating: '3' });
      expect(dto.rating).toBe(3);
      expect(typeof dto.rating).toBe('number');
    });

    it('should reject rating outside range', () => {
      const dto = transform({ rating: '6' });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'rating')).toBe(true);
    });

    it('should leave undefined when not provided', () => {
      const dto = transform({});
      expect(dto.rating).toBeUndefined();
    });
  });

  describe('city and country', () => {
    it('should accept city and country strings', () => {
      const dto = transform({ city: 'Paris', country: 'France' });
      expect(dto.city).toBe('Paris');
      expect(dto.country).toBe('France');
    });

    it('should leave undefined when not provided', () => {
      const dto = transform({});
      expect(dto.city).toBeUndefined();
      expect(dto.country).toBeUndefined();
    });
  });
});

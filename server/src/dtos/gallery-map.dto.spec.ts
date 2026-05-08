import { FilteredMapMarkerDto } from 'src/dtos/gallery-map.dto';

function parse(plain: Record<string, unknown>) {
  return FilteredMapMarkerDto.schema.safeParse(plain);
}

describe('FilteredMapMarkerDto', () => {
  describe('personIds', () => {
    it('should normalize a single string to an array', () => {
      const result = parse({ personIds: '7e57d004-2b97-4e7a-b45f-5387367791cd' });
      expect(result.success).toBe(true);
      expect(result.data?.personIds).toEqual(['7e57d004-2b97-4e7a-b45f-5387367791cd']);
    });

    it('should keep an array as-is', () => {
      const ids = ['7e57d004-2b97-4e7a-b45f-5387367791cd', '8e57d004-2b97-4e7a-b45f-5387367791cd'];
      const result = parse({ personIds: ids });
      expect(result.success).toBe(true);
      expect(result.data?.personIds).toEqual(ids);
    });

    it('should accept scoped shared-space person tokens', () => {
      const result = parse({ personIds: 'space-person:7e57d004-2b97-4e7a-b45f-5387367791cd' });

      expect(result.success).toBe(true);
      expect(result.data?.personIds).toEqual(['space-person:7e57d004-2b97-4e7a-b45f-5387367791cd']);
    });

    it('should leave undefined when not provided and pass validation', () => {
      const result = parse({});
      expect(result.success).toBe(true);
      expect(result.data?.personIds).toBeUndefined();
    });
  });

  describe('tagIds', () => {
    it('should normalize a single string to an array', () => {
      const result = parse({ tagIds: '7e57d004-2b97-4e7a-b45f-5387367791cd' });
      expect(result.success).toBe(true);
      expect(result.data?.tagIds).toEqual(['7e57d004-2b97-4e7a-b45f-5387367791cd']);
    });

    it('should leave undefined when not provided and pass validation', () => {
      const result = parse({});
      expect(result.success).toBe(true);
      expect(result.data?.tagIds).toBeUndefined();
    });
  });

  describe('rating', () => {
    it('should coerce string to number', () => {
      const result = parse({ rating: '3' });
      expect(result.success).toBe(true);
      expect(result.data?.rating).toBe(3);
      expect(typeof result.data?.rating).toBe('number');
    });

    it('should reject rating outside range', () => {
      const result = parse({ rating: '6' });
      expect(result.success).toBe(false);
    });

    it('should leave undefined when not provided', () => {
      const result = parse({});
      expect(result.success).toBe(true);
      expect(result.data?.rating).toBeUndefined();
    });
  });

  describe('city and country', () => {
    it('should accept city and country strings', () => {
      const result = parse({ city: 'Paris', country: 'France' });
      expect(result.success).toBe(true);
      expect(result.data?.city).toBe('Paris');
      expect(result.data?.country).toBe('France');
    });

    it('should leave undefined when not provided', () => {
      const result = parse({});
      expect(result.success).toBe(true);
      expect(result.data?.city).toBeUndefined();
      expect(result.data?.country).toBeUndefined();
    });
  });

  describe('isNotInAlbum', () => {
    it('should coerce true string to boolean', () => {
      const result = parse({ isNotInAlbum: 'true' });

      expect(result.success).toBe(true);
      expect(result.data?.isNotInAlbum).toBe(true);
    });

    it('should coerce false string to boolean', () => {
      const result = parse({ isNotInAlbum: 'false' });

      expect(result.success).toBe(true);
      expect(result.data?.isNotInAlbum).toBe(false);
    });

    it('should leave undefined when not provided', () => {
      const result = parse({});

      expect(result.success).toBe(true);
      expect(result.data?.isNotInAlbum).toBeUndefined();
    });
  });
});

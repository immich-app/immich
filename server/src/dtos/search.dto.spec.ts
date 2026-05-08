import {
  FilterSuggestionsRequestDto,
  SearchSuggestionRequestDto,
  SearchSuggestionType,
  SmartSearchDto,
  SmartSearchFacetsDto,
} from 'src/dtos/search.dto';

describe('search DTO albumless filters', () => {
  it('should accept isNotInAlbum on smart search requests', () => {
    const result = SmartSearchDto.schema.safeParse({ query: 'beach', isNotInAlbum: true });

    expect(result.success).toBe(true);
    expect(result.data?.isNotInAlbum).toBe(true);
  });

  it('should accept isNotInAlbum on smart search facet requests', () => {
    const result = SmartSearchFacetsDto.schema.safeParse({ query: 'beach', isNotInAlbum: true });

    expect(result.success).toBe(true);
    expect(result.data?.isNotInAlbum).toBe(true);
  });

  it('should coerce isNotInAlbum on filter suggestion requests', () => {
    const result = FilterSuggestionsRequestDto.schema.safeParse({ isNotInAlbum: 'true' });

    expect(result.success).toBe(true);
    expect(result.data?.isNotInAlbum).toBe(true);
  });

  it('should coerce isNotInAlbum on dependent search suggestion requests', () => {
    const result = SearchSuggestionRequestDto.schema.safeParse({
      type: SearchSuggestionType.CITY,
      country: 'Germany',
      isNotInAlbum: 'true',
    });

    expect(result.success).toBe(true);
    expect(result.data?.isNotInAlbum).toBe(true);
  });

  it('should reject unrelated album values on suggestion requests instead of treating them as albumless', () => {
    const result = FilterSuggestionsRequestDto.schema.safeParse({ album: 'none' });

    expect(result.success).toBe(true);
    expect(result.data?.isNotInAlbum).toBeUndefined();
  });
});

import { QueryParameter } from '$lib/constants';
import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';

export function isSmartSearchDto(
  dto: SmartSearchDto | MetadataSearchDto,
  featureFlagEnabled = true,
): dto is SmartSearchDto {
  return ('query' in dto || 'queryAssetId' in dto) && featureFlagEnabled;
}

export function encodeSearchQuery(search: SmartSearchDto | MetadataSearchDto) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        for (const item of value) {
          searchParams.append(key, String(item));
        }
      } else {
        searchParams.set(key, String(value));
      }
    }
  }

  return searchParams.toString();
}

export function decodeSearchQuery(searchParams: URLSearchParams): SmartSearchDto | MetadataSearchDto {
  const result: Record<string, unknown> = {};

  const queryParam = searchParams.get(QueryParameter.QUERY);
  if (queryParam) {
    try {
      return JSON.parse(queryParam);
    } catch {
      // not a JSON query
    }
  }

  for (const [key, value] of searchParams.entries()) {
    const values = searchParams.getAll(key);
    result[key] = values.length > 1 ? values : value;
  }

  return result as SmartSearchDto | MetadataSearchDto;
}

import { QueryParameter } from '$lib/constants';
import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';

export function encodeSearchQuery(search: SmartSearchDto | MetadataSearchDto) {
  const searchParams = new URLSearchParams({
    [QueryParameter.QUERY]: JSON.stringify(search),
  });
  return searchParams.toString();
}

export function decodeSearchQuery(query: string): SmartSearchDto | MetadataSearchDto {
  const searchParams = new URLSearchParams(query);
  const jsonString = searchParams.get(QueryParameter.QUERY);
  if (!jsonString) {
    throw new Error('Invalid search query');
  }
  try {
    return JSON.parse(jsonString) as SmartSearchDto | MetadataSearchDto;
  } catch {
    throw new Error('Invalid search query');
  }
}

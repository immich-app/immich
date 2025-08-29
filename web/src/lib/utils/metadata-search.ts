import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';
import { QueryParameter } from '$lib/constants';

export function getMetadataSearchQuery(metadata: SmartSearchDto | MetadataSearchDto) {
  const searchParams = new URLSearchParams({
    [QueryParameter.QUERY]: JSON.stringify(metadata),
  });
  return searchParams.toString();
}

export function parseMetadataSearchQuery(query: string): SmartSearchDto | MetadataSearchDto {
  const searchParams = new URLSearchParams(query);
  const jsonString = searchParams.get(QueryParameter.QUERY);
  if (!jsonString) {
    throw new Error('Invalid metadata search query');
  }
  try {
    return JSON.parse(jsonString) as SmartSearchDto | MetadataSearchDto;
  } catch {
    throw new Error('Invalid metadata search query');
  }
}

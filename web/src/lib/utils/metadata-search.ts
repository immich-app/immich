import { QueryParameter } from '$lib/constants';
import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';

export function getMetadataSearchQuery(metadata: SmartSearchDto | MetadataSearchDto) {
  const searchParams = new URLSearchParams({
    [QueryParameter.QUERY]: JSON.stringify(metadata),
  });
  return searchParams.toString();
}

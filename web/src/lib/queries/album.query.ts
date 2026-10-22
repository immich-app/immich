import { getAlbumInfo } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getAlbumInfoQuery = (id: string) =>
  queryOptions({
    queryKey: ['album', id],
    queryFn: ({ signal }) => getAlbumInfo({ id }, { signal }),
  });

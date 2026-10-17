import {
  createLibrary,
  deleteLibrary,
  getAllLibraries,
  getLibraryStatistics,
  scanLibrary,
  updateLibrary,
  type LibraryResponseDto,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';
import { asMutation, queryClient } from '$lib/queries/client';

const findOrFail = (libraries: LibraryResponseDto[], id: string) => {
  const library = libraries.find((library) => library.id === id);
  if (!library) {
    throw new Error(`Library ${id} not found`);
  }
  return library;
};

export const getAllLibrariesQuery = () =>
  queryOptions({
    queryKey: ['libraries'],
    queryFn: ({ signal }) => getAllLibraries({ signal }),
  });

export const getLibraryQuery = (id: string) =>
  queryOptions({
    ...getAllLibrariesQuery(),
    select: (libraries) => findOrFail(libraries, id),
  });

export const getLibraryStatisticsQuery = (id: string) =>
  queryOptions({
    queryKey: ['libraries', id, 'statistics'],
    queryFn: ({ signal }) => getLibraryStatistics({ id }, { signal }),
    refetchInterval: 30_000,
  });

export const createLibraryMutation = () =>
  asMutation(createLibrary, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getAllLibrariesQuery().queryKey, exact: true }),
    meta: { error: { toast: 'errors.unable_to_create_library' } },
  });

export const updateLibraryMutation = () =>
  asMutation(updateLibrary, {
    onSuccess: async (library) => {
      queryClient.setQueryData(getAllLibrariesQuery().queryKey, (libraries) =>
        libraries?.map((item) => (item.id === library.id ? library : item)),
      );
      await queryClient.invalidateQueries({ queryKey: getLibraryStatisticsQuery(library.id).queryKey });
    },
    meta: { success: { toast: 'admin.library_updated' }, error: { toast: 'errors.unable_to_update_library' } },
  });

export const deleteLibraryMutation = () =>
  asMutation(deleteLibrary, {
    onSuccess: (_, [{ id }]) => {
      queryClient.setQueryData(getAllLibrariesQuery().queryKey, (libraries) =>
        libraries?.filter((library) => library.id !== id),
      );
      queryClient.removeQueries({ queryKey: getLibraryStatisticsQuery(id).queryKey });
    },
    meta: { success: { toast: 'admin.library_deleted' }, error: { toast: 'errors.unable_to_remove_library' } },
  });

export const scanLibraryMutation = () =>
  asMutation(scanLibrary, {
    meta: {
      success: { toast: { color: 'info', description: 'admin.scanning_library' } },
      error: { toast: 'errors.unable_to_scan_library' },
    },
  });

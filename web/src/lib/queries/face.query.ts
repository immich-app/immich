import { asMutation, queryClient } from '#lib/queries/client.ts';
import { createFace, deleteFace, getFaces, reassignFacesById, type AssetFaceResponseDto } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getFacesQuery = (assetId: string) =>
  queryOptions({
    queryKey: ['faces', assetId],
    queryFn: ({ signal }) => getFaces({ id: assetId }, { signal }),
  });

export const createFaceMutation = () =>
  asMutation(createFace, {
    onSuccess: (_, [{ assetFaceCreateDto }]) =>
      queryClient.invalidateQueries({ queryKey: getFacesQuery(assetFaceCreateDto.assetId).queryKey }),
  });

export const deleteFaceMutation = () =>
  asMutation(deleteFace, {
    onSuccess: (_, [{ id }]) =>
      queryClient.setQueriesData<AssetFaceResponseDto[]>({ queryKey: ['faces'] }, (faces) =>
        faces?.filter((face) => face.id !== id),
      ),
    meta: { error: { toast: 'error_delete_face' } },
  });

export const reassignFacesByIdMutation = () =>
  asMutation(reassignFacesById, {
    onSuccess: (person, [{ faceDto }]) =>
      queryClient.setQueriesData<AssetFaceResponseDto[]>({ queryKey: ['faces'] }, (faces) =>
        faces?.map((face) => (face.id === faceDto.id ? { ...face, person } : face)),
      ),
    meta: { error: { toast: 'errors.cant_apply_changes' } },
  });

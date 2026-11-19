import { asMutation } from '#lib/queries/client.ts';
import { emptyTrash, restoreAssets, restoreTrash } from '@immich/sdk';

export const emptyTrashMutation = () =>
  asMutation(emptyTrash, { meta: { error: { toast: 'errors.unable_to_empty_trash' } } });

export const restoreTrashMutation = () =>
  asMutation(restoreTrash, { meta: { error: { toast: 'errors.unable_to_restore_trash' } } });

export const restoreAssetsMutation = () =>
  asMutation(restoreAssets, { meta: { error: { toast: 'errors.unable_to_restore_assets' } } });

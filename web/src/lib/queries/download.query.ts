import { asMutation } from '#lib/queries/client.ts';
import { getDownloadInfo } from '@immich/sdk';

export const getDownloadInfoMutation = () =>
  asMutation(getDownloadInfo, { meta: { error: { toast: 'errors.unable_to_download_files' } } });

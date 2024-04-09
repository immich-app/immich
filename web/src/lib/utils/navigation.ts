import { getAssetInfo } from '@immich/sdk';

export const isExternalUrl = (url: string): boolean => {
  return new URL(url, window.location.href).origin !== window.location.origin;
};

export async function getAssetInfoFromParam(params: { assetId?: string }) {
  if (params.assetId) {
    return getAssetInfo({ id: params.assetId });
  }
  return null;
}

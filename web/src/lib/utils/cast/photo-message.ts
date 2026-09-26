import type { CastMediaSource } from '$lib/managers/cast-manager.svelte';
import { withCastSession } from '$lib/utils/cast/cast-url';

export const PHOTO_NAMESPACE = 'urn:x-cast:app.immich.photos';

export const isPhotoReceiver = (sessionAppId: string, configuredAppId?: string): boolean =>
  Boolean(configuredAppId) && sessionAppId === configuredAppId;

export const createPhotoMessage = (source: CastMediaSource, sessionKey: string, requestId: number) => {
  const signedPhoto = (item: CastMediaSource | undefined) =>
    item && {
      url: withCastSession(item.url, sessionKey),
      fallbackUrl: item.fallback ? withCastSession(item.fallback.url, sessionKey) : undefined,
    };

  return {
    type: 'SHOW_PHOTO',
    requestId,
    current: signedPhoto(source),
    previous: signedPhoto(source.neighbors?.previous),
    next: signedPhoto(source.neighbors?.next),
  };
};

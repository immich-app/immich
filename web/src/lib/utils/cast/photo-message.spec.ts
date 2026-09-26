import { describe, expect, it } from 'vitest';
import { createPhotoMessage, isPhotoReceiver, PHOTO_NAMESPACE } from '$lib/utils/cast/photo-message';

describe('photo cast message', () => {
  it('uses the custom photo protocol only for its actual receiver app', () => {
    expect(isPhotoReceiver('A2AE3577', 'A2AE3577')).toBe(true);
    expect(isPhotoReceiver('CC1AD845', 'A2AE3577')).toBe(false);
    expect(isPhotoReceiver('CC1AD845')).toBe(false);
  });

  it('signs the selected photo, fallback, and both adjacent photos', () => {
    const media = (id: string) => ({
      key: id,
      url: `https://immich.example/api/assets/${id}/thumbnail?size=preview`,
      fallback: { key: `${id}-thumb`, url: `https://immich.example/api/assets/${id}/thumbnail?size=thumbnail` },
    });
    const message = createPhotoMessage(
      { ...media('current'), neighbors: { previous: media('previous'), next: media('next') } },
      'secret key',
      42,
    );

    expect(PHOTO_NAMESPACE).toBe('urn:x-cast:app.immich.photos');
    expect(message.type).toBe('SHOW_PHOTO');
    expect(message.requestId).toBe(42);
    for (const item of [message.current, message.previous, message.next]) {
      expect(item?.url).toContain('sessionKey=secret+key');
      expect(item?.fallbackUrl).toContain('sessionKey=secret+key');
    }
    expect(message.previous?.url).toContain('/previous/');
    expect(message.next?.url).toContain('/next/');
  });
});

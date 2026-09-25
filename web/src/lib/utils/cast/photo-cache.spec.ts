import { describe, expect, it } from 'vitest';
import { PhotoCache } from '../../../../static/cast/photo-cache.js';

describe('receiver photo cache', () => {
  it('deduplicates loads and retains decoded images', async () => {
    const requests: string[] = [];
    const cache = new PhotoCache(3, () => {
      class FakeImage {
        src = '';
        decode() {
          requests.push(this.src);
          return Promise.resolve();
        }
      }
      return new FakeImage() as unknown as HTMLImageElement;
    });

    const [first, second] = await Promise.all([cache.load('/photo-a'), cache.load('/photo-a')]);
    const third = await cache.load('/photo-a');

    expect(first).toBe(second);
    expect(third).toBe(first);
    expect(requests).toEqual(['/photo-a']);
  });

  it('keeps both adjacent photos ready for navigation', async () => {
    const requests: string[] = [];
    const cache = new PhotoCache(3, () => {
      class FakeImage {
        src = '';
        decode() {
          requests.push(this.src);
          return Promise.resolve();
        }
      }
      return new FakeImage() as unknown as HTMLImageElement;
    });

    await cache.load('/current');
    await Promise.all([cache.load('/previous'), cache.load('/next')]);
    await cache.load('/next');
    await cache.load('/current');
    await cache.load('/previous');

    expect(requests).toEqual(['/current', '/previous', '/next']);
  });

  it('evicts the oldest photo when the cache is full', async () => {
    const requests: string[] = [];
    const cache = new PhotoCache(2, () => {
      class FakeImage {
        src = '';
        decode() {
          requests.push(this.src);
          return Promise.resolve();
        }
      }
      return new FakeImage() as unknown as HTMLImageElement;
    });

    await cache.load('/photo-a');
    await cache.load('/photo-b');
    await cache.load('/photo-c');
    await cache.load('/photo-a');

    expect(requests).toEqual(['/photo-a', '/photo-b', '/photo-c', '/photo-a']);
  });

  it('uses a thumbnail fallback when the preview fails', async () => {
    const requests: string[] = [];
    const cache = new PhotoCache(3, () => {
      class FakeImage {
        src = '';
        decode() {
          requests.push(this.src);
          return this.src === '/preview' ? Promise.reject(new Error('not found')) : Promise.resolve();
        }
      }
      return new FakeImage() as unknown as HTMLImageElement;
    });

    const image = await cache.load('/preview', '/thumbnail');

    expect(image.src).toBe('/thumbnail');
    expect(requests).toEqual(['/preview', '/thumbnail']);
  });
});

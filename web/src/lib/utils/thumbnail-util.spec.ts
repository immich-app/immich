import { getAltText } from '$lib/utils/thumbnail-util';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
import { init, register, waitLocale } from 'svelte-i18n';

describe('getAltText', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$lib/i18n/en.json'));
    await waitLocale('en-US');
  });

  it('defaults to the description, if available', () => {
    const asset = {
      exifInfo: { description: 'description' },
    } as AssetResponseDto;

    getAltText.subscribe((fn) => {
      expect(fn(asset)).toEqual('description');
    });
  });

  it('includes the city and country', () => {
    const asset = {
      exifInfo: { city: 'city', country: 'country' },
      localDateTime: '2024-01-01T12:00:00.000Z',
    } as AssetResponseDto;

    getAltText.subscribe((fn) => {
      expect(fn(asset)).toEqual('Image taken in city, country on January 1, 2024');
    });
  });

  // convert the people tests into an it.each
  it.each([
    [[{ name: 'person' }], 'Image taken with person on January 1, 2024'],
    [[{ name: 'person1' }, { name: 'person2' }], 'Image taken with person1 and person2 on January 1, 2024'],
    [
      [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }],
      'Image taken with person1, person2, and person3 on January 1, 2024',
    ],
    [
      [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }, { name: 'person4' }],
      'Image taken with person1, person2, and 2 others on January 1, 2024',
    ],
  ])('includes people, correctly formatted', (people, expected) => {
    const asset = {
      localDateTime: '2024-01-01T12:00:00.000Z',
      people,
    } as AssetResponseDto;

    getAltText.subscribe((fn) => {
      expect(fn(asset)).toEqual(expected);
    });
  });

  it('handles videos, location, people, and date', () => {
    const asset = {
      exifInfo: { city: 'city', country: 'country' },
      localDateTime: '2024-01-01T12:00:00.000Z',
      people: [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }, { name: 'person4' }, { name: 'person5' }],
      type: AssetTypeEnum.Video,
    } as AssetResponseDto;

    getAltText.subscribe((fn) => {
      expect(fn(asset)).toEqual('Video taken in city, country with person1, person2, and 3 others on January 1, 2024');
    });
  });
});

import { getFormatterSync } from '$lib/utils/i18n';
import { getAltText } from '$lib/utils/thumbnail-util';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';

vi.mock('$lib/utils/i18n', () => ({
  getFormatterSync: vi.fn(),
}));

describe('getAltText', () => {
  it('defaults to the description, if available', () => {
    const asset = {
      exifInfo: { description: 'description' },
    } as AssetResponseDto;
    expect(getAltText(asset)).toEqual('description');
  });

  it('includes the city and country', () => {
    const asset = {
      exifInfo: { city: 'city', country: 'country' },
      localDateTime: '2024-01-01T12:00:00.000Z',
    } as AssetResponseDto;
    const mockFormatter = getMockFormatter();

    const result = getAltText(asset);

    expect(mockFormatter).toHaveBeenCalledTimes(3);
    expect(mockFormatter).toHaveBeenNthCalledWith(1, 'image_taken', {
      values: { isVideo: false },
    });
    expect(mockFormatter).toHaveBeenNthCalledWith(2, 'image_alt_text_place', {
      values: { city: 'city', country: 'country' },
    });
    expect(mockFormatter).toHaveBeenNthCalledWith(3, 'image_alt_text_date', {
      values: { date: 'January 1, 2024' },
    });
    expect(result).toEqual('formatted formatted formatted');
  });

  // convert the people tests into an it.each
  it.each([
    [
      [{ name: 'person' }],
      {
        count: 1,
        person1: 'person',
        person2: undefined,
        person3: undefined,
        others: 0,
      },
    ],
    [
      [{ name: 'person1' }, { name: 'person2' }],
      {
        count: 2,
        person1: 'person1',
        person2: 'person2',
        person3: undefined,
        others: 0,
      },
    ],
    [
      [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }],
      {
        count: 3,
        person1: 'person1',
        person2: 'person2',
        person3: 'person3',
        others: 0,
      },
    ],
    [
      [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }, { name: 'person4' }],
      {
        count: 4,
        person1: 'person1',
        person2: 'person2',
        person3: 'person3',
        others: 2,
      },
    ],
  ])('includes people, correctly formatted', (people, expected) => {
    const asset = {
      localDateTime: '2024-01-01T12:00:00.000Z',
      people,
    } as AssetResponseDto;
    const mockFormatter = getMockFormatter();

    const result = getAltText(asset);

    expect(mockFormatter).toHaveBeenCalledTimes(3);
    expect(mockFormatter).toHaveBeenNthCalledWith(1, 'image_taken', {
      values: { isVideo: false },
    });
    expect(mockFormatter).toHaveBeenNthCalledWith(2, 'image_alt_text_people', {
      values: expected,
    });
    expect(mockFormatter).toHaveBeenNthCalledWith(3, 'image_alt_text_date', {
      values: { date: 'January 1, 2024' },
    });
    expect(result).toBe('formatted formatted formatted');
  });

  it('handles videos, location, people, and date', () => {
    const asset = {
      exifInfo: { city: 'city', country: 'country' },
      localDateTime: '2024-01-01T12:00:00.000Z',
      people: [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }, { name: 'person4' }, { name: 'person5' }],
      type: AssetTypeEnum.Video,
    } as AssetResponseDto;
    const mockFormatter = getMockFormatter();

    const result = getAltText(asset);

    expect(mockFormatter).toHaveBeenCalledTimes(4);
    expect(mockFormatter).toHaveBeenNthCalledWith(1, 'image_taken', {
      values: { isVideo: true },
    });
    expect(mockFormatter).toHaveBeenNthCalledWith(2, 'image_alt_text_place', {
      values: { city: 'city', country: 'country' },
    });
    expect(mockFormatter).toHaveBeenNthCalledWith(3, 'image_alt_text_people', {
      values: {
        count: 5,
        person1: 'person1',
        person2: 'person2',
        person3: 'person3',
        others: 3,
      },
    });
    expect(mockFormatter).toHaveBeenNthCalledWith(4, 'image_alt_text_date', {
      values: { date: 'January 1, 2024' },
    });
    expect(result).toBe('formatted formatted formatted formatted');
  });
});

function getMockFormatter() {
  const getter = vi.mocked(getFormatterSync);
  const mockFormatter = vi.fn().mockReturnValue('formatted');
  getter.mockReturnValue(mockFormatter);
  return mockFormatter;
}

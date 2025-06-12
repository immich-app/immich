import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { getAltText } from '$lib/utils/thumbnail-util';
import { AssetVisibility } from '@immich/sdk';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import { init, register, waitLocale } from 'svelte-i18n';

interface Person {
  name: string;
}

const onePerson: Person[] = [{ name: 'person' }];
const twoPeople: Person[] = [{ name: 'person1' }, { name: 'person2' }];
const threePeople: Person[] = [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }];
const fourPeople: Person[] = [{ name: 'person1' }, { name: 'person2' }, { name: 'person3' }, { name: 'person4' }];

describe('getAltText', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it.each`
    isVideo  | city         | country      | people         | expected
    ${false} | ${undefined} | ${'country'} | ${undefined}   | ${'Image taken on January 1, 2024'}
    ${true}  | ${'city'}    | ${undefined} | ${undefined}   | ${'Video taken on January 1, 2024'}
    ${false} | ${'city'}    | ${'country'} | ${[]}          | ${'Image taken in city, country on January 1, 2024'}
    ${true}  | ${'city'}    | ${'country'} | ${[]}          | ${'Video taken in city, country on January 1, 2024'}
    ${false} | ${undefined} | ${undefined} | ${onePerson}   | ${'Image taken with person on January 1, 2024'}
    ${false} | ${undefined} | ${undefined} | ${twoPeople}   | ${'Image taken with person1 and person2 on January 1, 2024'}
    ${false} | ${undefined} | ${undefined} | ${threePeople} | ${'Image taken with person1, person2, and person3 on January 1, 2024'}
    ${false} | ${undefined} | ${undefined} | ${fourPeople}  | ${'Image taken with person1, person2, and 2 others on January 1, 2024'}
    ${false} | ${'city'}    | ${'country'} | ${onePerson}   | ${'Image taken in city, country with person on January 1, 2024'}
    ${false} | ${'city'}    | ${'country'} | ${twoPeople}   | ${'Image taken in city, country with person1 and person2 on January 1, 2024'}
    ${false} | ${'city'}    | ${'country'} | ${threePeople} | ${'Image taken in city, country with person1, person2, and person3 on January 1, 2024'}
    ${false} | ${'city'}    | ${'country'} | ${fourPeople}  | ${'Image taken in city, country with person1, person2, and 2 others on January 1, 2024'}
    ${true}  | ${undefined} | ${undefined} | ${onePerson}   | ${'Video taken with person on January 1, 2024'}
    ${true}  | ${undefined} | ${undefined} | ${twoPeople}   | ${'Video taken with person1 and person2 on January 1, 2024'}
    ${true}  | ${undefined} | ${undefined} | ${threePeople} | ${'Video taken with person1, person2, and person3 on January 1, 2024'}
    ${true}  | ${undefined} | ${undefined} | ${fourPeople}  | ${'Video taken with person1, person2, and 2 others on January 1, 2024'}
    ${true}  | ${'city'}    | ${'country'} | ${onePerson}   | ${'Video taken in city, country with person on January 1, 2024'}
    ${true}  | ${'city'}    | ${'country'} | ${twoPeople}   | ${'Video taken in city, country with person1 and person2 on January 1, 2024'}
    ${true}  | ${'city'}    | ${'country'} | ${threePeople} | ${'Video taken in city, country with person1, person2, and person3 on January 1, 2024'}
    ${true}  | ${'city'}    | ${'country'} | ${fourPeople}  | ${'Video taken in city, country with person1, person2, and 2 others on January 1, 2024'}
  `(
    'generates correctly formatted alt text when isVideo=$isVideo, city=$city, country=$country, people=$people.length',
    ({
      isVideo,
      city,
      country,
      people,
      expected,
    }: {
      isVideo: boolean;
      city?: string;
      country?: string;
      people?: Person[];
      expected: string;
    }) => {
      const testDate = new Date('2024-01-01T12:00:00.000Z');
      const asset: TimelineAsset = timelineAssetFactory.build({
        id: 'test-id',
        ownerId: 'test-owner',
        ratio: 1,
        thumbhash: null,
        fileCreatedAt: {
          year: testDate.getUTCFullYear(),
          month: testDate.getUTCMonth() + 1, // Note: getMonth() is 0-based
          day: testDate.getUTCDate(),
          hour: testDate.getUTCHours(),
          minute: testDate.getUTCMinutes(),
          second: testDate.getUTCSeconds(),
          millisecond: testDate.getUTCMilliseconds(),
        },
        localDateTime: {
          year: testDate.getUTCFullYear(),
          month: testDate.getUTCMonth() + 1, // Note: getMonth() is 0-based
          day: testDate.getUTCDate(),
          hour: testDate.getUTCHours(),
          minute: testDate.getUTCMinutes(),
          second: testDate.getUTCSeconds(),
          millisecond: testDate.getUTCMilliseconds(),
        },

        visibility: AssetVisibility.Timeline,
        isFavorite: false,
        isTrashed: false,
        isVideo,
        isImage: !isVideo,
        stack: null,
        duration: null,
        projectionType: null,
        livePhotoVideoId: null,
        city: city ?? null,
        country: country ?? null,
        people: people?.map((person: Person) => person.name) ?? [],
      });

      getAltText.subscribe((fn) => {
        expect(fn(asset)).toEqual(expected);
      });
    },
  );
});

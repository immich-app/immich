import { MemoryType, type MemoryResponseDto } from '@immich/sdk';
import type { MessageFormatter } from 'svelte-i18n';
import { buildMemoryIndexItems, filterMemoryIndexItems, groupMemoryIndexItems } from './memory-index-utils';

const translate = ((key: string, payload?: { values?: Record<string, number> }) => {
  if (key === 'years_ago') {
    return `${payload?.values?.years} years ago`;
  }

  if (key === 'memory_type_on_this_day') {
    return 'On this day';
  }

  return key;
}) as MessageFormatter;

const memory = (overrides: Partial<MemoryResponseDto> = {}): MemoryResponseDto => ({
  assets: [{ id: `${overrides.id ?? 'memory'}-asset` }] as MemoryResponseDto['assets'],
  createdAt: '2026-01-01T00:00:00.000Z',
  data: {},
  id: 'memory-id',
  isSaved: false,
  memoryAt: '2020-01-01T00:00:00.000Z',
  ownerId: 'owner-id',
  type: MemoryType.Rule,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const options = {
  locale: 'en-US',
  now: new Date('2026-04-23T00:00:00.000Z'),
  translate,
};

describe('memory index utilities', () => {
  it('filters out memories with no assets', () => {
    const items = buildMemoryIndexItems(
      [memory({ id: 'empty-memory', assets: [] }), memory({ id: 'memory-with-assets', title: 'Has assets' })],
      options,
    );

    expect(items.map((item) => item.memory.id)).toEqual(['memory-with-assets']);
  });

  it('sorts by shown or generated date, newest first', () => {
    const items = buildMemoryIndexItems(
      [
        memory({ id: 'created-newer', createdAt: '2026-03-01T00:00:00.000Z' }),
        memory({ id: 'shown-newest', createdAt: '2026-01-01T00:00:00.000Z', showAt: '2026-04-01T00:00:00.000Z' }),
        memory({ id: 'oldest', createdAt: '2026-02-01T00:00:00.000Z' }),
      ],
      options,
    );

    expect(items.map((item) => item.memory.id)).toEqual(['shown-newest', 'created-newer', 'oldest']);
  });

  it('groups memories by shown or generated month', () => {
    const items = buildMemoryIndexItems(
      [
        memory({ id: 'april-shown', createdAt: '2026-01-01T00:00:00.000Z', showAt: '2026-04-10T00:00:00.000Z' }),
        memory({ id: 'march-created', createdAt: '2026-03-15T00:00:00.000Z' }),
        memory({ id: 'april-created', createdAt: '2026-04-01T00:00:00.000Z' }),
      ],
      options,
    );
    const groups = groupMemoryIndexItems(items, { locale: options.locale });

    expect(groups).toMatchObject([
      {
        key: '2026-04',
        label: 'April 2026',
        items: [{ memory: { id: 'april-shown' } }, { memory: { id: 'april-created' } }],
      },
      {
        key: '2026-03',
        label: 'March 2026',
        items: [{ memory: { id: 'march-created' } }],
      },
    ]);
  });

  it('groups and labels UTC day-boundary dates without local timezone shifting', () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    try {
      const items = buildMemoryIndexItems(
        [memory({ id: 'april-utc', createdAt: '2026-01-01T00:00:00.000Z', showAt: '2026-04-01T00:00:00.000Z' })],
        options,
      );
      const groups = groupMemoryIndexItems(items, { locale: options.locale });

      expect(items[0]).toMatchObject({
        dateLabel: 'Apr 1, 2026',
        monthKey: '2026-04',
      });
      expect(groups).toMatchObject([{ key: '2026-04', label: 'April 2026' }]);
    } finally {
      process.env.TZ = previousTimezone;
    }
  });

  it('returns only saved memories for the saved filter', () => {
    const items = buildMemoryIndexItems(
      [memory({ id: 'saved', isSaved: true }), memory({ id: 'unsaved', isSaved: false })],
      options,
    );

    expect(filterMemoryIndexItems(items, { filter: 'saved' }).map((item) => item.memory.id)).toEqual(['saved']);
  });

  it('matches search by title, subtitle, memory year, date label, type label, and raw type enum', () => {
    const memories = [
      memory({
        id: 'title-match',
        title: 'Summer archive',
        subtitle: '',
        memoryAt: '2019-06-01T00:00:00.000Z',
        showAt: '2026-02-01T00:00:00.000Z',
      }),
      memory({
        id: 'subtitle-match',
        title: 'Road trip',
        subtitle: 'Coastal weekend',
        memoryAt: '2018-07-01T00:00:00.000Z',
        showAt: '2026-02-02T00:00:00.000Z',
      }),
      memory({
        id: 'year-match',
        title: 'Family day',
        subtitle: '',
        memoryAt: '2017-08-01T00:00:00.000Z',
        showAt: '2026-02-03T00:00:00.000Z',
      }),
      memory({
        id: 'date-match',
        title: 'Quiet afternoon',
        subtitle: '',
        memoryAt: '2016-09-01T00:00:00.000Z',
        showAt: '2026-02-04T00:00:00.000Z',
      }),
      memory({
        id: 'type-match',
        title: undefined,
        subtitle: '',
        data: { year: 2015 },
        memoryAt: '2015-10-01T00:00:00.000Z',
        showAt: '2026-02-05T00:00:00.000Z',
        type: MemoryType.OnThisDay,
      }),
    ];

    const items = buildMemoryIndexItems(memories, options);

    expect(filterMemoryIndexItems(items, { query: 'summer' }).map((item) => item.memory.id)).toEqual(['title-match']);
    expect(filterMemoryIndexItems(items, { query: 'coastal' }).map((item) => item.memory.id)).toEqual([
      'subtitle-match',
    ]);
    expect(filterMemoryIndexItems(items, { query: '2017' }).map((item) => item.memory.id)).toEqual(['year-match']);
    expect(filterMemoryIndexItems(items, { query: 'Feb 4, 2026' }).map((item) => item.memory.id)).toEqual([
      'date-match',
    ]);
    expect(filterMemoryIndexItems(items, { query: 'On this day' }).map((item) => item.memory.id)).toEqual([
      'type-match',
    ]);
    expect(filterMemoryIndexItems(items, { query: MemoryType.OnThisDay }).map((item) => item.memory.id)).toEqual([
      'type-match',
    ]);
  });
});

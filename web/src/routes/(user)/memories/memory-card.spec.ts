import { getAssetMediaUrl } from '$lib/utils';
import { AssetMediaSize, MemoryType, type MemoryResponseDto } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import MemoryCard from './memory-card.svelte';
import type { MemoryIndexItem } from './memory-index-utils';

vi.mock('$lib/utils', () => ({
  getAssetMediaUrl: vi.fn(({ id }) => `/thumbnail/${id}`),
}));

const asset = (id: string) => ({ id }) as MemoryResponseDto['assets'][number];

const memory = (overrides: Partial<MemoryResponseDto> = {}): MemoryResponseDto => ({
  assets: [asset('asset-1'), asset('asset-2'), asset('asset-3')],
  createdAt: '2026-04-01T00:00:00.000Z',
  data: {},
  id: 'memory-id',
  isSaved: true,
  memoryAt: '2019-04-01T00:00:00.000Z',
  ownerId: 'owner-id',
  type: MemoryType.OnThisDay,
  updatedAt: '2026-04-01T00:00:00.000Z',
  ...overrides,
});

const item = (overrides: Partial<MemoryIndexItem> = {}): MemoryIndexItem => {
  const shownAt = new Date('2026-04-23T00:00:00.000Z');

  return {
    memory: memory(),
    title: 'Seven years ago',
    subtitle: 'Spring archive',
    shownAt,
    monthKey: '2026-04',
    dateLabel: 'Apr 23, 2026',
    typeLabel: 'On this day',
    searchText: '',
    ...overrides,
  };
};

describe('MemoryCard component', () => {
  beforeAll(async () => {
    register('en-US', () => import('$i18n/en.json'));
    await init({ fallbackLocale: 'en-US' });
    await waitLocale('en-US');
  });

  it('renders memory metadata, saved state, thumbnails, and history link', () => {
    const { container } = render(MemoryCard, { item: item() });

    expect(screen.getByText('Seven years ago')).toBeInTheDocument();
    expect(screen.getByText('Spring archive')).toBeInTheDocument();
    expect(screen.getByText('Apr 23, 2026')).toBeInTheDocument();
    expect(screen.getByText('3 photos')).toBeInTheDocument();
    expect(screen.getByTestId('memory-saved-indicator')).toBeInTheDocument();

    const link = screen.getByTestId('memory-card');
    expect(link).toHaveAttribute('href', '/memory?id=asset-1&source=history');
    expect(link).toHaveAttribute('aria-label', 'Seven years ago');

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(3);
    expect([...images].map((image) => image.getAttribute('src'))).toEqual([
      '/thumbnail/asset-1',
      '/thumbnail/asset-2',
      '/thumbnail/asset-3',
    ]);
    expect(getAssetMediaUrl).toHaveBeenCalledWith({ id: 'asset-1', size: AssetMediaSize.Thumbnail });
    expect(getAssetMediaUrl).toHaveBeenCalledWith({ id: 'asset-2', size: AssetMediaSize.Thumbnail });
    expect(getAssetMediaUrl).toHaveBeenCalledWith({ id: 'asset-3', size: AssetMediaSize.Thumbnail });
  });
});

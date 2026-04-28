import TestWrapper from '$lib/components/TestWrapper.svelte';
import { MemoryType, searchMemories, type MemoryResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import MemoriesPage from './+page.svelte';

const { searchMemoriesMock, handleErrorMock } = vi.hoisted(() => ({
  searchMemoriesMock: vi.fn(),
  handleErrorMock: vi.fn(),
}));

vi.mock('@immich/sdk', async () => {
  const actual = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...actual,
    searchMemories: searchMemoriesMock,
  };
});

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/utils/handle-error', () => ({ handleError: handleErrorMock }));

const asset = (id: string) => ({ id }) as MemoryResponseDto['assets'][number];

const memory = (overrides: Partial<MemoryResponseDto> = {}): MemoryResponseDto => ({
  assets: [asset(`${overrides.id ?? 'memory'}-asset`)],
  createdAt: '2026-01-01T00:00:00.000Z',
  data: {},
  id: 'memory-id',
  isSaved: false,
  memoryAt: '2020-01-01T00:00:00.000Z',
  ownerId: 'owner-id',
  showAt: '2026-01-01T00:00:00.000Z',
  title: 'Memory',
  type: MemoryType.OnThisDay,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const renderPage = () => {
  const props = {
    data: {
      meta: { title: 'Memories' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof MemoriesPage; componentProps: typeof props }>, {
    component: MemoriesPage,
    componentProps: props,
  });
};

describe('Memories page', () => {
  beforeAll(async () => {
    register('en-US', () => import('$i18n/en.json'));
    await init({ fallbackLocale: 'en-US', initialLocale: 'en-US' });
    await waitLocale('en-US');
  });

  beforeEach(() => {
    vi.resetAllMocks();
    searchMemoriesMock.mockResolvedValue([]);
  });

  it('loads retained memories and renders them in month groups', async () => {
    searchMemoriesMock.mockResolvedValue([
      memory({
        id: 'april-memory',
        title: 'April picnic',
        showAt: '2026-04-12T00:00:00.000Z',
      }),
      memory({
        id: 'march-memory',
        title: 'March snow',
        showAt: '2026-03-03T00:00:00.000Z',
      }),
    ]);

    renderPage();

    expect(searchMemories).toHaveBeenCalledWith({});
    expect(await screen.findByText('April 2026')).toBeInTheDocument();
    expect(screen.getByText('March 2026')).toBeInTheDocument();
    expect(screen.getByText('April picnic')).toBeInTheDocument();
    expect(screen.getByText('March snow')).toBeInTheDocument();
    expect(screen.getAllByTestId('memory-card')).toHaveLength(2);
  });

  it('filters to saved memories', async () => {
    searchMemoriesMock.mockResolvedValue([
      memory({ id: 'saved-memory', title: 'Saved spring', isSaved: true }),
      memory({ id: 'unsaved-memory', title: 'Unsaved winter', isSaved: false }),
    ]);

    renderPage();
    expect(await screen.findByText('Saved spring')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Saved'));

    expect(screen.getByText('Saved spring')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved winter')).not.toBeInTheDocument();
  });

  it('filters memories by title search', async () => {
    searchMemoriesMock.mockResolvedValue([
      memory({ id: 'mountain-memory', title: 'Mountain lake' }),
      memory({ id: 'city-memory', title: 'City lights' }),
    ]);

    renderPage();
    expect(await screen.findByText('Mountain lake')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Search memories'), 'city');

    expect(screen.getByText('City lights')).toBeInTheDocument();
    expect(screen.queryByText('Mountain lake')).not.toBeInTheDocument();
  });

  it('renders the empty state for an empty response', async () => {
    searchMemoriesMock.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('No memories are available yet.')).toBeInTheDocument();
  });

  it('renders the error state when memories fail to load', async () => {
    const error = new Error('failed to load memories');
    searchMemoriesMock.mockRejectedValue(error);

    renderPage();

    expect(await screen.findByText('Unable to load memories')).toBeInTheDocument();
    await waitFor(() => expect(handleErrorMock).toHaveBeenCalledWith(error, 'Unable to load memories'));
  });
});

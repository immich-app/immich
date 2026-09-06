import { getAlbumInfo } from '@immich/sdk';
import '@testing-library/jest-dom';
import { cleanup, screen } from '@testing-library/svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import WorkflowStepCard from './WorkflowStepCard.svelte';

/**
 * The album name shown on a step comes from a cache that lives at module scope, so it outlives the
 * component and every navigation inside the app. Nothing invalidated it, which meant a renamed
 * album kept its old name on the step for the life of the page — and re-picking the same album
 * showed the stale name too, because the picker's fresh value went back through the same cache.
 * Only a full reload fixed it, which is exactly what clearing module state does.
 */

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  getAlbumInfo: vi.fn(),
  getTagById: vi.fn(),
}));

vi.mock('$lib/managers/plugin-manager.svelte', () => ({
  pluginManager: {
    getMethod: () => ({
      uiHints: [],
      schema: { properties: { albumId: { uiHint: { type: 'AlbumId' } } } },
    }),
    getMethodLabel: () => 'Add to album',
  },
}));

/**
 * A fresh id per test. The cache under test is module scoped by design, so it survives between
 * tests in one file — sharing an id would let one test's rename decide what the next one starts
 * from, and the failure would look like the bug rather than like the fixture.
 */
let nextAlbumId = 0;
const freshAlbumId = () => `album-${++nextAlbumId}`;

const renderCard = (albumId: string) =>
  renderWithTooltips(WorkflowStepCard, {
    step: { id: 'step-1', method: 'immich:add-to-album', config: { albumId } },
    index: 0,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onInsertBefore: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDragEnd: vi.fn(),
    onDragStart: vi.fn(),
  } as never);

describe('WorkflowStepCard album name', () => {
  beforeEach(() => {
    vi.mocked(getAlbumInfo).mockImplementation((({ id }: { id: string }) =>
      Promise.resolve({ id, albumName: 'Latest Uploads' })) as never);
  });

  it('shows the renamed album when the step is looked at again', async () => {
    // The reported flow: open the workflow, rename the album elsewhere, come back to the workflow.
    const albumId = freshAlbumId();
    renderCard(albumId);
    expect(await screen.findByText(/Latest Uploads/)).toBeInTheDocument();

    eventManager.emit('AlbumUpdate', { id: albumId, albumName: 'Recent Uploads' } as never);

    cleanup();
    renderCard(albumId);

    expect(await screen.findByText(/Recent Uploads/)).toBeInTheDocument();
    expect(screen.queryByText(/Latest Uploads/)).not.toBeInTheDocument();
  });

  it('does not refetch the album it was told about', async () => {
    // The event carries the new album, so the refresh costs no request. Fetching again here would
    // work too, but it would make every rename anywhere re-request every album on the page.
    const albumId = freshAlbumId();
    renderCard(albumId);
    await screen.findByText(/Latest Uploads/);
    vi.mocked(getAlbumInfo).mockClear();

    eventManager.emit('AlbumUpdate', { id: albumId, albumName: 'Recent Uploads' } as never);
    cleanup();
    renderCard(albumId);
    await screen.findByText(/Recent Uploads/);

    expect(getAlbumInfo).not.toHaveBeenCalled();
  });

  it('fetches again after the album is deleted from under it', async () => {
    // Deletion drops the entry rather than rewriting it: there is no name to hold, and whatever
    // replaces that id must be read from the server rather than from a stale entry.
    const albumId = freshAlbumId();
    renderCard(albumId);
    await screen.findByText(/Latest Uploads/);
    vi.mocked(getAlbumInfo).mockClear();
    vi.mocked(getAlbumInfo).mockResolvedValue({ id: albumId, albumName: 'Rebuilt' } as never);

    eventManager.emit('AlbumDelete', { id: albumId } as never);
    cleanup();
    renderCard(albumId);

    expect(await screen.findByText(/Rebuilt/)).toBeInTheDocument();
    expect(getAlbumInfo).toHaveBeenCalled();
  });

  it('leaves an album it has never shown out of the cache', async () => {
    // Only ids already on screen are refreshed. Caching every album that is ever updated would
    // grow the map with entries no step refers to.
    const albumId = freshAlbumId();
    renderCard(albumId);
    await screen.findByText(/Latest Uploads/);
    vi.mocked(getAlbumInfo).mockClear();

    eventManager.emit('AlbumUpdate', { id: 'never-shown', albumName: 'Untouched' } as never);
    cleanup();
    renderCard(albumId);
    await screen.findByText(/Latest Uploads/);

    // The displayed album was not re-requested, and the unrelated one was not cached either.
    expect(getAlbumInfo).not.toHaveBeenCalled();
  });
});

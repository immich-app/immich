import '@testing-library/jest-dom';
import { waitFor, type RenderResult } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { renderWithTooltips } from '$tests/helpers';
import { albumFactory } from '@test-data/factories/album-factory';
import AlbumThumbnail from '../AlbumThumbnail.svelte';

describe('AlbumThumbnail component', () => {
  let sut: RenderResult<typeof AlbumThumbnail>;

  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the album name and the description separately', async () => {
    const album = albumFactory.build({
      albumName: 'Holiday 2024',
      description: 'A very long description that should never be mistaken for the album name',
    });
    sdkMock.getAlbumInfo.mockResolvedValue(album);

    sut = renderWithTooltips(AlbumThumbnail, { albumId: album.id, onDelete: vi.fn() });

    await waitFor(() => expect(sut.getByTestId('album-name')).toBeInTheDocument());

    const nameElements = sut.getAllByTestId('album-name');
    expect(nameElements).toHaveLength(1);
    expect(nameElements[0]).toHaveTextContent('Holiday 2024');
    expect(nameElements[0]).not.toHaveTextContent(album.description);

    const descriptionElement = sut.getByTestId('album-description');
    expect(descriptionElement).toHaveTextContent(album.description);
    expect(descriptionElement).toHaveClass('line-clamp-2');
  });

  it('does not render a description element when the album has no description', async () => {
    const album = albumFactory.build({ albumName: 'Holiday 2024', description: '' });
    sdkMock.getAlbumInfo.mockResolvedValue(album);

    sut = renderWithTooltips(AlbumThumbnail, { albumId: album.id, onDelete: vi.fn() });

    await waitFor(() => expect(sut.getByTestId('album-name')).toHaveTextContent('Holiday 2024'));
    expect(sut.queryByTestId('album-description')).not.toBeInTheDocument();
  });
});

import '@testing-library/jest-dom';
import { render, waitFor, type RenderResult } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { albumFactory } from '@test-data/factories/album-factory';
import AlbumCard from '../AlbumCard.svelte';

describe('AlbumCard component', () => {
  let sut: RenderResult<typeof AlbumCard>;

  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it.each([
    {
      album: albumFactory.build({ albumThumbnailAssetId: null, shared: false, assetCount: 0 }),
      count: 0,
      shared: false,
    },
    {
      album: albumFactory.build({ albumThumbnailAssetId: null, shared: true, assetCount: 0 }),
      count: 0,
      shared: true,
    },
    {
      album: albumFactory.build({ albumThumbnailAssetId: null, shared: false, assetCount: 5 }),
      count: 5,
      shared: false,
    },
    {
      album: albumFactory.build({ albumThumbnailAssetId: null, shared: true, assetCount: 2 }),
      count: 2,
      shared: true,
    },
  ])('shows album data without thumbnail with count $count - shared: $shared', async ({ album, count, shared }) => {
    sut = render(AlbumCard, { album, showItemCount: true });

    const albumImgElement = sut.getByTestId('album-image');
    const albumNameElement = sut.getByTestId('album-name');
    const albumDetailsElement = sut.getByTestId('album-details');
    const detailsText = `${count} items` + (shared ? ' . Shared' : '');

    expect(albumImgElement).toHaveAttribute('src');
    expect(albumImgElement).toHaveAttribute('alt', album.albumName);

    await waitFor(() => expect(albumImgElement).toHaveAttribute('src'));

    expect(albumImgElement).toHaveAttribute('alt', album.albumName);
    expect(sdkMock.viewAsset).not.toHaveBeenCalled();

    expect(albumNameElement).toHaveTextContent(album.albumName);
    expect(albumDetailsElement).toHaveTextContent(new RegExp(detailsText));
  });

  it('shows album data', () => {
    const album = albumFactory.build({
      shared: false,
      albumName: 'some album name',
    });
    sut = render(AlbumCard, { album, showItemCount: true });

    const albumImgElement = sut.getByTestId('album-image');
    const albumNameElement = sut.getByTestId('album-name');
    const albumDetailsElement = sut.getByTestId('album-details');

    expect(albumImgElement).toHaveAttribute('alt', album.albumName);
    expect(albumImgElement).toHaveAttribute('src');

    expect(albumNameElement).toHaveTextContent('some album name');
    expect(albumDetailsElement).toHaveTextContent(`${album.assetCount} item`);
  });

  it('hides context menu when "contextMenuItems" is undefined', () => {
    const album = Object.freeze(albumFactory.build({ albumThumbnailAssetId: null }));
    sut = render(AlbumCard, { album });

    const contextButtonParent = sut.queryByTestId('context-button-parent');
    expect(contextButtonParent).not.toBeInTheDocument();
  });
});

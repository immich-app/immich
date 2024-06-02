import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { albumFactory } from '@test-data';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor, type RenderResult } from '@testing-library/svelte';
import AlbumCard from '../album-card.svelte';

const onShowContextMenu = vi.fn();

describe('AlbumCard component', () => {
  let sut: RenderResult<AlbumCard>;

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
    expect(albumDetailsElement).toHaveTextContent('0 item');
  });

  it('hides context menu when "onShowContextMenu" is undefined', () => {
    const album = Object.freeze(albumFactory.build({ albumThumbnailAssetId: null }));
    sut = render(AlbumCard, { album });

    const contextButtonParent = sut.queryByTestId('context-button-parent');
    expect(contextButtonParent).not.toBeInTheDocument();
  });

  describe('with rendered component - no thumbnail', () => {
    const album = Object.freeze(albumFactory.build({ albumThumbnailAssetId: null }));

    beforeEach(async () => {
      sut = render(AlbumCard, { album, onShowContextMenu });

      const albumImgElement = sut.getByTestId('album-image');
      await waitFor(() => expect(albumImgElement).toHaveAttribute('src'));
    });

    it('dispatches "onShowContextMenu" event on context menu click with mouse coordinates', async () => {
      const contextMenuButton = sut.getByTestId('context-button-parent').children[0];
      expect(contextMenuButton).toBeDefined();

      // Mock getBoundingClientRect to return a bounding rectangle that will result in the expected position
      contextMenuButton.getBoundingClientRect = () => ({
        x: 123,
        y: 456,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      });

      await fireEvent(
        contextMenuButton,
        new MouseEvent('click', {
          clientX: 123,
          clientY: 456,
        }),
      );
      expect(onShowContextMenu).toHaveBeenCalledTimes(1);
      expect(onShowContextMenu).toHaveBeenCalledWith(expect.objectContaining({ x: 123, y: 456 }));
    });
  });
});

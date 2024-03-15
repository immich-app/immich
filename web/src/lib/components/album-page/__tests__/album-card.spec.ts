import { createObjectURLMock } from '$lib/__mocks__/jsdom-url.mock';
import sdk, { ThumbnailFormat } from '@immich/sdk';
import { albumFactory } from '@test-data';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor, type RenderResult } from '@testing-library/svelte';
import type { MockedObject } from 'vitest';
import AlbumCard from '../album-card.svelte';

vi.mock('@immich/sdk', async (originalImport) => {
  const module = await originalImport<typeof import('@immich/sdk')>();
  const mock = { ...module, getAssetThumbnail: vi.fn() };
  return { ...mock, default: mock };
});

const sdkMock: MockedObject<typeof sdk> = sdk as MockedObject<typeof sdk>;
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
    sut = render(AlbumCard, { album });

    const albumImgElement = sut.getByTestId('album-image');
    const albumNameElement = sut.getByTestId('album-name');
    const albumDetailsElement = sut.getByTestId('album-details');
    const detailsText = `${count} items` + (shared ? ' . Shared' : '');

    expect(albumImgElement).toHaveAttribute('src');
    expect(albumImgElement).toHaveAttribute('alt', album.albumName);

    await waitFor(() => expect(albumImgElement).toHaveAttribute('src'));

    expect(albumImgElement).toHaveAttribute('alt', album.albumName);
    expect(sdkMock.getAssetThumbnail).not.toHaveBeenCalled();

    expect(albumNameElement).toHaveTextContent(album.albumName);
    expect(albumDetailsElement).toHaveTextContent(new RegExp(detailsText));
  });

  it('shows album data and loads the thumbnail image when available', async () => {
    const thumbnailFile = new File([new Blob()], 'fileThumbnail');
    const thumbnailUrl = 'blob:thumbnailUrlOne';
    sdkMock.getAssetThumbnail.mockResolvedValue(thumbnailFile);
    createObjectURLMock.mockReturnValueOnce(thumbnailUrl);

    const album = albumFactory.build({
      albumThumbnailAssetId: 'thumbnailIdOne',
      shared: false,
      albumName: 'some album name',
    });
    sut = render(AlbumCard, { album });

    const albumImgElement = sut.getByTestId('album-image');
    const albumNameElement = sut.getByTestId('album-name');
    const albumDetailsElement = sut.getByTestId('album-details');
    expect(albumImgElement).toHaveAttribute('alt', album.albumName);

    await waitFor(() => expect(albumImgElement).toHaveAttribute('src', thumbnailUrl));

    expect(albumImgElement).toHaveAttribute('alt', album.albumName);
    expect(sdkMock.getAssetThumbnail).toHaveBeenCalledTimes(1);
    expect(sdkMock.getAssetThumbnail).toHaveBeenCalledWith({
      id: 'thumbnailIdOne',
      format: ThumbnailFormat.Jpeg,
    });
    expect(createObjectURLMock).toHaveBeenCalledWith(thumbnailFile);

    expect(albumNameElement).toHaveTextContent('some album name');
    expect(albumDetailsElement).toHaveTextContent('0 items');
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

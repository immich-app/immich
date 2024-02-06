import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { api, type CreateAlbumDto } from '@api';
import { albumFactory } from '@test-data';
import { get } from 'svelte/store';
import { useAlbums } from '../albums.bloc';
import type { MockedObject } from 'vitest';

vi.mock('@api');

const apiMock: MockedObject<typeof api> = api as MockedObject<typeof api>;

describe('Albums BLoC', () => {
  let sut: ReturnType<typeof useAlbums>;
  const _albums = albumFactory.buildList(5);

  beforeEach(() => {
    sut = useAlbums({ albums: [..._albums] });
  });

  afterEach(() => {
    const notifications = get(notificationController.notificationList);

    for (const notification of notifications) {
      notificationController.removeNotificationById(notification.id);
    }
  });

  it('inits with provided albums', () => {
    const albums = get(sut.albums);
    expect(albums.length).toEqual(5);
    expect(albums).toEqual(_albums);
  });

  it('loads albums from the server', async () => {
    // TODO: this method currently deletes albums with no assets and albumName === '' which might not be the best approach
    const loadedAlbums = [..._albums, albumFactory.build({ id: 'new_loaded_uuid' })];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //  @ts-ignore
    // TODO: there needs to be a more robust mock of the @api to avoid mockResolvedValueOnce ts error
    //       this is a workaround to make ts checks not fail but the test will pass as expected
    apiMock.albumApi.getAllAlbums.mockResolvedValueOnce({
      data: loadedAlbums,
      config: {},
      headers: {},
      status: 200,
      statusText: '',
    });

    await sut.loadAlbums();
    const albums = get(sut.albums);

    expect(apiMock.albumApi.getAllAlbums).toHaveBeenCalledTimes(1);
    expect(albums).toEqual(loadedAlbums);
  });

  it('shows error message when it fails loading albums', async () => {
    // TODO: implement APIProblem interface in the server
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //  @ts-ignore
    // TODO: there needs to be a more robust mock of the @api to avoid mockResolvedValueOnce ts error
    //       this is a workaround to make ts checks not fail but the test will pass as expected
    apiMock.albumApi.getAllAlbums.mockRejectedValueOnce({});

    expect(get(notificationController.notificationList)).toHaveLength(0);
    await sut.loadAlbums();
    const albums = get(sut.albums);
    const notifications = get(notificationController.notificationList);

    expect(apiMock.albumApi.getAllAlbums).toHaveBeenCalledTimes(2);
    expect(albums).toEqual(_albums);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toEqual(NotificationType.Error);
  });

  it('creates a new album', async () => {
    const payload: CreateAlbumDto = {
      albumName: '',
    };

    const returnedAlbum = albumFactory.build();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //  @ts-ignore
    // TODO: there needs to be a more robust mock of the @api to avoid mockResolvedValueOnce ts error
    //       this is a workaround to make ts checks not fail but the test will pass as expected
    apiMock.albumApi.createAlbum.mockResolvedValueOnce({
      data: returnedAlbum,
      config: {},
      headers: {},
      status: 200,
      statusText: '',
    });

    const newAlbum = await sut.createAlbum();

    expect(apiMock.albumApi.createAlbum).toHaveBeenCalledTimes(1);
    expect(apiMock.albumApi.createAlbum).toHaveBeenCalledWith({ createAlbumDto: payload });
    expect(newAlbum).toEqual(returnedAlbum);
  });

  it('shows error message when it fails creating an album', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //  @ts-ignore
    // TODO: there needs to be a more robust mock of the @api to avoid mockResolvedValueOnce ts error
    //       this is a workaround to make ts checks not fail but the test will pass as expected
    apiMock.albumApi.createAlbum.mockRejectedValueOnce({});

    const newAlbum = await sut.createAlbum();
    const notifications = get(notificationController.notificationList);

    expect(apiMock.albumApi.createAlbum).toHaveBeenCalledTimes(2);
    expect(newAlbum).not.toBeDefined();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toEqual(NotificationType.Error);
  });

  it('selects an album and deletes it', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //  @ts-ignore
    // TODO: there needs to be a more robust mock of the @api to avoid mockResolvedValueOnce ts error
    //       this is a workaround to make ts checks not fail but the test will pass as expected
    apiMock.albumApi.deleteAlbum.mockResolvedValueOnce({
      data: undefined,
      config: {},
      headers: {},
      status: 200,
      statusText: '',
    });

    const albumToDelete = get(sut.albums)[2]; // delete third album
    const albumToDeleteId = albumToDelete.id;
    const contextMenuCoords = { x: 100, y: 150 };

    expect(get(sut.isShowContextMenu)).toBe(false);
    sut.showAlbumContextMenu(contextMenuCoords, albumToDelete);
    expect(get(sut.contextMenuPosition)).toEqual(contextMenuCoords);
    expect(get(sut.isShowContextMenu)).toBe(true);
    expect(get(sut.contextMenuTargetAlbum)).toEqual(albumToDelete);

    await sut.deleteAlbum(albumToDelete);
    const updatedAlbums = get(sut.albums);

    expect(apiMock.albumApi.deleteAlbum).toHaveBeenCalledTimes(1);
    expect(apiMock.albumApi.deleteAlbum).toHaveBeenCalledWith({ id: albumToDeleteId });
    expect(updatedAlbums).toHaveLength(4);
    expect(updatedAlbums).not.toContain(albumToDelete);
  });

  it('closes album context menu, deselecting album', () => {
    const albumToDelete = get(sut.albums)[2]; // delete third album
    sut.showAlbumContextMenu({ x: 100, y: 150 }, albumToDelete);

    expect(get(sut.isShowContextMenu)).toBe(true);

    sut.closeAlbumContextMenu();
    expect(get(sut.isShowContextMenu)).toBe(false);
  });
});

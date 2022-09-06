import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { useAlbums } from '../albums-bloc';
import { api, CreateAlbumDto } from '@api';
import { albumFactory } from '@test-data';
import { get } from 'svelte/store';

jest.mock('@api');

const apiMock: jest.MockedObject<typeof api> = api as jest.MockedObject<typeof api>;

describe('Albums BLoC', () => {
	let sut: ReturnType<typeof useAlbums>;
	const _albums = albumFactory.buildList(5);

	beforeEach(() => {
		sut = useAlbums({ albums: [..._albums] });
	});

	it('inits with provided albums', () => {
		const albums = get(sut.albums);
		expect(albums.length).toEqual(5);
		expect(albums).toEqual(_albums);
	});

	it('loads albums from the server', async () => {
		// TODO: this method currently deletes albums with no assets and albumName === 'Untitled' which might not be the best approach
		const loadedAlbums = [..._albums, albumFactory.build({ id: 'new_loaded_uuid' })];

		apiMock.albumApi.getAllAlbums.mockResolvedValueOnce({
			data: loadedAlbums,
			config: {},
			headers: {},
			status: 200,
			statusText: ''
		});

		await sut.loadAlbums();
		const albums = get(sut.albums);

		expect(apiMock.albumApi.getAllAlbums).toHaveBeenCalledTimes(1);
		expect(albums).toEqual(loadedAlbums);
	});

	it('creates a new album', async () => {
		// TODO: we probably shouldn't hardcode the album name "untitled" here and let the user input the album name before creating it
		const payload: CreateAlbumDto = {
			albumName: 'Untitled'
		};

		const returnedAlbum = albumFactory.build();

		apiMock.albumApi.createAlbum.mockResolvedValueOnce({
			data: returnedAlbum,
			config: {},
			headers: {},
			status: 200,
			statusText: ''
		});

		const newAlbum = await sut.createAlbum();

		expect(apiMock.albumApi.createAlbum).toHaveBeenCalledTimes(1);
		expect(apiMock.albumApi.createAlbum).toHaveBeenCalledWith(payload);
		expect(newAlbum).toEqual(returnedAlbum);
	});

	it('selects an album and deletes it', async () => {
		apiMock.albumApi.deleteAlbum.mockResolvedValueOnce({
			data: undefined,
			config: {},
			headers: {},
			status: 200,
			statusText: ''
		});

		jest.spyOn(global, 'confirm').mockReturnValueOnce(true);

		const albumToDelete = get(sut.albums)[2]; // delete third album
		const albumToDeleteId = albumToDelete.id;
		const contextMenuCoords = { x: 100, y: 150 };

		expect(get(sut.isShowContextMenu)).toBe(false);
		sut.showAlbumContextMenu(contextMenuCoords, albumToDelete);
		expect(get(sut.contextMenuPosition)).toEqual(contextMenuCoords);
		expect(get(sut.isShowContextMenu)).toBe(true);

		await sut.deleteSelectedContextAlbum();
		const updatedAlbums = get(sut.albums);

		expect(apiMock.albumApi.deleteAlbum).toHaveBeenCalledTimes(1);
		expect(apiMock.albumApi.deleteAlbum).toHaveBeenCalledWith(albumToDeleteId);
		expect(updatedAlbums).toHaveLength(4);
		expect(updatedAlbums).not.toContain(albumToDelete);
		expect(get(sut.isShowContextMenu)).toBe(false);
	});

	it('prevents deleting an album when rejecting confirm dialog', async () => {
		const albumToDelete = get(sut.albums)[2]; // delete third album

		jest.spyOn(global, 'confirm').mockReturnValueOnce(false);

		sut.showAlbumContextMenu({ x: 100, y: 150 }, albumToDelete);
		await sut.deleteSelectedContextAlbum();

		expect(apiMock.albumApi.deleteAlbum).not.toHaveBeenCalled();
	});

	it('prevents deleting an album when not previously selected', async () => {
		jest.spyOn(global, 'confirm').mockReturnValueOnce(true);

		await sut.deleteSelectedContextAlbum();

		expect(apiMock.albumApi.deleteAlbum).not.toHaveBeenCalled();
	});
});

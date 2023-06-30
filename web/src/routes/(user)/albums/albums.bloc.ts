import type { OnShowContextMenuDetail } from '$lib/components/album-page/album-card';
import {
	notificationController,
	NotificationType
} from '$lib/components/shared-components/notification/notification';
import { AlbumResponseDto, api } from '@api';
import { derived, get, writable } from 'svelte/store';

type AlbumsProps = { albums: AlbumResponseDto[] };

export const useAlbums = (props: AlbumsProps) => {
	const albums = writable([...props.albums]);
	const contextMenuPosition = writable<OnShowContextMenuDetail>({ x: 0, y: 0 });
	const contextMenuTargetAlbum = writable<AlbumResponseDto | undefined>();
	const isShowContextMenu = derived(contextMenuTargetAlbum, ($selectedAlbum) => !!$selectedAlbum);

	async function loadAlbums(): Promise<void> {
		try {
			const { data } = await api.albumApi.getAllAlbums();
			albums.set(data);

			// Delete album that has no photos and is named 'Untitled'
			for (const album of data) {
				if (album.albumName === 'Untitled' && album.assetCount === 0) {
					setTimeout(async () => {
						await deleteAlbum(album);
					}, 500);
				}
			}
		} catch {
			notificationController.show({
				message: 'Error loading albums',
				type: NotificationType.Error
			});
		}
	}

	async function createAlbum(): Promise<AlbumResponseDto | undefined> {
		try {
			const { data: newAlbum } = await api.albumApi.createAlbum({
				createAlbumDto: {
					albumName: 'Untitled'
				}
			});

			return newAlbum;
		} catch {
			notificationController.show({
				message: 'Error creating album',
				type: NotificationType.Error
			});
		}
	}

	async function deleteAlbum(albumToDelete: AlbumResponseDto): Promise<void> {
		await api.albumApi.deleteAlbum({ id: albumToDelete.id });
		albums.set(
			get(albums).filter(({ id }) => {
				return id !== albumToDelete.id;
			})
		);
	}

	async function showAlbumContextMenu(
		contextMenuDetail: OnShowContextMenuDetail,
		album: AlbumResponseDto
	): Promise<void> {
		contextMenuTargetAlbum.set(album);

		contextMenuPosition.set({
			x: contextMenuDetail.x,
			y: contextMenuDetail.y
		});
	}

	function closeAlbumContextMenu() {
		contextMenuTargetAlbum.set(undefined);
	}

	return {
		albums,
		isShowContextMenu,
		contextMenuPosition,
		contextMenuTargetAlbum,
		loadAlbums,
		createAlbum,
		deleteAlbum,
		showAlbumContextMenu,
		closeAlbumContextMenu
	};
};

import {
	notificationController,
	NotificationType
} from '$lib/components/shared-components/notification/notification';
import { AssetResponseDto, api } from '@api';
import { writable } from 'svelte/store';

export const useFavorites = () => {
	const favorites = writable<AssetResponseDto[]>([]);

	const loadFavorites = async (): Promise<void> => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets(true);
			favorites.set(assets);
		} catch {
			notificationController.show({
				message: 'Error loading favorites',
				type: NotificationType.Error
			});
		}
	}

	return {
		favorites,
		loadFavorites
	};
};

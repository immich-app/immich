import {
	notificationController,
	NotificationType
} from '$lib/components/shared-components/notification/notification';
import { AssetResponseDto, api } from '@api';
import { writable } from 'svelte/store';

type AssestsProps = { favorites: AssetResponseDto[] };

export const useFavorites = (props: AssestsProps) => {
	const favorites = writable([...props.favorites]);

	async function loadFavorites(): Promise<void> {
		try {
			const { data } = await api.assetApi.getAllAssets();
			favorites.set(
				data.filter((value) => {
					return value.isFavorite;
				})
			);
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

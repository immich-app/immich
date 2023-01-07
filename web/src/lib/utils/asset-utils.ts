import { api, AddAssetsResponseDto } from '@api';
import {
	notificationController,
	NotificationType
} from '$lib/components/shared-components/notification/notification';

export const addAssetsToAlbum = async (
	albumId: string,
	assetIds: Array<string>,
	key: string | undefined = undefined
): Promise<AddAssetsResponseDto> =>
	api.albumApi
		.addAssetsToAlbum(albumId, { assetIds }, { params: { key: key } })
		.then(({ data: dto }) => {
			if (dto.successfullyAdded > 0) {
				// This might be 0 if the user tries to add an asset that is already in the album
				notificationController.show({
					message: `Added ${dto.successfullyAdded} to ${dto.album?.albumName}`,
					type: NotificationType.Info
				});
			}

			return dto;
		});

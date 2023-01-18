import { AxiosError, AxiosPromise } from 'axios';
import { api } from './api';
import { UserResponseDto } from './open-api';

const _basePath = '/api';

export function getFileUrl(assetId: string, isThumb?: boolean, isWeb?: boolean, key?: string) {
	const urlObj = new URL(`${window.location.origin}${_basePath}/asset/file/${assetId}`);

	if (isThumb !== undefined && isThumb !== null)
		urlObj.searchParams.append('isThumb', `${isThumb}`);
	if (isWeb !== undefined && isWeb !== null) urlObj.searchParams.append('isWeb', `${isWeb}`);

	if (key !== undefined && key !== null) urlObj.searchParams.append('key', key);
	return urlObj.href;
}

export type ApiError = AxiosError<{ message: string }>;

export const oauth = {
	isCallback: (location: Location) => {
		const search = location.search;
		return search.includes('code=') || search.includes('error=');
	},
	isAutoLaunchDisabled: (location: Location) => {
		const values = ['autoLaunch=0', 'password=1', 'password=true'];
		for (const value of values) {
			if (location.search.includes(value)) {
				return true;
			}
		}
		return false;
	},
	getConfig: (location: Location) => {
		const redirectUri = location.href.split('?')[0];
		console.log(`OAuth Redirect URI: ${redirectUri}`);
		return api.oauthApi.generateConfig({ redirectUri });
	},
	login: (location: Location) => {
		return api.oauthApi.callback({ url: location.href });
	},
	link: (location: Location): AxiosPromise<UserResponseDto> => {
		return api.oauthApi.link({ url: location.href });
	},
	unlink: () => {
		return api.oauthApi.unlink();
	}
};

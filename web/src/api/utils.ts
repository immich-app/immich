import { AxiosError, AxiosPromise } from 'axios';
import { api } from './api';
import { UserResponseDto } from './open-api';

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

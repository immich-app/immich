import type { AxiosError, AxiosPromise } from 'axios';
import {
  notificationController,
  NotificationType,
} from '../lib/components/shared-components/notification/notification';
import { handleError } from '../lib/utils/handle-error';
import { api } from './api';
import type { UserResponseDto } from './open-api';

export type ApiError = AxiosError<{ message: string }>;

export const copyToClipboard = async (secret: string) => {
  try {
    await navigator.clipboard.writeText(secret);
    notificationController.show({ message: 'Copied to clipboard!', type: NotificationType.Info });
  } catch (error) {
    handleError(error, 'Cannot copy to clipboard, make sure you are accessing the page through https');
  }
};

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
    return api.oauthApi.generateConfig({ oAuthConfigDto: { redirectUri } });
  },
  login: (location: Location) => {
    return api.oauthApi.callback({ oAuthCallbackDto: { url: location.href } });
  },
  link: (location: Location): AxiosPromise<UserResponseDto> => {
    return api.oauthApi.link({ oAuthCallbackDto: { url: location.href } });
  },
  unlink: () => {
    return api.oauthApi.unlink();
  },
};

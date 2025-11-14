import { page } from '$app/state';
import { AppRoute } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { notificationManager } from '$lib/stores/notification-manager.svelte';
import { createEventEmitter } from '$lib/utils/eventemitter';
import { type AssetResponseDto, type NotificationDto, type ServerVersionResponseDto } from '@immich/sdk';
import { io, type Socket } from 'socket.io-client';
import { get, writable } from 'svelte/store';
import { user } from './user.store';

export interface ReleaseEvent {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}

interface AppRestartEvent {
  isMaintenanceMode: boolean;
}

export interface Events {
  on_upload_success: (asset: AssetResponseDto) => void;
  on_user_delete: (id: string) => void;
  on_asset_delete: (assetId: string) => void;
  on_asset_trash: (assetIds: string[]) => void;
  on_asset_update: (asset: AssetResponseDto) => void;
  on_asset_hidden: (assetId: string) => void;
  on_asset_restore: (assetIds: string[]) => void;
  on_asset_stack_update: (assetIds: string[]) => void;
  on_person_thumbnail: (personId: string) => void;
  on_server_version: (serverVersion: ServerVersionResponseDto) => void;
  on_config_update: () => void;
  on_new_release: (newRelease: ReleaseEvent) => void;
  on_session_delete: (sessionId: string) => void;
  on_notification: (notification: NotificationDto) => void;

  AppRestartV1: (event: AppRestartEvent) => void;
}

const websocket: Socket<Events> = io({
  path: '/api/socket.io',
  transports: ['websocket'],
  reconnection: true,
  forceNew: true,
  autoConnect: false,
});

export const websocketStore = {
  connected: writable<boolean>(false),
  serverVersion: writable<ServerVersionResponseDto>(),
  release: writable<ReleaseEvent>(),
  serverRestarting: writable<undefined | AppRestartEvent>(),
};

export const websocketEvents = createEventEmitter(websocket);

websocket
  .on('connect', () => websocketStore.connected.set(true))
  .on('disconnect', () => websocketStore.connected.set(false))
  .on('on_server_version', (serverVersion) => websocketStore.serverVersion.set(serverVersion))
  .on('AppRestartV1', (mode) => websocketStore.serverRestarting.set(mode))
  .on('on_new_release', (releaseVersion) => websocketStore.release.set(releaseVersion))
  .on('on_session_delete', () => authManager.logout())
  .on('on_notification', () => notificationManager.refresh())
  .on('connect_error', (e) => console.log('Websocket Connect Error', e));

export const openWebsocketConnection = () => {
  try {
    if (get(user) || page.url.pathname.startsWith(AppRoute.MAINTENANCE)) {
      websocket.connect();
    }
  } catch (error) {
    console.log('Cannot connect to websocket', error);
  }
};

export const closeWebsocketConnection = () => {
  websocket.disconnect();
};

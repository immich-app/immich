import type { AssetResponseDto, ServerVersionResponseDto } from '@api';
import { Socket, io } from 'socket.io-client';
import { writable } from 'svelte/store';
import { loadConfig } from './server-config.store';
import { getAuthUser } from '$lib/utils/auth';

export interface ReleaseEvent {
  isAvailable: boolean;
  checkedAt: Date;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}

export const websocketStore = {
  onUploadSuccess: writable<AssetResponseDto>(),
  onAssetDelete: writable<string>(),
  onAssetTrash: writable<string[]>(),
  onAssetUpdate: writable<AssetResponseDto>(),
  onPersonThumbnail: writable<string>(),
  serverVersion: writable<ServerVersionResponseDto>(),
  connected: writable<boolean>(false),
  onRelease: writable<ReleaseEvent>(),
};

let websocket: Socket | null = null;

export const openWebsocketConnection = async () => {
  try {
    if (websocket) {
      return;
    }

    const user = await getAuthUser();
    if (!user) {
      return;
    }

    websocket = io('', {
      path: '/api/socket.io',
      transports: ['websocket'],
      reconnection: true,
      forceNew: true,
      autoConnect: true,
    });

    websocket
      .on('connect', () => websocketStore.connected.set(true))
      .on('disconnect', () => websocketStore.connected.set(false))
      // .on('on_upload_success', (data) => websocketStore.onUploadSuccess.set(data))
      .on('on_asset_delete', (data) => websocketStore.onAssetDelete.set(data))
      .on('on_asset_trash', (data) => websocketStore.onAssetTrash.set(data))
      .on('on_asset_update', (data) => websocketStore.onAssetUpdate.set(data))
      .on('on_person_thumbnail', (data) => websocketStore.onPersonThumbnail.set(data))
      .on('on_server_version', (data) => websocketStore.serverVersion.set(data))
      .on('on_config_update', () => loadConfig())
      .on('on_new_release', (data) => websocketStore.onRelease.set(data))
      .on('error', (e) => console.log('Websocket Error', e));
  } catch (error) {
    console.log('Cannot connect to websocket', error);
  }
};

export const closeWebsocketConnection = () => {
  if (websocket) {
    websocket.close();
  }
  websocket = null;
};

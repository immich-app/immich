import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { createEventEmitter } from '$lib/utils/eventemitter';
import type { ServerVersionResponseDto } from '@server/sdk';
import { io, type Socket } from 'socket.io-client';
import { get, writable } from 'svelte/store';
import { user } from './user.store';

export interface Events {
  on_user_delete: (id: string) => void;
  on_server_version: (serverVersion: ServerVersionResponseDto) => void;
  on_config_update: () => void;
  on_session_delete: (sessionId: string) => void;
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
};

export const websocketEvents = createEventEmitter(websocket);

websocket
  .on('connect', () => websocketStore.connected.set(true))
  .on('disconnect', () => websocketStore.connected.set(false))
  .on('on_server_version', (serverVersion) => websocketStore.serverVersion.set(serverVersion))
  .on('on_session_delete', () => authManager.logout())
  .on('on_user_delete', (id) => eventManager.emit('UserAdminDeleted', { id }))
  .on('connect_error', (e) => console.log('Websocket Connect Error', e));

export const openWebsocketConnection = () => {
  try {
    if (get(user)) {
      websocket.connect();
    }
  } catch (error) {
    console.log('Cannot connect to websocket', error);
  }
};

export const closeWebsocketConnection = () => {
  websocket.disconnect();
};

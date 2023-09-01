import { io, Socket } from 'socket.io-client';
import type { AssetResponseDto } from '../../api/open-api';
import { writable } from 'svelte/store';

let websocket: Socket;

function initWebsocketStore() {
  const onUploadSuccess = writable<AssetResponseDto>();
  const onAssetDelete = writable<string>();

  return {
    onUploadSuccess,
    onAssetDelete,
  };
}

export const websocketStore = initWebsocketStore();

export const openWebsocketConnection = () => {
  try {
    websocket = io('', {
      path: '/api/socket.io',
      transports: ['polling'],
      reconnection: true,
      forceNew: true,
      autoConnect: true,
    });

    listenToEvent(websocket);
  } catch (e) {
    console.log('Cannot connect to websocket ', e);
  }
};

const listenToEvent = async (socket: Socket) => {
  socket.on('on_upload_success', (data) => websocketStore.onUploadSuccess.set(JSON.parse(data) as AssetResponseDto));
  socket.on('on_asset_delete', (data) => websocketStore.onAssetDelete.set(JSON.parse(data) as string));
  socket.on('error', (e) => console.log('Websocket Error', e));
};

export const closeWebsocketConnection = () => {
  websocket?.close();
};

import { Socket, io } from 'socket.io-client';
import { serverEndpoint } from '../constants';
import type { ImmichAsset } from '../models/immich-asset';
import { assets } from './assets';

export const openWebsocketConnection = (accessToken: string) => {
	const websocket = io(serverEndpoint, {
		transports: ['polling'],
		reconnection: true,
		forceNew: true,
		autoConnect: true,
		extraHeaders: {
			Authorization: 'Bearer ' + accessToken,
		},
	});

	listenToEvent(websocket);
};

const listenToEvent = (socket: Socket) => {
	socket.on('on_upload_success', (data) => {
		const newUploadedAsset: ImmichAsset = JSON.parse(data);

		assets.update((assets) => [...assets, newUploadedAsset]);
	});

	socket.on('error', (e) => {
		console.log('Websocket Error', e);
	});
};

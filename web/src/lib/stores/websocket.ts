import { Socket, io } from 'socket.io-client';
import { writable } from 'svelte/store';

let websocket: Socket;

export const openWebsocketConnection = () => {
	try {
		websocket = io('', {
			path: '/api/socket.io',
			transports: ['polling'],
			reconnection: true,
			forceNew: true,
			autoConnect: true
		});

		listenToEvent(websocket);
	} catch (e) {
		console.log('Cannot connect to websocket ', e);
	}
};

const listenToEvent = (socket: Socket) => {
	socket.on('on_upload_success', (data) => {});

	socket.on('error', (e) => {
		console.log('Websocket Error', e);
	});
};

export const closeWebsocketConnection = () => {
	websocket?.close();
};

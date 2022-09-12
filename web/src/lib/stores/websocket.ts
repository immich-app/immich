import { Socket, io } from 'socket.io-client';

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
	//TODO: if we are not using this, we should probably remove it?
	socket.on('on_upload_success', () => undefined);

	socket.on('error', (e) => {
		console.log('Websocket Error', e);
	});
};

export const closeWebsocketConnection = () => {
	websocket?.close();
};

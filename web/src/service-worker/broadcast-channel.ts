import { cancelRequest, handleRequest } from './request';

export const installBroadcastChannelListener = () => {
  const broadcast = new BroadcastChannel('immich');
  // eslint-disable-next-line  unicorn/prefer-add-event-listener
  broadcast.onmessage = (event) => {
    if (!event.data) {
      return;
    }
    const urlString = event.data.url;
    const url = new URL(urlString, event.origin);
    if (event.data.type === 'cancel') {
      cancelRequest(url);
    } else if (event.data.type === 'preload') {
      handleRequest(url);
    }
  };
};

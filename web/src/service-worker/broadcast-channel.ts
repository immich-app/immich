import { cancelLoad, getCachedOrFetch } from './cache';

export const installBroadcastChannelListener = () => {
  const broadcast = new BroadcastChannel('immich');
  // eslint-disable-next-line  unicorn/prefer-add-event-listener
  broadcast.onmessage = (event) => {
    if (!event.data) {
      return;
    }
    const urlstring = event.data.url;
    const url = new URL(urlstring, event.origin);
    if (event.data.type === 'cancel') {
      cancelLoad(url.toString());
    } else if (event.data.type === 'preload') {
      getCachedOrFetch(url);
    }
  };
};

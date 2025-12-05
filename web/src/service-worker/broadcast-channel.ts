import { handleCancel, handleIsUrlCached, handlePreload } from './request';

export const broadcast = new BroadcastChannel('immich');

export const installBroadcastChannelListener = () => {
  // eslint-disable-next-line  unicorn/prefer-add-event-listener
  broadcast.onmessage = (event) => {
    if (!event.data) {
      return;
    }

    const url = new URL(event.data.url, event.origin);

    switch (event.data.type) {
      case 'preload': {
        handlePreload(url);
        break;
      }

      case 'cancel': {
        handleCancel(url);
        break;
      }

      case 'isImageUrlCached': {
        void handleIsUrlCached(url);
        break;
      }
    }
  };
};

export const replyIsImageUrlCached = (url: string, isImageUrlCached: boolean) => {
  broadcast.postMessage({ type: 'isImageUrlCachedReply', url, isImageUrlCached });
};

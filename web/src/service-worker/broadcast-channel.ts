import { handleCancel, handlePreload } from './request';

export const installBroadcastChannelListener = () => {
  const broadcast = new BroadcastChannel('immich');
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
    }
  };
};

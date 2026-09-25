/* global cast */
// `cast` is provided by the Cast Application Framework receiver script in receiver.html.
import { PhotoCache } from './photo-cache.js';

const NAMESPACE = 'urn:x-cast:app.immich.photos';
const photos = document.querySelector('#photos');
const player = document.querySelector('#player');
const video = document.querySelector('#video-player');
const brand = document.querySelector('#brand');
const spinner = document.querySelector('#spinner');
const cache = new PhotoCache();
const preparedFrames = new Map();
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
let selection = 0;
let spinnerTimeout;

// Play videos on our own media element. Progressive streams keep their data
// buffered on the element, so a looping video wraps from the last frame back
// to the first without tearing down the pipeline and rebuffering.
playerManager.setMediaElement(video);

video.addEventListener('waiting', () => {
  if (!video.hidden) {
    spinner.hidden = false;
  }
});
video.addEventListener('playing', () => hideSpinner());

const mediaUrl = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const url = new URL(value, location.href);
  return url.origin === location.origin && url.pathname.startsWith('/api/assets/') ? url.href : null;
};

const photo = (value) => {
  const url = mediaUrl(value?.url);
  if (!url) {
    return null;
  }
  return { url, fallbackUrl: mediaUrl(value.fallbackUrl) };
};

const reply = (senderId, type, requestId, details = {}) => {
  context.sendCustomMessage(NAMESPACE, senderId, { type, requestId, ...details });
};

const createPhotoFrame = (image) => {
  const frame = document.createElement('div');
  frame.className = 'photo-frame';

  // drawImage prepares both the decoded image and its screen-sized pixels.
  // Keeping the canvas backing store in memory avoids decoding/scaling again
  // when the user selects an already-prepared adjacent photo.
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context && image.naturalWidth > 0 && image.naturalHeight > 0) {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const requestedWidth = Math.max(1, Math.round(window.innerWidth * pixelRatio));
    const requestedHeight = Math.max(1, Math.round(window.innerHeight * pixelRatio));
    const scale = Math.min(1, Math.sqrt((2560 * 1440) / (requestedWidth * requestedHeight)));
    canvas.width = Math.max(1, Math.round(requestedWidth * scale));
    canvas.height = Math.max(1, Math.round(requestedHeight * scale));
    const fit = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = Math.round(image.naturalWidth * fit);
    const height = Math.round(image.naturalHeight * fit);
    try {
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        Math.round((canvas.width - width) / 2),
        Math.round((canvas.height - height) / 2),
        width,
        height,
      );
      frame.append(canvas);
      return frame;
    } catch {
      // Fall back to the decoded image if the receiver cannot allocate a canvas.
    }
  }
  frame.append(image);
  return frame;
};

const preparePhoto = (item) => {
  const cached = preparedFrames.get(item.url);
  if (cached) {
    preparedFrames.delete(item.url);
    preparedFrames.set(item.url, cached);
    return cached;
  }

  const prepared = cache.load(item.url, item.fallbackUrl).then(createPhotoFrame);
  preparedFrames.set(item.url, prepared);
  while (preparedFrames.size > 3) {
    preparedFrames.delete(preparedFrames.keys().next().value);
  }
  void prepared.catch(() => {
    if (preparedFrames.get(item.url) === prepared) {
      preparedFrames.delete(item.url);
    }
  });
  return prepared;
};

const preload = (value) => {
  const adjacent = photo(value);
  if (adjacent) {
    void preparePhoto(adjacent).catch(() => {});
  }
};

const hideSpinner = () => {
  clearTimeout(spinnerTimeout);
  spinner.hidden = true;
};

const showLoading = (thisSelection) => {
  hideSpinner();
  if (!player.hidden || !video.hidden) {
    playerManager.stop();
    player.hidden = true;
    video.hidden = true;
  }
  const keepPhotoVisible = !photos.hidden && photos.firstElementChild;
  brand.hidden = Boolean(keepPhotoVisible);
  if (keepPhotoVisible) {
    spinnerTimeout = setTimeout(() => {
      if (thisSelection === selection) {
        spinner.hidden = false;
      }
    }, 180);
  }
};

context.addCustomMessageListener(NAMESPACE, (event) => {
  const message = event.data;
  if (message?.type !== 'SHOW_PHOTO') {
    return;
  }

  const current = photo(message.current);
  if (!current) {
    reply(event.senderId, 'PHOTO_ERROR', message.requestId);
    return;
  }

  const thisSelection = ++selection;
  showLoading(thisSelection);
  void preparePhoto(current)
    .then((frame) => {
      if (thisSelection !== selection) {
        return;
      }
      hideSpinner();
      if (photos.firstElementChild !== frame) {
        photos.replaceChildren(frame);
      }
      player.hidden = true;
      photos.hidden = false;
      brand.hidden = true;
      preload(message.previous);
      preload(message.next);
    })
    .catch(() => {
      if (thisSelection !== selection) {
        return;
      }
      hideSpinner();
      brand.hidden = !photos.hidden && Boolean(photos.firstElementChild);
      reply(event.senderId, 'PHOTO_ERROR', message.requestId);
    });
});

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, (request) => {
  selection++;
  hideSpinner();
  photos.hidden = true;
  brand.hidden = true;
  const isVideo = request.media?.contentType?.startsWith('video/') ?? false;
  if (!isVideo) {
    video.loop = false;
    video.hidden = true;
    player.hidden = false;
    return request;
  }
  // With a repeating sender the element loops natively, so no `ended` event
  // ever reaches the queue and playback wraps without reloading the stream.
  video.loop = request.repeatMode === cast.framework.messages.RepeatMode.REPEAT_SINGLE;
  player.hidden = true;
  video.hidden = false;
  return request;
});

context.start({ disableIdleTimeout: true });

import { PUBLIC_IMMICH_CAST_APPLICATION_ID } from '$env/static/public';
import { createApiKey, deleteApiKey, getApiKeys, Permission, type ApiKeyCreateResponseDto } from '@immich/sdk';
import 'chromecast-caf-sender';

import { get, writable } from 'svelte/store';

const CAST_API_KEY_NAME = 'cast';

const FRAMEWORK_LINK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

enum SESSION_DISCOVERY_CAUSE {
  LOAD_MEDIA,
  ACTIVE_SESSION,
}

class CastPlayer {
  static instance: CastPlayer | null = null;
  isInitialized = writable(false);

  session: chrome.cast.Session | null = null;

  isConnected = writable(false);

  castState = writable(cast.framework.CastState.NO_DEVICES_AVAILABLE);
  playerState = writable(chrome.cast.media.PlayerState.IDLE);
  mediaInfo = writable<chrome.cast.media.MediaInfo | undefined>(undefined);
  currentTime = writable<number | null>(null);
  duration = writable<number | null>(null);

  castPlayerState = writable(chrome.cast.media.PlayerState.IDLE);

  currentMedia: chrome.cast.media.Media | null = null;

  receiverFriendlyName = writable<string | null>(null);

  remotePlayer = writable(new cast.framework.RemotePlayer());

  currentUrl: string | null = null;

  private constructor() {}

  static getInstance(): CastPlayer {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new CastPlayer();
    this.instance.initialize();

    return this.instance;
  }

  private initialize() {
    console.debug('Initializing cast player');
    const applicationId = PUBLIC_IMMICH_CAST_APPLICATION_ID;

    const castContext = cast.framework.CastContext.getInstance();

    castContext.setOptions({
      receiverApplicationId: applicationId,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    castContext.addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      this.onSessionStateChanged.bind(this),
    );

    castContext.addEventListener(
      cast.framework.CastContextEventType.CAST_STATE_CHANGED,
      this.onCastStateChanged.bind(this),
    );

    const remotePlayerController = new cast.framework.RemotePlayerController(get(this.remotePlayer));
    remotePlayerController.addEventListener(
      cast.framework.RemotePlayerEventType.ANY_CHANGE,
      this.onRemotePlayerChange.bind(this),
    );

    this.isInitialized.set(true);
  }

  private apiKey: ApiKeyCreateResponseDto | null = null;

  private onSessionStateChanged(event: cast.framework.SessionStateEventData) {
    switch (event.sessionState) {
      case cast.framework.SessionState.SESSION_ENDED: {
        this.session = null;
        break;
      }
      case cast.framework.SessionState.SESSION_RESUMED:
      case cast.framework.SessionState.SESSION_STARTED: {
        this.session = event.session.getSessionObj();
        break;
      }
    }
  }

  private onCastStateChanged(event: cast.framework.CastStateEventData) {
    this.castState.set(event.castState);
    this.isConnected.set(event.castState === cast.framework.CastState.CONNECTED);
  }

  private onRemotePlayerChange(event: cast.framework.RemotePlayerChangedEvent) {
    switch (event.field) {
      case 'isConnected': {
        this.isConnected.set(event.value);
        break;
      }
      case 'mediaInfo': {
        this.mediaInfo.set(event.value);
        break;
      }
      case 'remotePlayer': {
        this.remotePlayer.set(event.value);
        break;
      }
      case 'duration': {
        this.duration.set(event.value);
        break;
      }
      case 'currentTime': {
        this.currentTime.set(event.value);
        break;
      }
      case 'playerState': {
        this.playerState.set(event.value);
        break;
      }
    }
  }

  async loadMedia(mediaUrl: string) {
    if (!get(this.isInitialized)) {
      return;
    } else if (!this.session) {
      return;
    } else if (this.currentUrl === mediaUrl) {
      // Media already loaded, prevent reloading
      return;
    } else if (get(this.castState) !== cast.framework.CastState.CONNECTED) {
      // Cast not connected
      return;
    }

    if (!this.apiKey) {
      const apiKey = await this.getCastApiKey();

      if (!apiKey) {
        console.error('No cast api available');
        return;
      }

      this.apiKey = apiKey;
    }

    let contentType: string | null = null;

    await fetch(mediaUrl, { method: 'HEAD' }).then((response) => {
      contentType = response.headers.get('content-type');
    });

    if (!contentType) {
      console.error('Could not get content type for url ' + mediaUrl);
      return;
    }

    const authenticatedUrl = `${mediaUrl}&apiKey=${this.apiKey.secret}`;
    const mediaInfo = new chrome.cast.media.MediaInfo(authenticatedUrl, contentType);

    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    const successCallback = this.onMediaDiscovered.bind(CastPlayer.instance, SESSION_DISCOVERY_CAUSE.LOAD_MEDIA);
    this.currentUrl = mediaUrl;
    return this.session.loadMedia(request, successCallback, this.onError.bind(this));
  }

  onError(error: chrome.cast.Error) {
    console.error('cast player error', error);
  }

  onMediaDiscovered(cause: SESSION_DISCOVERY_CAUSE, currentMedia: chrome.cast.media.Media) {
    this.currentMedia = currentMedia;

    if (cause === SESSION_DISCOVERY_CAUSE.LOAD_MEDIA) {
      this.castPlayerState.set(chrome.cast.media.PlayerState.PLAYING);
    } else if (cause === SESSION_DISCOVERY_CAUSE.ACTIVE_SESSION) {
      this.castPlayerState.set(currentMedia.playerState);
    }

    this.currentMedia.addUpdateListener(this.onMediaStatusUpdate.bind(this));
  }

  onMediaStatusUpdate(mediaStillAlive: boolean) {
    if (mediaStillAlive) {
      const friendlyName = this.session?.receiver.friendlyName;
      if (friendlyName) {
        this.receiverFriendlyName.set(friendlyName);
      } else {
        this.receiverFriendlyName.set(null);
      }
    } else {
      this.castPlayerState.set(chrome.cast.media.PlayerState.IDLE);
    }
  }

  sessionMediaListener(currentMedia: chrome.cast.media.Media) {
    this.currentMedia = currentMedia;
    this.currentMedia.addUpdateListener(this.onMediaStatusUpdate.bind(this));
  }

  private async createCastApiKey() {
    try {
      const data = await createApiKey({
        apiKeyCreateDto: {
          name: CAST_API_KEY_NAME,
          permissions: [Permission.AssetView],
        },
      });
      return data;
    } catch (error) {
      console.error('Failed to create cast api key', error);
    }
  }

  private async getCastApiKey() {
    const currentKeys = await getApiKeys();

    const previousKey = currentKeys.find((key) => key.name == 'cast');

    if (previousKey) {
      await deleteApiKey({ id: previousKey.id });
    }

    return await this.createCastApiKey();
  }

  play() {
    if (!this.currentMedia) {
      console.error("Can't play: No media loaded");
      return;
    }

    const playRequest = new chrome.cast.media.PlayRequest();

    this.currentMedia.play(playRequest, () => {}, this.onError.bind(this));
  }

  pause() {
    if (!this.currentMedia) {
      console.error("Can't play: No media loaded");
      return;
    }

    const pauseRequest = new chrome.cast.media.PauseRequest();

    this.currentMedia.pause(pauseRequest, () => {}, this.onError.bind(this));
  }

  seek(currentTime: number) {
    const remotePlayer = new cast.framework.RemotePlayer();
    const remotePlayerController = new cast.framework.RemotePlayerController(remotePlayer);
    remotePlayer.currentTime = currentTime;
    remotePlayerController.seek();
  }
}

export default CastPlayer;

export const loadCastFramework = function () {
  if (!document.querySelector(`script[src="${FRAMEWORK_LINK}"]`)) {
    const script = document.createElement('script');
    script.src = FRAMEWORK_LINK;
    document.body.append(script);
  }
};

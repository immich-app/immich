/// <reference types="chromecast-caf-sender" />

import { PUBLIC_IMMICH_CAST_APPLICATION_ID } from '$env/static/public';
import { createApiKey, deleteApiKey, getApiKeys, Permission, type ApiKeyCreateResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

const CAST_API_KEY_NAME = 'cast';

const FRAMEWORK_LINK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

enum DEVICE_STATE {
  IDLE = 0,
  ACTIVE = 1,
  WARNING = 2,
  ERROR = 3,
}

enum SESSION_DISCOVERY_CAUSE {
  LOAD_MEDIA,
  ACTIVE_SESSION,
}

class CastPlayer {
  session: chrome.cast.Session | null = null;
  isConnected = writable(false);
  sessionStatus = writable(chrome.cast.SessionStatus.DISCONNECTED);

  deviceState = DEVICE_STATE.IDLE;

  castPlayerState = writable(chrome.cast.media.PlayerState.IDLE);

  isInitialized = false;

  readonly errorHandler = this.onError.bind(CastPlayer.instance);

  hasReceivers = writable(false);

  currentMedia: chrome.cast.media.Media | null = null;

  private constructor() {}
  private static instance: CastPlayer;

  private apiKey: ApiKeyCreateResponseDto | null = null;

  private async initialize() {
    const chromeWindow = window.chrome;
    if (!chromeWindow) {
      console.debug('Not initializing cast player: chrome object is missing');
      return;
    }

    const applicationId = PUBLIC_IMMICH_CAST_APPLICATION_ID;

    const sessionRequest = new chrome.cast.SessionRequest(applicationId);

    const apiConfig = new chrome.cast.ApiConfig(
      sessionRequest,
      this.sessionListener.bind(this),
      this.receiverListener.bind(this),
    );
    console.debug(`Initializing cast player, applicationId=${applicationId}`);
    chromeWindow.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.errorHandler);
    const castContext = cast.framework.CastContext.getInstance();
    const castSession = castContext.getCurrentSession();

    this.isConnected.set(!!castSession);
  }

  public static async getInstance(): Promise<CastPlayer | undefined> {
    if (CastPlayer.instance) {
      return CastPlayer.instance;
    }

    if (!chrome.cast) {
      console.warn('Not initializing cast player: cast object is missing');
      return;
    }

    CastPlayer.instance = new CastPlayer();
    await CastPlayer.instance.initialize();

    return CastPlayer.instance;
  }

  async loadMedia(mediaUrl: string) {
    if (!this.isInitialized || !this.session) {
      console.error('Cast player is not initialized');
      return;
    } else {
      console.debug('Cast player is initialized');
    }

    if (!this.apiKey) {
      const apiKey = await CastPlayer.instance.getCastApiKey();

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

    return this.session.loadMedia(request, successCallback, this.errorHandler);
  }

  onInitSuccess() {
    this.isInitialized = true;
    console.debug('cast player initialized');
  }

  onError() {
    console.debug('cast player error');
  }

  sessionListener(session: chrome.cast.Session) {
    console.debug('session listener');
    this.session = session;
    if (this.session) {
      this.isConnected.set(true);

      // Session already exists, join the session and sync up media status
      if (this.session.media[0]) {
        this.onMediaDiscovered(SESSION_DISCOVERY_CAUSE.ACTIVE_SESSION, this.session.media[0]);
      }

      this.onSessionConnected(session);
    }
  }

  receiverListener(receiver: chrome.cast.ReceiverAvailability) {
    if (receiver === chrome.cast.ReceiverAvailability.AVAILABLE) {
      this.hasReceivers.update(() => true);
    } else {
      this.hasReceivers.update(() => false);
    }
  }

  onMediaDiscovered(cause: SESSION_DISCOVERY_CAUSE, currentMedia: chrome.cast.media.Media) {
    this.currentMedia = currentMedia;

    if (cause === SESSION_DISCOVERY_CAUSE.LOAD_MEDIA) {
      this.castPlayerState.set(chrome.cast.media.PlayerState.PLAYING);
    } else if (cause === SESSION_DISCOVERY_CAUSE.ACTIVE_SESSION) {
      this.castPlayerState.set(currentMedia.playerState);
    }

    this.currentMedia.addUpdateListener(this.onMediaStatusUpdate.bind(CastPlayer.instance));
  }

  onMediaStatusUpdate(mediaStillAlive: boolean) {
    console.log('Media update', mediaStillAlive);
    if (!mediaStillAlive) {
      this.castPlayerState.set(chrome.cast.media.PlayerState.IDLE);
    }
  }

  onSessionConnected(session: chrome.cast.Session) {
    console.debug('session connected');
    this.session = session;
    this.deviceState = DEVICE_STATE.ACTIVE;
    this.sessionStatus.set(session.status);

    this.session.addMediaListener(this.sessionMediaListener.bind(CastPlayer.instance));
    this.session.addUpdateListener(this.sessionUpdateListener.bind(CastPlayer.instance));
  }

  sessionMediaListener(currentMedia: chrome.cast.media.Media) {
    this.currentMedia = currentMedia;
    this.currentMedia.addUpdateListener(this.onMediaStatusUpdate.bind(CastPlayer.instance));
  }

  sessionUpdateListener(session: chrome.cast.Session) {
    console.debug('session update listener', session);
    this.session = session;
    this.isConnected.set(!!session);
  }

  getReceiverName(): string | null {
    return this.session?.receiver?.friendlyName || null;
  }

  isCasting(): boolean {
    return this.deviceState === DEVICE_STATE.ACTIVE;
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

    let previousKey = currentKeys.find((key) => key.name == 'cast');

    if (previousKey) {
      await deleteApiKey({ id: previousKey.id });
    }

    return await this.createCastApiKey();
  }
}

export default CastPlayer;

export const loadCastFramework = (() => {
  let promise: Promise<typeof cast> | undefined;

  return async () => {
    if (promise === undefined) {
      promise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = FRAMEWORK_LINK;

        document.body.appendChild(script);
      });
    }
    return promise;
  };
})();

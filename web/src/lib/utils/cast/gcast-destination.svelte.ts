import 'chromecast-caf-sender';
import { Duration } from 'luxon';
import { authManager } from '$lib/managers/auth-manager.svelte';
import {
  CastDestinationType,
  CastState,
  type CastMediaSource,
  type ICastDestination,
} from '$lib/managers/cast-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { userPreferencesManager } from '$lib/managers/user-preferences-manager.svelte';
import { withCastSession } from '$lib/utils/cast/cast-url';
import { createPhotoMessage, isPhotoReceiver, PHOTO_NAMESPACE } from '$lib/utils/cast/photo-message';

const FRAMEWORK_LINK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

export class GCastDestination implements ICastDestination {
  private get customReceiverAppId(): string | undefined {
    return (
      userPreferencesManager.castReceiverAppId.trim() ||
      (import.meta.env.VITE_IMMICH_CAST_RECEIVER_APP_ID as string | undefined)?.trim() ||
      serverConfigManager.value.castReceiverAppId.trim() ||
      undefined
    );
  }
  type = CastDestinationType.GCAST;
  isAvailable = $state<boolean>(false);
  isConnected = $state<boolean>(false);
  currentTime = $state<number | null>(null);
  duration = $state<number | null>(null);
  castState = $state<CastState>(CastState.IDLE);
  receiverName = $state<string | null>(null);
  volumeLevel = $state<number | null>(null);
  isMuted = $state<boolean | null>(null);

  private remotePlayer: cast.framework.RemotePlayer | null = null;
  private remotePlayerController: cast.framework.RemotePlayerController | null = null;
  private session: chrome.cast.Session | null = null;
  private currentMedia: chrome.cast.media.Media | null = null;
  private loadedUrl: string | null = null;
  private loadedPhotoSignature: string | null = null;
  private photoRequestId = 0;
  // MIME lookups do not participate in Svelte reactivity.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  private contentTypes = new Map<string, Promise<string>>();

  private onPhotoMessage = (_namespace: string, message: string) => {
    try {
      const response = JSON.parse(message) as {
        type?: string;
        requestId?: number;
      };
      if (response.requestId !== this.photoRequestId) {
        return;
      }
      if (response.type === 'PHOTO_ERROR') {
        this.loadedUrl = null;
        this.loadedPhotoSignature = null;
        console.error('Google Cast: receiver failed to load photo');
      }
    } catch {
      // Ignore messages not using the photo protocol.
    }
  };

  async initialize(): Promise<boolean> {
    if (!authManager.authenticated || !authManager.preferences.cast.gCastEnabled) {
      this.isAvailable = false;
      return false;
    }

    const receiverAppId = this.customReceiverAppId;
    if (!receiverAppId) {
      this.isAvailable = false;
      return false;
    }

    // this is a really messy way since google does a pseudo-callbak
    // in the form of a global window event. We will give Chrome 3 seconds to respond
    // or we will mark the destination as unavailable

    const callbackPromise: Promise<boolean> = new Promise((resolve) => {
      // check if the cast framework is already loaded
      if (this.isAvailable) {
        resolve(true);
        return;
      }

      // eslint-disable-next-line unicorn/no-global-object-property-assignment
      window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
        resolve(isAvailable);
      };

      if (!document.querySelector(`script[src="${CSS.escape(FRAMEWORK_LINK)}"]`)) {
        const script = document.createElement('script');
        script.src = FRAMEWORK_LINK;
        document.body.append(script);
      }
    });

    const timeoutPromise: Promise<boolean> = new Promise((resolve) => {
      setTimeout(
        () => {
          resolve(false);
        },
        Duration.fromObject({ seconds: 3 }).toMillis(),
      );
    });

    this.isAvailable = await Promise.race([callbackPromise, timeoutPromise]);

    if (!this.isAvailable) {
      return false;
    }

    const castContext = cast.framework.CastContext.getInstance();
    this.remotePlayer = new cast.framework.RemotePlayer();

    castContext.setOptions({
      receiverApplicationId: receiverAppId,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    castContext.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (event) =>
      this.onSessionStateChanged(event),
    );

    castContext.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, (event) =>
      this.onCastStateChanged(event),
    );

    this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);
    this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, (event) =>
      this.onRemotePlayerChange(event),
    );

    return true;
  }

  prepareMedia(source: CastMediaSource): Promise<string> {
    if (source.contentType) {
      return Promise.resolve(source.contentType);
    }

    if (source.kind === 'photo') {
      // The custom receiver decodes the image itself and falls back to the thumbnail if preview loading fails.
      return Promise.resolve('image/*');
    }

    const cached = this.contentTypes.get(source.key);
    if (cached) {
      return cached;
    }

    const lookup = fetch(source.url, { method: 'HEAD' }).then((response) => {
      const contentType = response.headers.get('content-type')?.split(';', 1)[0];
      if (!response.ok || !contentType) {
        throw new Error(`Unable to resolve Cast media type (${response.status})`);
      }
      return contentType;
    });
    this.contentTypes.set(source.key, lookup);
    if (this.contentTypes.size > 256) {
      this.contentTypes.delete(this.contentTypes.keys().next().value!);
    }
    void lookup.catch(() => this.contentTypes.delete(source.key));
    return lookup;
  }

  async loadMedia(source: CastMediaSource, sessionKey: string, reload: boolean = false): Promise<boolean> {
    if (!this.isAvailable || !this.isConnected || !this.session) {
      throw new Error('Google Cast session is unavailable');
    }

    const activeSession = this.session;
    if (!isPhotoReceiver(activeSession.appId, this.customReceiverAppId)) {
      throw new Error('Google Cast session is not using the configured Immich receiver');
    }
    const photoSignature = [source.url, source.neighbors?.previous?.url, source.neighbors?.next?.url].join('|');
    if (
      this.loadedUrl === source.url &&
      !reload &&
      (!source.neighbors || this.loadedPhotoSignature === photoSignature)
    ) {
      return false;
    }

    const contentType = await this.prepareMedia(source);
    if (this.session !== activeSession || !this.isConnected) {
      return false;
    }

    if (contentType.startsWith('image/')) {
      const requestId = ++this.photoRequestId;
      await new Promise<void>((resolve, reject) => {
        activeSession.sendMessage(
          PHOTO_NAMESPACE,
          createPhotoMessage(source, sessionKey, requestId),
          resolve,
          (error) => reject(new Error(`Google Cast photo request failed: ${error.code}`)),
        );
      });
      if (this.session === activeSession) {
        this.currentMedia = null;
        this.loadedUrl = source.url;
        this.loadedPhotoSignature = photoSignature;
      }
      return true;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(withCastSession(source.url, sessionKey), contentType);
    if (contentType.startsWith('video/')) {
      mediaInfo.customData = { immichLoop: true };
    }

    // Create a queue with a single item and set it to repeat
    const queueItem = new chrome.cast.media.QueueItem(mediaInfo);
    const queueLoadRequest = new chrome.cast.media.QueueLoadRequest([queueItem]);
    queueLoadRequest.repeatMode = chrome.cast.media.RepeatMode.SINGLE;

    await new Promise<void>((resolve, reject) => {
      activeSession.queueLoad(
        queueLoadRequest,
        (media) => {
          if (this.session === activeSession) {
            this.currentMedia = media;
            this.loadedUrl = source.url;
            this.loadedPhotoSignature = null;
          }
          resolve();
        },
        (error) => reject(new Error(`Google Cast load failed: ${error.code}`)),
      );
    });
    return true;
  }

  ///
  /// Remote Player Controls
  ///

  play(): void {
    if (!this.currentMedia) {
      return;
    }

    const playRequest = new chrome.cast.media.PlayRequest();

    this.currentMedia.play(playRequest, () => {}, this.onError.bind(this));
  }

  pause(): void {
    if (!this.currentMedia) {
      return;
    }

    const pauseRequest = new chrome.cast.media.PauseRequest();

    this.currentMedia.pause(pauseRequest, () => {}, this.onError.bind(this));
  }

  seekTo(time: number): void {
    if (!this.remotePlayer || !this.remotePlayerController) {
      return;
    }

    this.remotePlayer.currentTime = time;
    this.remotePlayerController.seek();
  }

  setVolume(level: number): void {
    if (!this.remotePlayer || !this.remotePlayerController) {
      return;
    }

    this.remotePlayer.volumeLevel = Math.min(1, Math.max(0, level));
    this.remotePlayerController.setVolumeLevel();
  }

  toggleMute(): void {
    if (!this.remotePlayer || !this.remotePlayerController) {
      return;
    }

    this.remotePlayer.isMuted = !this.remotePlayer.isMuted;
    this.remotePlayerController.muteOrUnmute();
  }

  disconnect(): void {
    if (this.session) {
      cast.framework.CastContext.getInstance().endCurrentSession(true);
    }
  }

  ///
  /// Google Cast Callbacks
  ///
  private onSessionStateChanged(event: cast.framework.SessionStateEventData) {
    switch (event.sessionState) {
      case cast.framework.SessionState.NO_SESSION:
      case cast.framework.SessionState.SESSION_ENDED: {
        if (this.session && isPhotoReceiver(this.session.appId, this.customReceiverAppId)) {
          this.session?.removeMessageListener(PHOTO_NAMESPACE, this.onPhotoMessage);
        }
        this.session = null;
        this.isConnected = false;
        this.currentMedia = null;
        this.loadedUrl = null;
        this.loadedPhotoSignature = null;
        break;
      }
      case cast.framework.SessionState.SESSION_RESUMED:
      case cast.framework.SessionState.SESSION_STARTED: {
        if (this.session && isPhotoReceiver(this.session.appId, this.customReceiverAppId)) {
          this.session?.removeMessageListener(PHOTO_NAMESPACE, this.onPhotoMessage);
        }
        const session = event.session.getSessionObj();
        if (!isPhotoReceiver(session.appId, this.customReceiverAppId)) {
          this.session = null;
          this.isConnected = false;
          return;
        }
        this.session = session;
        if (isPhotoReceiver(this.session.appId, this.customReceiverAppId)) {
          this.session.addMessageListener(PHOTO_NAMESPACE, this.onPhotoMessage);
        }
        this.isConnected = true;
        this.receiverName = this.session.receiver.friendlyName;
        this.volumeLevel = this.remotePlayer?.volumeLevel ?? null;
        this.isMuted = this.remotePlayer?.isMuted ?? null;
        this.currentMedia = this.session.media?.[0] ?? null;
        const contentId = this.currentMedia?.media?.contentId;
        if (contentId) {
          try {
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
            const url = new URL(contentId);
            url.searchParams.delete('sessionKey');
            this.loadedUrl = url.href;
            this.castState = this.currentMedia!.playerState as unknown as CastState;
          } catch {
            this.loadedUrl = null;
          }
        }
        break;
      }
      case cast.framework.SessionState.SESSION_START_FAILED: {
        console.error('Google Cast failed to start session:', event.errorCode);
        break;
      }
      // no default
    }
  }

  private onCastStateChanged(event: cast.framework.CastStateEventData) {
    this.isConnected = event.castState === cast.framework.CastState.CONNECTED && !!this.session;
    this.receiverName = this.session?.receiver.friendlyName ?? null;

    if (event.castState === cast.framework.CastState.NOT_CONNECTED) {
      this.currentMedia = null;
      this.loadedUrl = null;
      this.loadedPhotoSignature = null;
    }
  }

  private onRemotePlayerChange(event: cast.framework.RemotePlayerChangedEvent) {
    switch (event.field) {
      case 'isConnected': {
        this.isConnected = event.value && !!this.session;
        break;
      }
      case 'remotePlayer': {
        this.remotePlayer = event.value;
        break;
      }
      case 'duration': {
        this.duration = event.value;
        break;
      }
      case 'currentTime': {
        this.currentTime = event.value;
        break;
      }
      case 'playerState': {
        this.castState = event.value;
        break;
      }
      case 'volumeLevel': {
        this.volumeLevel = event.value;
        break;
      }
      case 'isMuted': {
        this.isMuted = event.value;
        break;
      }
    }
  }

  onError(error: chrome.cast.Error) {
    console.error('Google Cast Error:', error);
  }

  static async showCastDialog() {
    const context = cast.framework.CastContext.getInstance();
    try {
      await context.requestSession();
    } catch (error) {
      const code = typeof error === 'string' ? error : (error as { code?: string } | null)?.code;
      if (code === chrome.cast.ErrorCode.CANCEL) {
        return;
      }
      console.error('Google Cast: device picker failed', { error, castState: context.getCastState() });
      throw error;
    }
  }
}

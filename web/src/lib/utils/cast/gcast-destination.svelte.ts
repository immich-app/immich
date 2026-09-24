import 'chromecast-caf-sender';
import { Duration } from 'luxon';
import { authManager } from '$lib/managers/auth-manager.svelte';
import {
  CastDestinationType,
  CastState,
  type CastMediaSource,
  type ICastDestination,
} from '$lib/managers/cast-manager.svelte';
import { withCastSession } from '$lib/utils/cast/cast-url';

const FRAMEWORK_LINK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

export class GCastDestination implements ICastDestination {
  type = CastDestinationType.GCAST;
  isAvailable = $state<boolean>(false);
  isConnected = $state<boolean>(false);
  currentTime = $state<number | null>(null);
  duration = $state<number | null>(null);
  castState = $state<CastState>(CastState.IDLE);
  receiverName = $state<string | null>(null);

  private remotePlayer: cast.framework.RemotePlayer | null = null;
  private remotePlayerController: cast.framework.RemotePlayerController | null = null;
  private session: chrome.cast.Session | null = null;
  private currentMedia: chrome.cast.media.Media | null = null;
  private loadedUrl: string | null = null;
  private contentTypes = new Map<string, Promise<string>>();

  async initialize(): Promise<boolean> {
    if (!authManager.authenticated || !authManager.preferences.cast.gCastEnabled) {
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
      receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
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

    const cached = this.contentTypes.get(source.key);
    if (cached) {
      return cached;
    }

    const lookup = fetch(source.url, { method: 'HEAD' }).then((response) => {
      const contentType = response.headers.get('content-type')?.split(';')[0];
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

    if (this.loadedUrl === source.url && !reload) {
      return false;
    }

    const contentType = await this.prepareMedia(source);
    const activeSession = this.session;

    const mediaInfo = new chrome.cast.media.MediaInfo(withCastSession(source.url, sessionKey), contentType);

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
    if (this.remotePlayer && this.remotePlayerController) {
      this.remotePlayer.currentTime = time;
      this.remotePlayerController.seek();
    }
  }

  disconnect(): void {
    this.session?.leave(() => {
      this.session = null;
      this.castState = CastState.IDLE;
      this.isConnected = false;
      this.receiverName = null;
    }, this.onError.bind(this));
  }

  ///
  /// Google Cast Callbacks
  ///
  private onSessionStateChanged(event: cast.framework.SessionStateEventData) {
    switch (event.sessionState) {
      case cast.framework.SessionState.NO_SESSION:
      case cast.framework.SessionState.SESSION_ENDED: {
        this.session = null;
        this.isConnected = false;
        this.currentMedia = null;
        this.loadedUrl = null;
        break;
      }
      case cast.framework.SessionState.SESSION_RESUMED:
      case cast.framework.SessionState.SESSION_STARTED: {
        this.session = event.session.getSessionObj();
        this.isConnected = true;
        this.receiverName = this.session.receiver.friendlyName;
        this.currentMedia = this.session.media?.[0] ?? null;
        const contentId = this.currentMedia?.media?.contentId;
        if (contentId) {
          try {
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
    }
  }

  onError(error: chrome.cast.Error) {
    console.error('Google Cast Error:', error);
  }

  static async showCastDialog() {
    try {
      await cast.framework.CastContext.getInstance().requestSession();
    } catch {
      // the cast dialog throws an error if the user closes it
      // we don't care about this error
      return;
    }
  }
}

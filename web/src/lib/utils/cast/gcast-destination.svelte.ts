import { CastDestinationType, CastState, type CastDestination } from '$lib/managers/cast-manager.svelte';
import 'chromecast-caf-sender';
import { Duration } from 'luxon';

const FRAMEWORK_LINK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

enum SESSION_DISCOVERY_CAUSE {
  LOAD_MEDIA,
  ACTIVE_SESSION,
}

export class GCastDestination implements CastDestination {
  type = CastDestinationType.GCAST;
  isAvailable = $state(false);
  isConnected = $state(false);
  currentTime: number | null = $state(null);
  duration: number | null = $state(null);
  castState = $state(CastState.IDLE);
  receiverName: string | null = $state(null);

  private remotePlayer: cast.framework.RemotePlayer | null = null;
  private session: chrome.cast.Session | null = null;
  private currentMedia: chrome.cast.media.Media | null = null;
  private currentUrl: string | null = null;

  async initialize(): Promise<boolean> {
    // this is a really messy way since google does a pseudo-callbak
    // in the form of a global window event. We will give Chrome 3 seconds to respond
    // or we will mark the destination as unavailable

    const callbackPromise: Promise<boolean> = new Promise((resolve) => {
      if (this.isAvailable) {
        console.debug('GCast API already available');
        resolve(true);
        return;
      }

      window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
        resolve(isAvailable);
      };

      if (!document.querySelector(`script[src="${FRAMEWORK_LINK}"]`)) {
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

    console.debug('GCast API available:', this.isAvailable);

    if (this.isAvailable) {
      const castContext = cast.framework.CastContext.getInstance();
      this.remotePlayer = new cast.framework.RemotePlayer();

      castContext.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      //
      // setup the event listeners
      //

      castContext.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        this.onSessionStateChanged.bind(this),
      );

      castContext.addEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        this.onCastStateChanged.bind(this),
      );

      const remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);
      remotePlayerController.addEventListener(
        cast.framework.RemotePlayerEventType.ANY_CHANGE,
        this.onRemotePlayerChange.bind(this),
      );
    }

    return this.isAvailable;
  }

  async loadMedia(mediaUrl: string, sessionKey: string, reload: boolean = false): Promise<void> {
    if (!this.isAvailable || !this.isConnected) {
      console.debug('Cannot load media, cast destination is not available or not connected');
      return;
    }

    if (!this.session) {
      console.debug('No active session, cannot load media');
      return;
    }

    if (this.currentUrl === mediaUrl && !reload) {
      console.debug('Already casting this media, skipping load');
      return;
    }

    // we need to send content type in the request
    let contentType: string | null = null;

    // in the future we can swap this out for an API call to get image metadata
    await fetch(mediaUrl, { method: 'HEAD' }).then((response) => {
      contentType = response.headers.get('content-type');
    });

    if (!contentType) {
      console.error('Could not get content type for url ' + mediaUrl);
      return;
    }

    // build the authenticated media request and send it to the cast device
    const authenticatedUrl = `${mediaUrl}&sessionKey=${sessionKey}`;
    const mediaInfo = new chrome.cast.media.MediaInfo(authenticatedUrl, contentType);

    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    const successCallback = this.onMediaDiscovered.bind(this, SESSION_DISCOVERY_CAUSE.LOAD_MEDIA);
    this.currentUrl = mediaUrl;

    console.debug('Casting new media:', authenticatedUrl);

    return this.session.loadMedia(request, successCallback, this.onError.bind(this));
  }

  ///
  /// Remote Player Controls
  ///

  play(): void {
    if (!this.currentMedia) {
      console.error("Can't play: No media loaded");
      return;
    }

    const playRequest = new chrome.cast.media.PlayRequest();

    this.currentMedia.play(playRequest, () => {}, this.onError.bind(this));
  }

  pause(): void {
    if (!this.currentMedia) {
      console.error("Can't play: No media loaded");
      return;
    }

    const pauseRequest = new chrome.cast.media.PauseRequest();

    this.currentMedia.pause(pauseRequest, () => {}, this.onError.bind(this));
  }

  seekTo(time: number): void {
    const remotePlayer = new cast.framework.RemotePlayer();
    const remotePlayerController = new cast.framework.RemotePlayerController(remotePlayer);
    remotePlayer.currentTime = time;
    remotePlayerController.seek();
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
    this.isConnected = event.castState === cast.framework.CastState.CONNECTED;
  }

  private onRemotePlayerChange(event: cast.framework.RemotePlayerChangedEvent) {
    switch (event.field) {
      case 'isConnected': {
        this.isConnected = event.value;
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

  onMediaDiscovered(cause: SESSION_DISCOVERY_CAUSE, currentMedia: chrome.cast.media.Media) {
    this.currentMedia = currentMedia;

    if (cause === SESSION_DISCOVERY_CAUSE.LOAD_MEDIA) {
      this.castState = CastState.PLAYING;
    } else if (cause === SESSION_DISCOVERY_CAUSE.ACTIVE_SESSION) {
      // CastState and PlayerState are identical enums
      this.castState = currentMedia.playerState as unknown as CastState;
    }

    this.currentMedia.addUpdateListener(this.onMediaStatusUpdate.bind(this));
  }

  onMediaStatusUpdate(mediaStillAlive: boolean) {
    if (mediaStillAlive) {
      const friendlyName = this.session?.receiver.friendlyName;
      this.receiverName = friendlyName ?? null;
    } else {
      this.castState = CastState.IDLE;
    }
  }

  sessionMediaListener(currentMedia: chrome.cast.media.Media) {
    this.currentMedia = currentMedia;
    this.currentMedia.addUpdateListener(this.onMediaStatusUpdate.bind(this));
  }

  static async showCastDialog() {
    try {
      await cast.framework.CastContext.getInstance().requestSession();
    } catch (error) {
      console.debug('Error from cast dialog:', error);
    }
  }
}

import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';
import { createSession, type SessionCreateResponseDto } from '@immich/sdk';

// follows chrome.cast.media.PlayerState
export enum CastState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  BUFFERING = 'BUFFERING',
}

export enum CastDestinationType {
  GCAST = 'GCAST',
}

export interface CastDestination {
  initialize(): Promise<boolean>; // returns if the cast destination can be used
  type: CastDestinationType; // type of cast destination

  isAvailable: boolean; // can we use the cast destination
  isConnected: boolean; // is the cast destination actively sharing

  currentTime: number | null; // current seek time the player is at
  duration: number | null; // duration of media

  receiverName: string | null; // name of the cast destination
  castState: CastState; // current state of the cast destination

  loadMedia(mediaUrl: string, sessionKey: string, reload: boolean): Promise<void>; // load media to the cast destination

  // remote player controls
  play(): void;
  pause(): void;
  seekTo(time: number): void;
  disconnect(): void;
}

class CastManager {
  private castDestinations = $state<CastDestination[]>([]);
  private current = $derived<CastDestination | null>(this.monitorConnectedDestination());

  availableDestinations = $state<CastDestination[]>([]);
  initialized = $state(false);

  isCasting = $derived<boolean>(this.current?.isConnected ?? false);
  receiverName = $derived<string | null>(this.current?.receiverName ?? null);
  castState = $derived<CastState | null>(this.current?.castState ?? null);
  currentTime = $derived<number | null>(this.current?.currentTime ?? null);
  duration = $derived<number | null>(this.current?.duration ?? null);

  private sessionKey: SessionCreateResponseDto | null = null;

  constructor() {
    // load each cast destination
    this.castDestinations = [
      new GCastDestination(),
      // Add other cast destinations here (ie FCast)
    ];
  }

  async initialize() {
    // this goes first to prevent multiple calls to initialize
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    // try to initialize each cast destination
    for (const castDestination of this.castDestinations) {
      const destAvailable = await castDestination.initialize();
      if (destAvailable) {
        this.availableDestinations.push(castDestination);
      }
    }
  }

  // monitor all cast destinations for changes
  // we want to make sure only one session is active at a time
  private monitorConnectedDestination(): CastDestination | null {
    // check if we have a connected destination
    const connectedDest = this.castDestinations.find((dest) => dest.isConnected);
    return connectedDest || null;
  }

  private async refreshSessionToken() {
    // get session token to authenticate the media url
    // TODO: check and make sure we have at least 60 seconds remaining in the session
    // before we send the media request, refresh the session if needed
    if (!this.sessionKey) {
      this.sessionKey = await createSession({
        sessionCreateDto: {
          // duration: Duration.fromObject({ minutes: 15 }).as('seconds'),
          deviceOS: 'Google Cast',
          deviceType: 'Cast',
        },
      });
    }
  }

  async loadMedia(mediaUrl: string, reload: boolean = false) {
    if (!this.current) {
      throw new Error('No active cast destination');
    }

    await this.refreshSessionToken();
    if (!this.sessionKey) {
      throw new Error('No session key available');
    }

    await this.current.loadMedia(mediaUrl, this.sessionKey.token, reload);
  }

  play() {
    this.current?.play();
  }

  pause() {
    this.current?.pause();
  }

  seekTo(time: number) {
    this.current?.seekTo(time);
  }

  disconnect() {
    this.current?.disconnect();
  }
}

// Persist castManager across Svelte HMRs
let castManager: CastManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.castManager) {
    import.meta.hot.data.castManager = new CastManager();
  }
  castManager = import.meta.hot.data.castManager;
} else {
  castManager = new CastManager();
}

export { castManager };

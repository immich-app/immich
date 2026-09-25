import { createSession, type SessionCreateResponseDto } from '@immich/sdk';
import { DateTime, Duration } from 'luxon';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';
import { LatestLoadQueue } from '$lib/utils/cast/latest-load-queue';

export type CastMediaSource = {
  key: string;
  url: string;
  kind?: 'photo';
  contentType?: string;
  fallback?: CastMediaSource;
  neighbors?: { previous?: CastMediaSource; next?: CastMediaSource };
};

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

export interface ICastDestination {
  initialize(): Promise<boolean>; // returns if the cast destination can be used
  type: CastDestinationType; // type of cast destination

  isAvailable: boolean; // can we use the cast destination
  isConnected: boolean; // is the cast destination actively sharing

  currentTime: number | null; // current seek time the player is at
  duration: number | null; // duration of media

  receiverName: string | null; // name of the cast destination
  castState: CastState; // current state of the cast destination

  prepareMedia(source: CastMediaSource): Promise<string>;
  loadMedia(source: CastMediaSource, sessionKey: string, reload: boolean): Promise<boolean>;

  // remote player controls
  play(): void;
  pause(): void;
  seekTo(time: number): void;
  disconnect(): void;
}

class CastManager {
  private castDestinations = $state<ICastDestination[]>([]);
  private current = $derived<ICastDestination | null>(this.monitorConnectedDestination());

  availableDestinations = $state<ICastDestination[]>([]);
  initialized = $state(false);

  isCasting = $derived<boolean>(this.current?.isConnected ?? false);
  receiverName = $derived<string | null>(this.current?.receiverName ?? null);
  castState = $derived<CastState | null>(this.current?.castState ?? null);
  currentTime = $derived<number | null>(this.current?.currentTime ?? null);
  duration = $derived<number | null>(this.current?.duration ?? null);

  private sessionKey: SessionCreateResponseDto | null = null;
  private sessionPromise: Promise<SessionCreateResponseDto> | null = null;
  private sessionUserId: string | null = null;
  private loadQueue = new LatestLoadQueue();

  constructor() {
    // load each cast destination
    this.castDestinations = [
      new GCastDestination(),
      // Add other cast destinations here (ie FCast)
    ];

    eventManager.on({
      AppInit: () => void this.initialize(),
      AuthLogout: () => {
        this.sessionKey = null;
        this.sessionPromise = null;
        this.sessionUserId = null;
        this.loadQueue.invalidate();
      },
    });
  }

  private async initialize() {
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
  private monitorConnectedDestination(): ICastDestination | null {
    // check if we have a connected destination
    const connectedDest = this.castDestinations.find((dest) => dest.isConnected);
    return connectedDest || null;
  }

  private isTokenValid() {
    // check if we already have a session token
    // we should always have a expiration date
    if (!this.sessionKey || !this.sessionKey.expiresAt) {
      return false;
    }

    const tokenExpiration = DateTime.fromISO(this.sessionKey.expiresAt);

    // we want to make sure we have at least 10 seconds remaining in the session
    // this is to account for network latency and other delays when sending the request
    const bufferedExpiration = tokenExpiration.minus({ seconds: 10 });

    return bufferedExpiration > DateTime.now();
  }

  private async refreshSessionToken(): Promise<SessionCreateResponseDto> {
    if (!authManager.authenticated) {
      throw new Error('No authenticated user for Cast');
    }
    const userId = authManager.user.id;
    if (this.sessionUserId !== userId) {
      this.sessionKey = null;
      this.sessionPromise = null;
      this.sessionUserId = userId;
    }
    if (this.isTokenValid()) {
      return this.sessionKey!;
    }

    this.sessionPromise ??= createSession({
      sessionCreateDto: {
        duration: Duration.fromObject({ minutes: 15 }).as('seconds'),
        deviceOS: 'Google Cast',
        deviceType: 'Cast',
      },
    });
    try {
      const session = await this.sessionPromise;
      if (!authManager.authenticated || authManager.user.id !== userId) {
        throw new Error('Cast user changed while preparing credentials');
      }
      this.sessionKey = session;
      return session;
    } finally {
      if (this.sessionUserId === userId) {
        this.sessionPromise = null;
      }
    }
  }

  prepareSession(): void {
    if (this.current) {
      void this.refreshSessionToken().catch(() => {});
    }
  }

  prepareMedia(source: CastMediaSource): void {
    if (this.current) {
      void this.resolveSource(this.current, source).catch(() => {});
    }
  }

  private async resolveSource(destination: ICastDestination, source: CastMediaSource): Promise<CastMediaSource> {
    try {
      await destination.prepareMedia(source);
      return source;
    } catch (error) {
      if (!source.fallback) {
        throw error;
      }
      await destination.prepareMedia(source.fallback);
      return source.fallback;
    }
  }

  async loadMedia(source: CastMediaSource, reload: boolean = false) {
    const destination = this.current;
    if (!destination) {
      throw new Error('No active cast destination');
    }

    const selectedAt = performance.now();
    await this.loadQueue.run(
      async () => {
        const prepared = await Promise.all([this.refreshSessionToken(), this.resolveSource(destination, source)]);
        return [...prepared, performance.now()] as const;
      },
      async ([session, resolvedSource, readyAt]) => {
        if (destination !== this.current || !destination.isConnected) {
          return;
        }
        performance.measure('cast:selection-to-ready', { start: selectedAt, end: readyAt });
        const dispatchedAt = performance.now();
        if (await destination.loadMedia(resolvedSource, session.token, reload)) {
          performance.measure('cast:command-to-ack', { start: dispatchedAt, end: performance.now() });
          performance.measure('cast:selection-to-ack', { start: selectedAt, end: performance.now() });
        }
      },
    );
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

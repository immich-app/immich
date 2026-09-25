import { castManager, CastState } from '$lib/managers/cast-manager.svelte';

// How close the remote playback position has to get to a pending seek
// target before the target is released and the remote time is shown again.
const SEEK_TARGET_TOLERANCE_S = 1.5;
const SEEK_TARGET_TIMEOUT_MS = 10_000;

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: #000;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
  <img part="poster" alt="" />
`;

class CastVideoElement extends HTMLElement {
  static observedAttributes = ['poster'];

  #img: HTMLImageElement;
  #seekTarget: number | null = null;
  #seekTimer: ReturnType<typeof setTimeout> | undefined;
  #dispose: (() => void) | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.append(template.content.cloneNode(true));
    this.#img = shadow.querySelector('img')!;
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    if (name === 'poster') {
      this.#img.src = newValue ?? '';
    }
  }

  get src(): string {
    return this.getAttribute('src') ?? '';
  }

  get paused(): boolean {
    return castManager.castState !== CastState.PLAYING;
  }

  get ended(): boolean {
    return castManager.castState === CastState.IDLE;
  }

  get currentTime(): number {
    return this.#seekTarget ?? castManager.currentTime ?? 0;
  }

  set currentTime(value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    // Show the seek target until the receiver catches up, so the scrubber
    // does not snap back to the previous position while the seek is in flight.
    this.#seekTarget = value;
    clearTimeout(this.#seekTimer);
    this.#seekTimer = setTimeout(() => (this.#seekTarget = null), SEEK_TARGET_TIMEOUT_MS);
    this.#emit('seeking');
    castManager.seekTo(value);
    this.#emit('seeked');
    this.#emit('timeupdate');
  }

  get duration(): number {
    return castManager.duration ?? NaN;
  }

  get volume(): number {
    return castManager.volumeLevel ?? 1;
  }

  set volume(value: number) {
    castManager.setVolume(value);
  }

  get muted(): boolean {
    return castManager.isMuted;
  }

  set muted(value: boolean) {
    if (value !== castManager.isMuted) {
      castManager.toggleMute();
    }
  }

  get readyState(): number {
    return castManager.castState === CastState.PLAYING || castManager.castState === CastState.PAUSED ? 4 : 0;
  }

  get disablePictureInPicture(): boolean {
    return true;
  }

  async play(): Promise<void> {
    if (castManager.castState === CastState.IDLE && this.src) {
      // Nothing is loaded on the receiver (e.g. after an error), reload it.
      await castManager.loadMedia({ key: this.src, url: this.src }, true);
      return;
    }
    castManager.play();
  }

  pause(): void {
    castManager.pause();
  }

  connectedCallback() {
    this.#dispose = $effect.root(() => {
      let previousState: CastState | null = null;
      $effect(() => {
        const state = castManager.castState;
        if (state === previousState) {
          return;
        }
        previousState = state;
        switch (state) {
          case CastState.PLAYING: {
            this.#emit('play');
            this.#emit('playing');
            break;
          }
          case CastState.PAUSED: {
            this.#emit('pause');
            break;
          }
          case CastState.BUFFERING: {
            this.#emit('waiting');
            break;
          }
          case CastState.IDLE: {
            this.#emit('pause');
            this.#emit('ended');
            break;
          }
          case null: {
            break;
          }
        }
      });

      let previousDuration: number | null = null;
      $effect(() => {
        const duration = castManager.duration;
        if (duration === previousDuration) {
          return;
        }
        const hadDuration = previousDuration !== null;
        previousDuration = duration;
        if (duration === null) {
          this.#seekTarget = null;
          this.#emit('emptied');
          return;
        }
        if (!hadDuration) {
          this.#emit('loadedmetadata');
        }
        this.#emit('durationchange');
      });

      let previousTime: number | null = null;
      $effect(() => {
        const time = castManager.currentTime;
        if (time === null || time === previousTime) {
          return;
        }
        previousTime = time;
        if (this.#seekTarget !== null && Math.abs(time - this.#seekTarget) <= SEEK_TARGET_TOLERANCE_S) {
          this.#seekTarget = null;
        }
        this.#emit('timeupdate');
      });

      let previousVolume: number | null = null;
      let previousMuted: boolean | null = null;
      $effect(() => {
        const volume = castManager.volumeLevel;
        const muted = castManager.isMuted;
        if (volume === previousVolume && muted === previousMuted) {
          return;
        }
        previousVolume = volume;
        previousMuted = muted;
        this.#emit('volumechange');
      });
    });
  }

  disconnectedCallback() {
    this.#dispose?.();
    this.#dispose = undefined;
    clearTimeout(this.#seekTimer);
  }

  #emit(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

if (!customElements.get('cast-video')) {
  customElements.define('cast-video', CastVideoElement);
}

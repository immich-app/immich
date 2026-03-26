import type { EditAction, EditActions, EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import type { AssetResponseDto } from '@immich/sdk';

export class TrimManager implements EditToolManager {
  startTime = $state(0);
  endTime = $state(0);
  duration = $state(0);
  currentTime = $state(0);
  isPlaying = $state(false);

  hasChanges = $state(false);
  canReset = $derived(this.hasChanges);
  trimmedDuration = $derived(this.endTime - this.startTime);

  startPercent = $derived(this.duration > 0 ? this.startTime / this.duration : 0);
  endPercent = $derived(this.duration > 0 ? this.endTime / this.duration : 1);
  currentPercent = $derived(this.duration > 0 ? this.currentTime / this.duration : 0);

  private videoElement: HTMLVideoElement | undefined;
  private cleanupListeners: (() => void) | undefined;

  edits: EditAction[] = $derived.by(() => {
    if (!this.hasChanges) {
      return [];
    }
    return [
      {
        action: 'trim' as const,
        parameters: {
          startTime: this.startTime,
          endTime: this.endTime,
        },
      },
    ] as EditAction[];
  });

  onActivate(asset: AssetResponseDto, edits: EditActions): Promise<void> {
    this.duration = this.parseDuration(asset.duration);
    this.startTime = 0;
    this.endTime = this.duration;
    this.hasChanges = false;

    // Restore existing trim edits if any
    const existingTrim = edits.find((e) => e.action === 'trim');
    if (existingTrim) {
      const params = existingTrim.parameters as { startTime: number; endTime: number; originalDuration?: number };
      // Use originalDuration so the timeline shows the full video range, not the trimmed range
      if (params.originalDuration && params.originalDuration > this.duration) {
        this.duration = params.originalDuration;
        this.endTime = this.duration;
      }
      this.startTime = params.startTime;
      this.endTime = params.endTime;
      this.hasChanges = true;
    }
    return Promise.resolve();
  }

  onDeactivate(): void {
    this.cleanupListeners?.();
    this.cleanupListeners = undefined;
    this.videoElement = undefined;
  }

  resetAllChanges(): Promise<void> {
    this.startTime = 0;
    this.endTime = this.duration;
    this.hasChanges = false;
    return Promise.resolve();
  }

  setVideoElement(element: HTMLVideoElement | undefined): void {
    this.cleanupListeners?.();

    if (!element) {
      this.videoElement = undefined;
      return;
    }

    this.videoElement = element;

    const onTimeUpdate = () => {
      this.currentTime = element.currentTime;
      // Constrained playback: loop within trim region
      if (this.hasChanges && element.currentTime >= this.endTime) {
        element.pause();
        element.currentTime = this.startTime;
      }
    };

    const onPlay = () => {
      this.isPlaying = true;
    };
    const onPause = () => {
      this.isPlaying = false;
    };

    element.addEventListener('timeupdate', onTimeUpdate);
    element.addEventListener('play', onPlay);
    element.addEventListener('pause', onPause);

    this.cleanupListeners = () => {
      element.removeEventListener('timeupdate', onTimeUpdate);
      element.removeEventListener('play', onPlay);
      element.removeEventListener('pause', onPause);
    };
  }

  setStart(time: number): void {
    this.startTime = Math.max(0, Math.min(time, this.endTime - 1));
    this.hasChanges = true;
  }

  setEnd(time: number): void {
    this.endTime = Math.min(this.duration, Math.max(time, this.startTime + 1));
    this.hasChanges = true;
  }

  seekTo(time: number): void {
    if (this.videoElement) {
      this.videoElement.currentTime = time;
    }
  }

  togglePlayPause(): void {
    if (!this.videoElement) {
      return;
    }
    if (this.videoElement.paused) {
      // If playhead is outside trim range, move to start
      if (this.currentTime < this.startTime || this.currentTime >= this.endTime) {
        this.videoElement.currentTime = this.startTime;
      }
      void this.videoElement.play();
    } else {
      this.videoElement.pause();
    }
  }

  static formatTime(seconds: number): string {
    if (seconds < 0) {
      seconds = 0;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toFixed(1).padStart(4, '0')}`;
  }

  private parseDuration(duration: string | null | undefined): number {
    if (!duration) {
      return 0;
    }
    const match = duration.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!match) {
      return 0;
    }
    const [, hours, minutes, seconds, fractional] = match;
    const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    return fractional ? total + Number(`0.${fractional}`) : total;
  }
}

export const trimManager = new TrimManager();

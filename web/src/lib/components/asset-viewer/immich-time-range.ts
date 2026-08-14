import { MediaUIEvents } from 'media-chrome/constants';
import MediaTimeRange from 'media-chrome/media-time-range';

const COMMIT_DELAY_MS = 750;

/** Custom MediaTimeRange that only seeks after pointer release to avoid hammering the server.
 * Keyboard input uses timed debouncing instead since there's no release event. */
class ImmichTimeRange extends MediaTimeRange {
  private seeking = false;
  private pending: number | undefined;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('pointerdown', this.hold);
    this.addEventListener('keydown', this.hold);
    this.addEventListener('pointerup', this.release);
    this.addEventListener('pointercancel', this.release);
    this.addEventListener(MediaUIEvents.MEDIA_SEEK_REQUEST, this.intercept, { capture: true });
  }

  private hold(event: Event) {
    if (event instanceof KeyboardEvent) {
      if (!this.keysUsed.includes(event.key)) {
        return;
      }
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(this.release, COMMIT_DELAY_MS);
    }
    this.seeking = true;
  }

  private intercept(event: Event) {
    if (!this.seeking) {
      return; // not mid-scrub, or this is the request we replay in release()
    }
    this.pending = (event as CustomEvent<number>).detail;
    event.stopImmediatePropagation();
  }

  private release() {
    clearTimeout(this.idleTimer);
    this.seeking = false;
    if (this.pending !== undefined) {
      const detail = this.pending;
      this.pending = undefined;
      this.dispatchEvent(new CustomEvent(MediaUIEvents.MEDIA_SEEK_REQUEST, { bubbles: true, composed: true, detail }));
    }
  }
}

if (!customElements.get('immich-time-range')) {
  customElements.define('immich-time-range', ImmichTimeRange);
}

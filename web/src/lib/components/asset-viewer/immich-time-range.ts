import MediaTimeRange from 'media-chrome/media-time-range';

const COMMIT_DELAY_MS = 750;

/** Custom MediaTimeRange that only seeks after pointer release to avoid hammering the server.
 * Keyboard input uses timed debouncing instead since there's no release event. */
class ImmichTimeRange extends MediaTimeRange {
  private pointerSeek = false;
  private pendingSeek = false;
  private commitTimer: ReturnType<typeof setTimeout> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('pointercancel', this); // The base only wires pointerdown/up
  }

  override handleEvent(event: Event) {
    switch (event.type) {
      case 'pointerdown': {
        this.pointerSeek = true;
        break;
      }
      case 'input': {
        this.pendingSeek = true;
        this.updateBar();
        if (this.pointerSeek) {
          return;
        }
        clearTimeout(this.commitTimer);
        this.commitTimer = setTimeout(() => this.commit(), COMMIT_DELAY_MS);
        return;
      }
      case 'pointerup':
      case 'pointercancel': {
        super.handleEvent(event);
        if (this.pointerSeek) {
          this.pointerSeek = false;
          this.commit();
        }
        return;
      }
    }
    super.handleEvent(event);
  }

  private commit() {
    clearTimeout(this.commitTimer);
    if (this.pendingSeek) {
      this.pendingSeek = false;
      super.handleEvent(new Event('input'));
    }
  }
}

if (!globalThis.customElements.get('immich-time-range')) {
  globalThis.customElements.define('immich-time-range', ImmichTimeRange);
}

import { debounce } from 'lodash-es';

type LayoutOptions = {
  headerHeight: number;
  rowHeight: number;
  gap: number;
};

// Browsers cap the rendered height of a layout/scroll box. Blink's LayoutUnit gives
// ~33.5M device px, halved on DPR-2 displays to 2^24 = 16,777,216 CSS px; Firefox caps
// lower (~17.9M at DPR 1). Stay safely under both so #virtual-timeline always fits inside
// the cap. The timeline keeps a real layout coordinate space larger than the scroll box,
// mapped to DOM scroll via a compression factor. See immich-app/immich#16788.
function computeMaxScrollHeight(): number {
  const dpr = Math.max(1, (globalThis.devicePixelRatio as number | undefined) || 1);
  return Math.floor(15_000_000 / dpr);
}

export abstract class VirtualScrollManager {
  topSectionHeight = $state(0);
  bodySectionHeight = $state(0);
  bottomSectionHeight = $state(0);
  totalViewerHeight = $derived.by(() => this.topSectionHeight + this.bodySectionHeight + this.bottomSectionHeight);

  // Two coordinate spaces:
  //   Layout space: month/day/asset positions, sum to totalViewerHeight (real, uncapped).
  //   Scroll space: what the DOM sees on #asset-grid.scrollTop, capped at renderedHeight.
  // When the timeline fits under the cap, renderedHeight === totalViewerHeight and the
  // compression factor maxScrollPercent === 1, reducing this to upstream's single space.
  renderedHeight = $derived.by(() => Math.min(this.totalViewerHeight, computeMaxScrollHeight()));

  // Compression factor: 1 px of DOM scroll = (1 / factor) px of layout movement.
  // 1.0 when no compression is needed (small/medium libraries).
  maxScrollPercent = $derived.by(() => {
    const total = this.totalViewerHeight;
    const vh = this.viewportHeight;
    if (total <= vh) {
      return 1;
    }
    const rendered = this.renderedHeight;
    const numer = rendered - vh;
    const denom = total - vh;
    if (numer <= 0 || denom <= 0) {
      return 1;
    }
    return Math.max(0.01, Math.min(1, numer / denom));
  });

  maxScroll = $derived.by(() => Math.max(0, this.renderedHeight - this.viewportHeight));

  // Anchor offset that lets in-viewport months render at real (1:1) coordinates while the
  // DOM scroll box stays under the cap. Zero when factor is 1.
  renderOffset = $derived.by(() => {
    const f = this.maxScrollPercent;
    if (f >= 0.999) {
      return 0;
    }
    return this.#scrollTop * (1 / f - 1);
  });

  // visibleWindow is expressed in LAYOUT space so it compares directly against
  // month.top / position.top in intersection tests. When factor === 1 this is the
  // upstream definition: { top: scrollTop, bottom: scrollTop + viewportHeight }.
  visibleWindow = $derived.by(() => {
    const f = this.maxScrollPercent;
    const total = this.totalViewerHeight;
    const vh = this.viewportHeight;
    const layoutTop = f >= 0.999 ? this.#scrollTop : this.#scrollTop / f;
    const maxLayoutTop = Math.max(0, total - vh);
    const top = Math.max(0, Math.min(layoutTop, maxLayoutTop));
    return { top, bottom: top + vh };
  });

  #viewportHeight = $state(0);
  #viewportWidth = $state(0);
  #scrollTop = $state(0);
  #rowHeight = $state(235);
  #headerHeight = $state(48);
  #gap = $state(12);
  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);
  #justifiedLayoutOptions = $derived({
    spacing: 2,
    heightTolerance: 0.5,
    rowHeight: this.#rowHeight,
    rowWidth: Math.floor(this.viewportWidth),
  });

  constructor() {
    this.setLayoutOptions();
  }

  get scrollTop() {
    return 0;
  }

  get justifiedLayoutOptions() {
    return this.#justifiedLayoutOptions;
  }

  // Convert a layout-space y position to the DOM scrollTop needed to place it at the
  // viewport top. When factor is 1 this is a no-op.
  layoutToScroll(layoutCoord: number): number {
    return layoutCoord * this.maxScrollPercent;
  }

  // Convert a DOM scrollTop value to the layout-space y position at the viewport top.
  scrollToLayout(scrollCoord: number): number {
    const f = this.maxScrollPercent;
    return f >= 0.999 ? scrollCoord : scrollCoord / f;
  }

  #setHeaderHeight(value: number) {
    if (this.#headerHeight == value) {
      return false;
    }
    this.#headerHeight = value;
    return true;
  }

  get headerHeight() {
    return this.#headerHeight;
  }

  #setGap(value: number) {
    if (this.#gap == value) {
      return false;
    }
    this.#gap = value;
    return true;
  }

  get gap() {
    return this.#gap;
  }

  #setRowHeight(value: number) {
    if (this.#rowHeight == value) {
      return false;
    }
    this.#rowHeight = value;
    return true;
  }

  get rowHeight() {
    return this.#rowHeight;
  }

  set scrolling(value: boolean) {
    this.#scrolling = value;
    if (value) {
      this.suspendTransitions = true;
      this.#resetScrolling();
    }
  }

  get scrolling() {
    return this.#scrolling;
  }

  set suspendTransitions(value: boolean) {
    this.#suspendTransitions = value;
    if (value) {
      this.#resetSuspendTransitions();
    }
  }

  get suspendTransitions() {
    return this.#suspendTransitions;
  }

  set viewportWidth(value: number) {
    const changed = value !== this.#viewportWidth;
    this.#viewportWidth = value;
    this.suspendTransitions = true;
    void this.updateViewportGeometry(changed);
  }

  get viewportWidth() {
    return this.#viewportWidth;
  }

  set viewportHeight(value: number) {
    this.#viewportHeight = value;
    this.#suspendTransitions = true;
    void this.updateViewportGeometry(false);
  }

  get viewportHeight() {
    return this.#viewportHeight;
  }

  get hasEmptyViewport() {
    return this.viewportWidth === 0 || this.viewportHeight === 0;
  }

  protected updateViewportProximities(): void {}

  protected updateViewportGeometry(_: boolean) {}

  setLayoutOptions({ headerHeight = 48, rowHeight = 235, gap = 12 }: Partial<LayoutOptions> = {}) {
    let changed = false;
    changed ||= this.#setHeaderHeight(headerHeight);
    changed ||= this.#setGap(gap);
    changed ||= this.#setRowHeight(rowHeight);
    if (changed) {
      this.refreshLayout();
    }
  }

  updateSlidingWindow() {
    const scrollTop = this.scrollTop;
    if (this.#scrollTop !== scrollTop) {
      this.#scrollTop = scrollTop;
      this.updateViewportProximities();
    }
  }

  refreshLayout() {
    this.updateViewportProximities();
  }

  destroy(): void {}
}

import { MediaRenditionMenu, type FormatRenditionOptions } from 'media-chrome/menu/media-rendition-menu';

type Rendition = Parameters<MediaRenditionMenu['formatRendition']>[0];
type QualityLabel = 'auto' | 'original';

const DEFAULT_LABELS: Record<QualityLabel, string> = { auto: 'Auto', original: 'Original' };
const LABEL_ATTRIBUTES = new Set(['auto-label', 'original-label', 'original-rendition-id']);

class ImmichRenditionMenu extends MediaRenditionMenu {
  static override get observedAttributes(): string[] {
    return [...MediaRenditionMenu.observedAttributes, ...LABEL_ATTRIBUTES];
  }

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (oldValue === newValue || !LABEL_ATTRIBUTES.has(name) || !this.isConnected) {
      return;
    }

    const renditions = [...this.mediaRenditionList];
    this.mediaRenditionList = [];
    this.mediaRenditionList = renditions;
  }

  private getLabel(label: QualityLabel): string {
    return this.getAttribute(`${label}-label`) ?? DEFAULT_LABELS[label];
  }

  override formatMenuItemText(_text: string, rendition?: Rendition): string {
    return rendition ? super.formatMenuItemText(_text, rendition) : this.getLabel('auto');
  }

  override formatRendition(rendition: Rendition, options?: FormatRenditionOptions): string {
    if (rendition.id === this.getAttribute('original-rendition-id')) {
      return this.getLabel('original');
    }
    return super.formatRendition(rendition, options);
  }
}

if (!customElements.get('immich-rendition-menu')) {
  customElements.define('immich-rendition-menu', ImmichRenditionMenu);
}

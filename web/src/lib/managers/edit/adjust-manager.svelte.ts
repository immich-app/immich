import { type EditActions, type EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import type { AssetResponseDto } from '@immich/sdk';

export interface AdjustValues {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpness: number;
}

export interface FilterPreset {
  name: string;
  label: string;
  values: AdjustValues;
}

const defaultValues: AdjustValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
};

export const filterPresets: FilterPreset[] = [
  { name: 'original', label: 'Original', values: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, sharpness: 0 } },
  { name: 'vivid', label: 'Vivid', values: { brightness: 5, contrast: 15, saturation: 40, warmth: 0, sharpness: 10 } },
  { name: 'dramatic', label: 'Dramatic', values: { brightness: -10, contrast: 40, saturation: -10, warmth: 0, sharpness: 20 } },
  { name: 'noir', label: 'Noir', values: { brightness: -5, contrast: 30, saturation: -100, warmth: 0, sharpness: 15 } },
  { name: 'mono', label: 'Mono', values: { brightness: 0, contrast: 10, saturation: -100, warmth: 0, sharpness: 0 } },
  { name: 'sepia', label: 'Sepia', values: { brightness: 5, contrast: 5, saturation: -50, warmth: 40, sharpness: 0 } },
  { name: 'warm', label: 'Warm', values: { brightness: 5, contrast: 5, saturation: 10, warmth: 30, sharpness: 0 } },
  { name: 'cool', label: 'Cool', values: { brightness: 0, contrast: 5, saturation: 5, warmth: -30, sharpness: 0 } },
  { name: 'vintage', label: 'Vintage', values: { brightness: -5, contrast: -10, saturation: -30, warmth: 20, sharpness: 0 } },
  { name: 'fade', label: 'Fade', values: { brightness: 10, contrast: -20, saturation: -20, warmth: 0, sharpness: 0 } },
];

/**
 * Maps a slider value (-100 to +100) to the server parameter range.
 * brightness/contrast/saturation: 0.0 to 2.0 (default 1.0)
 * sharpness: 0.0 to 2.0 (default 0)
 * warmth: mapped to hue 0-360 (warm = slight rotation, cool = opposite)
 */
function sliderToServerBrightness(value: number): number {
  // -100 -> 0.0, 0 -> 1.0, +100 -> 2.0
  return 1.0 + value / 100;
}

function sliderToServerContrast(value: number): number {
  return 1.0 + value / 100;
}

function sliderToServerSaturation(value: number): number {
  return 1.0 + value / 100;
}

function sliderToServerSharpness(value: number): number {
  // -100 -> 0, 0 -> 0, +100 -> 2.0
  return Math.max(0, value / 50);
}

function sliderToServerHue(warmth: number): number {
  // warmth: -100 to +100 mapped to hue rotation
  // positive warmth = slight warm hue shift, negative = cool shift
  if (warmth >= 0) {
    return Math.round((warmth / 100) * 30); // 0-30 degrees warm
  }
  return Math.round(360 + (warmth / 100) * 30); // 330-360 degrees cool
}

class AdjustManager implements EditToolManager {
  hasChanges: boolean = $state(false);
  canReset: boolean = $derived.by(() => this.checkHasEdits());

  brightness = $state(0);
  contrast = $state(0);
  saturation = $state(0);
  warmth = $state(0);
  sharpness = $state(0);
  isAutoEnhance = $state(false);
  activeFilter = $state('original');

  edits = $derived.by(() => this.getEdits());

  /** CSS filter string for live preview */
  cssFilter = $derived.by(() => {
    const b = sliderToServerBrightness(this.brightness);
    const c = sliderToServerContrast(this.contrast);
    const s = sliderToServerSaturation(this.saturation);
    // Warmth is approximated in CSS with sepia + hue-rotate
    const warmthFilter = this.warmth > 0 ? `sepia(${this.warmth / 100 * 0.3})` : '';
    const coolFilter = this.warmth < 0 ? `hue-rotate(${Math.round(this.warmth / 100 * 30)}deg)` : '';
    return `brightness(${b}) contrast(${c}) saturate(${s}) ${warmthFilter} ${coolFilter}`.trim();
  });

  checkHasEdits(): boolean {
    return (
      this.brightness !== 0 ||
      this.contrast !== 0 ||
      this.saturation !== 0 ||
      this.warmth !== 0 ||
      this.sharpness !== 0 ||
      this.isAutoEnhance
    );
  }

  getEdits(): EditActions {
    const edits: EditActions = [];

    if (this.isAutoEnhance) {
      edits.push({
        action: 'auto-enhance' as never,
        parameters: {} as never,
      });
      return edits;
    }

    if (this.checkHasEdits()) {
      edits.push({
        action: 'adjust' as never,
        parameters: {
          brightness: sliderToServerBrightness(this.brightness),
          contrast: sliderToServerContrast(this.contrast),
          saturation: sliderToServerSaturation(this.saturation),
          hue: sliderToServerHue(this.warmth),
          sharpness: sliderToServerSharpness(this.sharpness),
        } as never,
      });
    }

    return edits;
  }

  applyPreset(preset: FilterPreset) {
    this.activeFilter = preset.name;
    this.brightness = preset.values.brightness;
    this.contrast = preset.values.contrast;
    this.saturation = preset.values.saturation;
    this.warmth = preset.values.warmth;
    this.sharpness = preset.values.sharpness;
    this.isAutoEnhance = false;
    this.hasChanges = preset.name !== 'original';
  }

  setAutoEnhance() {
    this.isAutoEnhance = true;
    this.activeFilter = '';
    this.hasChanges = true;
  }

  setValue(key: keyof AdjustValues, value: number) {
    this[key] = value;
    this.isAutoEnhance = false;
    this.activeFilter = '';
    this.hasChanges = true;
  }

  async onActivate(_asset: AssetResponseDto, edits: EditActions): Promise<void> {
    // Only restore from server edits if we don't already have local changes
    if (this.hasChanges) {
      return;
    }

    // Restore adjust state from existing edits if present
    const adjustEdit = edits.find((e) => (e.action as string) === 'adjust');
    if (adjustEdit) {
      const params = adjustEdit.parameters as { brightness: number; contrast: number; saturation: number; hue: number; sharpness: number };
      this.brightness = Math.round((params.brightness - 1.0) * 100);
      this.contrast = Math.round((params.contrast - 1.0) * 100);
      this.saturation = Math.round((params.saturation - 1.0) * 100);
      this.sharpness = Math.round(params.sharpness * 50);
      // Reverse hue to warmth
      if (params.hue <= 30) {
        this.warmth = Math.round((params.hue / 30) * 100);
      } else if (params.hue >= 330) {
        this.warmth = Math.round(((params.hue - 360) / 30) * 100);
      } else {
        this.warmth = 0;
      }
    }

    const autoEnhanceEdit = edits.find((e) => (e.action as string) === 'auto-enhance');
    if (autoEnhanceEdit) {
      this.isAutoEnhance = true;
    }
  }

  onDeactivate() {
    // Do not reset values on deactivate - preserve state when switching tools
    // The edits derived property keeps providing values to the edit manager
  }

  async resetAllChanges() {
    this.reset();
  }

  private reset() {
    this.brightness = defaultValues.brightness;
    this.contrast = defaultValues.contrast;
    this.saturation = defaultValues.saturation;
    this.warmth = defaultValues.warmth;
    this.sharpness = defaultValues.sharpness;
    this.isAutoEnhance = false;
    this.activeFilter = 'original';
    this.hasChanges = false;
  }
}

export const adjustManager = new AdjustManager();

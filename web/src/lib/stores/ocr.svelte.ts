import { getAssetOcr } from '@immich/sdk';

export type OcrBoundingBox = {
  id: string;
  assetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;
  boxScore: number;
  textScore: number;
  text: string;
};

class OcrManager {
  #data = $state<OcrBoundingBox[]>([]);
  showOverlay = $state(false);
  #hasOcrData = $derived(this.#data.length > 0);

  get data() {
    return this.#data;
  }

  get hasOcrData() {
    return this.#hasOcrData;
  }

  async getAssetOcr(id: string) {
    this.#data = await getAssetOcr({ id });
  }

  clear() {
    this.#data = [];
    this.showOverlay = false;
  }

  toggleOcrBoundingBox() {
    this.showOverlay = !this.showOverlay;
  }
}

export const ocrManager = new OcrManager();

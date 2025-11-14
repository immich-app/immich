import { getAssetOcr } from '@immich/sdk';

export interface OcrBoundingBox {
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
}

class OcrStore {
  data = $state<OcrBoundingBox[]>([]);
  showOverlay = $state(false);
  hasOcrData = $state(false);

  async getAssetOcr(id: string) {
    this.data = await getAssetOcr({ id });
    this.hasOcrData = this.data.length > 0;
  }

  clear() {
    this.data = [];
    this.showOverlay = false;
    this.hasOcrData = false;
  }

  toggleOcrBoundingBox() {
    this.showOverlay = !this.showOverlay;
  }
}

export const ocrStore = new OcrStore();

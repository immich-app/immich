import { CancellableTask } from '$lib/utils/cancellable-task';
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
  #ocrLoader = new CancellableTask();
  #cleared = false;

  get data() {
    return this.#data;
  }

  get hasOcrData() {
    return this.#hasOcrData;
  }

  async getAssetOcr(id: string) {
    if (this.#cleared) {
      await this.#ocrLoader.reset();
      this.#cleared = false;
    }
    await this.#ocrLoader.execute(async () => {
      this.#data = await getAssetOcr({ id });
    }, false);
  }

  clear() {
    this.#cleared = true;
    this.#data = [];
    this.showOverlay = false;
  }

  toggleOcrBoundingBox() {
    this.showOverlay = !this.showOverlay;
  }
}

export const ocrManager = new OcrManager();

import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';

export const ocrStub = {
  textBox1: Object.freeze<AssetOcrResponseDto>({
    id: 'ocr-id-1',
    assetId: 'asset-id',
    x1: 0.1,
    y1: 0.2,
    x2: 0.3,
    y2: 0.2,
    x3: 0.3,
    y3: 0.4,
    x4: 0.1,
    y4: 0.4,
    boxScore: 0.95,
    textScore: 0.92,
    text: 'Hello World',
  }),
  textBox2: Object.freeze<AssetOcrResponseDto>({
    id: 'ocr-id-2',
    assetId: 'asset-id',
    x1: 0.5,
    y1: 0.6,
    x2: 0.8,
    y2: 0.6,
    x3: 0.8,
    y3: 0.7,
    x4: 0.5,
    y4: 0.7,
    boxScore: 0.98,
    textScore: 0.89,
    text: 'Test Image',
  }),
};

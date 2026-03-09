import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import CropArea from '$lib/components/asset-viewer/editor/transform-tool/crop-area.svelte';
import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
import { getAssetMediaUrl } from '$lib/utils';
import { assetFactory } from '@test-data/factories/asset-factory';
import { render } from '@testing-library/svelte';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils');

describe('CropArea', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
    vi.mocked(getAssetMediaUrl).mockReturnValue('/mock-image.jpg');
  });

  afterEach(() => {
    transformManager.reset();
  });

  it('clears cursor styles on reset', () => {
    const asset = assetFactory.build();
    const { getByRole } = render(CropArea, { asset });
    const cropArea = getByRole('button', { name: 'Crop area' });

    transformManager.region = { x: 100, y: 100, width: 200, height: 200 };
    transformManager.cropImageSize = { width: 1000, height: 1000 };
    transformManager.cropImageScale = 1;
    transformManager.updateCursor(100, 150);

    expect(document.body.style.cursor).toBe('ew-resize');
    expect(cropArea.style.cursor).toBe('ew-resize');

    transformManager.reset();

    expect(document.body.style.cursor).toBe('');
    expect(cropArea.style.cursor).toBe('');
  });

  it('sets cursor style at x: $x, y: $y to be $cursor', () => {
    const data = [
      { x: 299, y: 84, cursor: '' },
      { x: 299, y: 85, cursor: 'nesw-resize' },
      { x: 299, y: 115, cursor: 'nesw-resize' },
      { x: 299, y: 116, cursor: 'ew-resize' },
      { x: 299, y: 284, cursor: 'ew-resize' },
      { x: 299, y: 285, cursor: 'nwse-resize' },
      { x: 299, y: 300, cursor: 'nwse-resize' },
      { x: 299, y: 301, cursor: '' },
      { x: 300, y: 84, cursor: '' },
      { x: 300, y: 85, cursor: 'nesw-resize' },
      { x: 300, y: 86, cursor: 'nesw-resize' },
      { x: 300, y: 114, cursor: 'nesw-resize' },
      { x: 300, y: 115, cursor: 'nesw-resize' },
      { x: 300, y: 116, cursor: 'ew-resize' },
      { x: 300, y: 284, cursor: 'ew-resize' },
      { x: 300, y: 285, cursor: 'nwse-resize' },
      { x: 300, y: 286, cursor: 'nwse-resize' },
      { x: 300, y: 300, cursor: 'nwse-resize' },
      { x: 300, y: 301, cursor: '' },
      { x: 301, y: 300, cursor: '' },
      { x: 301, y: 301, cursor: '' },
    ];

    const element = document.createElement('div');

    for (const { x, y, cursor } of data) {
      const message = `x: ${x}, y: ${y} - ${cursor}`;
      transformManager.reset();
      transformManager.region = { x: 100, y: 100, width: 200, height: 200 };
      transformManager.cropImageSize = { width: 600, height: 600 };
      transformManager.cropAreaEl = element;
      transformManager.cropImageScale = 0.5;
      transformManager.updateCursor(x, y);
      expect(element.style.cursor, message).toBe(cursor);
      expect(document.body.style.cursor, message).toBe(cursor);
    }
  });
});

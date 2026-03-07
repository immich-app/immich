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
      { x: 84, y: 84, cursor: '' },
      { x: 84, y: 85, cursor: '' },
      { x: 84, y: 86, cursor: '' },
      { x: 84, y: 114, cursor: '' },
      { x: 84, y: 115, cursor: '' },
      { x: 84, y: 116, cursor: '' },
      { x: 84, y: 284, cursor: '' },
      { x: 84, y: 285, cursor: '' },
      { x: 84, y: 286, cursor: '' },
      { x: 84, y: 300, cursor: '' },
      { x: 84, y: 301, cursor: '' },
      { x: 85, y: 84, cursor: '' },
      { x: 85, y: 85, cursor: 'nwse-resize' },
      { x: 85, y: 86, cursor: 'nwse-resize' },
      { x: 85, y: 114, cursor: 'nwse-resize' },
      { x: 85, y: 115, cursor: 'nwse-resize' },
      { x: 85, y: 116, cursor: '' },
      { x: 85, y: 284, cursor: '' },
      { x: 85, y: 285, cursor: 'nesw-resize' },
      { x: 85, y: 286, cursor: 'nesw-resize' },
      { x: 85, y: 300, cursor: 'nesw-resize' },
      { x: 85, y: 301, cursor: '' },
      { x: 86, y: 84, cursor: '' },
      { x: 86, y: 85, cursor: 'nwse-resize' },
      { x: 86, y: 86, cursor: 'nwse-resize' },
      { x: 86, y: 114, cursor: 'nwse-resize' },
      { x: 86, y: 115, cursor: 'nwse-resize' },
      { x: 86, y: 116, cursor: '' },
      { x: 86, y: 284, cursor: '' },
      { x: 86, y: 285, cursor: 'nesw-resize' },
      { x: 86, y: 286, cursor: 'nesw-resize' },
      { x: 86, y: 300, cursor: 'nesw-resize' },
      { x: 86, y: 301, cursor: '' },
      { x: 89, y: 284, cursor: '' },
      { x: 89, y: 116, cursor: '' },
      { x: 90, y: 116, cursor: 'ew-resize' },
      { x: 90, y: 284, cursor: 'ew-resize' },
      { x: 91, y: 116, cursor: 'ew-resize' },
      { x: 91, y: 284, cursor: 'ew-resize' },
      { x: 109, y: 116, cursor: 'ew-resize' },
      { x: 109, y: 284, cursor: 'ew-resize' },
      { x: 110, y: 116, cursor: 'ew-resize' },
      { x: 110, y: 284, cursor: 'ew-resize' },
      { x: 111, y: 116, cursor: 'move' },
      { x: 111, y: 284, cursor: 'move' },
      { x: 114, y: 84, cursor: '' },
      { x: 114, y: 85, cursor: 'nwse-resize' },
      { x: 114, y: 86, cursor: 'nwse-resize' },
      { x: 114, y: 114, cursor: 'nwse-resize' },
      { x: 114, y: 115, cursor: 'nwse-resize' },
      { x: 114, y: 116, cursor: 'move' },
      { x: 114, y: 284, cursor: 'move' },
      { x: 114, y: 285, cursor: 'nesw-resize' },
      { x: 114, y: 286, cursor: 'nesw-resize' },
      { x: 114, y: 300, cursor: 'nesw-resize' },
      { x: 114, y: 301, cursor: '' },
      { x: 115, y: 84, cursor: '' },
      { x: 115, y: 85, cursor: 'nwse-resize' },
      { x: 115, y: 86, cursor: 'nwse-resize' },
      { x: 115, y: 114, cursor: 'nwse-resize' },
      { x: 115, y: 115, cursor: 'nwse-resize' },
      { x: 115, y: 116, cursor: 'move' },
      { x: 115, y: 284, cursor: 'move' },
      { x: 115, y: 285, cursor: 'nesw-resize' },
      { x: 115, y: 286, cursor: 'nesw-resize' },
      { x: 115, y: 300, cursor: 'nesw-resize' },
      { x: 115, y: 301, cursor: '' },
      { x: 116, y: 84, cursor: '' },
      { x: 116, y: 85, cursor: '' },
      { x: 116, y: 86, cursor: '' },
      { x: 116, y: 89, cursor: '' },
      { x: 116, y: 90, cursor: 'ns-resize' },
      { x: 116, y: 91, cursor: 'ns-resize' },
      { x: 116, y: 109, cursor: 'ns-resize' },
      { x: 116, y: 110, cursor: 'ns-resize' },
      { x: 116, y: 111, cursor: 'move' },
      { x: 116, y: 114, cursor: 'move' },
      { x: 116, y: 115, cursor: 'move' },
      { x: 116, y: 116, cursor: 'move' },
      { x: 116, y: 284, cursor: 'move' },
      { x: 116, y: 285, cursor: 'move' },
      { x: 116, y: 286, cursor: 'move' },
      { x: 116, y: 289, cursor: 'move' },
      { x: 116, y: 290, cursor: 'ns-resize' },
      { x: 116, y: 291, cursor: 'ns-resize' },
      { x: 116, y: 300, cursor: 'ns-resize' },
      { x: 116, y: 301, cursor: '' },
      { x: 284, y: 84, cursor: '' },
      { x: 284, y: 85, cursor: '' },
      { x: 284, y: 86, cursor: '' },
      { x: 284, y: 89, cursor: '' },
      { x: 284, y: 90, cursor: 'ns-resize' },
      { x: 284, y: 91, cursor: 'ns-resize' },
      { x: 284, y: 109, cursor: 'ns-resize' },
      { x: 284, y: 110, cursor: 'ns-resize' },
      { x: 284, y: 111, cursor: 'move' },
      { x: 284, y: 114, cursor: 'move' },
      { x: 284, y: 115, cursor: 'move' },
      { x: 284, y: 116, cursor: 'move' },
      { x: 284, y: 284, cursor: 'move' },
      { x: 284, y: 285, cursor: 'move' },
      { x: 284, y: 286, cursor: 'move' },
      { x: 284, y: 289, cursor: 'move' },
      { x: 284, y: 290, cursor: 'ns-resize' },
      { x: 284, y: 291, cursor: 'ns-resize' },
      { x: 284, y: 300, cursor: 'ns-resize' },
      { x: 284, y: 301, cursor: '' },
      { x: 285, y: 84, cursor: '' },
      { x: 285, y: 85, cursor: 'nesw-resize' },
      { x: 285, y: 86, cursor: 'nesw-resize' },
      { x: 285, y: 114, cursor: 'nesw-resize' },
      { x: 285, y: 115, cursor: 'nesw-resize' },
      { x: 285, y: 116, cursor: 'move' },
      { x: 285, y: 284, cursor: 'move' },
      { x: 285, y: 285, cursor: 'nwse-resize' },
      { x: 285, y: 286, cursor: 'nwse-resize' },
      { x: 285, y: 300, cursor: 'nwse-resize' },
      { x: 285, y: 301, cursor: '' },
      { x: 286, y: 84, cursor: '' },
      { x: 286, y: 85, cursor: 'nesw-resize' },
      { x: 286, y: 86, cursor: 'nesw-resize' },
      { x: 286, y: 114, cursor: 'nesw-resize' },
      { x: 286, y: 115, cursor: 'nesw-resize' },
      { x: 286, y: 116, cursor: 'move' },
      { x: 286, y: 284, cursor: 'move' },
      { x: 286, y: 285, cursor: 'nwse-resize' },
      { x: 286, y: 286, cursor: 'nwse-resize' },
      { x: 286, y: 300, cursor: 'nwse-resize' },
      { x: 286, y: 301, cursor: '' },
      { x: 289, y: 116, cursor: 'move' },
      { x: 289, y: 284, cursor: 'move' },
      { x: 290, y: 116, cursor: 'ew-resize' },
      { x: 290, y: 284, cursor: 'ew-resize' },
      { x: 291, y: 116, cursor: 'ew-resize' },
      { x: 291, y: 284, cursor: 'ew-resize' },
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

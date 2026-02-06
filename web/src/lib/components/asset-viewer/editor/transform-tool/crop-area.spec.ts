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
});

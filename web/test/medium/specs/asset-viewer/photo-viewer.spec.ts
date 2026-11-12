import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { Page } from '@playwright/test';

const zoomIn = async (page: Page) => {
  const { width, height } = page.viewportSize()!;
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.wheel(0, -1);
};

test.describe('photo viewer', () => {
  test('loads the original when zoomed and right-click targets the image', async ({ page, data, api, app }) => {
    const asset = factory.asset();
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await expect(app.viewer.image('preview')).toHaveAttribute('src', /.+/);

    const box = (await app.viewer.image('preview').boundingBox())!;
    const tagAtCenter = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    });
    expect(tagAtCenter).toBe('IMG');

    await zoomIn(page);
    await expect(app.viewer.image('original')).toHaveAttribute('src', /original/);
    expect(api.downloadAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id }) });
  });

  test('zoom loads the fullsize rendition for a non-web original', async ({ page, data, api, app }) => {
    const asset = factory.asset({ originalFileName: 'test.arw', originalMimeType: 'image/x-sony-arw' });
    data.addAssets(asset);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await expect(app.viewer.image('preview')).toHaveAttribute('src', /.+/);

    await zoomIn(page);
    await expect(app.viewer.image('original')).toHaveAttribute('src', /fullsize/);
    expect(api.viewAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id, size: 'fullsize' }) });
  });
});

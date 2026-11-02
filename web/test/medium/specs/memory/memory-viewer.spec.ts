import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';

test.describe('memory viewer', () => {
  test('walks through every asset across memories with buttons and arrow keys', async ({ page, data, app }) => {
    const assets = data.addTimeline({ years: 3 });
    data.addMemories(
      ...factory.memories(assets, [
        { year: 2024, assetCount: 3 },
        { year: 2023, assetCount: 2 },
        { year: 2022, assetCount: 4 },
      ]),
    );
    const memories = data.memoryList();
    const sequence = memories.flatMap((item) => item.assets);
    const [first] = memories;

    await page.goto(Route.viewMemory({ id: first.id, assetId: sequence[0].id }));
    await app.memory.gallery.open(sequence[0]);
    await app.viewer.waitForAsset(sequence[0]);
    await expect(app.viewer.previousButton).toHaveCount(0);
    await expect(app.viewer.nextButton).toBeVisible();

    for (const asset of sequence.slice(1)) {
      await app.viewer.nextButton.click();
      await app.viewer.waitForAsset(asset);
      await expect.poll(() => app.memory.currentAssetId()).toBe(asset.id);
      await expect(app.viewer.previousButton).toBeVisible();
    }
    await expect(app.viewer.nextButton).toHaveCount(0);

    await page.keyboard.press('ArrowLeft');
    await app.viewer.waitForAsset(sequence.at(-2)!);
    await page.keyboard.press('ArrowRight');
    await app.viewer.waitForAsset(sequence.at(-1)!);
  });

  test('a single-asset memory between other memories shows both buttons', async ({ page, data, app }) => {
    const assets = data.addTimeline({ years: 3 });
    const memories = factory.memories(
      assets,
      [
        { year: 2024, assetCount: 2 },
        { year: 2023, assetCount: 1 },
        { year: 2022, assetCount: 2 },
      ],
      123,
    );
    data.addMemories(...memories);
    const single = memories[1];
    await page.goto(Route.viewMemory({ id: single.id, assetId: single.assets[0].id }));
    await app.memory.gallery.open(single.assets[0]);
    await app.viewer.waitForAsset(single.assets[0]);

    await expect(app.viewer.previousButton).toBeVisible();
    await expect(app.viewer.nextButton).toBeVisible();
  });
});

import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory, validThumbhash } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { DateTime } from 'luxon';

const addMemories = (data: MockData, assetCounts: number[]) => {
  const memories = assetCounts.map((count, index) => {
    const assets = Array.from({ length: count }, () => factory.asset());
    data.addAssets(assets);
    return factory.memory({
      assets,
      memoryAt: DateTime.utc()
        .minus({ years: index + 1 })
        .toISO()!,
    });
  });
  data.addMemories(memories);
  return memories;
};

test.describe('memory viewer', () => {
  test('walks through every asset across memories with buttons and arrow keys', async ({ page, data, app }) => {
    const assets = data.addTimeline({ years: 3 });
    data.addMemories(
      factory.memories(assets, [
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
    data.addMemories(memories);
    const single = memories[1];
    await page.goto(Route.viewMemory({ id: single.id, assetId: single.assets[0].id }));
    await app.memory.gallery.open(single.assets[0]);
    await app.viewer.waitForAsset(single.assets[0]);

    await expect(app.viewer.previousButton).toBeVisible();
    await expect(app.viewer.nextButton).toBeVisible();
  });

  test('should restore scroll position when navigating from a memory back to the list', async ({ page, data, app }) => {
    const assets = Array.from({ length: 20 }, (_, i) =>
      factory.asset({ fileCreatedAt: `${2026 - i}-01-01T12:00:00.000Z` }),
    );

    data.addAssets(assets);
    data.addMemories(
      factory.memories(
        assets,
        assets.map(({ fileCreatedAt }) => ({ year: DateTime.fromISO(fileCreatedAt).year, assetCount: 1 })),
      ),
    );

    await page.goto(Route.memories());
    await app.memories.card().last().click();
    await app.memory.root.waitFor();
    await page.goBack();

    await expect(app.memories.card().last()).toBeInViewport();
  });

  test('favorites a memory', async ({ page, data, api, app }) => {
    const [memory] = addMemories(data, [2]);
    await page.goto(Route.viewMemory({ id: memory.id, assetId: memory.assets[0].id }));

    await app.memory.favoriteButton.click();

    await expect(app.memory.unfavoriteButton).toBeVisible();
    await expect(app.toast('added_to_favorites')).toBeVisible();
    expect(api.updateMemory).toHaveBeenCalledWith({ params: { id: memory.id }, body: { isSaved: true } });
  });

  test('removes a memory and shows the next one', async ({ page, data, api, app }) => {
    const [first, second] = addMemories(data, [2, 2]);
    await page.goto(Route.viewMemory({ id: first.id, assetId: first.assets[0].id }));

    await app.memory.removeMemory();

    await expect(app.toast('removed_memory')).toBeVisible();
    await expect.poll(() => app.memory.currentMemoryId()).toBe(second.id);
    expect(api.deleteMemory).toHaveBeenCalledWith({ params: { id: first.id } });
  });

  test('removes a photo from a memory', async ({ page, data, api, app }) => {
    const [memory] = addMemories(data, [2]);
    const [removed, kept] = memory.assets;
    await page.goto(Route.viewMemory({ id: memory.id, assetId: removed.id }));

    await app.memory.removePhoto();

    await expect.poll(() => app.memory.currentAssetId()).toBe(kept.id);
    expect(api.removeMemoryAssets).toHaveBeenCalledWith({ params: { id: memory.id }, body: { ids: [removed.id] } });
  });

  test('removing the last photo removes the memory', async ({ page, data, api, app }) => {
    const [single, next] = addMemories(data, [1, 2]);
    await page.goto(Route.viewMemory({ id: single.id, assetId: single.assets[0].id }));

    await app.memory.removePhoto();

    await expect.poll(() => app.memory.currentMemoryId()).toBe(next.id);
    expect(api.deleteMemory).toHaveBeenCalledWith({ params: { id: single.id } });
    expect(api.removeMemoryAssets).not.toHaveBeenCalled();
  });

  test('opens a memory past the first page', async ({ page, data, api, app }) => {
    const memories = addMemories(
      data,
      Array.from({ length: 251 }, () => 1),
    );
    const oldest = memories.at(-1)!;

    await page.goto(Route.viewMemory({ id: oldest.id, assetId: oldest.assets[0].id }));

    await expect(app.memory.root).toBeVisible();
    expect(app.memory.currentMemoryId()).toBe(oldest.id);
    expect(api.searchMemories).toHaveBeenCalledWith({ params: { id: oldest.id } });
  });

  test('goes to the memories list for an unknown memory', async ({ page, data }) => {
    addMemories(data, [1]);

    await page.goto(Route.viewMemory({ id: crypto.randomUUID(), assetId: crypto.randomUUID() }));

    await expect(page).toHaveURL(Route.memories());
  });

  test('shows the photo with its thumbhash cache key', async ({ page, data, app }) => {
    const [memory] = addMemories(data, [1]);

    await page.goto(Route.viewMemory({ id: memory.id, assetId: memory.assets[0].id }));

    await expect(app.memory.photo).toHaveAttribute('src', new RegExp(`c=${validThumbhash}`));
  });

  test('closes a memory opened from a link', async ({ page, data, app }) => {
    const [memory] = addMemories(data, [1, 1]);
    await page.goto(Route.viewMemory({ id: memory.id, assetId: memory.assets[0].id }));
    await expect(app.memory.root).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page).toHaveURL(Route.memories());
    await expect(app.memories.card()).toHaveCount(2);
  });

  test('keeps the shown photos when favoriting', async ({ page, data, api, app }) => {
    const [memory] = addMemories(data, [2]);
    const hidden = factory.asset();
    data.addAssets(hidden);
    api.on({
      updateMemory: ({ params, body }) => ({
        json: { ...data.updateMemory(params.id, body)!, assets: [...memory.assets, hidden] },
      }),
    });
    await page.goto(Route.viewMemory({ id: memory.id, assetId: memory.assets[0].id }));

    await app.memory.favoriteButton.click();

    await expect(app.memory.unfavoriteButton).toBeVisible();
    await expect(app.memory.gallery.thumbnail(memory.assets[1])).toHaveCount(1);
    await expect(app.memory.gallery.thumbnail(hidden)).toHaveCount(0);
    expect(api.updateMemory).toHaveBeenCalledWith({ params: { id: memory.id }, body: { isSaved: true } });
  });
});

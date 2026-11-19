import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory, validThumbhash } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { DateTime } from 'luxon';

const addMemories = (data: MockData, saved: boolean[]) => {
  const memories = saved.map((isSaved, index) => {
    const asset = factory.asset();
    data.addAssets(asset);
    return factory.memory({
      assets: [asset],
      isSaved,
      memoryAt: DateTime.utc()
        .minus({ years: index + 1 })
        .toISO()!,
    });
  });
  data.addMemories(memories);
  return memories;
};

test.describe('memories', () => {
  test('shows every memory with the total count', async ({ page, data, app }) => {
    addMemories(data, [false, false, true]);

    await page.goto(Route.memories());

    await expect(app.memories.card()).toHaveCount(3);
    await expect(app.text('(3)')).toBeVisible();
  });

  test('shows only favorite memories when filtered', async ({ page, data, api, app }) => {
    const [, saved] = addMemories(data, [false, true, false]);
    await page.goto(Route.memories());
    await expect(app.memories.card()).toHaveCount(3);

    await app.memories.filtersButton.click();
    await app.memories.onlyFavoritesSwitch.click();
    await app.memories.saveFiltersButton.click();

    await expect(app.memories.card()).toHaveCount(1);
    await expect(app.memories.card()).toHaveAttribute('href', new RegExp(saved.id));
    await expect(app.text('(1)')).toBeVisible();
    expect(api.searchMemories).toHaveBeenCalledWith({ params: expect.objectContaining({ isSaved: true }) });
  });

  test('shows the cover with its thumbhash cache key', async ({ page, data, app }) => {
    addMemories(data, [false]);

    await page.goto(Route.memories());

    await expect(app.memories.cover(0)).toHaveAttribute('src', new RegExp(`c=${validThumbhash}`));
  });

  test('includes a memory favorited in the viewer when filtering favorites', async ({ page, data, api, app }) => {
    const [memory] = addMemories(data, [false]);
    await page.goto(Route.memories());
    await app.memories.filtersButton.click();
    await app.memories.onlyFavoritesSwitch.click();
    await app.memories.saveFiltersButton.click();
    await expect(app.memories.card()).toHaveCount(0);
    await app.memories.filtersButton.click();
    await app.memories.onlyFavoritesSwitch.click();
    await app.memories.saveFiltersButton.click();
    await app.memories.card().first().click();
    await app.memory.favoriteButton.click();
    await expect(app.memory.unfavoriteButton).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(Route.memories());

    await app.memories.filtersButton.click();
    await app.memories.onlyFavoritesSwitch.click();
    await app.memories.saveFiltersButton.click();

    await expect(app.memories.card()).toHaveCount(1);
    await expect(app.memories.card()).toHaveAttribute('href', new RegExp(memory.id));
    expect(api.updateMemory).toHaveBeenCalledWith({ params: { id: memory.id }, body: { isSaved: true } });
  });
});

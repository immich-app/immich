import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import { adjacentYearMonths, yearMonthOf, yearMonthsOf } from '#test/common/timeline.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { MockNetwork } from '#test/medium/mocks/api.ts';
import type { Page } from '@playwright/test';

const addTrash = (data: MockData) => {
  const assets = data.addTimeline({ years: 1 });
  data.deleteAssets(assets.map(({ id }) => id));
  return assets;
};

const trashAt = (id: string) => `${Route.trash()}?at=${id}`;

const permanentDeletes = [
  {
    name: 'the permanently delete button',
    run: (_: Page, app: App) => app.timeline.selectionBar.permanentlyDeleteButton.click(),
  },
  { name: 'the delete key', run: (page: Page) => page.keyboard.press('Delete') },
  { name: 'shift delete', run: (page: Page) => page.keyboard.press('Shift+Delete') },
];

const headerActions = [
  {
    name: 'restore all',
    button: (app: App) => app.trash.restoreAllButton,
    toast: 'assets_restored_count',
    sent: (api: MockNetwork) => expect(api.restoreTrash).toHaveBeenCalled(),
  },
  {
    name: 'empty trash',
    button: (app: App) => app.trash.emptyTrashButton,
    toast: 'assets_permanently_deleted_count',
    sent: (api: MockNetwork) => expect(api.emptyTrash).toHaveBeenCalled(),
  },
];

test.describe('/trash', () => {
  test('shows only trashed assets', async ({ page, data, app }) => {
    const [trashed, kept] = data.addTimeline({ years: 1 });
    data.deleteAssets([trashed.id]);

    await page.goto(Route.trash());

    await expect(app.timeline.thumbnail(trashed)).toBeVisible();
    await expect(app.timeline.thumbnail(kept)).toHaveCount(0);
  });

  test('shows every asset of a trashed stack without a stack icon', async ({ page, data, app }) => {
    const [primary, second] = [factory.asset(), factory.asset()];
    data.addStacks(factory.stack({ assets: [primary, second] })).deleteAssets([primary.id, second.id]);

    await page.goto(Route.trash());

    await expect(app.timeline.thumbnail(second)).toBeVisible();
    await expect(app.timeline.thumbnail(primary)).toBeVisible();
    await expect(app.timeline.stackIcon(primary)).toHaveCount(0);
  });

  test('deep link to an asset and to the last asset', async ({ page, data, app }) => {
    const assets = addTrash(data);
    for (const asset of [assets[300], assets.at(-1)!]) {
      await page.goto(trashAt(asset.id));
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    }
  });

  test('click the scrubber to jump to a month', async ({ page, data, app }) => {
    const assets = addTrash(data);
    await page.goto(Route.trash());
    const month = yearMonthOf(assets.at(-1)!);
    const nearby = new Set(adjacentYearMonths(month));
    const renderedNearby = async () => {
      const rendered = await app.timeline.renderedMonths();
      return rendered.some((yearMonth) => nearby.has(yearMonth));
    };

    await app.timeline.scrubber(month).click({ force: true });

    await expect.poll(renderedNearby).toBe(true);
  });

  test('arrow keys move the focus between thumbnails', async ({ page, data, app }) => {
    const assets = addTrash(data);
    await page.goto(Route.trash());
    await app.timeline.thumbnail(assets[0]).focus();

    await page.keyboard.press('ArrowRight');
    await expect(app.timeline.thumbnail(assets[1])).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(app.timeline.thumbnail(assets[0])).toBeFocused();
  });

  test.describe('viewer', () => {
    test('next and previous skip assets outside the trash', async ({ page, data, app }) => {
      const [first, _, second] = data.addTimeline({ years: 1 });
      data.deleteAssets([first.id, second.id]);
      await page.goto(Route.trash());
      await app.timeline.thumbnail(first).click();
      await app.viewer.waitForAsset(first);

      await app.viewer.nextButton.click();
      await app.viewer.waitForAsset(second);
      await expect(page).toHaveURL(Route.viewTrashedAsset({ id: second.id }));
      await app.viewer.previousButton.click();
      await app.viewer.waitForAsset(first);
      await expect(page).toHaveURL(Route.viewTrashedAsset({ id: first.id }));
    });

    test('closing the viewer keeps the scroll position', async ({ page, data, app }) => {
      const asset = addTrash(data)[300];
      await page.goto(trashAt(asset.id));
      const scrollTopBefore = await app.timeline.scrollTop();
      await app.timeline.thumbnail(asset).click();
      await app.viewer.waitForAsset(asset);

      await app.viewer.backButton.click();

      await expect(page).toHaveURL(trashAt(asset.id));
      expect(Math.abs((await app.timeline.scrollTop()) - scrollTopBefore)).toBeLessThan(5);
    });

    test('closing a deep linked asset lands on it in the trash', async ({ page, data, app }) => {
      const asset = addTrash(data)[300];
      await page.goto(Route.viewTrashedAsset({ id: asset.id }));
      await app.viewer.waitForAsset(asset);

      await app.viewer.backButton.click();

      await expect(page).toHaveURL(trashAt(asset.id));
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    });
  });

  test.describe('selection', () => {
    test('escape clears the selection', async ({ page, data, app }) => {
      const [asset] = addTrash(data);
      await page.goto(Route.trash());
      await app.timeline.select(asset);
      await expect(app.trash.restoreAllButton).toHaveCount(0);

      await page.keyboard.press('Escape');

      await expect(app.timeline.selected).toHaveCount(0);
      await expect(app.trash.restoreAllButton).toBeVisible();
    });

    test('shift-click selects a range across days', async ({ page, data, app }) => {
      const assets = addTrash(data);
      await page.goto(Route.trash());
      await app.timeline.select(assets[0]);

      await app.timeline.thumbnail(assets[6]).click({ modifiers: ['Shift'] });

      await expect(app.timeline.selected).toHaveCount(7);
    });

    test('select day, unselect day', async ({ page, data, app }) => {
      const assets = addTrash(data);
      const day = (asset: { fileCreatedAt: string }) => asset.fileCreatedAt.slice(0, 10);
      const asset = assets.find((candidate) => assets.filter((other) => day(other) === day(candidate)).length <= 4)!;
      const dayCount = assets.filter((other) => day(other) === day(asset)).length;
      await page.goto(Route.trash());

      await app.timeline.selectDay(asset);
      await expect(app.timeline.selected).toHaveCount(dayCount);
      await app.timeline.selectDay(asset);
      await expect(app.timeline.selected).toHaveCount(0);
    });

    test('select all restores every month', async ({ page, data, api, app }) => {
      const assets = addTrash(data);
      await page.goto(Route.trash());
      await app.timeline.select(assets[0]);
      await app.timeline.selectionBar.selectAllButton.click();
      await expect
        .poll(() => new Set(api.getTimeBucket.calls.map(({ params }) => params.timeBucket)).size)
        .toBe(yearMonthsOf(assets).length);

      await app.timeline.selectionBar.restoreButton.click();

      await expect(app.timeline.thumbnails).toHaveCount(0);
      await expect(app.trash.restoreAllButton).toHaveCount(0);
      expect(api.restoreAssets).toHaveBeenCalledWith({
        body: { ids: expect.arrayContaining(assets.map(({ id }) => id)) },
      });
    });

    test('restores only the selected asset', async ({ page, data, api, app }) => {
      const [asset, other] = addTrash(data);
      await page.goto(Route.trash());
      await app.timeline.select(asset);

      await app.timeline.selectionBar.restoreButton.click();

      await expect(app.toast('assets_restored_count')).toBeVisible();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      await expect(app.timeline.thumbnail(other)).toBeVisible();
      expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
    });

    for (const { name, run } of permanentDeletes) {
      test(`${name} permanently deletes the selection after confirmation`, async ({ page, data, api, app }) => {
        const [asset, other] = addTrash(data);
        await page.goto(Route.trash());
        await app.timeline.select(asset);

        await run(page, app);
        await app.dialogButton('delete').click();

        await expect(app.toast('assets_permanently_deleted_count')).toBeVisible();
        await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
        await expect(app.timeline.thumbnail(other)).toBeVisible();
        expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: true } });
      });
    }
  });

  for (const { name, button, toast, sent } of headerActions) {
    test(`${name} shows its toast`, async ({ page, data, api, app }) => {
      const [asset] = addTrash(data);
      await page.goto(Route.trash());
      await expect(app.timeline.thumbnail(asset)).toBeVisible();

      await button(app).click();
      await app.dialogButton('confirm').click();

      await expect(app.toast(toast)).toBeVisible();
      sent(api);
    });
  }
});

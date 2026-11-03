import { Route } from '#lib/route.ts';
import type { Rect } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';
import type { AssetResponseDto, PersonResponseDto } from '@immich/sdk';

const names = [
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  'Diana Prince',
  'Eve Adams',
  'Frank Castle',
  'Grace Lee',
  'Hank Pym',
];

const expectInside = (rect: Rect, viewport: { width: number; height: number }) => {
  expect(rect.top).toBeGreaterThanOrEqual(0);
  expect(rect.left).toBeGreaterThanOrEqual(0);
  expect(rect.top + rect.height).toBeLessThanOrEqual(viewport.height);
  expect(rect.left + rect.width).toBeLessThanOrEqual(viewport.width);
};

test.describe('face editor', () => {
  let asset: AssetResponseDto;
  let people: PersonResponseDto[];

  test.beforeEach(async ({ page, data, app }) => {
    asset = factory.asset({ width: 4000, height: 3000 });
    people = names.map((name) => factory.person({ name }));
    data.addAsset(asset).addPeople(...people);
    await page.goto(Route.viewAsset({ id: asset.id }));
    await app.viewer.waitForAsset(asset);
    await app.viewer.openDetailPanel();
    await app.viewer.faceEditor.open();
  });

  test('lists people and filters them by name', async ({ app }) => {
    await expect(app.viewer.faceEditor.canvas).toBeVisible();
    for (const name of names) {
      await expect(app.viewer.faceEditor.person(name)).toBeVisible();
    }

    await app.viewer.faceEditor.search.fill('Alice');
    await expect(app.viewer.faceEditor.person('Alice Johnson')).toBeVisible();
    await expect(app.viewer.faceEditor.person('Bob Smith')).toBeHidden();

    await app.viewer.faceEditor.search.fill('Nonexistent Person XYZ');
    for (const name of names) {
      await expect(app.viewer.faceEditor.person(name)).toBeHidden();
    }

    await app.viewer.faceEditor.search.clear();
    for (const name of names) {
      await expect(app.viewer.faceEditor.person(name)).toBeVisible();
    }
  });

  test('tags the selected person after confirming', async ({ page, api, app }) => {
    const [alice] = people;
    await app.viewer.faceEditor.person(alice.name).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await app.viewer.faceEditor.confirmButton.click();

    await expect(app.viewer.faceEditor.selector).toBeHidden();
    await expect(app.viewer.faceEditor.canvas).toBeHidden();
    expect(api.createFace).toHaveBeenCalledWith({
      body: expect.objectContaining({ assetId: asset.id, personId: alice.id }),
    });
  });

  test('cancel closes the editor without tagging', async ({ api, app }) => {
    await app.viewer.faceEditor.cancelButton.click();
    await expect(app.viewer.faceEditor.selector).toBeHidden();
    await expect(app.viewer.faceEditor.canvas).toBeHidden();
    expect(api.createFace).not.toHaveBeenCalled();
  });

  test('selector avoids the face box and stays within the viewport while dragging', async ({ page, app }) => {
    const viewport = page.viewportSize()!;
    expect(await app.viewer.faceEditor.overlapArea()).toBe(0);
    expectInside(await app.viewer.faceEditor.selectorRect(), viewport);

    for (const [deltaX, deltaY] of [
      [0, 150],
      [200, 0],
      [-300, -300],
      [300, 300],
      [-400, -400],
    ]) {
      await app.viewer.faceEditor.dragBox(deltaX, deltaY);
      expect(await app.viewer.faceEditor.overlapArea()).toBe(0);
      expectInside(await app.viewer.faceEditor.selectorRect(), viewport);
    }
  });

  test('face box is draggable', async ({ app }) => {
    const before = await app.viewer.faceEditor.boxRect();
    await app.viewer.faceEditor.dragBox(100, 50);
    const after = await app.viewer.faceEditor.boxRect();

    expect(after.left).toBeGreaterThan(before.left + 50);
    expect(after.top).toBeGreaterThan(before.top + 20);
  });
});

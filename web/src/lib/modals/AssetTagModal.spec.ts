import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import type { Mock } from '#test/unit/mocks/mock.ts';
import type { TagResponseDto, TagsForAssetsResponseDto } from '@immich/sdk';
import { modalManager } from '@immich/ui';
import { tick } from 'svelte';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import AssetTagModal from './AssetTagModal.svelte';

const simpleTag = factory.tag({ id: 'tag-id', name: 'Tag', value: 'Tag' });
const parentTag = factory.tag({ id: 'tag-id-parent', name: 'TagParent', value: 'TagParent' });
const childTag = factory.tag({
  id: 'tag-id-child',
  name: 'TagChild',
  value: 'TagParent/TagChild',
  parentId: parentTag.id,
});
const tags = [simpleTag, parentTag, childTag];
const pills = () => page.getByTestId('tag-pill-label');
const options = () => page.getByRole('option');
const combobox = () => page.getByRole('combobox');
const save = () => page.getByRole('button', { name: 'save tags' });
const saveChanges = async () => {
  (save().element() as HTMLElement).focus();
  await tick();
  await save().click();
};

const setup = async (
  api: Mock['api'],
  settle: Mock['settle'],
  assetIds = ['asset-id'],
  assignments: TagsForAssetsResponseDto[] = [],
  allTags: TagResponseDto[] = tags,
) => {
  api.on({ getAllTags: () => ({ json: allTags }), queryTagsForAssets: () => ({ json: assignments }) });
  const onClose = vi.fn();
  await render(AssetTagModal, { assetIds, onClose });
  await settle();
  expect(api.queryTagsForAssets).toHaveBeenCalledWith({ body: { assetIds } });
  await expect.element(combobox()).toBeEnabled();
  return onClose;
};

const openOptions = async () => {
  await combobox().click();
};

const expectOptions = (values: string[]) => {
  expect(
    options()
      .elements()
      .map((element) => element.textContent?.trim()),
  ).toEqual(values);
};

test('renders available tags and no pills when no tags are assigned', async ({ api, settle }) => {
  await setup(api, settle);
  expect(pills().elements()).toHaveLength(0);
  await openOptions();
  expectOptions(tags.map(({ value }) => value));
});

test('renders existing tags and returns removed tags to the combobox', async ({ api, settle }) => {
  await setup(
    api,
    settle,
    ['asset-id'],
    [
      { tagId: simpleTag.id, assetIds: ['asset-id'] },
      { tagId: parentTag.id, assetIds: ['asset-id'] },
    ],
  );
  expect(
    pills()
      .elements()
      .map((element) => element.textContent?.trim()),
  ).toEqual([simpleTag.value, parentTag.value]);
  await page.getByTestId('tag-pill-remove-button').first().click();
  expect(
    pills()
      .elements()
      .map((element) => element.textContent?.trim()),
  ).toEqual([parentTag.value]);
  await openOptions();
  expectOptions([simpleTag.value, childTag.value]);
});

test('moves selected options into pills', async ({ api, settle }) => {
  await setup(api, settle);
  await openOptions();
  await options().first().click();
  await expect.element(pills().first()).toHaveTextContent(simpleTag.value);
  await openOptions();
  expectOptions([parentTag.value, childTag.value]);
  await options().first().click();
  expect(
    pills()
      .elements()
      .map((element) => element.textContent?.trim()),
  ).toEqual([simpleTag.value, parentTag.value]);
  await openOptions();
  expectOptions([childTag.value]);
});

test('shows partial tags and allows them to be promoted to full tags', async ({ api, settle }) => {
  await setup(
    api,
    settle,
    ['asset-id', 'asset-id2'],
    [
      { tagId: simpleTag.id, assetIds: ['asset-id', 'asset-id2'] },
      { tagId: parentTag.id, assetIds: ['asset-id'] },
    ],
  );
  await expect.element(pills().first()).toHaveClass('bg-primary');
  await expect.element(pills().nth(1)).toHaveClass('bg-gray-500');
  await openOptions();
  expectOptions([parentTag.value, childTag.value]);
  await options().first().click();
  await expect.element(pills().nth(1)).toHaveClass('bg-primary');
  await openOptions();
  expectOptions([childTag.value]);
});

test('filters available tags', async ({ api, settle }) => {
  await setup(api, settle);
  await combobox().fill('TagParent');
  expectOptions([parentTag.value, childTag.value]);
});

test('creates a new tag and selects it', async ({ api, settle }) => {
  const newTag = factory.tag({ id: 'new-tag-id', name: 'NewTag', value: 'NewTag' });
  const allTags = [...tags];
  await setup(api, settle, ['asset-id'], [], allTags);
  api.on({
    upsertTags: () => {
      allTags.push(newTag);
      return { json: [newTag] };
    },
  });
  await combobox().fill('NewTag');
  await userEvent.keyboard('{Enter}');
  await settle();
  expect(api.upsertTags).toHaveBeenCalledWith({ body: { tags: ['NewTag'] } });
  await expect.element(pills().first()).toHaveTextContent('NewTag');
  await expect.element(pills().first()).toHaveClass('bg-primary');
});

for (const { count, confirmed } of [
  { count: 40, confirmed: true },
  { count: 41, confirmed: true },
  { count: 41, confirmed: false },
]) {
  test(`saves tags for ${count} assets when confirmation is ${confirmed}`, async ({ api, settle }) => {
    const showDialog = vi
      .spyOn(modalManager, 'showDialog')
      .mockReturnValueOnce(Promise.resolve(confirmed) as ReturnType<typeof modalManager.showDialog>);
    try {
      const assetIds = Array.from({ length: count }, (_, index) => `asset-id-${index}`);
      const onClose = await setup(api, settle, assetIds);
      await openOptions();
      await options().first().click();
      await saveChanges();
      await settle();
      if (count > 40) {
        await vi.waitFor(() =>
          expect(showDialog).toHaveBeenCalledExactlyOnceWith({ prompt: 'modify_tags_confirmation' }),
        );
      } else {
        expect(showDialog).not.toHaveBeenCalled();
      }
      if (confirmed) {
        expect(api.bulkTagUntagAssets).toHaveBeenCalledWith({
          body: { assetIds, tagIdsToAdd: [simpleTag.id], tagIdsToRemove: [] },
        });
        await vi.waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
      } else {
        expect(api.bulkTagUntagAssets).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
      }
    } finally {
      showDialog.mockRestore();
    }
  });
}

test('saves a promoted partial tag', async ({ api, settle }) => {
  const assetIds = ['asset-id', 'asset-id2'];
  const onClose = await setup(api, settle, assetIds, [{ tagId: simpleTag.id, assetIds: ['asset-id'] }]);
  await openOptions();
  await options().first().click();
  await saveChanges();
  await settle();
  expect(api.bulkTagUntagAssets).toHaveBeenCalledWith({
    body: { assetIds, tagIdsToAdd: [simpleTag.id], tagIdsToRemove: [] },
  });
  await vi.waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
});

test('keeps the modal open when saving a promoted partial tag fails', async ({ api, settle, logger }) => {
  const assetIds = ['asset-id', 'asset-id2'];
  const onClose = await setup(api, settle, assetIds, [{ tagId: simpleTag.id, assetIds: ['asset-id'] }]);
  api.on({ bulkTagUntagAssets: () => ({ status: 500, json: { message: 'Failed', statusCode: 500 } }) });
  await openOptions();
  await options().first().click();
  await saveChanges();
  await settle();
  expect(api.bulkTagUntagAssets).toHaveBeenCalledWith({
    body: { assetIds, tagIdsToAdd: [simpleTag.id], tagIdsToRemove: [] },
  });
  expect(onClose).not.toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith(/\[handleError\].*500/);
});

test('closes without updating when full and partial tags are unchanged', async ({ api, settle }) => {
  const assetIds = ['asset-id', 'asset-id2'];
  const onClose = await setup(api, settle, assetIds, [
    { tagId: simpleTag.id, assetIds },
    { tagId: parentTag.id, assetIds: ['asset-id'] },
  ]);
  await save().click();
  expect(api.bulkTagUntagAssets).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledExactlyOnceWith(false);
});

test('saves only added and removed tag ids, leaving unchanged partial tags alone', async ({ api, settle }) => {
  const addedTag1 = factory.tag({ id: 'tag-id-added1', name: 'TagAdded1', value: 'TagAdded1' });
  const addedTag2 = factory.tag({ id: 'tag-id-added2', name: 'TagAdded2', value: 'TagAdded2' });
  const assetIds = ['asset-id', 'asset-id2', 'asset-id3'];
  const onClose = await setup(
    api,
    settle,
    assetIds,
    [
      { tagId: simpleTag.id, assetIds },
      { tagId: parentTag.id, assetIds: ['asset-id', 'asset-id2'] },
      { tagId: childTag.id, assetIds: ['asset-id'] },
    ],
    [...tags, addedTag1, addedTag2],
  );
  await page.getByTestId('tag-pill-remove-button').nth(0).click();
  await page.getByTestId('tag-pill-remove-button').nth(0).click();
  await openOptions();
  expect(options().elements()).toHaveLength(5);
  await page.getByRole('option', { name: addedTag2.value }).click();
  await openOptions();
  expect(options().elements()).toHaveLength(4);
  await page.getByRole('option', { name: addedTag1.value }).click();
  await saveChanges();
  await settle();
  expect(api.bulkTagUntagAssets).toHaveBeenCalledWith({
    body: { assetIds, tagIdsToAdd: [addedTag2.id, addedTag1.id], tagIdsToRemove: [simpleTag.id, parentTag.id] },
  });
  await vi.waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith(true));
});

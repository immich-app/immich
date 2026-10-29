import type { MockData } from '#test/medium/mock/data.ts';
import type { AssetResponseDto, IntegrityReport } from '@immich/sdk';
import { expect, type Page } from '@playwright/test';
import { DateTime } from 'luxon';

type Asset = Pick<AssetResponseDto, 'id'>;

export type Rect = { top: number; left: number; width: number; height: number };

export const createApp = (page: Page, data: MockData) => {
  const link = (name: string) => page.getByRole('link', { name, exact: true });
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const labelled = (name: string) => page.getByLabel(name, { exact: true });

  const viewer = createViewer(page);
  const memoryRoot = page.locator('#memory-viewer');
  const memoryGallery = page.locator('#gallery-memory');

  return {
    admin: {
      maintenance: {
        checkAllButton: button('admin.maintenance_integrity_check_all'),
        reportCount: (report: IntegrityReport) =>
          page
            .getByText(`admin.maintenance_integrity_${report}`, { exact: true })
            .locator('xpath=ancestor::div[2]')
            .locator('.font-mono')
            .first(),
      },
      users: {
        createUserButton: button('create_user'),
        form: {
          emailInput: labelled('email'),
          passwordInput: labelled('password'),
          confirmPasswordInput: labelled('confirm_password'),
          nameInput: labelled('name'),
          adminSwitch: labelled('admin.admin_user'),
          createButton: button('create'),
          saveButton: button('save'),
        },
      },
    },

    album: {
      mapButton: labelled('map'),
      mapDialog: page.getByRole('dialog'),
      mapMarkers: page.getByRole('dialog').locator('.maplibregl-marker'),
    },

    memory: {
      root: memoryRoot,
      gallery: {
        root: memoryGallery,
        thumbnail: (asset: Asset) =>
          memoryGallery.locator(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`),
        open: async (asset: Asset) => {
          await expect(memoryRoot).toBeVisible();
          const showGallery = labelled('show_gallery');
          if (await showGallery.isVisible()) {
            await showGallery.click();
          }
          await expect(memoryGallery).toBeInViewport();
          await memoryGallery.locator(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`).click();
          await expect(viewer.root).toBeVisible();
        },
      },
      currentAssetId: () => {
        const url = new URL(page.url());
        return url.pathname.match(/\/memories\/[^/]+\/photos\/([^/]+)/)?.[1] ?? url.searchParams.get('assetId');
      },
    },

    sharedLink: {
      passwordInput: page.getByPlaceholder('Password'),
      submitButton: button('submit'),
      showPasswordButton: labelled('show_password'),
      hidePasswordButton: labelled('hide_password'),
      downloadButton: labelled('download'),
      removeFromSharedLinkButton: labelled('remove_from_shared_link'),
      notFoundHeading: page.getByRole('heading', { name: /errors\.page_not_found/ }),
      homeLink: page.locator('a[href="/"]'),
      heading: (name: string) => page.getByRole('heading', { name }),
      confirmRemove: () => button('remove').click(),
    },

    sidebar: {
      photosLink: link('photos'),
      favoritesLink: link('favorites'),
      archiveLink: link('archive'),
      trashLink: link('trash'),
    },

    timeline: createTimeline(page, data),

    viewer,
  };
};

export type App = ReturnType<typeof createApp>;

const createTimeline = (page: Page, data: MockData) => {
  const grid = page.locator('#asset-grid');
  const thumbnails = page.locator('[data-thumbnail-focus-container]');
  const thumbnail = (asset: Asset) => page.locator(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`);

  const alignedWith = (asset: Asset, edge: 'top' | 'bottom') =>
    expect(async () => {
      const box = (await thumbnail(asset).boundingBox())!;
      const gridBox = (await grid.boundingBox())!;
      if (edge === 'top') {
        expect(box.y).toBeCloseTo(gridBox.y, 0);
      } else {
        expect(box.y + box.height).toBeCloseTo(gridBox.y + gridBox.height, 0);
      }
    }).toPass();

  return {
    grid,
    thumbnails,
    thumbnail,
    selected: page.locator('[data-thumbnail-focus-container][data-selected]'),
    addPhotosButton: page.getByLabel('add_photos', { exact: true }),
    selectionBar: {
      favoriteButton: page.getByLabel('to_favorite', { exact: true }),
      unfavoriteButton: page.getByLabel('remove_from_favorites', { exact: true }),
      unarchiveButton: page.getByLabel('unarchive', { exact: true }),
      restoreButton: page.getByRole('button', { name: 'restore', exact: true }),
      // TODO: wire the app translations into the @immich/ui ControlBar so this can target the `close` key
      closeButton: page.locator('#control-bar').getByLabel('Close'),

      archive: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'to_archive', exact: true }).click();
      },

      trash: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'delete', exact: true }).click();
      },
    },
    disabledSelection: (asset: Asset) => thumbnail(asset).and(page.locator('[data-selected][data-disabled]')),
    favoriteIcon: (asset: Asset) => thumbnail(asset).locator('[data-icon-favorite]'),
    archiveIcon: (asset: Asset) => thumbnail(asset).locator('[data-icon-archive]'),
    scrubber: (yearMonth: string) => page.locator(`[data-segment-year-month="${yearMonth}"]`),

    select: async (asset: Asset) => {
      await thumbnail(asset).hover();
      await thumbnail(asset).locator('button[role="checkbox"]').click();
    },

    selectDay: async (asset: AssetResponseDto) => {
      const title = DateTime.fromISO(asset.fileCreatedAt, { zone: 'utc' }).toLocaleString(
        DateTime.DATE_MED_WITH_WEEKDAY,
        { locale: 'en-US' },
      );
      const section = page.getByTitle(title).locator('xpath=ancestor::section[@data-group]');
      await section.hover();
      await section.locator('.w-8').click();
    },

    goToDate: async (asset: AssetResponseDto) => {
      await grid.hover();
      await page.keyboard.press('g');
      const value = DateTime.fromISO(asset.fileCreatedAt, { zone: 'utc' }).toFormat('MMddyyyy,hh:mm:ss.SSSa');
      await page.locator('#datetime').pressSequentially(value);
      await page.getByRole('button', { name: 'confirm', exact: true }).click();
    },

    scrollTop: async () => {
      const read = () => grid.evaluate((element) => element.scrollTop);
      await expect.poll(read).toBeGreaterThan(0);
      return read();
    },

    renderedMonths: async () => {
      const ids = await thumbnails.evaluateAll((elements) =>
        elements
          .filter((element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          })
          .map((element) => (element as HTMLElement).dataset.asset ?? ''),
      );
      return ids.map((id) => {
        const date = DateTime.fromISO(data.getAsset(id)!.fileCreatedAt, { zone: 'utc' });
        return `${date.year}-${date.month}`;
      });
    },

    expectAtTop: (asset: Asset) => alignedWith(asset, 'top'),
    expectAtBottom: (asset: Asset) => alignedWith(asset, 'bottom'),
  };
};

const createFaceEditor = (page: Page) => {
  const selector = page.locator('#face-selector');
  const canvas = page.locator('#face-editor');
  const data = page.locator('#face-editor-data');

  const boxRect = async (): Promise<Rect> => {
    await expect(data).toHaveAttribute('data-face-left', /^-?\d+/);
    await expect(data).toHaveAttribute('data-face-top', /^-?\d+/);
    await expect(data).toHaveAttribute('data-face-width', /^[1-9]/);
    await expect(data).toHaveAttribute('data-face-height', /^[1-9]/);
    const canvasBox = (await canvas.boundingBox())!;
    return {
      top: canvasBox.y + Number(await data.getAttribute('data-face-top')),
      left: canvasBox.x + Number(await data.getAttribute('data-face-left')),
      width: Number(await data.getAttribute('data-face-width')),
      height: Number(await data.getAttribute('data-face-height')),
    };
  };

  const selectorRect = async (): Promise<Rect> => {
    const box = (await selector.boundingBox())!;
    return { top: box.y, left: box.x, width: box.width, height: box.height };
  };

  return {
    selector,
    canvas,
    search: selector.locator('input'),
    confirmButton: page.getByRole('button', { name: 'confirm', exact: true }),
    cancelButton: page.getByRole('button', { name: 'cancel', exact: true }),
    person: (name: string) => selector.getByText(name),
    boxRect,
    selectorRect,

    open: async () => {
      await page.getByLabel('tag_people', { exact: true }).click();
      await expect(selector).toBeVisible();
      await page.waitForFunction(
        () => {
          const element = document.querySelector('#face-selector');
          return (
            element !== null &&
            element.getAnimations({ subtree: false }).every((animation) => animation.playState === 'finished')
          );
        },
        undefined,
        { timeout: 1000, polling: 50 },
      );
    },

    overlapArea: async () => {
      const a = await boxRect();
      const b = await selectorRect();
      const overlapX = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
      const overlapY = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
      return overlapX * overlapY;
    },

    dragBox: async (deltaX: number, deltaY: number) => {
      const box = await boxRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + deltaX, centerY + deltaY, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    },
  };
};

const createViewer = (page: Page) => {
  const root = page.locator('#immich-asset-viewer');
  const content = page.locator('[data-viewer-content]');
  const detailPanel = page.locator('#detail-panel');
  const stack = page.locator('#stack-slideshow');
  const ocrImage = content.locator('img[draggable="false"]');

  const media = (asset: Asset) =>
    content
      .locator(`img[src*="/assets/${asset.id}/thumbnail"], video[poster*="/assets/${asset.id}/thumbnail"]`)
      .first();

  return {
    root,
    content,
    detailPanel,
    stack,
    nextButton: page.getByLabel('view_next_asset', { exact: true }),
    previousButton: page.getByLabel('view_previous_asset', { exact: true }),
    deleteButton: page.getByLabel('delete', { exact: true }),
    permanentlyDeleteButton: page.getByLabel('permanently_delete', { exact: true }),
    backButton: page.getByLabel('go_back', { exact: true }),
    favoriteButton: page.getByRole('button', { name: 'to_favorite', exact: true }),
    unfavoriteButton: page.getByRole('button', { name: 'unfavorite', exact: true }),
    infoButton: page.getByLabel('info', { exact: true }),
    moreButton: page.getByLabel('more', { exact: true }),
    exitSlideshowButton: page.getByLabel('exit_slideshow', { exact: true }),
    description: page.getByPlaceholder('add_a_description'),
    editDateButton: page.getByTestId('detail-panel-edit-date-button'),
    tags: page.getByTestId('detail-panel-tags').getByRole('link'),
    media,
    image: (quality: 'thumbnail' | 'preview' | 'original') => content.getByTestId(quality).filter({ visible: true }),
    stackThumbnail: (asset: Asset) => stack.locator(`[data-asset="${asset.id}"]`),

    ocr: {
      button: page.getByLabel('text_recognition', { exact: true }),
      boxes: content.locator('[data-testid="ocr-box"]'),
      image: ocrImage,
      imageTransform: () =>
        ocrImage.evaluate((element) => getComputedStyle(element.closest('[style*="transform"]') ?? element).transform),
    },

    faceEditor: createFaceEditor(page),

    waitForAsset: (asset: Asset) => expect(media(asset)).toBeVisible(),

    openSlideshow: async () => {
      await page.getByLabel('more', { exact: true }).click();
      await page.getByRole('menuitem', { name: 'slideshow', exact: true }).click();
    },

    permanentlyDelete: async () => {
      await page.getByLabel('permanently_delete', { exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'delete', exact: true }).click();
    },

    openDetailPanel: async () => {
      await expect(root).toBeVisible();
      if (!(await detailPanel.isVisible())) {
        await page.keyboard.press('i');
      }
      await expect(detailPanel).toBeVisible();
    },
  };
};

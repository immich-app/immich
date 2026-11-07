import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
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
  const card = (link: { key: string }) => page.locator(`a[href="${Route.viewSharedLink(link)}"]`);
  const memoryRoot = page.getByTestId('memory-viewer');
  const memoryGallery = page.getByTestId('memory-gallery');

  return {
    dialog: page.getByRole('dialog'),
    dialogButton: (name: string) => page.getByRole('dialog').getByRole('button', { name, exact: true }),
    toast: (key: string) => page.getByText(key),

    admin: {
      maintenance: {
        checkAllButton: button('admin.maintenance_integrity_check_all'),
        reportCount: (report: IntegrityReport) =>
          page
            .getByTestId('statistic-card')
            .filter({ hasText: `admin.maintenance_integrity_${report}` })
            .getByTestId('statistic-value'),
      },
      users: {
        createUserButton: button('create_user'),
        restoreButton: button('restore'),
        editButton: button('edit'),
        deleteButton: button('delete'),
        resetPasswordButton: button('reset_password'),
        resetPinCodeButton: button('reset_pin_code'),
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

    albums: {
      createAlbumButton: button('create_album'),
    },

    library: {
      deleteButton: button('delete').filter({ hasText: 'delete' }),
      rowDeleteButton: (text: string) =>
        page.getByRole('row').filter({ hasText: text }).getByRole('button', { name: 'delete', exact: true }),
    },

    tags: {
      child: (name: string) => page.getByRole('main').getByRole('button', { name, exact: true }),
    },

    album: {
      summary: page.getByTestId('album-details'),
      selectPhotosButton: button('select_photos'),
      mapButton: labelled('map'),
      mapDialog: page.getByRole('dialog'),
      mapMarkers: page.getByRole('dialog').locator('.maplibregl-marker'),
      optionsMenuButton: labelled('album_options'),
      optionsMenuItem: page.getByRole('menuitem', { name: 'options', exact: true }),
      userRoleSelect: (role: string) => page.getByRole('dialog').getByText(role, { exact: true }),
      removeUserOption: page.getByRole('option', { name: 'remove_user', exact: true }),
      activity: {
        commentsButton: page.getByRole('button', { name: 'activity', exact: true }),
      },
    },

    memories: {
      card: () => page.getByTestId('memory-card'),
    },

    person: {
      editNameButton: page.getByTitle('edit_name', { exact: true }),
      nameInput: page.getByPlaceholder('name_or_nickname'),
      doneButton: page.getByRole('button', { name: 'done', exact: true }),
      mergeDialog: (name: string) => page.getByRole('dialog').getByText(`merge_people - ${name}`, { exact: true }),
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
      card,
      deleteButton: labelled('delete_link'),
      cover: (link: { key: string }) => card(link).getByTestId('album-image'),
      brokenCover: (link: { key: string }) => card(link).getByTestId('broken-asset'),
      form: {
        showMetadataSwitch: page.getByRole('dialog').getByLabel('show_metadata', { exact: true }),
        allowDownloadSwitch: page.getByRole('dialog').getByLabel('allow_public_user_to_download', { exact: true }),
      },
    },

    sidebar: {
      photosLink: link('photos'),
      favoritesLink: link('favorites'),
      archiveLink: link('archive'),
      trashLink: link('trash'),
    },

    timeline: createTimeline(page, data),

    duplicates: {
      viewButton: button('view'),
    },

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
    albumPicker: {
      title: page.getByRole('dialog').getByText('add_to_album_item_count', { exact: true }),
      selectAlbumsTitle: page.getByRole('dialog').getByText('select_albums', { exact: true }),
    },
    selectionCandidates: thumbnails.getByTestId('selection-candidate'),
    selectionBar: {
      addToAlbumButton: page.getByLabel('add_to_album', { exact: true }),
      favoriteButton: page.getByLabel('to_favorite', { exact: true }),
      unfavoriteButton: page.getByLabel('remove_from_favorites', { exact: true }),
      unarchiveButton: page.getByLabel('unarchive', { exact: true }),
      restoreButton: page.getByRole('button', { name: 'restore', exact: true }),
      // TODO: wire the app translations into the @immich/ui ControlBar so this can target the `close` key
      closeButton: page.getByTestId('control-bar').getByLabel('Close'),

      archive: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'to_archive', exact: true }).click();
      },

      trash: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'delete', exact: true }).click();
      },

      changeDate: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'change_date', exact: true }).click();
      },

      stack: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'stack', exact: true }).click();
      },

      unstack: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'unstack', exact: true }).click();
      },

      openRemoveFromAlbum: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'remove_from_album', exact: true }).click();
      },
      removeFromAlbum: async () => {
        await page.getByLabel('menu', { exact: true }).click();
        await page.getByRole('menuitem', { name: 'remove_from_album', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'confirm', exact: true }).click();
      },
    },
    changeDate: {
      dateInput: page.getByLabel('date_and_time', { exact: true }),
      timezoneInput: page.getByLabel('timezone', { exact: true }),
      offsetSwitch: page.getByTestId('edit-by-offset-switch'),
      daysInput: page.getByPlaceholder('days', { exact: true }),
      hoursInput: page.getByPlaceholder('hours', { exact: true }),
      minutesInput: page.getByPlaceholder('minutes', { exact: true }),
      confirmButton: page.getByRole('button', { name: 'confirm', exact: true }),
    },
    disabledSelection: (asset: Asset) => thumbnail(asset).and(page.locator('[data-selected][data-disabled]')),
    favoriteIcon: (asset: Asset) => thumbnail(asset).getByTestId('favorite-icon'),
    thumbhash: (asset: Asset) => thumbnail(asset).getByTestId('thumbhash'),
    brokenImage: (asset: Asset) => thumbnail(asset).getByText('error_loading_image', { exact: true }),
    archiveIcon: (asset: Asset) => thumbnail(asset).getByTestId('archive-icon'),
    stackIcon: (asset: Asset) => thumbnail(asset).getByTestId('stack-icon'),
    scrubber: (yearMonth: string) => page.locator(`[data-segment-year-month="${yearMonth}"]`),

    select: async (asset: Asset) => {
      await thumbnail(asset).hover();
      await thumbnail(asset).getByRole('checkbox').click();
    },

    selectDay: async (asset: AssetResponseDto) => {
      const title = DateTime.fromISO(asset.fileCreatedAt, { zone: 'utc' }).toLocaleString(
        DateTime.DATE_MED_WITH_WEEKDAY,
        { locale: 'en-US' },
      );
      const day = page.getByTestId('timeline-day').filter({ has: page.getByTitle(title) });
      await day.hover();
      await day.getByTestId('select-day').click();
    },

    goToDate: async (asset: AssetResponseDto) => {
      await grid.hover();
      await page.keyboard.press('g');
      const value = DateTime.fromISO(asset.fileCreatedAt, { zone: 'utc' }).toFormat('MMddyyyy,hh:mm:ss.SSSa');
      await page.getByLabel('date_and_time', { exact: true }).pressSequentially(value);
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

    position: async (asset: Asset) => {
      const box = (await thumbnail(asset).boundingBox())!;
      return { x: Math.round(box.x), y: Math.round(box.y) };
    },

    expectAtTop: (asset: Asset) => alignedWith(asset, 'top'),
    expectAtBottom: (asset: Asset) => alignedWith(asset, 'bottom'),
  };
};

const createViewer = (page: Page) => {
  const root = page.locator('#immich-asset-viewer');
  const content = page.getByTestId('viewer-content');
  const detailPanel = page.getByTestId('detail-panel');
  const stack = page.getByTestId('stack-slideshow');
  const ocrImage = content
    .getByTestId(/^(thumbnail|preview|original)$/)
    .filter({ visible: true })
    .first();

  const moreMenuItem = async (name: string) => {
    await page.getByLabel('more', { exact: true }).click();
    await page.getByRole('menuitem', { name, exact: true }).click();
  };

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
    shareButton: page.getByLabel('share', { exact: true }),
    deleteButton: page.getByLabel('delete', { exact: true }),
    permanentlyDeleteButton: page.getByLabel('permanently_delete', { exact: true }),
    backButton: page.getByLabel('go_back', { exact: true }),
    favoriteButton: page.getByRole('button', { name: 'to_favorite', exact: true }),
    unfavoriteButton: page.getByRole('button', { name: 'unfavorite', exact: true }),
    infoButton: page.getByLabel('info', { exact: true }),
    moreButton: page.getByLabel('more', { exact: true }),
    exitSlideshowButton: page.getByLabel('exit_slideshow', { exact: true }),
    description: page.getByPlaceholder('add_a_description'),
    rating: page.getByTestId('star-container'),
    editDateButton: page.getByTestId('detail-panel-edit-date-button'),
    editLocationButton: page.getByTitle('edit_location'),
    addLocationButton: page.getByTitle('add_location'),
    changeDate: {
      dateInput: page.getByLabel('date_and_time', { exact: true }),
      timezoneInput: page.getByRole('combobox', { name: 'timezone' }),
    },
    changeLocation: {
      latitudeInput: page.getByRole('dialog').getByLabel('latitude', { exact: true }),
      longitudeInput: page.getByRole('dialog').getByLabel('longitude', { exact: true }),
      confirmButton: page.getByRole('dialog').getByRole('button', { name: 'confirm', exact: true }),
      searchInput: page.getByRole('dialog').getByPlaceholder('search_places'),
      place: (label: string) => page.getByRole('dialog').getByRole('button', { name: label, exact: true }),
    },
    navbarActions: page.getByTestId('asset-viewer-navbar-actions'),
    tags: page.getByTestId('detail-panel-tags').getByRole('link'),
    editPeopleButton: page.getByLabel('edit_people', { exact: true }),
    deleteFaceButton: page.getByLabel('delete_face', { exact: true }),
    tag: (value: string) => page.getByTestId('detail-panel-tags').getByRole('link', { name: value, exact: true }),
    addTagButton: page.getByTestId('detail-panel-tags').getByRole('button', { name: 'add_tag', exact: true }),
    removeTagButton: page.getByTestId('detail-panel-tags').getByRole('button', { name: 'remove_tag', exact: true }),
    tagAssets: {
      input: page.getByRole('dialog').getByLabel('tag', { exact: true }),
      submitButton: page.getByRole('dialog').getByRole('button', { name: 'tag_assets', exact: true }),
      pick: async (value: string) => {
        await page.getByRole('dialog').getByLabel('tag', { exact: true }).fill(value);
        await page.getByRole('dialog').getByLabel('tag', { exact: true }).press('Enter');
      },
    },
    media,
    image: (quality: 'thumbnail' | 'preview' | 'original') => content.getByTestId(quality).filter({ visible: true }),
    stackThumbnail: (asset: Asset) => stack.locator(`[data-asset="${asset.id}"]`),
    stackAssets: stack.locator('[data-asset]'),
    stackBrokenAssets: stack.getByTestId('broken-asset'),
    brokenAsset: content.getByTestId('broken-asset').first(),

    ocr: {
      button: page.getByLabel('text_recognition', { exact: true }),
      boxes: content.getByTestId('ocr-box'),
      image: ocrImage,
      imageTransform: () =>
        ocrImage.evaluate((element) => getComputedStyle(element.closest('[style*="transform"]') ?? element).transform),
    },

    faceEditor: createFaceEditor(page),

    activity: {
      likeButton: root.getByRole('button', { name: 'like', exact: true, pressed: false }),
      likedButton: root.getByRole('button', { name: 'like', exact: true, pressed: true }),
      commentsButton: root.getByRole('button', { name: 'activity', exact: true }),
      commentInput: page.getByPlaceholder('say_something'),
    },

    waitForAsset: (asset: Asset) => expect(media(asset)).toBeVisible(),

    openSlideshow: () => moreMenuItem('slideshow'),
    download: () => moreMenuItem('download'),
    archive: () => moreMenuItem('to_archive'),
    unarchive: () => moreMenuItem('unarchive'),
    unstack: () => moreMenuItem('unstack'),
    setStackPrimary: () => moreMenuItem('set_stack_primary_asset'),
    removeFromStack: () => moreMenuItem('viewer_remove_from_stack'),

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

const createFaceEditor = (page: Page) => {
  const selector = page.getByTestId('face-selector');
  const canvas = page.getByTestId('face-editor');
  const data = page.getByTestId('face-editor-data');

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
    search: selector.getByPlaceholder('search_people'),
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
          const element = document.querySelector('[data-testid="face-selector"]');
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

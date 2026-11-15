import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { adjacentAsset, adjacentYearMonths, yearMonthOf, yearMonthsOf } from '#test/common/timeline.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { AssetTypeEnum, AssetVisibility } from '@immich/sdk';

test.describe('timeline', () => {
  test.describe('/photos', () => {
    test('deep link to random assets and to the last asset', async ({ page, data, app }) => {
      const assets = data.addTimeline();
      for (const asset of [...data.sampleAssets(9), assets.at(-1)!]) {
        await page.goto(Route.photos({ at: asset.id }));
        await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      }
    });

    test('browser back returns to the viewed asset and scroll position', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      const [asset, next] = assets.slice(300, 302);
      await page.goto(Route.photos({ at: asset.id }));
      const scrollTopBefore = await app.timeline.scrollTop();

      await app.timeline.thumbnail(asset).click();
      await app.viewer.waitForAsset(asset);
      await page.goBack();
      expect(Math.abs((await app.timeline.scrollTop()) - scrollTopBefore)).toBeLessThanOrEqual(1);

      await app.timeline.thumbnail(asset).click();
      await app.viewer.waitForAsset(asset);
      await expect(page).toHaveURL(Route.viewAsset({ id: asset.id }));
      await app.viewer.nextButton.click();
      await app.viewer.waitForAsset(next);
      await expect(page).toHaveURL(Route.viewAsset({ id: next.id }));

      await page.goBack();
      await app.viewer.waitForAsset(asset);
      await page.goBack();
      await page.waitForURL(/\/photos\?at=/);
      expect(Math.abs((await app.timeline.scrollTop()) - scrollTopBefore)).toBeLessThan(5);
    });

    test('next photo 15 times, go back lands on the viewed asset', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos({ at: assets[0].id }));
      await app.timeline.thumbnail(assets[0]).click();
      await app.viewer.waitForAsset(assets[0]);
      for (let index = 1; index <= 15; index++) {
        await app.viewer.nextButton.click();
        await app.viewer.waitForAsset(assets[index]);
      }

      await app.viewer.backButton.click();
      await page.waitForURL(/\/photos\?at=/);

      await expect(app.timeline.thumbnail(assets[15])).toBeInViewport();
      await app.timeline.expectAtBottom(assets[15]);
    });
  });

  test.describe('keyboard', () => {
    test('next/previous asset with arrow keys and tab', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());
      await app.timeline.thumbnail(assets[0]).focus();

      for (let index = 1; index < 15; index++) {
        await page.keyboard.press('ArrowRight');
        await expect(app.timeline.thumbnail(assets[index])).toBeFocused();
      }
      for (let index = 15; index <= 20; index++) {
        await page.keyboard.press('ArrowRight');
        await expect(app.timeline.thumbnail(assets[index])).toBeFocused();
        await app.timeline.expectAtBottom(assets[index]);
      }
      for (let index = 19; index >= 15; index--) {
        await page.keyboard.press('ArrowLeft');
        await expect(app.timeline.thumbnail(assets[index])).toBeFocused();
      }
      for (let index = 14; index > 0; index--) {
        await page.keyboard.press('ArrowLeft');
        await expect(app.timeline.thumbnail(assets[index])).toBeFocused();
        await app.timeline.expectAtTop(assets[index]);
      }

      for (let index = 2; index <= 6; index++) {
        await page.keyboard.press('Tab');
        await expect(app.timeline.thumbnail(assets[index])).toBeFocused();
      }
      for (let index = 5; index >= 1; index--) {
        await page.keyboard.press('Shift+Tab');
        await expect(app.timeline.thumbnail(assets[index])).toBeFocused();
      }
    });

    test('next/previous day, month and year with d, m and y', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 8 });
      await page.goto(Route.photos());
      await app.timeline.grid.hover();

      let asset = assets[0];
      await page.keyboard.press('d');
      await expect(app.timeline.thumbnail(asset)).toBeFocused();

      for (const [unit, key] of [
        ['day', 'd'],
        ['month', 'm'],
        ['year', 'y'],
      ] as const) {
        for (let index = 0; index < 5; index++) {
          await page.keyboard.press(key);
          asset = adjacentAsset(assets, asset, 'next', unit)!;
          await expect(app.timeline.thumbnail(asset)).toBeFocused();
        }
        for (let index = 0; index < 5; index++) {
          await page.keyboard.press(`Shift+${key.toUpperCase()}`);
          asset = adjacentAsset(assets, asset, 'previous', unit)!;
          await expect(app.timeline.thumbnail(asset)).toBeFocused();
        }
      }
    });

    test('tab skips the checkbox of a selected thumbnail', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[1]);
      await page.keyboard.press('Tab');
      await expect(app.timeline.thumbnail(assets[2])).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(app.timeline.thumbnail(assets[1])).toBeFocused();
    });

    test('navigate to date with g', async ({ page, data, app }) => {
      data.addTimeline({ years: 3 });
      await page.goto(Route.photos());
      for (const asset of data.sampleAssets(3)) {
        await app.timeline.goToDate(asset);
        await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      }
    });
  });

  test.describe('selection', () => {
    test('select day, unselect day', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      const day = (asset: { fileCreatedAt: string }) => asset.fileCreatedAt.slice(0, 10);
      const asset = assets.find((candidate) => assets.filter((other) => day(other) === day(candidate)).length <= 4)!;
      const dayCount = assets.filter((other) => day(other) === day(asset)).length;
      await page.goto(Route.photos());

      await app.timeline.selectDay(asset);
      await expect(app.timeline.selected).toHaveCount(dayCount);
      await app.timeline.selectDay(asset);
      await expect(app.timeline.selected).toHaveCount(0);
    });

    test('select and unselect assets', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[1]);
      await expect(app.timeline.selected).toHaveCount(1);
      await app.timeline.thumbnail(assets[2]).click();
      await expect(app.timeline.selected).toHaveCount(2);

      await app.timeline.thumbnail(assets[2]).click();
      await expect(app.timeline.selected).toHaveCount(1);
      await app.timeline.thumbnail(assets[1]).click();
      await page.mouse.move(0, 0);
      await expect(app.timeline.selected).toHaveCount(0);
    });

    test('add to album shows the selection count title', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[0]);
      await app.timeline.selectionBar.addToAlbumButton.click();
      await expect(app.timeline.albumPicker.title).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(app.timeline.albumPicker.title).toHaveCount(0);

      await app.timeline.thumbnail(assets[1]).click();
      await expect(app.timeline.selected).toHaveCount(2);
      await app.timeline.selectionBar.addToAlbumButton.click();
      await expect(app.timeline.albumPicker.title).toBeVisible();
      await expect(app.timeline.albumPicker.selectAlbumsTitle).toHaveCount(0);
    });

    test('change date sends the chosen date in the chosen time zone', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[0]);
      await app.timeline.selectionBar.changeDate();
      await app.timeline.changeDate.dateInput.fill('2024-07-01T00:00');
      await app.timeline.changeDate.timezoneInput.fill('Europe/Berlin');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await app.timeline.changeDate.confirmButton.click();

      await expect(app.timeline.selected).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [assets[0].id], dateTimeOriginal: '2024-07-01T00:00:00.000+02:00' },
      });
    });

    test('change date by offset sends the offset in minutes', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[0]);
      await app.timeline.thumbnail(assets[1]).click();
      await app.timeline.selectionBar.changeDate();
      await app.timeline.changeDate.offsetSwitch.click();
      await app.timeline.changeDate.daysInput.fill('5');
      await app.timeline.changeDate.hoursInput.fill('4');
      await app.timeline.changeDate.minutesInput.fill('3');
      await app.timeline.changeDate.confirmButton.click();

      await expect(app.timeline.selected).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: expect.objectContaining({
          ids: [assets[0].id, assets[1].id],
          dateTimeRelative: 5 * 24 * 60 + 4 * 60 + 3,
        }),
      });
    });

    test('links a live photo', async ({ page, data, api, app }) => {
      const photo = factory.asset({ fileCreatedAt: '2025-06-01T12:00:00.000Z' });
      const video = factory.asset({ type: AssetTypeEnum.Video, fileCreatedAt: '2025-06-01T12:00:01.000Z' });
      data.addAssets([photo, video]);
      await page.goto(Route.photos());

      await app.timeline.select(photo);
      await app.timeline.thumbnail(video).click();
      await app.timeline.selectionBar.linkLivePhoto();

      await expect(app.timeline.thumbnail(video)).toHaveCount(0);
      await expect(app.timeline.thumbnail(photo)).toBeVisible();
      expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: photo.id }, body: { livePhotoVideoId: video.id } });
    });

    test('unlinks a live photo', async ({ page, data, api, app }) => {
      const photo = factory.asset({ fileCreatedAt: '2025-06-01T12:00:00.000Z' });
      const video = factory.asset({ type: AssetTypeEnum.Video, fileCreatedAt: '2025-06-01T12:00:01.000Z' });
      data.addAssets([photo, video]);
      data.updateAsset(photo.id, { livePhotoVideoId: video.id });
      await page.goto(Route.photos());
      await expect(app.timeline.thumbnail(video)).toHaveCount(0);

      await app.timeline.select(photo);
      await app.timeline.selectionBar.unlinkLivePhoto();

      await expect(app.timeline.thumbnail(video)).toBeVisible();
      expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: photo.id }, body: { livePhotoVideoId: null } });
    });

    test('moves assets to the locked folder', async ({ page, data, api, app }) => {
      const [asset, next] = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(asset);
      await app.timeline.selectionBar.moveToLockedFolder();

      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      await expect(app.timeline.thumbnail(next)).toBeVisible();
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], visibility: AssetVisibility.Locked } });
    });

    test('changes the location of assets', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[0]);
      await app.timeline.thumbnail(assets[1]).click();
      await app.timeline.selectionBar.changeLocation();
      await app.timeline.changeLocation.latitudeInput.fill('48.8566');
      await app.timeline.changeLocation.longitudeInput.fill('2.3522');
      await app.timeline.changeLocation.confirmButton.click();

      await expect(app.timeline.selected).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [assets[0].id, assets[1].id], latitude: 48.8566, longitude: 2.3522 },
      });
    });

    test('changes the description of assets', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[0]);
      await app.timeline.thumbnail(assets[1]).click();
      await app.timeline.selectionBar.changeDescription();
      await app.timeline.changeDescription.input.fill('Summer trip');
      await app.timeline.changeDescription.saveButton.click();

      await expect(app.timeline.selected).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [assets[0].id, assets[1].id], description: 'Summer trip' },
      });
    });

    test('downloads a single selected asset', async ({ page, data, api, app }) => {
      const asset = factory.asset({ originalFileName: 'holiday.jpg' });
      data.addAssets(asset);
      await page.goto(Route.photos());

      await app.timeline.select(asset);
      const [download] = await Promise.all([page.waitForEvent('download'), app.timeline.selectionBar.download()]);

      expect(download.suggestedFilename()).toBe('holiday.jpg');
      await expect(app.timeline.selected).toHaveCount(0);
      expect(api.getAssetInfo).toHaveBeenCalledWith({ params: { id: asset.id } });
      expect(api.downloadAsset).toHaveBeenCalledWith({ params: expect.objectContaining({ id: asset.id }) });
    });

    test('shift-click selects ranges', async ({ page, data, app }) => {
      const assets = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(assets[0]);
      await page.keyboard.down('Shift');
      await app.timeline.thumbnail(assets[2]).hover();
      await expect(app.timeline.selectionCandidates).toHaveCount(3);
      await app.timeline.select(assets[2]);
      await page.keyboard.up('Shift');
      await expect(app.timeline.selected).toHaveCount(3);

      await page.keyboard.down('Shift');
      await app.timeline.thumbnail(assets[4]).click();
      await page.keyboard.up('Shift');
      await page.mouse.move(0, 0);
      await expect(app.timeline.selected).toHaveCount(5);
    });
  });

  test.describe('scroll', () => {
    test('click scrubber segments across the timeline', async ({ page, data, app }) => {
      test.slow();
      data.addTimeline();
      await page.goto(Route.photos());

      for (const asset of data.sampleAssets(10)) {
        const month = yearMonthOf(asset);
        const nearby = new Set(adjacentYearMonths(month));
        const renderedNearby = async () => {
          const rendered = await app.timeline.renderedMonths();
          return rendered.some((yearMonth) => nearby.has(yearMonth));
        };
        await app.timeline.scrubber(month).click({ force: true });
        await expect.poll(renderedNearby).toBe(true);
      }
    });

    test('drag scrubber to the bottom and back to the top', async ({ page, data, app }) => {
      const assets = data.addTimeline();
      const yearMonths = yearMonthsOf(assets);
      await page.goto(Route.photos({ at: assets[0].id }));

      const first = (await app.timeline.scrubber(yearMonths[0]).boundingBox())!;
      await app.timeline.scrubber(yearMonths[0]).hover();
      await page.mouse.move(first.x + first.width / 2, first.y);
      await page.mouse.down();
      await page.mouse.move(first.x + first.width / 2, page.viewportSize()!.height - 10, { steps: 20 });
      await page.mouse.up();
      await expect.poll(() => app.timeline.renderedMonths()).toContain(yearMonths.at(-1));

      const last = (await app.timeline.scrubber(yearMonths.at(-1)!).boundingBox())!;
      await app.timeline.scrubber(yearMonths[0]).hover();
      await page.mouse.move(last.x + last.width / 2, last.y);
      await page.mouse.down();
      await page.mouse.move(last.x + last.width / 2, first.y, { steps: 20 });
      await page.mouse.up();
      await expect(app.timeline.thumbnail(assets[0])).toBeInViewport();
    });

    test('bucket requests are cancelled when scrolling away', async ({ page, data, api, app }) => {
      const assets = data.addTimeline({ years: 2 });
      const yearMonths = yearMonthsOf(assets);
      await page.goto(Route.photos());

      api.on({
        getTimeBucket: async ({ params }) => {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return { json: data.timeBucket(params.timeBucket) };
        },
      });
      const failed: string[] = [];
      page.on('requestfailed', (request) => {
        failed.push(request.url());
      });

      await app.timeline.scrubber(yearMonths[12]).click({ force: true });
      await app.timeline.scrubber(yearMonths.at(-1)!).click({ force: true });

      const [year, month] = yearMonths[12].split('-', 2);
      await expect
        .poll(() => failed)
        .toEqual(expect.arrayContaining([expect.stringContaining(`${year}-${month.padStart(2, '0')}`)]));
    });
  });

  test.describe('/albums', () => {
    test('open album and deep link to its last photo', async ({ page, data, app }) => {
      data.addTimeline({ years: 2 });
      const members = data.sampleAssets(20);
      const last = members.at(-1)!;
      const album = factory.album();
      data.addAlbums(album).addToAlbum(album.id, members);

      await page.goto(Route.viewAlbum({ id: album.id }));
      await expect(app.timeline.thumbnail(members[0])).toBeInViewport();

      await page.goto(`${Route.viewAlbum({ id: album.id })}?at=${last.id}`);
      await expect(app.timeline.thumbnail(last)).toBeInViewport();
      await app.timeline.expectAtBottom(last);
    });

    test('add photos pre-selects existing album assets', async ({ page, data, app }) => {
      data.addTimeline({ years: 2 });
      const [asset] = data.sampleAssets(20);
      const album = factory.album();
      data.addAlbums(album).addToAlbum(album.id, data.sampleAssets(20));
      await page.goto(Route.viewAlbum({ id: album.id }));

      await app.timeline.addPhotosButton.click();
      await app.timeline.goToDate(asset);

      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      await expect(app.timeline.disabledSelection(asset)).toBeVisible();
    });
  });

  test.describe('thumbnail', () => {
    test('broken image shows the thumbhash and the error message', async ({ page, data, logger, app }) => {
      const [asset] = data.addTimeline({ years: 1 });
      data.markBroken(asset);
      await page.goto(Route.photos());

      await expect(app.timeline.brokenImage(asset)).toBeVisible();
      await expect(app.timeline.thumbhash(asset)).toBeVisible();
      expect(logger.error).toHaveBeenCalledWith(/404/);
    });
  });

  test.describe('/trash', () => {
    test('trash from /photos, restore from /trash', async ({ page, data, api, app }) => {
      const [asset, next] = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());
      const position = await app.timeline.position(asset);
      expect(await app.timeline.position(next)).not.toEqual(position);

      await app.timeline.select(asset);
      await app.timeline.selectionBar.trash();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      await expect.poll(() => app.timeline.position(next)).toEqual(position);
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { force: false, ids: [asset.id] } });

      await app.sidebar.trashLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      await app.timeline.select(asset);
      await app.timeline.selectionBar.restoreButton.click();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });

      await app.sidebar.photosLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    });

    test('trash from album, restore from /trash', async ({ page, data, api, app }) => {
      data.addTimeline({ years: 2 });
      const [asset] = data.sampleAssets(20);
      const album = factory.album();
      data.addAlbums(album).addToAlbum(album.id, data.sampleAssets(20));
      await page.goto(Route.viewAlbum({ id: album.id }));

      await app.timeline.select(asset);
      await app.timeline.selectionBar.trash();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.deleteAssets).toHaveBeenCalledWith({ body: { force: false, ids: [asset.id] } });

      await app.timeline.selectionBar.closeButton.click();
      await app.sidebar.trashLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      await app.timeline.select(asset);
      await app.timeline.selectionBar.restoreButton.click();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });

      await page.goto(Route.viewAlbum({ id: album.id }));
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    });
  });

  test.describe('/archive', () => {
    test('archive from /photos, unarchive from /archive', async ({ page, data, api, app }) => {
      const [asset] = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(asset);
      await app.timeline.selectionBar.archive();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [asset.id], visibility: AssetVisibility.Archive },
      });

      await app.sidebar.archiveLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      await app.timeline.select(asset);
      await app.timeline.selectionBar.unarchiveButton.click();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [asset.id], visibility: AssetVisibility.Timeline },
      });

      await app.sidebar.photosLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    });

    test('undoes an archive from the toast', async ({ page, data, api, app }) => {
      const [asset] = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(asset);
      await app.timeline.selectionBar.archive();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      await app.undoButton.click();

      await expect(app.timeline.thumbnail(asset)).toBeVisible();
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], visibility: AssetVisibility.Archive } });
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [asset.id], visibility: AssetVisibility.Timeline },
      });
    });

    test('favorite and unfavorite from /archive', async ({ page, data, api, app }) => {
      const [asset] = data.addTimeline({ years: 1 });
      data.updateAssets({ ids: [asset.id], visibility: AssetVisibility.Archive });
      await page.goto(Route.archive());

      await app.timeline.select(asset);
      await app.timeline.selectionBar.favoriteButton.click();
      await expect(app.timeline.favoriteIcon(asset)).toHaveCount(1);
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], isFavorite: true } });

      await app.timeline.select(asset);
      await app.timeline.selectionBar.unfavoriteButton.click();
      await expect(app.timeline.favoriteIcon(asset)).toHaveCount(0);
      await expect(app.timeline.thumbnail(asset)).toHaveCount(1);
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], isFavorite: false } });
    });

    test('archive from album, unarchive from /archive', async ({ page, data, api, app }) => {
      data.addTimeline({ years: 2 });
      const [asset] = data.sampleAssets(20);
      const album = factory.album();
      data.addAlbums(album).addToAlbum(album.id, data.sampleAssets(20));
      await page.goto(Route.viewAlbum({ id: album.id }));

      await app.timeline.select(asset);
      await app.timeline.selectionBar.archive();
      await expect(app.timeline.archiveIcon(asset)).toHaveCount(1);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [asset.id], visibility: AssetVisibility.Archive },
      });

      await app.timeline.selectionBar.closeButton.click();
      await app.sidebar.archiveLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      await app.timeline.select(asset);
      await app.timeline.selectionBar.unarchiveButton.click();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({
        body: { ids: [asset.id], visibility: AssetVisibility.Timeline },
      });

      await page.goto(Route.viewAlbum({ id: album.id }));
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    });
  });

  test.describe('/favorites', () => {
    test('favorite from /photos, unfavorite from /favorites', async ({ page, data, api, app }) => {
      const [asset] = data.addTimeline({ years: 1 });
      await page.goto(Route.photos());

      await app.timeline.select(asset);
      await app.timeline.selectionBar.favoriteButton.click();
      await expect(app.timeline.favoriteIcon(asset)).toHaveCount(1);
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], isFavorite: true } });

      await app.sidebar.favoritesLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      await app.timeline.select(asset);
      await app.timeline.selectionBar.unfavoriteButton.click();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], isFavorite: false } });

      await app.sidebar.photosLink.click();
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    });

    test('favorite from album, unfavorite from /favorites', async ({ page, data, api, app }) => {
      data.addTimeline({ years: 2 });
      const [asset] = data.sampleAssets(20);
      const album = factory.album();
      data.addAlbums(album).addToAlbum(album.id, data.sampleAssets(20));
      await page.goto(Route.viewAlbum({ id: album.id }));

      await app.timeline.select(asset);
      await app.timeline.selectionBar.favoriteButton.click();
      await expect(app.timeline.favoriteIcon(asset)).toHaveCount(1);
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], isFavorite: true } });

      await app.timeline.selectionBar.closeButton.click();
      await app.sidebar.favoritesLink.click();
      await app.timeline.goToDate(asset);
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
      await app.timeline.select(asset);
      await app.timeline.selectionBar.unfavoriteButton.click();
      await expect(app.timeline.thumbnail(asset)).toHaveCount(0);
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], isFavorite: false } });

      await page.goto(Route.viewAlbum({ id: album.id }));
      await expect(app.timeline.thumbnail(asset)).toBeInViewport();
    });
  });
});

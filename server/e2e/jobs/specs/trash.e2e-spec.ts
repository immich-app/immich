import { LoginResponseDto } from '@app/domain';
import { api } from 'e2e/client';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { App } from 'supertest/types';
import { IMMICH_TEST_ASSET_PATH, testApp } from '../../../src/test-utils/utils';

const assetFilePath = join(IMMICH_TEST_ASSET_PATH, 'formats/png/density_plot.png');

describe(`Trash (e2e)`, () => {
  let server: App;
  let admin: LoginResponseDto;

  beforeAll(async () => {
    const app = await testApp.create();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await testApp.reset();
    await api.authApi.adminSignUp(server);
    admin = await api.authApi.adminLogin(server);
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  it('should move an asset to trash', async () => {
    const content = await readFile(assetFilePath);
    const { id: assetId } = await api.assetApi.upload(server, admin.accessToken, 'test-device-id', {
      content,
      filename: basename(assetFilePath),
    });

    const uploadedAsset = await api.assetApi.get(server, admin.accessToken, assetId);
    expect(uploadedAsset.isTrashed).toBe(false);

    await api.assetApi.delete(server, admin.accessToken, { ids: [assetId] });

    const deletedAsset = await api.assetApi.get(server, admin.accessToken, assetId);
    expect(deletedAsset.isTrashed).toBe(true);
  });

  it('should delete all trashed assets', async () => {
    const content = await readFile(assetFilePath);
    const { id: assetId } = await api.assetApi.upload(server, admin.accessToken, 'test-device-id', {
      content,
      filename: basename(assetFilePath),
    });

    await api.assetApi.delete(server, admin.accessToken, { ids: [assetId] });

    const assetsBeforeEmpty = await api.assetApi.getAllAssets(server, admin.accessToken);
    expect(assetsBeforeEmpty.length).toBe(1);

    await api.trashApi.empty(server, admin.accessToken);

    const assetsAfterEmpty = await api.assetApi.getAllAssets(server, admin.accessToken);
    expect(assetsAfterEmpty.length).toBe(0);
  });

  it('should restore all trashed assets', async () => {
    const content = await readFile(assetFilePath);
    const { id: assetId } = await api.assetApi.upload(server, admin.accessToken, 'test-device-id', {
      content,
      filename: basename(assetFilePath),
    });

    await api.assetApi.delete(server, admin.accessToken, { ids: [assetId] });

    const deletedAsset = await api.assetApi.get(server, admin.accessToken, assetId);
    expect(deletedAsset.isTrashed).toBe(true);

    await api.trashApi.restore(server, admin.accessToken);

    const restoredAsset = await api.assetApi.get(server, admin.accessToken, assetId);
    expect(restoredAsset.isTrashed).toBe(false);
  });
});

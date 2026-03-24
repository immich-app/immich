import { AssetMediaResponseDto, LoginResponseDto, SharedSpaceResponseDto, SharedSpaceRole } from '@immich/sdk';
import { readFile, writeFile } from 'node:fs/promises';
import { app, tempDir, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/download', () => {
  let admin: LoginResponseDto;
  let asset1: AssetMediaResponseDto;
  let asset2: AssetMediaResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    [asset1, asset2] = await Promise.all([utils.createAsset(admin.accessToken), utils.createAsset(admin.accessToken)]);
  });

  describe('POST /download/info', () => {
    it('should download info', async () => {
      const { status, body } = await request(app)
        .post('/download/info')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ assetIds: [asset1.id] });

      expect(status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          archives: [expect.objectContaining({ assetIds: [asset1.id] })],
        }),
      );
    });
  });

  describe('POST /download/archive', () => {
    it('should download an archive', async () => {
      const { status, body } = await request(app)
        .post('/download/archive')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ assetIds: [asset1.id, asset2.id] });

      expect(status).toBe(200);
      expect(body instanceof Buffer).toBe(true);

      await writeFile(`${tempDir}/archive.zip`, body);
      await utils.unzip(`${tempDir}/archive.zip`, `${tempDir}/archive`);
      const files = [
        { filename: 'example.png', id: asset1.id },
        { filename: 'example+1.png', id: asset2.id },
      ];
      for (const { id, filename } of files) {
        const bytes = await readFile(`${tempDir}/archive/${filename}`);
        const asset = await utils.getAssetInfo(admin.accessToken, id);
        expect(utils.sha1(bytes)).toBe(asset.checksum);
      }
    });
  });

  describe('POST /download/info (spaceId)', () => {
    let space: SharedSpaceResponseDto;
    let viewer: LoginResponseDto;
    let editor: LoginResponseDto;
    let outsider: LoginResponseDto;

    beforeAll(async () => {
      viewer = await utils.userSetup(admin.accessToken, {
        email: 'download-viewer@immich.cloud',
        name: 'Download Viewer',
        password: 'Password123!',
      });
      editor = await utils.userSetup(admin.accessToken, {
        email: 'download-editor@immich.cloud',
        name: 'Download Editor',
        password: 'Password123!',
      });
      outsider = await utils.userSetup(admin.accessToken, {
        email: 'download-outsider@immich.cloud',
        name: 'Download Outsider',
        password: 'Password123!',
      });

      space = await utils.createSpace(admin.accessToken, { name: 'Download Space' });
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset1.id, asset2.id]);
      await utils.addSpaceMember(admin.accessToken, space.id, {
        userId: viewer.userId,
        role: SharedSpaceRole.Viewer,
      });
      await utils.addSpaceMember(admin.accessToken, space.id, {
        userId: editor.userId,
        role: SharedSpaceRole.Editor,
      });
    });

    it('should return download info for space owner', async () => {
      const { status, body } = await request(app)
        .post('/download/info')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ spaceId: space.id });

      expect(status).toBe(201);
      expect(body.archives).toHaveLength(1);
      expect(body.archives[0].assetIds).toContain(asset1.id);
      expect(body.archives[0].assetIds).toContain(asset2.id);
    });

    it('should allow editor to download', async () => {
      const { status, body } = await request(app)
        .post('/download/info')
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .send({ spaceId: space.id });

      expect(status).toBe(201);
      expect(body.archives).toHaveLength(1);
      expect(body.archives[0].assetIds).toHaveLength(2);
    });

    it('should allow viewer to download', async () => {
      const { status, body } = await request(app)
        .post('/download/info')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ spaceId: space.id });

      expect(status).toBe(201);
      expect(body.archives).toHaveLength(1);
      expect(body.archives[0].assetIds).toHaveLength(2);
    });

    it('should reject non-member', async () => {
      const { status } = await request(app)
        .post('/download/info')
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ spaceId: space.id });

      expect(status).toBe(400);
    });

    it('should return empty archives for empty space', async () => {
      const emptySpace = await utils.createSpace(admin.accessToken, { name: 'Empty Download Space' });

      const { status, body } = await request(app)
        .post('/download/info')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ spaceId: emptySpace.id });

      expect(status).toBe(201);
      expect(body.totalSize).toBe(0);
      expect(body.archives).toHaveLength(0);
    });
  });
});
